/**
 * Redux Store
 *
 * Architecture decisions:
 * - Redux Toolkit (RTK) reduces boilerplate significantly.
 * - redux-persist + MMKV persists saved library and search history across
 *   app restarts. Books feed is NOT persisted (always re-fetched on launch).
 * - PersistGate in App.tsx delays render until rehydration is complete.
 * - Middleware is configured to ignore redux-persist serializability warnings
 *   (expected when using non-serializable actions from persist).
 * - Typed hooks (useAppDispatch, useAppSelector) live here for DRY usage.
 */

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { mmkvStorageAdapter } from './persist';

import booksReducer from './slices/booksSlice';
import searchReducer from './slices/searchSlice';
import savedLibraryReducer from './slices/savedLibrarySlice';

// ─── Persist Configuration ───────────────────────────────────────────────────

/**
 * Only persist the parts of state that should survive app restarts:
 * - savedLibrary: user's bookshelf (full offline support)
 * - search.history: recent search terms
 *
 * We do NOT persist:
 * - books.items: always re-fetched (stale data detection handles this)
 * - search.results: transient, re-searched on demand
 */

const searchPersistConfig = {
  key: 'search',
  storage: mmkvStorageAdapter,
  whitelist: ['history'], // Only persist search history
};

const savedLibraryPersistConfig = {
  key: 'savedLibrary',
  storage: mmkvStorageAdapter,
  // Persist everything in savedLibrary
};

const rootReducer = combineReducers({
  books: booksReducer,
  search: persistReducer(searchPersistConfig, searchReducer),
  savedLibrary: persistReducer(savedLibraryPersistConfig, savedLibraryReducer),
});

// ─── Store ───────────────────────────────────────────────────────────────────

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist action types (they carry non-serializable data)
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// ─── Types ───────────────────────────────────────────────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ─── Typed Hooks ─────────────────────────────────────────────────────────────

/** Use throughout app instead of plain `useDispatch` */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Use throughout app instead of plain `useSelector` */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
