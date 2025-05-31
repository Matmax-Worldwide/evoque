# JSDoc Comments and Code Signatures for `src/lib/graphql-client.ts`

This document contains extracted JSDoc comments and the code signatures they are associated with from the file `src/lib/graphql-client.ts`. The raw JSDoc content is provided for direct interpretation.

---

**JSDoc Block:**

```javascript
/**
 * @fileoverview This module serves as the central GraphQL client and API interaction layer.
 * It provides a core `gqlRequest` function for making GraphQL requests,
 * defines various TypeScript interfaces for CMS, Form, Blog, and Calendar data,
 * includes a simple in-memory caching mechanism, and exports numerous functions
 * grouped by functionality (CMS operations, Form Builder API, Blog API, etc.)
 * for interacting with the GraphQL backend.
 */```

**Associated Code:**

```typescript
import { updateCMSSection } from './cms-update';
import { deletePageWithSections } from './cms-page-delete';
```

---

**JSDoc Block:**

```javascript
/**
 * Performs a GraphQL request.
 *
 * @template T The expected type of the data returned by the GraphQL query.
 * @param query The GraphQL query string.
 * @param variables Optional variables for the GraphQL query.
 * @param timeout Optional timeout for the request in milliseconds (default: 10000ms).
 * @returns A promise that resolves to the data of type T.
 * @throws Throws an error if the request fails, times out, or if GraphQL errors are returned (unless it's a public operation).
 *
 * Behavior:
 * - Generates a unique `requestId` for logging and tracking.
 * - Logs query, variables (in development), and timeout.
 * - Uses an AbortController for request timeouts.
 * - Differentiates between public and private operations:
 *   - Public operations (e.g., `getPageBySlug`, `getMenus`, `submitForm`) do not require authentication.
 *     If an HTTP or GraphQL auth error occurs in a public operation, it logs a warning and returns an empty object (`{}` as T)
 *     or partial data if available, instead of throwing an error, to prevent UI breakage.
 *   - Private operations attempt to include an Authorization header with a session token retrieved from cookies (browser-only).
 * - Resolves GraphQL endpoint URL: uses `/api/graphql` on the client and an absolute URL (derived from `VERCEL_URL` or localhost) on the server.
 * - Handles HTTP errors: throws an error for non-OK responses unless it's a public operation.
 * - Handles GraphQL errors: throws an error if `responseData.errors` is present, with special handling for auth errors in public/form operations.
 * - Returns `responseData.data` or the entire `responseData` if `data` is not present.
 * - Handles `AbortError` (timeout) by throwing a specific error message.
 */```

**Associated Code:**

```typescript
export async function gqlRequest<T>(
```

---

**JSDoc Block:**

```javascript
/**
 * Represents a generic CMS component with dynamic data.
 */```

**Associated Code:**

```typescript
export interface CMSComponent {
```

---

**JSDoc Block:**

```javascript
/**
 * Represents the database structure of a CMS component definition.
 */```

**Associated Code:**

```typescript
export interface CMSComponentDB {
```

---

**JSDoc Block:**

```javascript
/**
 * Represents the database structure of a CMS page.
 */```

**Associated Code:**

```typescript
export interface CMSPageDB {
```

---

**JSDoc Block:**

```javascript
/**
 * Input type for creating or updating CMS components.
 */```

**Associated Code:**

```typescript
export interface CMSComponentInput {
```

---

**JSDoc Block:**

```javascript
/**
 * Result type for operations involving CMS components (create, update).
 */```

**Associated Code:**

```typescript
export interface CMSComponentResult {
```

---

**JSDoc Block:**

```javascript
/**
 * Represents a component within a CMS section, similar to CMSComponent but potentially with section-specific context.
 */```

**Associated Code:**

```typescript
export interface CMSSectionComponent {
```

---

**JSDoc Block:**

```javascript
/**
 * Result type for operations that return components of a section.
 */```

**Associated Code:**

```typescript
export interface CMSSectionResult {
```

---

**JSDoc Block:**

```javascript
/**
 * Expected response structure for fetching section components.
 */```

**Associated Code:**

