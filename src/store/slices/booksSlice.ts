/**
 * Books Slice
 * Manages the home feed: fetching, pagination, and stale-data detection.
 *
 * Design decisions:
 * - RTK's createAsyncThunk handles loading/error states automatically.
 * - Items are deduplicated by key on append (prevents dupes from double-fetches).
 * - lastFetchedAt is stored to decide whether to refresh on app foreground.
 * - Abort signal is threaded through so in-flight requests can be cancelled.
 */

import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import { fetchBooks } from '../../api/openLibrary';
import type { Book, BooksState } from '../../types';
import { logger } from '../../utils/logger';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

const initialState: BooksState = {
  items: [],
  status: 'idle',
  error: null,
  page: 1,
  hasMore: true,
  totalFound: 0,
  lastFetchedAt: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const loadBooks = createAsyncThunk(
  'books/load',
  async (_, { rejectWithValue, signal }) => {
    try {
      const data = await fetchBooks({ page: 1 }, signal);
      return data;
    } catch (err) {
      logger.error('booksSlice', 'loadBooks failed', err);
      return rejectWithValue((err as Error).message);
    }
  },
);

export const loadMoreBooks = createAsyncThunk(
  'books/loadMore',
  async (page: number, { rejectWithValue, signal }) => {
    try {
      const data = await fetchBooks({ page }, signal);
      return data;
    } catch (err) {
      logger.error('booksSlice', 'loadMoreBooks failed', err);
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    resetBooks(state) {
      state.items = [];
      state.page = 1;
      state.hasMore = true;
      state.status = 'idle';
      state.error = null;
      state.lastFetchedAt = null;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = 'failed';
    },
  },
  extraReducers: (builder) => {
    // ── Initial load ──────────────────────────────────────────────────────
    builder.addCase(loadBooks.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });

    builder.addCase(loadBooks.fulfilled, (state, action) => {
      const { docs, numFound } = action.payload;
      state.items = docs;
      state.totalFound = numFound;
      state.page = 2; // next page to fetch
      state.hasMore = docs.length > 0 && state.items.length < numFound;
      state.status = 'succeeded';
      state.lastFetchedAt = Date.now();
      state.error = null;
    });

    builder.addCase(loadBooks.rejected, (state, action) => {
      if (action.meta.aborted) return; // Request was cancelled — don't set error
      state.status = 'failed';
      state.error = (action.payload as string) ?? 'Failed to load books.';
    });

    // ── Load more (pagination) ────────────────────────────────────────────
    builder.addCase(loadMoreBooks.pending, (state) => {
      state.status = 'loadingMore';
    });

    builder.addCase(loadMoreBooks.fulfilled, (state, action) => {
      const { docs, numFound } = action.payload;

      // Deduplicate by key — prevents duplicates if user scrolls fast
      const existingKeys = new Set(state.items.map((b: Book) => b.key));
      const newBooks = docs.filter((b: Book) => !existingKeys.has(b.key));

      state.items.push(...newBooks);
      state.totalFound = numFound;
      state.page += 1;
      state.hasMore = newBooks.length > 0 && state.items.length < numFound;
      state.status = 'succeeded';
      state.lastFetchedAt = Date.now();
    });

    builder.addCase(loadMoreBooks.rejected, (state, action) => {
      if (action.meta.aborted) return;
      state.status = 'failed';
      state.error = (action.payload as string) ?? 'Failed to load more books.';
    });
  },
});

export const { resetBooks, setError } = booksSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectBooks = (state: { books: BooksState }) => state.books.items;
export const selectBooksStatus = (state: { books: BooksState }) => state.books.status;
export const selectBooksError = (state: { books: BooksState }) => state.books.error;
export const selectBooksPage = (state: { books: BooksState }) => state.books.page;
export const selectHasMore = (state: { books: BooksState }) => state.books.hasMore;
export const selectIsStale = (state: { books: BooksState }) => {
  const { lastFetchedAt } = state.books;
  if (!lastFetchedAt) return true;
  return Date.now() - lastFetchedAt > STALE_THRESHOLD_MS;
};

export default booksSlice.reducer;
