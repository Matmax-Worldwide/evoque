/**
 * @fileoverview This module provides the `VideoPreloader` class, designed for
 * optimizing video loading. It includes features like preloading initial video chunks,
 * caching video data (as Blobs and ObjectURLs), managing cache size and eviction,
 * optionally using IntersectionObserver to preload videos when they enter the viewport,
 * and attempting to select optimal video quality based on network conditions.
 */

/**
 * Options for configuring video preloading behavior.
 */
interface VideoPreloadOptions {
  /** Desired video quality. 'auto' attempts to detect optimal quality. */
  quality?: 'low' | 'medium' | 'high' | 'auto';
  /** Amount of video data to preload in megabytes (MB). */
  preloadAmount?: number;
  /** Future flag for enabling adaptive streaming (not fully implemented). */
  enableAdaptiveStreaming?: boolean;
  /** Whether to use IntersectionObserver to preload videos when they become visible. */
  enableIntersectionObserver?: boolean;
  /** Root margin for the IntersectionObserver (e.g., "200px"). */
  rootMargin?: string;
  /** Threshold for the IntersectionObserver (0.0 to 1.0). */
  threshold?: number;
}

/**
 * Represents an entry in the video cache.
 */
interface VideoCache {
  /** The original URL of the video. */
  url: string;
  /** The preloaded video data as a Blob. */
  blob?: Blob;
  /** An ObjectURL created from the Blob, usable as a video source. */
  objectUrl?: string;
  /** The quality level at which the video was preloaded. */
  quality: string;
  /** The number of bytes preloaded for this video. */
  preloadedBytes: number;
  /** Timestamp of the last time this cache entry was accessed. */
  lastAccessed: number;
  /** Flag indicating if the video is currently in the process of preloading. */
  isPreloading: boolean;
}

/**
 * Class responsible for preloading and caching video content for optimized playback.
 */
class VideoPreloader {
  /** @private Map storing cached video data. Key is the video URL. */
  private cache = new Map<string, VideoCache>();
  /** @private Set of video URLs currently in the preload queue or being preloaded. */
  private preloadQueue = new Set<string>();
  /** @private IntersectionObserver instance for viewport-based preloading. */
  private intersectionObserver?: IntersectionObserver;
  /** @private Maximum size of the video cache in bytes (default: 100MB). */
  private maxCacheSize = 100 * 1024 * 1024; // 100MB cache limit
  /** @private Current total size of all blobs stored in the cache, in bytes. */
  private currentCacheSize = 0;

  /**
   * Constructs a new VideoPreloader instance.
   * @param options - Optional configuration for the preloader.
   */
  constructor(private options: VideoPreloadOptions = {}) {
    this.setupIntersectionObserver();
    this.setupCacheCleanup();
  }