```typescript
interface SectionComponentsResponse {
```

---

**JSDoc Block:**

```javascript
/**
 * Represents the comprehensive data structure for a page, including SEO and section details.
 */```

**Associated Code:**

```typescript
export interface PageData {
```

---

**JSDoc Block:**

```javascript
/**
 * Generic wrapper for GraphQL responses, accommodating both data and errors.
 */```

**Associated Code:**

```typescript
interface GraphQLResponse<T> {
```

---

**JSDoc Block:**

```javascript
/**
 * Validates if a section ID logically belongs to a given page ID.
 * This is a utility function and might not reflect actual database relationships directly.
 * @param sectionId The ID of the section.
 * @param pageId The ID of the page.
 * @returns True if the sectionId starts with `page-${pageId}-`, false otherwise.
 */```

**Associated Code:**

```typescript
export const validateSectionOwnership = (sectionId: string, pageId: string): boolean => {
```

---

**JSDoc Block:**

```javascript
/**
 * Simple in-memory cache for API responses.
 * @type {Record<string, { data: unknown; timestamp: number }>}
 */```

**Associated Code:**

```typescript
const apiCache: Record<string, { data: unknown; timestamp: number }> = {};
```

---

**JSDoc Block:**

```javascript
/**
 * Time-to-live for cached items in milliseconds. Default is 1 minute.
 * @type {number}
 */```

**Associated Code:**

```typescript
const CACHE_TTL = 60000; // 1 minute cache TTL by default
```

---

**JSDoc Block:**

```javascript
/**
 * Retrieves a cached response if it exists and has not expired.
 * @template T The expected type of the cached data.
 * @param cacheKey The key for the cached item.
 * @returns The cached data of type T, or undefined if not found or expired.
 */```

**Associated Code:**

```typescript
function getCachedResponse<T>(cacheKey: string): T | undefined {
```

---

**JSDoc Block:**

```javascript
/**
 * Stores an API response in the in-memory cache.
 * @template T The type of the data to cache.
 * @param cacheKey The key for the cached item.
 * @param data The data to cache.
 * @returns void
 */```

**Associated Code:**

```typescript
function setCachedResponse<T>(cacheKey: string, data: T): void {
```

---

**JSDoc Block:**

```javascript
/**
 * Clears cache entries. If no `keyPattern` is provided, clears the entire cache.
 * Otherwise, clears entries where the key includes the `keyPattern`.
 * @param keyPattern Optional pattern to match against cache keys.
 * @returns void
 */```

**Associated Code:**

```typescript
function clearCache(keyPattern?: string): void {
```

---

**JSDoc Block:**

```javascript
/**
 * Type definition for the result of fetching section components.
 */```

**Associated Code:**

```typescript
interface SectionComponentsResult {
```

---

**JSDoc Block:**

```javascript
/**
 * Groups various CMS-related GraphQL operations.
 */```

**Associated Code:**

```typescript
export const cmsOperations = {
```

---

**JSDoc Block:**

```javascript
/**
 * Retrieves all forms, including a calculated `totalFieldCount` for each.
 * @returns A promise that resolves to an array of FormBase objects, each augmented with `totalFieldCount`.
 *          Returns an empty array if an error occurs.
 */```

**Associated Code:**

```typescript
async function getForms(): Promise<FormBase[]> {
```

---

**JSDoc Block:**

```javascript
/**
 * Retrieves a specific form by its ID, including all its fields and steps.
 * Provides a fallback minimal form structure on error to prevent UI breakage.
 * @param id - The ID of the form to retrieve.
 * @returns A promise that resolves to the FormBase object or a fallback, or null on critical error.
 */```

**Associated Code:**

```typescript
async function getFormById(id: string): Promise<FormBase | null> {
```

---

**JSDoc Block:**

```javascript
/**
 * Retrieves a specific form by its slug, including all its fields and steps.
 * @param slug - The slug of the form to retrieve.
 * @returns A promise that resolves to the FormBase object, or null if not found or an error occurs.
 */```

**Associated Code:**

```typescript
async function getFormBySlug(slug: string): Promise<FormBase | null> {
```

---

