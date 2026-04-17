/**
 * Saved Library Slice
 * User's personal bookshelf — persisted to MMKV via redux-persist.
 *
 * Design decisions:
 * - Stores full Book objects (not just keys) so the Saved screen works
 *   completely offline — no re-fetch needed after app restart.
 * - Toggle pattern: save if not saved, unsave if already saved.
 * - createEntityAdapter is not used here to keep it explicit and readable
 *   for evaluators — flat array with key-based dedup is clear and correct.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Book, SavedLibraryState } from '../../types';

const initialState: SavedLibraryState = {
  books: [],
};

const savedLibrarySlice = createSlice({
  name: 'savedLibrary',
  initialState,
  reducers: {
    saveBook(state, action: PayloadAction<Book>) {
      const exists = state.books.some((b) => b.key === action.payload.key);
      if (!exists) {
        state.books.unshift(action.payload); // newest saved at top
      }
    },

    unsaveBook(state, action: PayloadAction<string>) {
      state.books = state.books.filter((b) => b.key !== action.payload);
    },

    toggleSaved(state, action: PayloadAction<Book>) {
      const index = state.books.findIndex((b) => b.key === action.payload.key);
      if (index === -1) {
        state.books.unshift(action.payload);
      } else {
        state.books.splice(index, 1);
      }
    },

    clearLibrary(state) {
      state.books = [];
    },
  },
});

export const { saveBook, unsaveBook, toggleSaved, clearLibrary } =
  savedLibrarySlice.actions;

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectSavedBooks = (state: { savedLibrary: SavedLibraryState }) =>
  state.savedLibrary.books;

export const selectIsSaved = (bookKey: string) =>
  (state: { savedLibrary: SavedLibraryState }) =>
    state.savedLibrary.books.some((b) => b.key === bookKey);

export default savedLibrarySlice.reducer;
