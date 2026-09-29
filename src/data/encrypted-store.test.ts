import { randomBytes as nodeRandomBytes } from 'crypto';
import * as naclUtil from 'tweetnacl-util';
import { createProfile, emptyAppData, recordOutcome, updateProfile, type AppData } from '@/domain/model';
import { EncryptedStore, ENC_KEY, LEGACY_PLAINTEXT_KEY } from './encrypted-store';
import { KEY_BYTES, type RandomBytes } from './crypto/secret-box';
import type { KeyValueStore } from './kv';
import type { KeyProvider } from './crypto/key-provider';

const NOW = '2026-09-11T20:00:00.000Z';
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

/** An AppData carrying a distinctive sensitive marker in a free note. */
function sensitiveDoc(marker: string): AppData {
  let d = createProfile(emptyAppData(), { id: 'u1', language: 'tr', timezone: 'Europe/Istanbul', nowISO: NOW });
  d = updateProfile(d, { ageConfirmed18: true, consentHealthProcessing: true }, NOW);
  d = recordOutcome(d, {
    outcomeId: 'o1', userId: 'u1', attemptId: 'att1', craving: 2, energy: 6, mood: 7,
    connectionFeeling: 8, freeNote: marker, nowISO: NOW,
  });
  return d;
}

describe('EncryptedStore', () => {
  it('round-trips the document (save → load) identically', async () => {
    const kv = new MemoryKV();
    const store = new EncryptedStore(kv, new FixedKeyProvider(), rb);
    const d = sensitiveDoc('note-round-trip');
    await store.save(d);
    expect(await store.load()).toEqual(d);
  });

  it('stores CIPHERTEXT at rest — the sensitive marker never appears in the raw value', async () => {
    const kv = new MemoryKV();
    const store = new EncryptedStore(kv, new FixedKeyProvider(), rb);
    await store.save(sensitiveDoc('SENSITIVE_MARKER_XYZ'));
    const raw = await kv.getItem(ENC_KEY);
    expect(raw).not.toBeNull();
    expect(raw as string).not.toContain('SENSITIVE_MARKER_XYZ');
    expect(() => JSON.parse(raw as string)).toThrow(); // not readable JSON
  });

  it('migrates a legacy PLAINTEXT document into the encrypted blob and deletes the plaintext', async () => {
    const kv = new MemoryKV();
    const d = sensitiveDoc('legacy-note');
    await kv.setItem(LEGACY_PLAINTEXT_KEY, JSON.stringify(d)); // as the old plaintext store wrote it
    const store = new EncryptedStore(kv, new FixedKeyProvider(), rb);

    const loaded = await store.load();
    expect(loaded).toEqual(d);
    expect(await kv.getItem(LEGACY_PLAINTEXT_KEY)).toBeNull(); // plaintext removed
    const enc = await kv.getItem(ENC_KEY);
    expect(enc).not.toBeNull();
    expect(enc as string).not.toContain('legacy-note'); // now encrypted at rest
  });

  it('save() never leaves a plaintext copy behind', async () => {
    const kv = new MemoryKV();
    await kv.setItem(LEGACY_PLAINTEXT_KEY, '{"stale":true}');
    const store = new EncryptedStore(kv, new FixedKeyProvider(), rb);
    await store.save(sensitiveDoc('x'));
    expect(await kv.getItem(LEGACY_PLAINTEXT_KEY)).toBeNull();
  });

  it('returns null (no crash) on a corrupt encrypted blob', async () => {
    const kv = new MemoryKV();
    await kv.setItem(ENC_KEY, 'totally-not-valid-ciphertext');
    const store = new EncryptedStore(kv, new FixedKeyProvider(), rb);
    expect(await store.load()).toBeNull();
  });

  it('returns null when nothing is stored', async () => {
    const store = new EncryptedStore(new MemoryKV(), new FixedKeyProvider(), rb);
    expect(await store.load()).toBeNull();
  });

  it('clear() removes both the encrypted and any legacy blob', async () => {
    const kv = new MemoryKV();
    const store = new EncryptedStore(kv, new FixedKeyProvider(), rb);
    await store.save(sensitiveDoc('y'));
    await kv.setItem(LEGACY_PLAINTEXT_KEY, '{"stale":true}');
    await store.clear();
    expect(await kv.getItem(ENC_KEY)).toBeNull();
    expect(await kv.getItem(LEGACY_PLAINTEXT_KEY)).toBeNull();
  });
});
