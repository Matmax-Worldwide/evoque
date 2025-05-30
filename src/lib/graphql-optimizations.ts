/**
 * @fileoverview This module provides the `GraphQLOptimizer` class and related utilities
 * for optimizing GraphQL requests. It implements features like query batching,
 * intelligent caching with TTL and dependency-based invalidation, and selective
 * loading of data (e.g., loading basic page data first, then components, and
 * preloading video-specific data). The goal is to improve performance by reducing
 * the number of network requests, minimizing data transfer, and leveraging cached data.
 */

/**
 * Represents a query item in the batch queue.
 */
interface QueryBatch {
  id: string; // Unique identifier for the query, typically the cache key.
  query: string; // The GraphQL query string.
  variables: Record<string, unknown>; // Variables for the query.
  resolve: (data: unknown) => void; // Promise resolve function.
  reject: (error: Error) => void; // Promise reject function.
  timestamp: number; // Timestamp of when the query was added to the batch.
}

/**
 * Represents an entry in the cache.
 * @template T The type of the cached data.
 */
interface CacheEntry<T> {
  data: T; // The cached data.
  timestamp: number; // Timestamp of when the entry was cached.
  ttl: number; // Time-to-live for this cache entry in milliseconds.
  dependencies?: string[]; // Optional array of dependency keys for invalidation.
}

/**
 * Class responsible for optimizing GraphQL queries through batching, caching,
 * and selective loading strategies.
 */
class GraphQLOptimizer {
  /** @private Queue for batching GraphQL queries. */
  private batchQueue: QueryBatch[] = [];
  /** @private Timeout ID for executing the batch. */
  private batchTimeout: NodeJS.Timeout | null = null;
  /** @private In-memory cache for storing query results. */
  private cache = new Map<string, CacheEntry<unknown>>();
  /** @private Delay in milliseconds before executing a batch of queries. */
  private readonly BATCH_DELAY = 10; // ms
  /** @private Default time-to-live for cache entries in milliseconds (5 minutes). */
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  /** @private Maximum number of entries allowed in the cache. */
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * @private
   * A collection of optimized GraphQL query strings with minimal field selection
   * for common operations.
   */
  private readonly OPTIMIZED_QUERIES = {
    // Minimal page data for initial load
    getPageBasic: `
      query GetPageBasic($slug: String!) {
        getPageBySlug(slug: $slug) {
          id
          title
          slug
          isPublished
          pageType
          locale
          sections {
            id
            sectionId
            order
            name
          }
        }
      }
    `,

    // Section components with video detection
    getSectionComponentsOptimized: `
      query GetSectionComponentsOptimized($sectionId: ID!) {
        getSectionComponents(sectionId: $sectionId) {
          components {
            id
            type
            data
          }
          lastUpdated
        }
      }
    `,

    // Batch multiple sections at once - REMOVED: getMultipleSections doesn't exist
    // Using individual getSectionComponents calls instead
    getSectionComponents: `
      query GetSectionComponents($sectionId: ID!) {
        getSectionComponents(sectionId: $sectionId) {
          components {
            id
            type
            data
          }
          lastUpdated
        }
      }
    `,

    // Video-specific data only - Updated to use getSectionComponents
    getVideoComponents: `
      query GetVideoComponents($sectionId: ID!) {
        getSectionComponents(sectionId: $sectionId) {
          components {
            id
            type
            data
          }
        }
      }
    `,

    // Menus with minimal data
    getMenusMinimal: `
      query GetMenusMinimal {
        menus {
          id
          name
          location
          items {
            id
            title
            url
            pageId
            order
            parentId
            page {
              slug
            }
          }
        }
      }
    `
  };

  /**
   * Generates a cache key based on the query string and variables.
   * Normalizes whitespace in the query and stringifies variables.
   * @private
   * @param query - The GraphQL query string.
   * @param variables - An object containing query variables.
   * @returns A unique string key for caching.
   */
  private getCacheKey(query: string, variables: Record<string, unknown>): string {
    return `${query.replace(/\s+/g, ' ').trim()}_${JSON.stringify(variables)}`;
  }

