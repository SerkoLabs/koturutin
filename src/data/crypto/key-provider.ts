/**
 * Secret-key provider for at-rest encryption (SEC audit P2-1/P2-3). The 256-bit data key lives in the
 * OS keystore (iOS Keychain / Android Keystore) via expo-secure-store — NOT in AsyncStorage — and is
 * generated once with expo-crypto's secure RNG. It is marked device-only (never backed up / synced to
 * iCloud) so the encrypted document cannot be decrypted off-device.
 *
 * The interface is injected into EncryptedStore so tests can supply a fixed key without native modules.
 */
import * as SecureStore from 'expo-secure-store';
import { getRandomBytes } from 'expo-crypto';
import * as naclUtil from 'tweetnacl-util';
import { KEY_BYTES } from './secret-box';

export interface KeyProvider {
  /** Return the base64 data key, generating and persisting one on first use. */
  getOrCreateKey(): Promise<string>;
}

const KEY_NAME = 'koturutin.datakey.v1';

export class SecureStoreKeyProvider implements KeyProvider {
  async getOrCreateKey(): Promise<string> {
    const existing = await SecureStore.getItemAsync(KEY_NAME);
    if (existing) return existing;
    const key = naclUtil.encodeBase64(Uint8Array.from(getRandomBytes(KEY_BYTES)));
    await SecureStore.setItemAsync(KEY_NAME, key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return key;
  }
}
