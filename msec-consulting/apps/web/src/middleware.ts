import { NextResponse, type NextRequest } from 'next/server';

import { PORTAL_ROLES, type Role } from '@msec/core';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@msec/security';

const SESSION_SECRET = process.env['MSEC_SESSION_SECRET'] ?? '';

const LOGIN_PATH = '/connexion';

interface RouteProtection {
  readonly roles: readonly Role[];
}

function resolveProtection(pathname: string): RouteProtection | null {
  if (pathname.startsWith('/admin')) {
    return { roles: ['ADMIN', 'OWNER'] };
  }
  if (pathname.startsWith('/espace')) {
    return { roles: PORTAL_ROLES };
  }
  return null;
}

/**
 * Middleware : protection de routes SIAMOISE (edge runtime).
 *  - session httpOnly HMAC vérifiée sur chaque requête,
 *  - cookie falsifié/expiré → 302 vers /connexion (et purge),
 *  - rôle insuffisant → rewrite interne /403 (pas de divergence de statut).
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const protection = resolveProtection(request.nextUrl.pathname);
  if (protection === null) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session =
    token !== null && SESSION_SECRET.length > 0 ? await verifySessionToken(token, SESSION_SECRET) : null;

  if (session === null) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  if (!protection.roles.includes(session.role)) {
    const forbidden = request.nextUrl.clone();
    forbidden.pathname = '/403';
    forbidden.search = '';
    return NextResponse.rewrite(forbidden);
  }

  const response = NextResponse.next();
  response.headers.set('x-msec-role', session.role);
  response.headers.set('x-msec-subject', session.sub);
  return response;
}

export const config = {
  matcher: ['/espace/:path*', '/admin/:path*'],
};