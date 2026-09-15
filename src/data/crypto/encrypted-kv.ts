/**
 * A generic encrypted string key-value store (SEC audit P2-1). Wraps a plain KeyValueStore and
 * transparently encrypts every value with the OS-keystore data key (tweetnacl secretbox), so callers
 * read/write plaintext while nothing sensitive is ever written to the underlying store in the clear.
 *
 * Used as the Supabase auth `storage` adapter so the persisted session (access + refresh tokens) is
 * encrypted at rest in AsyncStorage — the token blob can exceed SecureStore's per-value size limit,
 * so we keep the blob in AsyncStorage and only the 32-byte key in the keystore.
 *
 * Reads that fail to decrypt (corrupt / wrong key) resolve to null, so a bad blob simply looks like
 * "no value" (e.g. Supabase then treats it as no session) rather than crashing.
 */
import type { KeyValueStore } from '../kv';
import type { KeyProvider } from './key-provider';
import { decryptString, encryptString, type RandomBytes } from './secret-box';

export class EncryptedKV implements KeyValueStore {
  constructor(
    private readonly inner: KeyValueStore,
    private readonly keys: KeyProvider,
    private readonly randomBytes: RandomBytes,
  ) {}

  async getItem(key: string): Promise<string | null> {
    const raw = await this.inner.getItem(key);
    if (raw === null) return null;
    return decryptString(raw, await this.keys.getOrCreateKey());
  }

  async setItem(key: string, value: string): Promise<void> {
    const enc = encryptString(value, await this.keys.getOrCreateKey(), this.randomBytes);
    await this.inner.setItem(key, enc);
  }

  async removeItem(key: string): Promise<void> {
    await this.inner.removeItem(key);
  }
}
