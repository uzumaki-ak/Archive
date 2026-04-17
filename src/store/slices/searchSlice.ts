/**
 * Search Slice
 * Manages full-screen search: query, results, pagination, and history.
 *
 * Design decisions:
 * - Search history capped at 10 items (LRU — newest first).
 * - Debouncing happens in the component with useDebounce; this slice
 *   just stores the dispatched results.
 * - Clearing query resets results but preserves history.
 */

import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import { searchBooks } from '../../api/openLibrary';
import type { Book, SearchState } from '../../types';
import { logger } from '../../utils/logger';

const MAX_HISTORY = 10;

const initialState: SearchState = {
  query: '',
  results: [],
  status: 'idle',
  error: null,
  page: 1,
  hasMore: false,
  history: [],
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const performSearch = createAsyncThunk(
  'search/perform',
  async (
    { query, page }: { query: string; page: number },
    { rejectWithValue, signal },
  ) => {
    try {
      const data = await searchBooks({ query, page }, signal);
      return { data, page };
    } catch (err) {
      logger.error('searchSlice', 'performSearch failed', err);
      return rejectWithValue((err as Error).message);
    }
  },
);

export const loadMoreSearchResults = createAsyncThunk(
  'search/loadMore',
  async (
    { query, page }: { query: string; page: number },
    { rejectWithValue, signal },
  ) => {
    try {
      const data = await searchBooks({ query, page }, signal);
      return { data, page };
    } catch (err) {
      logger.error('searchSlice', 'loadMoreSearchResults failed', err);
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
      if (!action.payload) {
        state.results = [];
        state.status = 'idle';
        state.page = 1;
        state.hasMore = false;
        state.error = null;
      }
    },

    addToHistory(state, action: PayloadAction<string>) {
      const term = action.payload.trim();
      if (!term) return;

      // Remove duplicate, then prepend (LRU)
      state.history = [
        term,
        ...state.history.filter((h) => h.toLowerCase() !== term.toLowerCase()),
      ].slice(0, MAX_HISTORY);
    },

    clearHistory(state) {
      state.history = [];
    },

    removeFromHistory(state, action: PayloadAction<string>) {
      state.history = state.history.filter((h) => h !== action.payload);
    },

    clearSearch(state) {
      state.query = '';
      state.results = [];
      state.status = 'idle';
      state.error = null;
      state.page = 1;
      state.hasMore = false;
    },
  },
  extraReducers: (builder) => {
    // ── Fresh search ──────────────────────────────────────────────────────
    builder.addCase(performSearch.pending, (state) => {
      state.status = 'loading';
      state.error = null;
      state.results = [];
      state.page = 1;
    });

    builder.addCase(performSearch.fulfilled, (state, action) => {
      const { docs, numFound } = action.payload.data;
      state.results = docs;
      state.page = 2;
      state.hasMore = docs.length > 0 && docs.length < numFound;
      state.status = 'succeeded';
      state.error = null;
    });

    builder.addCase(performSearch.rejected, (state, action) => {
      if (action.meta.aborted) return;
      state.status = 'failed';
      state.error = (action.payload as string) ?? 'Search failed. Try again.';
    });

    // ── Load more ─────────────────────────────────────────────────────────
    builder.addCase(loadMoreSearchResults.pending, (state) => {
      state.status = 'loadingMore';
    });

    builder.addCase(loadMoreSearchResults.fulfilled, (state, action) => {
      const { docs, numFound } = action.payload.data;

      const existingKeys = new Set(state.results.map((b: Book) => b.key));
      const newBooks = docs.filter((b: Book) => !existingKeys.has(b.key));

      state.results.push(...newBooks);
      state.page += 1;
      state.hasMore = newBooks.length > 0 && state.results.length < numFound;
      state.status = 'succeeded';
    });

    builder.addCase(loadMoreSearchResults.rejected, (state, action) => {
      if (action.meta.aborted) return;
      state.status = 'failed';
      state.error = (action.payload as string) ?? 'Failed to load more results.';
    });
  },
});

export const {
  setQuery,
  addToHistory,
  clearHistory,
  removeFromHistory,
  clearSearch,
} = searchSlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectSearchQuery = (state: { search: SearchState }) => state.search.query;
export const selectSearchResults = (state: { search: SearchState }) => state.search.results;
export const selectSearchStatus = (state: { search: SearchState }) => state.search.status;
export const selectSearchError = (state: { search: SearchState }) => state.search.error;
export const selectSearchHistory = (state: { search: SearchState }) => state.search.history;
export const selectSearchHasMore = (state: { search: SearchState }) => state.search.hasMore;
export const selectSearchPage = (state: { search: SearchState }) => state.search.page;

export default searchSlice.reducer;
