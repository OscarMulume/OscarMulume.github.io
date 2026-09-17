import type { Role } from './roles';

/**
 * Matrice RBAC (accès basé sur les rôles), partagée par :
 *  - le Middleware Next.js (protection des routes),
 *  - les gateways serveur (tRPC),
 *  - le portail mobile (masquage de l'UI).
 * Source de vérité unique : ne JAMAIS pouvoir superseder cette matrice côté client.
 */
export const PERMISSIONS = [
  'quote:create',
  'quote:read:own',
  'quote:read:all',
  'quote:update',
  'quote:sign',
  'invoice:create',
  'invoice:read:own',
  'invoice:read:all',
  'invoice:pay',
  'document:encrypt',
  'document:decrypt',
  'client:read',
  'client:manage',
  'admin:rbac',
  'admin:audit',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  VISITOR: [],
  CLIENT: ['quote:read:own', 'quote:sign', 'invoice:read:own', 'invoice:pay', 'document:decrypt'],
  STAFF: [
    'quote:create',
    'quote:read:all',
    'quote:update',
    'invoice:create',
    'invoice:read:all',
    'invoice:pay',
    'document:encrypt',
    'document:decrypt',
    'client:read',
  ],
  ADMIN: [
    'quote:create',
    'quote:read:all',
    'quote:update',
    'quote:sign',
    'invoice:create',
    'invoice:read:all',
    'invoice:pay',
    'document:encrypt',
    'document:decrypt',
    'client:read',
    'client:manage',
    'admin:rbac',
    'admin:audit',
  ],
  OWNER: [...PERMISSIONS],
};

/** Tous les rôles pouvant pénétrer le portail client. */
export const PORTAL_ROLES: readonly Role[] = ['CLIENT', 'STAFF', 'ADMIN', 'OWNER'];