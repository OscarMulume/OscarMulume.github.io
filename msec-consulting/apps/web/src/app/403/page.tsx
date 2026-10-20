import type { Metadata } from 'next';

import { msecBrand } from '@msec/ui';

export const metadata: Metadata = {
  title: 'Accès refusé',
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <section
      aria-label="Accès refusé"
      style={{ maxWidth: 520, margin: '0 auto', padding: msecBrand.spacing.xxl }}
    >
      <h1 style={{ fontSize: msecBrand.typography.heading }}>403 — Accès refusé</h1>
      <p style={{ color: msecBrand.colors.textMuted }}>
        Votre rôle ne permet pas de consulter cette section. Cette page est aussi
        appelée silencieusement par le middleware (rewrite interne) pour ne pas
        révéler l’existence d’une route protégée.
      </p>
    </section>
  );
}