**JSDoc Block:**

```javascript
/**
 * Retrieves all steps for a given form ID, including fields within each step.
 * @param formId - The ID of the form whose steps are to be retrieved.
 * @returns A promise that resolves to an array of FormStepBase objects.
 *          Returns an empty array if an error occurs or no steps are found.
 */```

**Associated Code:**

```typescript
async function getFormSteps(formId: string): Promise<FormStepBase[]> {
```

---

**JSDoc Block:**

```javascript
/**
 * Retrieves fields for a given form ID and optionally a step ID.
 * If `stepId` is provided, it fetches fields for that specific step.
 * Otherwise, it fetches fields directly under the form (not in any step).
 * @param formId - The ID of the form.
 * @param stepId - Optional ID of the step within the form.
 * @returns A promise that resolves to an array of FormFieldBase objects.
 *          Returns an empty array if an error occurs or no fields are found.
 */```

**Associated Code:**

```typescript
async function getFormFields(formId: string, stepId?: string): Promise<FormFieldBase[]> {
```

---

**JSDoc Block:**

```javascript
/**
 * Retrieves submissions for a given form ID, with optional limit and offset for pagination.
 * @param formId - The ID of the form.
 * @param limit - Optional limit for the number of submissions to retrieve.
 * @param offset - Optional offset for pagination.
 * @returns A promise that resolves to an array of FormSubmissionBase objects.
 *          Returns an empty array if an error occurs or no submissions are found.
 */```

**Associated Code:**

```typescript
async function getFormSubmissions(formId: string, limit?: number, offset?: number): Promise<FormSubmissionBase[]> {
```

---

**JSDoc Block:**

```javascript
/**
 * Retrieves submission statistics for a given form ID.
 * @param formId - The ID of the form.
 * @returns A promise that resolves to a FormSubmissionStats object, or null if an error occurs.
 */```

**Associated Code:**

```typescript
async function getFormSubmissionStats(formId: string): Promise<FormSubmissionStats | null> {
```

---

**JSDoc Block:**

```javascript
/**
 * Creates a new form.
 * Invalidates relevant form caches (`forms`, specific form ID and slug) on success.
 * @param input - The data for the new form (FormInput).
 * @returns A promise that resolves to a FormResult object.
 */```

**Associated Code:**

```typescript
async function createForm(input: FormInput): Promise<FormResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Updates an existing form.
 * Invalidates relevant form caches (specific form ID and slug, general list) on success.
 * Also invalidates cache for the old slug if the slug was changed.
 * @param id - The ID of the form to update.
 * @param input - An object containing the fields to update (Partial<FormInput>).
 * @returns A promise that resolves to a FormResult object.
 */```

**Associated Code:**

```typescript
async function updateForm(id: string, input: Partial<FormInput>): Promise<FormResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Deletes a form.
 * Invalidates relevant form caches (specific form ID, general list) on success.
 * @param id - The ID of the form to delete.
 * @returns A promise that resolves to a FormResult object (typically only success/message for delete).
 */```

**Associated Code:**

```typescript
async function deleteForm(id: string): Promise<FormResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Creates a new step for a form.
 * Invalidates caches for the parent form and the general forms list on success.
 * @param input - The data for the new form step (FormStepInput).
 * @returns A promise that resolves to a FormStepResult object.
 */```

**Associated Code:**

```typescript
async function createFormStep(input: FormStepInput): Promise<FormStepResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Creates a new field for a form or a form step.
 * Invalidates caches for the parent form and the general forms list on success.
 * @param input - The data for the new form field (FormFieldInput).
 * @returns A promise that resolves to a FormFieldResult object.
 */```

**Associated Code:**

```typescript
async function createFormField(input: FormFieldInput): Promise<FormFieldResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Updates an existing form field.
 * Invalidates caches for the parent form (if formId is available) and the general forms list on success.
 * @param id - The ID of the form field to update.
 * @param input - The data to update the form field with (FormFieldInput - though typically Partial for updates).
 * @returns A promise that resolves to a FormFieldResult object.
 */```

**Associated Code:**

