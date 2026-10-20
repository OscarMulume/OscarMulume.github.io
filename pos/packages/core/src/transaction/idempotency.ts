/**
 * Génération d'Idempotency-Key (UUID v4).
 * Une clé est créée UNE fois par transaction logique, puis RÉUTILISÉE
 * pour chaque tentative de retry → le serveur dédoublonne les écritures.
 */

export type RandomBytes = (target: Uint8Array) => void;

const HEX = '0123456789abcdef';

function cryptoRandomBytes(target: Uint8Array): void {
  const webCrypto = globalThis.crypto;
  if (webCrypto === undefined || typeof webCrypto.getRandomValues !== 'function') {
    throw new Error(
      'Aucun CSPRNG disponible : fournissez une implémentation RandomBytes (ex. expo-crypto).',
    );
  }
  webCrypto.getRandomValues(target);
}

/** UUID v4 déterministe si `randomBytes` est injecté (idéal pour les tests). */
export function uuidv4(randomBytes: RandomBytes = cryptoRandomBytes): string {
  const bytes = new Uint8Array(16);
  randomBytes(bytes);

  // Version 4 + variante RFC 4122.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  let out = '';
  for (let i = 0; i < 16; i += 1) {
    const byte = bytes[i] ?? 0;
    out += HEX[byte >> 4] ?? '0';
    out += HEX[byte & 0x0f] ?? '0';
    if (i === 3 || i === 5 || i === 7 || i === 9) {
      out += '-';
    }
  }
  return out;
}

/** Nouvelle clé d'idempotence pour une transaction logique. */
export function newIdempotencyKey(randomBytes?: RandomBytes): string {
  return uuidv4(randomBytes);
}