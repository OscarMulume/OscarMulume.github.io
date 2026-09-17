import { MsecError } from '../errors';

/**
 * Chiffrement at-rest des documents (AES-256-GCM, WebCrypto) — portable
 * navigateur, Node et Edge. Le document chiffré porte son propre IV ; tout
 * tampering (IV ou ciphertext) rend le déchiffrement invalide (tag GCM).
 */

const AES_GCM_IV_BYTES = 12;
const AES_GCM_KEY_BYTES = 32;

export interface EncryptedDocument {
  readonly iv: string;
  readonly ciphertext: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function importKey(keyB64Url: string): Promise<CryptoKey> {
  const raw = base64UrlToBytes(keyB64Url);
  if (raw.length !== AES_GCM_KEY_BYTES) {
    throw new MsecError('CRYPTO', 'Clé document invalide (32 octets attendus)', {
      details: { length: raw.length },
    });
  }
  return crypto.subtle.importKey('raw', raw as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Clé AES-256 aléatoire, exportée base64url (à ranger dans un KMS/vault, jamais en clair au repos). */
export async function createDocumentKey(): Promise<string> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return bytesToBase64Url(raw);
}

export async function encryptDocument(keyB64Url: string, plaintext: BufferSource): Promise<EncryptedDocument> {
  const key = await importKey(keyB64Url);
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  return { iv: bytesToBase64Url(iv), ciphertext: bytesToBase64Url(cipher) };
}

export async function decryptDocument(keyB64Url: string, encrypted: EncryptedDocument): Promise<Uint8Array> {
  try {
    const key = await importKey(keyB64Url);
    const iv = base64UrlToBytes(encrypted.iv);
    const cipher = base64UrlToBytes(encrypted.ciphertext);
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher as BufferSource));
  } catch (error) {
    throw new MsecError('CRYPTO', 'Déchiffrement refusé : clé, IV ou document altéré', { cause: error });
  }
}

/** Empreinte SHA-256 du document en clair (vérification d'intégrité hors chiffrement). */
export async function hashDocument(plaintext: BufferSource): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', plaintext));
  return bytesToBase64Url(digest);
}