import type { Metadata } from 'next';

import { msecBrand } from '@msec/ui';

import { requirePortalSession } from '../../lib/session';

export const metadata: Metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Zone réservée au STAFF senior/ADMIN/OWNER. Le middleware bloque les rôles
 * insuffisants (rewrite /403) ; ici on redouble la vérification côté serveur
 * pour le rendu - jamais de confiance implicite.
 */
export default async function AdminPage() {
  const session = await requirePortalSession();
  return (
    <section aria-label="Administration" style={{ padding: msecBrand.spacing.xxl }}>
      <h1 style={{ marginTop: 0, fontSize: msecBrand.typography.heading }}>Administration</h1>
      <p style={{ color: msecBrand.colors.textMuted }}>
        Accès accordé à <strong>{session.role}</strong>. Boilerplate : RBAC, journal d’audit
        et gestion des clés de chiffrement documentaire se branchent ici.
      </p>
    </section>
  );
}