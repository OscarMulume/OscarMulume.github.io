import { describe, expect, it } from 'vitest';

import { MsecError } from '../src';
import {
  createDocumentKey,
  decryptDocument,
  encryptDocument,
  hashDocument,
} from '../src/crypto/aes-gcm';

const SECRET = 'document chiffré —— confidentiel';

describe('chiffrement at-rest (AES-256-GCM)', () => {
  it('génère une clé base64url de 32 octets', async () => {
    const key = await createDocumentKey();
    expect(key).toMatch(/^[A-Za-z0-9_-]{43}$/u);
  });

  it('génère deux clés différentes', async () => {
    const [a, b] = await Promise.all([createDocumentKey(), createDocumentKey()]);
    expect(a).not.toBe(b);
  });

  it('chiffre puis déchiffre sans perte', async () => {
    const key = await createDocumentKey();
    const encrypted = await encryptDocument(key, new TextEncoder().encode(SECRET));
    expect(encrypted.iv.length).toBe(16);
    const decoded = await decryptDocument(key, encrypted);
    expect(new TextDecoder().decode(decoded)).toBe(SECRET);
  });

  it('refuse une clé erronée (tag GCM invalide)', async () => {
    const key = await createDocumentKey();
    const otherKey = await createDocumentKey();
    const encrypted = await encryptDocument(key, new TextEncoder().encode(SECRET));
    await expect(decryptDocument(otherKey, encrypted)).rejects.toBeInstanceOf(MsecError);
  });

  it('refuse un ciphertext altéré', async () => {
    const key = await createDocumentKey();
    const encrypted = await encryptDocument(key, new TextEncoder().encode(SECRET));
    const tampered = {
      iv: encrypted.iv,
      ciphertext: `${encrypted.ciphertext.slice(0, -2)}AA`,
    };
    await expect(decryptDocument(key, tampered)).rejects.toBeInstanceOf(MsecError);
  });

  it('calcule une empreinte SHA-256 stable', async () => {
    const digest = await hashDocument(new TextEncoder().encode(SECRET));
    expect(digest).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(await hashDocument(new TextEncoder().encode(SECRET))).toBe(digest);
  });
});