  /**
   * Sets up the IntersectionObserver if enabled in options.
   * The observer watches video elements and triggers preloading when they enter the viewport.
   * @private
   */
  private setupIntersectionObserver() {
    if (typeof window === 'undefined' || !this.options.enableIntersectionObserver) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoElement = entry.target as HTMLVideoElement;
          const videoUrl = videoElement.src || videoElement.currentSrc;
          
          if (entry.isIntersecting && videoUrl) {
            this.preloadVideo(videoUrl);
          }
        });
      },
      {
        rootMargin: this.options.rootMargin || '200px',
        threshold: this.options.threshold || 0.1
      }
    );
  }

  /**
   * Sets up a periodic interval to clean up the cache.
   * @private
   */
  private setupCacheCleanup() {
    // Clean up cache every 5 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Cleans the cache by removing entries older than 30 minutes
   * and then, if still over `maxCacheSize`, removes the least recently accessed entries
   * until the cache size is within limits.
   * @private
   */
  private cleanupCache() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [url, cache] of this.cache.entries()) {
      if (now - cache.lastAccessed > maxAge) {
        this.removeFromCache(url);
      }
    }

    // If still over limit, remove oldest entries
    while (this.currentCacheSize > this.maxCacheSize) {
      const oldestEntry = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)[0];
      
      if (oldestEntry) {
        this.removeFromCache(oldestEntry[0]);
      } else {
        break;
      }
    }
  }

  /**
   * Removes a video from the cache, revoking its ObjectURL and updating cache size.
   * @private
   * @param url - The URL of the video to remove from the cache.
   */
  private removeFromCache(url: string) {
    const cache = this.cache.get(url);
    if (cache) {
      if (cache.objectUrl) {
        URL.revokeObjectURL(cache.objectUrl);
      }
      if (cache.blob) {
        this.currentCacheSize -= cache.blob.size;
      }
      this.cache.delete(url);
    }
  }

  /**
   * Determines the optimal video quality based on current options, network conditions,
   * and screen size.
   * @private
   * @returns A string representing the chosen quality ('low', 'medium', or 'high').
   */
  private getOptimalQuality(): string {
    if (this.options.quality !== 'auto') {
      return this.options.quality || 'medium';
    }

    // Auto-detect based on connection and device capabilities
    const connection = (navigator as Navigator & { 
      connection?: { 
        effectiveType?: string; 
        downlink?: number; 
      } 
    }).connection;
    if (connection) {
      if (connection.effectiveType === '4g' && (connection.downlink || 0) > 10) {
        return 'high';
      } else if (connection.effectiveType === '3g' || (connection.downlink || 0) > 1.5) {
        return 'medium';
      } else {
        return 'low';
      }
    }

    // Fallback based on screen size
    const screenWidth = window.screen.width;
    if (screenWidth >= 1920) return 'high';
    if (screenWidth >= 1280) return 'medium';
    return 'low';
  }

  /**
   * Fetches a specific chunk of a video file using Range requests.
   * @private
   * @param url - The URL of the video to fetch.
   * @param start - The starting byte of the range.
   * @param end - The ending byte of the range.
   * @returns A Promise that resolves to a Blob containing the video chunk.
   * @throws If the fetch request fails.
   */
  private async fetchVideoChunk(url: string, start: number, end: number): Promise<Blob> {
    const response = await fetch(url, {
      headers: {
        'Range': `bytes=${start}-${end}`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video chunk: ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Preloads a video by fetching an initial chunk and caching it.
   * If the video is already cached sufficiently, it updates its last accessed time.
   * Converts S3 URLs to use an API route for potentially optimized delivery.
   * @param url - The URL of the video to preload.
   * @param options - Optional partial VideoPreloadOptions to override defaults for this specific preload.
   * @returns A Promise that resolves to an ObjectURL for the preloaded video chunk, or null if preloading fails or is skipped.
   */
  async preloadVideo(url: string, options?: Partial<VideoPreloadOptions>): Promise<string | null> {
    if (!url || this.preloadQueue.has(url)) return null;

    const mergedOptions = { ...this.options, ...options };
    const preloadAmount = mergedOptions.preloadAmount || 2; // 2MB default
    const quality = this.getOptimalQuality();

    this.preloadQueue.add(url);

    try {
      // Check if already cached
      let cache = this.cache.get(url);
      if (cache && cache.preloadedBytes >= preloadAmount * 1024 * 1024) {
        cache.lastAccessed = Date.now();
        this.preloadQueue.delete(url);
        return cache.objectUrl || null;
      }

      // Convert S3 URLs to API routes if needed
      const processedUrl = this.convertS3UrlToApiRoute(url);

      // Start preloading
      if (!cache) {
        cache = {
          url,
          quality,
          preloadedBytes: 0,
          lastAccessed: Date.now(),
          isPreloading: true
        };
        this.cache.set(url, cache);
      }

      cache.isPreloading = true;

      // Fetch initial chunk for immediate playback
      const chunkSize = Math.min(preloadAmount * 1024 * 1024, 5 * 1024 * 1024); // Max 5MB
      const blob = await this.fetchVideoChunk(processedUrl, 0, chunkSize - 1);

      // Update cache
      cache.blob = blob;
      cache.preloadedBytes = blob.size;
      cache.isPreloading = false;
      this.currentCacheSize += blob.size;

      // Create object URL for immediate use
      if (cache.objectUrl) {
        URL.revokeObjectURL(cache.objectUrl);
      }
      cache.objectUrl = URL.createObjectURL(blob);

      this.preloadQueue.delete(url);
      
      console.log(`Video preloaded: ${url} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
      
      return cache.objectUrl;

    } catch (error) {
      console.error('Video preload failed:', error);
      this.preloadQueue.delete(url);
      return null;
    }
  }

  /**
   * Converts direct S3 URLs to an API route for potentially optimized delivery or access control.
   * If the URL is not an S3 URL matching the pattern, it's returned unchanged.
   * @private
   * @param url - The video URL to process.
   * @returns The processed URL, potentially pointing to an API route.
   */
  private convertS3UrlToApiRoute(url: string): string {
    if (!url) return url;
    
    // Check if this is a direct S3 URL that needs to be converted
    const s3UrlPattern = /https:\/\/[^\/]+\.s3\.amazonaws\.com\/(.+)/;
    const match = url.match(s3UrlPattern);
    
    if (match) {
      const s3Key = decodeURIComponent(match[1]);
      return `/api/media/download?key=${encodeURIComponent(s3Key)}&view=true&optimize=true`;
    }
    
    return url;
  }

  /**
   * Starts observing a video element with the IntersectionObserver.
   * When the element enters the viewport, its video source will be preloaded.
   * @param videoElement - The HTMLVideoElement to observe.
   */
  observeVideo(videoElement: HTMLVideoElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(videoElement);
    }
  }

  /**
   * Stops observing a video element with the IntersectionObserver.
   * @param videoElement - The HTMLVideoElement to stop observing.
   */
  unobserveVideo(videoElement: HTMLVideoElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(videoElement);
    }
  }

  /**
   * Retrieves the ObjectURL for a cached video, if available.
   * Updates the last accessed time for the cache entry.
   * @param url - The original URL of the video.
   * @returns The ObjectURL string if the video is cached, otherwise null.
   */
  getCachedVideoUrl(url: string): string | null {
    const cache = this.cache.get(url);
    if (cache && cache.objectUrl) {
      cache.lastAccessed = Date.now();
      return cache.objectUrl;
    }
    return null;
  }

  /**
   * Checks if a video is currently being preloaded or is in the preload queue.
   * @param url - The URL of the video.
   * @returns True if the video is preloading, false otherwise.
   */
  isVideoPreloading(url: string): boolean {
    const cache = this.cache.get(url);
    return cache?.isPreloading || this.preloadQueue.has(url);
  }

  /**
   * Gets the preload progress for a video.
   * @param url - The URL of the video.
   * @returns A number between 0 and 1 representing the preload progress (1 for fully preloaded chunk).
   *          Returns 0 if the video is not cached or preloading.
   */
  getPreloadProgress(url: string): number {
    const cache = this.cache.get(url);
    if (!cache) return 0;
    
    const targetSize = (this.options.preloadAmount || 2) * 1024 * 1024;
    return Math.min(cache.preloadedBytes / targetSize, 1);
  }

  /**
   * Preloads multiple videos, potentially in parallel based on priority.
   * @param urls - An array of video URLs to preload.
   * @param priority - The priority for preloading ('high', 'medium', or 'low').
   *                   Higher priority may use more concurrent downloads.
   */
  async preloadVideos(urls: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const concurrency = priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
    const chunks = [];
    
    for (let i = 0; i < urls.length; i += concurrency) {
      chunks.push(urls.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(url => this.preloadVideo(url))
      );
    }
  }

  /**
   * Clears all videos from the cache and resets the current cache size.
   */
  clearCache() {
    for (const [url] of this.cache.entries()) {
      this.removeFromCache(url);
    }
    this.currentCacheSize = 0;
  }

  /**
   * Gets statistics about the current state of the video cache.
   * @returns An object containing total entries, total size, max size, and utilization percentage.
   */
  getCacheStats() {
    return {
      totalEntries: this.cache.size,
      totalSize: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      utilizationPercent: (this.currentCacheSize / this.maxCacheSize) * 100
    };
  }

  /**
   * Cleans up resources used by the VideoPreloader, such as disconnecting
   * the IntersectionObserver and clearing the cache.
   */
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.clearCache();
  }
}

/**
 * Global, pre-configured instance of the VideoPreloader.
 * This instance can be imported and used directly for video preloading tasks.
 * Default options aim for a balance of auto quality detection, reasonable preload amount,
 * and viewport-aware preloading.
 */
export const videoPreloader = new VideoPreloader({
  quality: 'auto',
  preloadAmount: 3, // 3MB
  enableAdaptiveStreaming: true,
  enableIntersectionObserver: true,
  rootMargin: '300px',
  threshold: 0.1
});

/**
 * Exports the VideoPreloader class for creating custom instances if needed.
 */
export default VideoPreloader; 