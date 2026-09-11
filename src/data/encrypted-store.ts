/**
 * Encrypted on-device Store (MASVS-STORAGE-1; SEC audit P2-3). The single AppData document is
 * AES-class authenticated-encrypted (tweetnacl secretbox) before it touches AsyncStorage, with the
 * key held in the OS keystore (see KeyProvider). This replaces the previous plaintext AsyncStorage
 * store behind the same `Store` port — the domain and UI are unchanged (ADR-004 local-first).
 *
 * Backward compatibility: on first load it migrates any existing PLAINTEXT document (written by the
 * old store) into the encrypted blob and deletes the plaintext copy, so no local data is lost.
 *
 * Fail-safe: unreadable/corrupt/tampered data returns null (start fresh) rather than crashing —
 * matching the previous store's behavior.
 */
import { normalizeAppData, type AppData } from '@/domain/model';
import type { Store } from './store';
import type { KeyValueStore } from './kv';
import type { KeyProvider } from './crypto/key-provider';
import { decryptString, encryptString, type RandomBytes } from './crypto/secret-box';

export const ENC_KEY = 'koturutin.appdata.enc';
/** The key the old plaintext store used. Migrated into the encrypted blob + removed on first load. */
export const LEGACY_PLAINTEXT_KEY = 'koturutin.appdata';

export class EncryptedStore implements Store {
  constructor(
    private readonly kv: KeyValueStore,
    private readonly keys: KeyProvider,
    private readonly randomBytes: RandomBytes,
  ) {}

  async load(): Promise<AppData | null> {
    try {
      const enc = await this.kv.getItem(ENC_KEY);
      if (enc !== null) {
        const key = await this.keys.getOrCreateKey();
        const json = decryptString(enc, key);
        if (json === null) return null; // corrupt / wrong key — start fresh, don't crash
        return normalizeAppData(JSON.parse(json) as Partial<AppData>);
      }
      // One-time migration of a legacy plaintext document, if present.
      const legacy = await this.kv.getItem(LEGACY_PLAINTEXT_KEY);
      if (legacy !== null) {
        const data = normalizeAppData(JSON.parse(legacy) as Partial<AppData>);
        await this.save(data); // re-writes encrypted AND removes the plaintext copy
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }

  async save(data: AppData): Promise<void> {
    const key = await this.keys.getOrCreateKey();
    const enc = encryptString(JSON.stringify(data), key, this.randomBytes);
    await this.kv.setItem(ENC_KEY, enc);
    // Never leave a plaintext copy behind once we hold an encrypted one.
    await this.kv.removeItem(LEGACY_PLAINTEXT_KEY);
  }

  async clear(): Promise<void> {
    await this.kv.removeItem(ENC_KEY);
    await this.kv.removeItem(LEGACY_PLAINTEXT_KEY);
  }
}
