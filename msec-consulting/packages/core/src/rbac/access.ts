import { MsecError } from '../errors';
import { toRole, type Role } from './roles';
import { PORTAL_ROLES, ROLE_PERMISSIONS, type Permission } from './permissions';

export function hasPermission(role: Role | string | null | undefined, permission: Permission): boolean {
  return ROLE_PERMISSIONS[toRole(role ?? null)].includes(permission);
}

/** Échoue si le rôle ne possède pas la permission (serveur/middleware uniquement). */
export function assertPermission(role: Role | string | null | undefined, permission: Permission): Role {
  const resolved = toRole(role ?? null);
  if (!ROLE_PERMISSIONS[resolved].includes(permission)) {
    throw new MsecError('FORBIDDEN', `Permission requise : ${permission}`, {
      details: { role: resolved, permission },
    });
  }
  return resolved;
}

/** Échoue si le rôle n'est pas dans la liste autorisée (ex. portail réservé aux connectés). */
export function assertRole(role: Role | string | null | undefined, allowed: readonly Role[]): Role {
  const resolved = toRole(role ?? null);
  if (!allowed.includes(resolved)) {
    throw new MsecError('FORBIDDEN', 'Accès interdit pour ce rôle', {
      details: { role: resolved, allowed: allowed.join(',') },
    });
  }
  return resolved;
}

/** Le rôle doit être présenté dans le portail client. */
export function assertPortalRole(role: Role | string | null | undefined): Role {
  return assertRole(role, PORTAL_ROLES);
}

export interface OwnershipContext {
  readonly role: Role | string;
  /** Id du client auquel appartient la session courante (null pour le staff/admin). */
  readonly subjectClientId: string | null;
}

/**
 * Contrôle d'accès sur une ressource possédée par `resourceClientId`.
 * - CLIENT : accès uniquement à SES documents.
 * - STAFF/ADMIN/OWNER : via la permission `…:read:all`/de mutation.
 */
export function assertResourceAccess(context: OwnershipContext, permission: Permission, resourceClientId: string): void {
  const role = toRole(context.role);
  if (role === 'CLIENT') {
    if (context.subjectClientId === null || context.subjectClientId !== resourceClientId) {
      throw new MsecError('FORBIDDEN', 'Ressource inaccessible : utilisateur non propriétaire', {
        details: { resourceClientId },
      });
    }
    return;
  }
  assertPermission(role, permission);
}