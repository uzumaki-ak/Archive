/**
 * Persistence Layer
 *
 * Uses react-native-mmkv as the storage backend for redux-persist.
 * MMKV is ~30x faster than AsyncStorage and synchronous under the hood.
 *
 * Security note:
 * - For production apps storing auth tokens, initialise MMKV with
 *   an encryptionKey sourced from react-native-keychain / Android Keystore.
 * - This app stores only book data (no PII/tokens), so plain storage is fine.
 *   The encryption setup is shown in comments below for reference.
 */

import { MMKV } from 'react-native-mmkv';

// Single shared instance — never instantiate MMKV multiple times
export const storage = new MMKV({
  id: 'the-archive-store',
  // encryptionKey: getEncryptionKeyFromKeychain(), // Enable for sensitive data
});

/**
 * redux-persist storage adapter.
 * redux-persist expects a Promise-based API; MMKV is synchronous,
 * so we wrap with Promise.resolve() — zero overhead.
 */
export const mmkvStorageAdapter = {
  setItem: (key: string, value: string): Promise<boolean> => {
    storage.set(key, value);
    return Promise.resolve(true);
  },

  getItem: (key: string): Promise<string | undefined> => {
    const value = storage.getString(key);
    return Promise.resolve(value);
  },

  removeItem: (key: string): Promise<void> => {
    storage.delete(key);
    return Promise.resolve();
  },
};
