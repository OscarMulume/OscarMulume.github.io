/**
 * Interface commune de stockage sécurisé des secrets.
 * Implémentations : Keychain iOS / Keystore Android (Expo SecureStore) pour le
 * mobile, keyring système natif (via commande Rust) pour le desktop Tauri.
 */

export interface SecureStorage {
  /** Obturateur du stockage (ex. identifiant d'application). */
  readonly namespace: string;

  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  deleteItem(key: string): Promise<void>;
  hasItem(key: string): Promise<boolean>;
}

export class SecureStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SecureStorageError';
  }
}

/** Clés de secrets manipulées par le POS. */
export const SECURE_KEYS = {
  authToken: 'pos.auth.token',
  refreshToken: 'pos.auth.refresh',
  deviceSecret: 'pos.device.secret',
  pinningPubkey: 'pos.security.pinning.pubkey',
} as const;

export type SecureKey = (typeof SECURE_KEYS)[keyof typeof SECURE_KEYS];