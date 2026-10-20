import * as SecureStore from 'expo-secure-store';

import { MsecError } from '@msec/core';

export const SESSION_TOKEN_KEY = 'session';

/**
 * Wrapper plat sur expo-secure-store, nombres de clés limités
 * (120 sur iOS, 65536 sur Android) et jamais de JSON en clair —
 * la valeur est un token signé opaque.
 */
export class SecureTokenStorage {
  readonly #prefix: string;

  constructor(prefix = 'msec') {
    this.#prefix = prefix;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.#key(key));
    } catch (error) {
      throw new MsecError('INTERNAL', 'SecureStore indisponible en lecture', { cause: error });
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.#key(key), value);
    } catch (error) {
      throw new MsecError('INTERNAL', 'SecureStore indisponible en écriture', { cause: error });
    }
  }

  async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.#key(key));
    } catch (error) {
      throw new MsecError('INTERNAL', 'SecureStore indisponible en suppression', { cause: error });
    }
  }

  #key(key: string): string {
    return `${this.#prefix}:${key}`;
  }
}