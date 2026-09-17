import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { MsecError, type Role } from '@msec/core';
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from '@msec/security';

const SESSION_SECRET = process.env['MSEC_SESSION_SECRET'] ?? '';

/** Lit et vérifie la session httpOnly. `null` si absente/expirée/invalide. */
export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value ?? null;
  if (token === null || SESSION_SECRET.length === 0) {
    return null;
  }
  return verifySessionToken(token, SESSION_SECRET);
}

export async function requirePortalSession(): Promise<SessionPayload> {
  const session = await readSession();
  if (session === null || session.role === 'VISITOR') {
    redirect('/connexion');
  }
  return session;
}

/** Écrit le jeton signé dans un cookie httpOnly — inaccessible au JavaScript. */
export async function createPortalSession(input: {
  readonly sub: string;
  readonly role: Role;
  readonly subjectClientId: string | null;
}): Promise<string> {
  if (SESSION_SECRET.length === 0) {
    throw new MsecError('INTERNAL', 'MSEC_SESSION_SECRET non configuré sur le serveur');
  }
  const token = await signSessionToken(
    { ...input, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1_000 },
    SESSION_SECRET,
  );
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return token;
}

export async function destroyPortalSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}