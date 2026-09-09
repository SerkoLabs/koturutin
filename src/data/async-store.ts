/**
 * On-device Store implementation using AsyncStorage. This is the real local-first persistence for
 * the app: the AppData document is JSON-serialized under a versioned key and survives app restarts
 * (spine §10, ADR-004). Sensitive data stays on the device; nothing here reaches a network.
 *
 * (ARCHITECTURE §11 names SQLite/SecureStore as the eventual local store; the MVP slice uses a
 * single JSON document behind the Store port so the storage engine can be swapped without touching
 * the domain or UI — recorded in docs/DECISIONS.md ADR-011.)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_DATA_VERSION, type AppData } from '@/domain/model';
import type { Store } from './store';

const KEY = `koturutin.appdata.v${APP_DATA_VERSION}`;

export class AsyncStorageStore implements Store {
  async load(): Promise<AppData | null> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AppData;
      if (parsed.version !== APP_DATA_VERSION) return null; // future: migrate
      return parsed;
    } catch {
      // Corrupt/unreadable local data must not crash the app; start fresh.
      return null;
    }
  }

  async save(data: AppData): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
