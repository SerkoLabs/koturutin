/**
 * Authenticated symmetric encryption for the local at-rest document (MASVS-STORAGE-1; SEC audit
 * P2-3). Uses tweetnacl `secretbox` (XSalsa20-Poly1305) — audited, pure-JS, so it bundles for the
 * app AND runs in the Node test env with no native module.
 *
 * PURE by design: the caller injects the secret key and a secure random-bytes source, so this module
 * has no I/O, no global crypto assumptions, and is fully unit-testable. The app supplies the key from
 * the OS keystore (expo-secure-store) and randomness from expo-crypto's secure RNG.
 *
 * Wire format (base64): [ 24-byte nonce | ciphertext+MAC ]. A fresh random nonce per encryption means
 * encrypting the same plaintext twice yields different output. Decryption is authenticated: any
 * tampering or wrong key returns null rather than garbage.
 */
import nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';

export type RandomBytes = (n: number) => Uint8Array;

/** 32-byte key required by secretbox, carried as base64. */
export const KEY_BYTES = nacl.secretbox.keyLength; // 32
const NONCE_BYTES = nacl.secretbox.nonceLength; // 24

export function encryptString(plaintext: string, keyBase64: string, randomBytes: RandomBytes): string {
  const key = naclUtil.decodeBase64(keyBase64);
  if (key.length !== KEY_BYTES) throw new Error('invalid key length');
  const nonce = Uint8Array.from(randomBytes(NONCE_BYTES));
  const box = nacl.secretbox(naclUtil.decodeUTF8(plaintext), nonce, key);
  const full = new Uint8Array(nonce.length + box.length);
  full.set(nonce, 0);
  full.set(box, nonce.length);
  return naclUtil.encodeBase64(full);
}

/** Decrypt; returns null on any failure (wrong key, tampering, malformed input) — never throws. */
export function decryptString(ciphertextBase64: string, keyBase64: string): string | null {
  try {
    const key = naclUtil.decodeBase64(keyBase64);
    if (key.length !== KEY_BYTES) return null;
    const full = naclUtil.decodeBase64(ciphertextBase64);
    if (full.length < NONCE_BYTES + nacl.secretbox.overheadLength) return null;
    const nonce = full.slice(0, NONCE_BYTES);
    const box = full.slice(NONCE_BYTES);
    const opened = nacl.secretbox.open(box, nonce, key);
    if (!opened) return null;
    return naclUtil.encodeUTF8(opened);
  } catch {
    return null;
  }
}
