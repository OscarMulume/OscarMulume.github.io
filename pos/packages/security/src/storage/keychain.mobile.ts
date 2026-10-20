import * as SecureStore from 'expo-secure-store';

import { SecureStorageError } from './types';
import type { SecureStorage } from './types';

const DEFAULT_NAMESPACE = 'com.msec.pos';

/**
 * Implémentation MOBILE : Expo SecureStore
 * (Keychain iOS + Keystore Android, chiffré AES-256 en matériel/OS).
 */
export class ExpoSecureStorage implements SecureStorage {
  public readonly namespace: string;

  constructor(namespace: string = DEFAULT_NAMESPACE) {
    this.namespace = namespace;
  }

  private keyFor(key: string): string {
    return `${this.namespace}.${key}`;
  }

  private convertError(context: string, error: unknown): SecureStorageError {
    return new SecureStorageError(`Echec ${context} (${this.namespace}): ${String(error)}`, {
      cause: error,
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.keyFor(key), value, {
        keychainService: this.namespace,
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        requireAuthentication: false,
      });
    } catch (error: unknown) {
      throw this.convertError(`setItem ${key}`, error);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.keyFor(key), {
        keychainService: this.namespace,
      });
    } catch (error: unknown) {
      throw this.convertError(`getItem ${key}`, error);
    }
  }

  async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.keyFor(key), {
        keychainService: this.namespace,
      });
    } catch (error: unknown) {
      throw this.convertError(`deleteItem ${key}`, error);
    }
  }

  async hasItem(key: string): Promise<boolean> {
    return (await this.getItem(key)) !== null;
  }
}