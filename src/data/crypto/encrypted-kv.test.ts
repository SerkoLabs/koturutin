import { randomBytes as nodeRandomBytes } from 'crypto';
import * as naclUtil from 'tweetnacl-util';
import { EncryptedKV } from './encrypted-kv';
import { KEY_BYTES, type RandomBytes } from './secret-box';
import type { KeyValueStore } from '../kv';
import type { KeyProvider } from './key-provider';

const rb: RandomBytes = (n) => new Uint8Array(nodeRandomBytes(n));

class MemoryKV implements KeyValueStore {
  store = new Map<string, string>();
  async getItem(k: string) {
    return this.store.get(k) ?? null;
  }
  async setItem(k: string, v: string) {
    this.store.set(k, v);
  }
  async removeItem(k: string) {
    this.store.delete(k);
  }
}

class FixedKeyProvider implements KeyProvider {
  private readonly key = naclUtil.encodeBase64(new Uint8Array(nodeRandomBytes(KEY_BYTES)));
  async getOrCreateKey() {
    return this.key;
  }
}

describe('EncryptedKV', () => {
  it('round-trips a value and stores only ciphertext underneath', async () => {
    const inner = new MemoryKV();
    const kv = new EncryptedKV(inner, new FixedKeyProvider(), rb);
    const token = 'eyJhbGciOi.session-token.SENSITIVE';
    await kv.setItem('sb-session', token);
    expect(await kv.getItem('sb-session')).toBe(token);
    const raw = inner.store.get('sb-session');
    expect(raw).toBeDefined();
    expect(raw as string).not.toContain('SENSITIVE'); // not stored in the clear
  });

  it('returns null for a missing key and for a corrupt value (no throw)', async () => {
    const inner = new MemoryKV();
    const kv = new EncryptedKV(inner, new FixedKeyProvider(), rb);
    expect(await kv.getItem('missing')).toBeNull();
    await inner.setItem('bad', 'not-ciphertext');
    expect(await kv.getItem('bad')).toBeNull();
  });

  it('removeItem clears the underlying value', async () => {
    const inner = new MemoryKV();
    const kv = new EncryptedKV(inner, new FixedKeyProvider(), rb);
    await kv.setItem('k', 'v');
    await kv.removeItem('k');
    expect(inner.store.has('k')).toBe(false);
  });
});
