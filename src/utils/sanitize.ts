/**
 * Sanitization & Validation Utilities
 * OWASP principle: treat all external input as potentially malicious.
 * These run on data coming in from the API before it touches Redux state.
 */

/**
 * Strips any HTML tags from a string.
 * Prevents XSS if content is ever rendered in a WebView.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitizes a search query:
 * - Trim whitespace
 * - Limit length to prevent oversized API requests
 * - Remove characters that could manipulate URL params
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return '';
  return query
    .trim()
    .slice(0, 100) // max 100 chars
    .replace(/[<>"'%;()&+]/g, ''); // remove dangerous chars
}

/**
 * Validates that a book key follows the Open Library format.
 * e.g. '/works/OL45804W' or '/books/OL123M'
 */
export function isValidBookKey(key: unknown): key is string {
  if (typeof key !== 'string') return false;
  return /^\/(works|books|authors)\/OL\d+[WMA]$/.test(key);
}

/**
 * Safely extracts description string from OL API,
 * which can be either a string or { value: string }.
 */
export function extractDescription(
  description: string | { value: string } | undefined,
): string | null {
  if (!description) return null;
  if (typeof description === 'string') return stripHtml(description);
  if (typeof description === 'object' && 'value' in description) {
    return stripHtml(description.value);
  }
  return null;
}

/**
 * Validates a cover image ID is a positive integer.
 */
export function isValidCoverId(id: unknown): id is number {
  return typeof id === 'number' && Number.isInteger(id) && id > 0;
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
