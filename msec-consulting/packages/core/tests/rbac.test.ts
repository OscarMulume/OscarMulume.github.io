import { describe, expect, it } from 'vitest';

import { MsecError } from '../src';
import {
  assertPermission,
  assertResourceAccess,
  assertRole,
  hasPermission,
} from '../src/rbac/access';
import { PORTAL_ROLES } from '../src/rbac/permissions';

describe('RBAC', () => {
  it('accorde au CLIENT l’accès à SES devis uniquement', () => {
    expect(hasPermission('CLIENT', 'quote:read:own')).toBe(true);
    expect(hasPermission('CLIENT', 'quote:read:all')).toBe(false);
    expect(hasPermission('VISITOR', 'quote:read:own')).toBe(false);
  });

  it('expose les droits de mutabilité aux rôles internes seulement', () => {
    expect(hasPermission('STAFF', 'quote:create')).toBe(true);
    expect(hasPermission('CLIENT', 'document:encrypt')).toBe(false);
    expect(hasPermission('ADMIN', 'admin:rbac')).toBe(true);
    expect(hasPermission('OWNER', 'admin:audit')).toBe(true);
  });

  it('résout un rôle inconnu vers VISITOR au lieu de crasher', () => {
    expect(hasPermission('HACKER', 'quote:read:all')).toBe(false);
  });

  it('assertRole refuse un rôle hors portail avec FORBIDDEN', () => {
    const clientId = crypto.randomUUID();
    expect(assertRole('CLIENT', PORTAL_ROLES)).toBe('CLIENT');
    try {
      assertRole('VISITOR', PORTAL_ROLES);
      expect.unreachable('VISITOR ne doit pas entrer dans le portail');
    } catch (error) {
      expect(error).toBeInstanceOf(MsecError);
      expect((error as MsecError).code).toBe('FORBIDDEN');
    }
  });

  it('assertResourceAccess : le CLIENT voit uniquement ses ressources', () => {
    const ownId = crypto.randomUUID();
    assertResourceAccess(
      { role: 'CLIENT', subjectClientId: ownId },
      'quote:read:own',
      ownId,
    );

    try {
      assertResourceAccess(
        { role: 'CLIENT', subjectClientId: ownId },
        'quote:read:own',
        crypto.randomUUID(),
      );
      expect.unreachable('Une ressource étrangère doit être refusée');
    } catch (error) {
      expect((error as MsecError).code).toBe('FORBIDDEN');
    }
  });

  it('assertResourceAccess : STAFF passe par la permission read:all', () => {
    expect(() =>
      assertResourceAccess({ role: 'STAFF', subjectClientId: null }, 'quote:read:all', crypto.randomUUID()),
    ).not.toThrow();
    expect(() => assertPermission('CLIENT', 'document:encrypt')).toThrow(MsecError);
  });
});