```typescript
async function updateFormField(id: string, input: FormFieldInput): Promise<FormFieldResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Deletes a form field.
 * Invalidates the general forms list cache as a broad measure, since formId is not directly available.
 * @param id - The ID of the form field to delete.
 * @returns A promise that resolves to an object indicating success and a message.
 */```

**Associated Code:**

```typescript
async function deleteFormField(id: string): Promise<{success: boolean; message: string}> {
```

---

**JSDoc Block:**

```javascript
/**
 * Submits a form.
 * @param input - The form submission data (FormSubmissionInput).
 * @returns A promise that resolves to a FormSubmissionResult object.
 * @throws Throws an error if the submission fails.
 */```

**Associated Code:**

```typescript
async function submitForm(input: FormSubmissionInput): Promise<FormSubmissionResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Updates the status of a form submission.
 * @param id - The ID of the form submission to update.
 * @param status - The new status string.
 * @returns A promise that resolves to a FormSubmissionResult object.
 * @throws Throws an error if the update fails.
 */```

**Associated Code:**

```typescript
async function updateFormSubmissionStatus(id: string, status: string): Promise<FormSubmissionResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Updates the order of a single form field.
 * @param id - The ID of the form field to update.
 * @param newOrder - The new order value for the field.
 * @returns A promise that resolves to a FormFieldResult object.
 */```

**Associated Code:**

```typescript
async function updateFieldOrder(id: string, newOrder: number): Promise<FormFieldResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Updates the order of multiple form fields at once.
 * Invalidates the general forms list cache on success.
 * @param updates - An array of objects, each containing `id` (field ID) and `order` (new order value).
 * @returns A promise that resolves to an object indicating success and a message.
 */```

**Associated Code:**

```typescript
async function updateFieldOrders(updates: Array<{ id: string; order: number }>): Promise<{
```

---

**JSDoc Block:**

```javascript
/**
 * Main exported object containing all GraphQL client functions,
 * grouped by functionality (CMS, Forms, Blog, Calendar, etc.).
 */```

**Associated Code:**

```typescript
const graphqlClient = {
```

---

**JSDoc Block:**

```javascript
/**
 * Retrieves the default page for a given locale.
 * Uses in-memory caching (`default_page_{locale}` key).
 * @param locale - The locale string (e.g., "en"). Defaults to "en".
 * @returns A promise that resolves to the PageData object for the default page, or null if not found or an error occurs.
 */```

**Associated Code:**

```typescript
async function getDefaultPage(locale: string = 'en'): Promise<PageData | null> {
```

---

**JSDoc Block:**

```javascript
/**
 * Updates an existing form step.
 * Invalidates caches for the parent form and the general forms list on success.
 * @param id - The ID of the form step to update.
 * @param input - An object containing the fields to update (Partial<FormStepInput>).
 * @returns A promise that resolves to a FormStepResult object.
 */```

**Associated Code:**

```typescript
async function updateFormStep(id: string, input: Partial<FormStepInput>): Promise<FormStepResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Deletes a form step.
 * Invalidates the general forms list cache as a broad measure.
 * @param id - The ID of the form step to delete.
 * @returns A promise that resolves to a FormStepResult object (typically only success/message for delete).
 */```

**Associated Code:**

```typescript
async function deleteFormStep(id: string): Promise<FormStepResult> {
```

---

**JSDoc Block:**

```javascript
/**
 * Updates the order of multiple form steps at once.
 * @param updates - An array of objects, each containing `id` (step ID) and `order` (new order value).
 * @returns A promise that resolves to an object indicating success and a message.
 */```

**Associated Code:**

```typescript
async function updateStepOrders(updates: Array<{ id: string; order: number }>): Promise<{
```

---

**JSDoc Block:**

```javascript
/**
 * Deletes a form submission.
 * This function is also part of `cmsOperations` but defined here for direct export or use by `graphqlClient`.
 * @param id - The ID of the form submission to delete.
 * @returns A promise that resolves to a FormSubmissionResult object.
 */```

**Associated Code:**

```typescript
async function deleteFormSubmission(id: string): Promise<FormSubmissionResult> {
```

---
