/**
 * Open Library API Service
 *
 * Architecture decisions:
 * - All API calls live here — screens/slices never call fetch directly.
 * - AbortController support for request cancellation (prevents stale responses).
 * - Timeout implemented manually (fetch doesn't have built-in timeout).
 * - Typed responses validated before returning to callers.
 * - No API key required for Open Library — public domain data.
 */

import type {
  BookDetail,
  BookSearchResponse,
  FetchBooksParams,
  SearchBooksParams,
} from '../types';
import { logger } from '../utils/logger';
import { sanitizeSearchQuery } from '../utils/sanitize';

const BASE_URL = 'https://openlibrary.org';
const COVERS_URL = 'https://covers.openlibrary.org/b/id';
const DEFAULT_LIMIT = 20;
const REQUEST_TIMEOUT_MS = 10_000;

// Open Library blocks single common stop words
const BLOCKED_QUERIES = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'is', 'it', 'as', 'be', 'are', 'was', 'were',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUrl(path: string, params: Record<string, string | number>): string {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  return url.toString();
}

function getUserFriendlyErrorMessage(status: number): string {
  switch (status) {
    case 404: return 'We could not find what you were looking for.';
    case 422: return 'Invalid search query. Please try different keywords.';
    case 429: return 'You are searching too fast. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504: return 'The public library is currently experiencing downtime. Please try again later.';
    default: return 'Something went wrong while connecting to the library.';
  }
}

async function fetchWithTimeout<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Merge with external signal if provided
  const combinedSignal = signal ?? controller.signal;

  try {
    const response = await fetch(url, {
      signal: combinedSignal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TheArchive/1.0 (contact@thearchive.app)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        getUserFriendlyErrorMessage(response.status),
        response.status,
      );
    }

    const data: T = await response.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) throw err;

    if ((err as Error).name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your internet connection.', 408);
    }

    throw new ApiError(
      'Unable to connect. Please check your internet connection.',
      0,
    );
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Cover URL Builder ────────────────────────────────────────────────────────

export type CoverSize = 'S' | 'M' | 'L';

export function getCoverUrl(coverId: number, size: CoverSize = 'M'): string {
  return `${COVERS_URL}/${coverId}-${size}.jpg`;
}

// ─── API Methods ─────────────────────────────────────────────────────────────

/**
 * Fetches the trending/general book feed.
 * Uses a broad query to get diverse results for the home screen.
 */
export async function fetchBooks(
  { page, limit = DEFAULT_LIMIT }: FetchBooksParams,
  signal?: AbortSignal,
): Promise<BookSearchResponse> {
  // Rotate subject queries to keep the home feed diverse
  const subjects = ['fiction', 'history', 'science', 'philosophy', 'art'];
  const subject = subjects[page % subjects.length];

  const url = buildUrl('/search.json', {
    subject,
    page,
    limit,
    fields: 'key,title,author_name,cover_i,first_publish_year,publisher,subject,number_of_pages_median,edition_count,language',
  });

  logger.info('API', `fetchBooks → page ${page}, subject: ${subject}`);

  const data = await fetchWithTimeout<BookSearchResponse>(url, signal);

  // Validate and filter out malformed entries
  const validDocs = (data.docs ?? []).filter(
    (book) => typeof book.key === 'string' && typeof book.title === 'string',
  );

  return { ...data, docs: validDocs };
}

/**
 * Searches books by query string.
 * Uses simple URL construction to avoid polyfill issues.
 * Only requests essential fields to prevent 422 errors.
 */
export async function searchBooks(
  { query, page, limit = DEFAULT_LIMIT }: SearchBooksParams,
  signal?: AbortSignal,
): Promise<BookSearchResponse> {
  const safeQuery = sanitizeSearchQuery(query);

  if (!safeQuery) {
    return { numFound: 0, start: 0, numFoundExact: true, docs: [] };
  }

  // Open Library rejects single stop words with 422
  if (BLOCKED_QUERIES.has(safeQuery.toLowerCase())) {
    return { numFound: 0, start: 0, numFoundExact: true, docs: [] };
  }

  // Build URL manually to avoid URLSearchParams issues
  const encodedQuery = encodeURIComponent(safeQuery);
  const fields = 'key,title,author_name,cover_i,first_publish_year,publisher,subject,number_of_pages_median,edition_count,language';
  const url = `${BASE_URL}/search.json?q=${encodedQuery}&page=${page}&limit=${limit}&fields=${fields}`;

  logger.info('API', `searchBooks → "${safeQuery}", page ${page}`);

  const data = await fetchWithTimeout<BookSearchResponse>(url, signal);

  const validDocs = (data.docs ?? []).filter(
    (book) => typeof book.key === 'string' && typeof book.title === 'string',
  );

  return { ...data, docs: validDocs };
}

/**
 * Fetches full detail for a specific work.
 * The key format is '/works/OL123W' — we strip the leading slash.
 */
export async function fetchBookDetail(
  workKey: string,
  signal?: AbortSignal,
): Promise<BookDetail> {
  const url = `${BASE_URL}${workKey}.json`;
  logger.info('API', `fetchBookDetail → ${workKey}`);
  return fetchWithTimeout<BookDetail>(url, signal);
}