  /**
   * Checks if a cache entry is still valid based on its timestamp and TTL.
   * @private
   * @template T The type of the cached data.
   * @param entry - The cache entry to validate.
   * @returns True if the entry is valid, false otherwise.
   */
  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Cleans the cache by removing expired entries and, if still over MAX_CACHE_SIZE,
   * removes the oldest entries until the cache size is within limits.
   * @private
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // If still over limit, remove oldest entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Sets a new entry in the cache.
   * Periodically triggers `cleanCache` if cache size reaches a multiple of 100.
   * @private
   * @template T The type of the data to cache.
   * @param key - The cache key.
   * @param data - The data to cache.
   * @param ttl - Optional time-to-live in milliseconds (defaults to DEFAULT_TTL).
   * @param dependencies - Optional array of dependency strings for invalidation.
   */
  private setCache<T>(
    key: string, 
    data: T, 
    ttl: number = this.DEFAULT_TTL,
    dependencies?: string[]
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      dependencies
    });

    // Clean cache periodically
    if (this.cache.size % 100 === 0) {
      this.cleanCache();
    }
  }

  /**
   * Retrieves an entry from the cache if it exists and is valid.
   * If the entry is found but expired, it's deleted from the cache.
   * @private
   * @template T The expected type of the cached data.
   * @param key - The cache key.
   * @returns The cached data of type T, or null if not found or expired.
   */
  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && this.isCacheValid(entry)) {
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key); // Delete expired entry
    }
    
    return null;
  }

  /**
   * Invalidates cache entries based on a dependency string.
   * Any cache entry that includes the given dependency in its `dependencies` array will be removed.
   * @param dependency - The dependency string to invalidate by.
   */
  invalidateByDependency(dependency: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies?.includes(dependency)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Main method for executing GraphQL queries.
   * Handles caching (if enabled) and can optionally batch queries.
   * @template T The expected type of the data returned by the GraphQL query.
   * @param query - The GraphQL query string.
   * @param variables - Optional variables for the GraphQL query.
   * @param options - Optional configuration for caching and batching.
   * @param options.cache - Whether to use caching (default: true).
   * @param options.ttl - TTL for the cache entry in ms (default: DEFAULT_TTL).
   * @param options.dependencies - Array of dependency strings for cache invalidation.
   * @param options.batch - Whether to batch this query (default: false).
   * @returns A promise that resolves to the query result of type T.
   * @throws Throws an error if the underlying GraphQL request fails.
   */
  async executeQuery<T>(
    query: string,
    variables: Record<string, unknown> = {},
    options: {
      cache?: boolean;
      ttl?: number;
      dependencies?: string[];
      batch?: boolean;
    } = {}
  ): Promise<T> {
    const {
      cache = true,
      ttl = this.DEFAULT_TTL,
      dependencies,
      batch = false
    } = options;

    const cacheKey = this.getCacheKey(query, variables);

    // Check cache first
    if (cache) {
      const cached = this.getCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Use batching if enabled
    if (batch) {
      return this.batchQuery<T>(query, variables, cacheKey, ttl, dependencies);
    }

    // Execute immediately
    try {
      const { gqlRequest } = await import('./graphql-client');
      const result = await gqlRequest<T>(query, variables);
      
      if (cache) {
        this.setCache(cacheKey, result, ttl, dependencies);
      }
      
      return result;
    } catch (error) {
      console.error('GraphQL query failed:', error);
      throw error;
    }
  }

  /**
   * Adds a query to the batch queue. If no batch timeout is active, it starts one.
   * @private
   * @template T The expected type of the data returned by the GraphQL query.
   * @param query - The GraphQL query string.
   * @param variables - Variables for the query.
   * @param cacheKey - The generated cache key for this query.
   * @param ttl - TTL for caching the result.
   * @param dependencies - Optional dependencies for cache invalidation.
   * @returns A promise that resolves with the query result of type T when the batch is executed.
   */
  private async batchQuery<T>(
    query: string,
    variables: Record<string, unknown>,
    cacheKey: string,
    ttl: number,
    dependencies?: string[]
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Add to batch queue
      this.batchQueue.push({
        id: cacheKey,
        query,
        variables,
        resolve: resolve as (data: unknown) => void,
        reject,
        timestamp: Date.now()
      });

      // Set timeout to execute batch
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.executeBatch(ttl, dependencies); // Pass ttl and dependencies for caching batched results
        }, this.BATCH_DELAY);
      }
    });
  }

  /**
   * Executes all queries currently in the batch queue.
   * It processes the queue, makes parallel GraphQL requests,
   * resolves individual promises, and caches the results.
   * @private
   * @param ttl - Optional TTL to use for caching the results of this batch.
   * @param dependencies - Optional dependencies to associate with cached results from this batch.
   */
  private async executeBatch(ttl?: number, dependencies?: string[]): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    try {
      const { gqlRequest } = await import('./graphql-client');
      
      // Execute all queries in parallel
      const results = await Promise.allSettled(
        batch.map(item => 
          gqlRequest(item.query, item.variables).then(result => ({
            id: item.id, // This is the cacheKey
            result,
            item // The original QueryBatch item
          }))
        )
      );

      // Resolve individual promises
      results.forEach((resultOutcome) => { // Renamed `result` to `resultOutcome` to avoid conflict
        if (resultOutcome.status === 'fulfilled') {
          const { id: cacheKey, result: data, item: batchItem } = resultOutcome.value;
          batchItem.resolve(data);
          
          // Cache the result with provided ttl and dependencies
          // Ensure ttl and dependencies from the batchQuery call are used if executeBatch specific ones aren't provided
          this.setCache(cacheKey, data, ttl || this.DEFAULT_TTL, dependencies || batchItem.item?.dependencies); // Access dependencies from original item if needed
        } else {
          // Find the original batch item that corresponds to this failed promise.
          // This assumes the order is maintained or we can find by some unique identifier if not cacheKey.
          // For simplicity, this example assumes order is maintained or cacheKey (item.id) is sufficient.
          const failedItem = batch.find(b => b.id === (resultOutcome.reason as any)?.request?.id || b.id === (resultOutcome.reason as any)?.id);
          if (failedItem) {
            failedItem.reject(new Error((resultOutcome.reason as Error)?.message || 'Unknown batch execution error'));
          } else {
            // Fallback if item cannot be identified, though this should ideally not happen
            console.error("Failed to identify item for rejection in batch:", resultOutcome.reason);
          }
        }
      });

    } catch (error) {
      // Reject all pending queries in this specific batch execution
      batch.forEach(item => {
        item.reject(error instanceof Error ? error : new Error('Batch execution failed'));
      });
    }
  }

  /**
   * Loads page data in an optimized manner:
   * 1. Fetches basic page data (ID, title, slug, sections list) using an optimized query.
   * 2. Fetches components for all sections of the page in parallel (batched).
   * 3. Identifies sections containing video components.
   * @param slug - The slug of the page to load.
   * @returns A promise that resolves to an object containing the page data,
   *          an array of section data (with components), and an array of video section IDs.
   */
  async loadPageOptimized(slug: string): Promise<{
    page: unknown; // Type should be more specific, e.g., PageData
    sections: unknown[]; // Type should be more specific, e.g., SectionData[]
    videoSections: string[];
  }> {
    // First, load basic page data
    const pageData = await this.executeQuery(
      this.OPTIMIZED_QUERIES.getPageBasic,
      { slug },
      { cache: true, ttl: 10 * 60 * 1000, dependencies: [`page:${slug}`] }
    );

    const page = (pageData as { getPageBySlug: unknown }).getPageBySlug;
    if (!page || !(page as { sections?: unknown[] }).sections) {
      return { page, sections: [], videoSections: [] };
    }

    const sections = (page as { sections: { sectionId: string }[] }).sections;
    const sectionIds = sections.map(s => s.sectionId);

    // Load all sections in parallel
    const sectionsData = await Promise.all(
      sectionIds.map(sectionId =>
        this.executeQuery(
          this.OPTIMIZED_QUERIES.getSectionComponentsOptimized,
          { sectionId },
          { 
            cache: true, 
            ttl: 5 * 60 * 1000, 
            dependencies: [`section:${sectionId}`],
            batch: true 
          }
        )
      )
    );

    // Identify video sections for preloading
    const videoSections: string[] = [];
    const processedSections = sectionsData.map((data, index) => {
      const sectionData = (data as { getSectionComponents: { components: { type: string }[] } }).getSectionComponents;
      
      // Check if section contains video components
      const hasVideo = sectionData.components.some(comp => 
        comp.type.toLowerCase() === 'video' || comp.type.toLowerCase() === 'videosection'
      );
      
      if (hasVideo) {
        videoSections.push(sectionIds[index]);
      }
      
      return sectionData;
    });

    return {
      page,
      sections: processedSections,
      videoSections
    };
  }

  /**
   * Preloads video components from specified section IDs.
   * It fetches components for these sections and then uses `videoPreloader`
   * to preload any video URLs found in components of type 'video' or 'videosection'.
   * @param videoSectionIds - An array of section IDs known to contain video components.
   */
  async preloadVideoSections(videoSectionIds: string[]): Promise<void> {
    if (!videoSectionIds.length) return;

    try {
      console.log('🎬 Preloading video sections:', videoSectionIds);

      // Process each section individually since there's no batch query
      const videoUrls: string[] = [];

      for (const sectionId of videoSectionIds) {
        try {
          const videoData = await this.executeQuery(
            this.OPTIMIZED_QUERIES.getVideoComponents,
            { sectionId },
            { cache: true, ttl: 15 * 60 * 1000 }
          );

          const sectionData = (videoData as { getSectionComponents: { components: { type: string; data: Record<string, unknown> }[] } }).getSectionComponents;
          
          sectionData.components.forEach(comp => {
            if (comp.type.toLowerCase() === 'video' && comp.data && typeof comp.data === 'object') {
              const videoUrl = (comp.data as { videoUrl?: string }).videoUrl;
              if (videoUrl) {
                videoUrls.push(videoUrl);
              }
            }
          });
        } catch (error) {
          console.warn(`Failed to preload video section ${sectionId}:`, error);
        }
      }

      // Preload video files
      if (videoUrls.length > 0) {
        const { videoPreloader } = await import('./video-preloader');
        
        await Promise.allSettled(
          videoUrls.map(url => videoPreloader.preloadVideo(url))
        );
        
        console.log(`🎬 Preloaded ${videoUrls.length} videos`);
      }
    } catch (error) {
      console.error('Error preloading video sections:', error);
    }
  }

  /**
   * Loads menu data using an optimized query and caches the result.
   * @returns A promise that resolves to the menu data.
   */
  async loadMenus(): Promise<unknown> {
    return this.executeQuery(
      this.OPTIMIZED_QUERIES.getMenusMinimal,
      {},
      { 
        cache: true, 
        ttl: 30 * 60 * 1000, // Cache menus for 30 minutes
        dependencies: ['menus'] 
      }
    );
  }

  /**
   * Clears the entire GraphQL query cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Retrieves statistics about the cache.
   * @returns An object containing total entries, valid entries, expired entries, and hit rate.
   */
  getCacheStats() {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (this.isCacheValid(entry)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / (validEntries + expiredEntries) || 0
    };
  }
}

