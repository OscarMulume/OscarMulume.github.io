import { invoke } from '@tauri-apps/api/core';

import { SecureStorageError } from './types';
import type { SecureStorage } from './types';

const DEFAULT_NAMESPACE = 'com.msec.pos';

/**
 * Implémentation DESKTOP : tiroir de secrets du système d'exploitation
 * (Keychain macOS / Credential Manager Windows / libsecret Linux) via le
 * command handler Rust (`secure_set_secret`, `secure_get_secret`,
 * `secure_delete_secret` défini dans apps/desktop/src-tauri).
 */
export class TauriKeychainStorage implements SecureStorage {
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
      await invoke<string>('secure_set_secret', {
        key: this.keyFor(key),
        value,
      });
    } catch (error: unknown) {
      throw this.convertError(`setItem ${key}`, error);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = await invoke<string | null>('secure_get_secret', {
        key: this.keyFor(key),
      });
      return value ?? null;
    } catch (error: unknown) {
      throw this.convertError(`getItem ${key}`, error);
    }
  }

  async deleteItem(key: string): Promise<void> {
    try {
      await invoke<string>('secure_delete_secret', {
        key: this.keyFor(key),
      });
    } catch (error: unknown) {
      throw this.convertError(`deleteItem ${key}`, error);
    }
  }

  async hasItem(key: string): Promise<boolean> {
    return (await this.getItem(key)) !== null;
  }
}