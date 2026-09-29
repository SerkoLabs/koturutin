/**
 * Minimal string key-value port. The EncryptedStore writes only CIPHERTEXT through this, so the
 * underlying engine (AsyncStorage) never sees plaintext special-category data. Kept behind an
 * interface so the store logic is unit-testable against an in-memory implementation.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** On-device adapter. Stores only ciphertext (see EncryptedStore). */
export class AsyncStorageKV implements KeyValueStore {
  getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }
  setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }
  removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
}