/**
 * Global instance of the GraphQLOptimizer.
 * Use this instance to interact with optimized query functionalities.
 */
export const graphqlOptimizer = new GraphQLOptimizer();

/**
 * Provides convenient access to the global `graphqlOptimizer`'s methods.
 */
export const optimizedQueries = {
  /** Loads page data in an optimized manner. @see GraphQLOptimizer#loadPageOptimized */
  loadPage: (slug: string) => graphqlOptimizer.loadPageOptimized(slug),
  /** Preloads video components from specified section IDs. @see GraphQLOptimizer#preloadVideoSections */
  preloadVideos: (sectionIds: string[]) => graphqlOptimizer.preloadVideoSections(sectionIds),
  /** Loads menu data with caching. @see GraphQLOptimizer#loadMenus */
  loadMenus: () => graphqlOptimizer.loadMenus(),
  /** Invalidates cache entries by a dependency string. @see GraphQLOptimizer#invalidateByDependency */
  invalidateCache: (dependency: string) => graphqlOptimizer.invalidateByDependency(dependency),
  /** Clears the entire GraphQL query cache. @see GraphQLOptimizer#clearCache */
  clearCache: () => graphqlOptimizer.clearCache(),
  /** Retrieves statistics about the cache. @see GraphQLOptimizer#getCacheStats */
  getStats: () => graphqlOptimizer.getCacheStats()
}; 