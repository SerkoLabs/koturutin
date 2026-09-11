import { randomBytes as nodeRandomBytes } from 'crypto';
import * as naclUtil from 'tweetnacl-util';
import { decryptString, encryptString, KEY_BYTES, type RandomBytes } from './secret-box';

const rb: RandomBytes = (n) => new Uint8Array(nodeRandomBytes(n));
const makeKey = (): string => naclUtil.encodeBase64(new Uint8Array(nodeRandomBytes(KEY_BYTES)));

describe('secret-box (tweetnacl secretbox)', () => {
  it('round-trips plaintext through encrypt → decrypt', () => {
    const key = makeKey();
    const msg = 'Eve varış: balkonda sigara · gizli not 🚬';
    const ct = encryptString(msg, key, rb);
    expect(decryptString(ct, key)).toBe(msg);
  });

  it('produces ciphertext that is not the plaintext', () => {
    const key = makeKey();
    const ct = encryptString('sensitive', key, rb);
    expect(ct).not.toContain('sensitive');
  });

  it('yields different ciphertext each time (random nonce)', () => {
    const key = makeKey();
    expect(encryptString('same', key, rb)).not.toBe(encryptString('same', key, rb));
  });

  it('returns null when decrypted with the wrong key', () => {
    const ct = encryptString('secret', makeKey(), rb);
    expect(decryptString(ct, makeKey())).toBeNull();
  });

  it('returns null on tampered ciphertext (authenticated)', () => {
    const key = makeKey();
    const ct = encryptString('secret', key, rb);
    const tampered = ct.slice(0, -2) + (ct.endsWith('A') ? 'B=' : 'A=');
    expect(decryptString(tampered, key)).toBeNull();
  });

  it('returns null on malformed input rather than throwing', () => {
    expect(decryptString('not-base64!!', makeKey())).toBeNull();
    expect(decryptString('', makeKey())).toBeNull();
  });

  it('rejects a wrong-length key', () => {
    const shortKey = naclUtil.encodeBase64(new Uint8Array(8));
    expect(() => encryptString('x', shortKey, rb)).toThrow();
    expect(decryptString('AAAA', shortKey)).toBeNull();
  });
});
