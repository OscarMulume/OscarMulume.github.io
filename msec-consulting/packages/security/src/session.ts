/**
 * Token de session HMAC-SHA-256 signé (WebCrypto) — viable Edge Runtime
 * (Next.js Middleware) et navigateur. Le cookie httpOnly est positionné par
 * l’application hôte (cookies().set) ; ici, la signature et la vérification
 * en tant que fonctions pures.
 */
import { isRole, MsecError, type Role } from '@msec/core';

export const SESSION_COOKIE_NAME = 'msec_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

export interface SessionPayload {
  readonly sub: string;
  readonly role: Role;
  readonly subjectClientId: string | null;
  readonly exp: number;
}

export interface CookieOptions {
  readonly httpOnly: boolean;
  readonly secure: boolean;
  readonly sameSite: 'lax' | 'strict' | 'none';
  readonly path: string;
  readonly maxAge: number;
}

export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: runtimeIsProduction(),
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
} as const;

/** Accès à l'environnement sans @types/node (Edge-safe). */
function runtimeIsProduction(): boolean {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return (env?.['NODE_ENV'] ?? 'production') !== 'development';
}

// ---------------------------------------------------------------------------
// Base64url (compact, sans dépendances)
// ---------------------------------------------------------------------------

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

async function hmacSign(
  payloadBytes: Uint8Array<ArrayBuffer>,
  secret: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, payloadBytes));
}

async function hmacVerify(
  payloadBytes: Uint8Array<ArrayBuffer>,
  signatureBytes: Uint8Array<ArrayBuffer>,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return crypto.subtle.verify('HMAC', key, signatureBytes, payloadBytes);
}

/**
 * Token au format `base64url(payload).base64url(HMAC-SHA256)`.
 * Jamais exposé au navigateur (httpOnly cookie).
 */
export async function signSessionToken(session: SessionPayload, secret: string): Promise<string> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(session));
  const signature = await hmacSign(payloadBytes, secret);
  return `${bytesToBase64Url(payloadBytes)}.${bytesToBase64Url(signature)}`;
}

/**
 * Vérifie et décode un token. Retourne `null` si :
 *  - le format est incorrect,
 *  - la signature ne correspond pas,
 *  - le token est expiré,
 *  - le rôle est invalide (token falsifié).
 */
export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  const separatorIndex = token.indexOf('.');
  if (separatorIndex <= 0) {
    return null;
  }
  const payloadB64 = token.slice(0, separatorIndex);
  const signatureB64 = token.slice(separatorIndex + 1);

  try {
    const payloadBytes = base64UrlToBytes(payloadB64);
    const signatureBytes = base64UrlToBytes(signatureB64);
    const valid = await hmacVerify(payloadBytes, signatureBytes, secret);
    if (!valid) {
      return null;
    }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (typeof parsed !== 'object' || parsed === null || !('sub' in parsed) || !('exp' in parsed) || !('role' in parsed)) {
      return null;
    }
    const { sub, exp, role, subjectClientId } = parsed as {
      sub: unknown;
      exp: unknown;
      role: unknown;
      subjectClientId?: unknown;
    };
    if (typeof sub !== 'string' || typeof exp !== 'number' || typeof role !== 'string') {
      return null;
    }
    if (!isRole(role)) {
      return null;
    }
    if (exp < Date.now()) {
      return null;
    }
    return {
      sub,
      role,
      subjectClientId: typeof subjectClientId === 'string' ? subjectClientId : null,
      exp,
    };
  } catch {
    return null;
  }
}