import type { Metadata } from 'next';

import { formatMinor } from '@msec/core';
import { msecBrand } from '@msec/ui';

import { getTrpcCaller } from '../../lib/trpc-server';
import { requirePortalSession } from '../../lib/session';

import { logoutAction } from './actions';

export const metadata: Metadata = {
  title: 'Espace client',
  robots: { index: false, follow: false },
};

/** Rendu SSR strict — jamais de cache pour des données authentifiées. */
export const dynamic = 'force-dynamic';

export default async function EspacePage() {
  const session = await requirePortalSession();
  const caller = getTrpcCaller({ role: session.role, subjectClientId: session.subjectClientId });
  const quotes = await caller.quotes.list({ limit: 20 });

  return (
    <section aria-label="Espace client" style={{ padding: msecBrand.spacing.xxl }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: msecBrand.spacing.lg,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: msecBrand.typography.heading }}>Devis</h1>
          <p style={{ margin: `${msecBrand.spacing.xs}px 0 0`, color: msecBrand.colors.textMuted }}>
            Connecté en tant que <strong>{session.role}</strong>
            {session.subjectClientId !== null ? ` (client ${session.subjectClientId})` : ''} — données
            clair uniquement si la permission RBAC le permet.
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              padding: `${msecBrand.spacing.sm}px ${msecBrand.spacing.lg}px`,
              borderRadius: msecBrand.radii.sm,
              border: `1px solid ${msecBrand.colors.border}`,
              backgroundColor: msecBrand.colors.surface,
              fontWeight: msecBrand.fontWeights.medium,
              cursor: 'pointer',
            }}
          >
            Se déconnecter
          </button>
        </form>
      </div>

      {quotes.length === 0 ? (
        <p style={{ color: msecBrand.colors.textMuted, marginTop: msecBrand.spacing.xxl }}>
          Aucun devis. (Le gateway mémoire renvoie une liste vide — branchez la BDD.)</p>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: msecBrand.spacing.xl }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: msecBrand.colors.surface,
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', color: msecBrand.colors.textMuted }}>
                <th style={thStyle}>Numéro</th>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Émis le</th>
                <th style={thStyle}>Total</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} style={{ borderTop: `1px solid ${msecBrand.colors.border}` }}>
                  <td style={tdStyle}>{quote.number}</td>
                  <td style={tdStyle}>{quote.clientEmail}</td>
                  <td style={tdStyle}>{quote.status}</td>
                  <td style={tdStyle}>{new Date(quote.issuedAtMs).toLocaleDateString('fr-FR')}</td>
                  <td style={tdStyle}>{formatMinor(quote.summary.totalMinor, quote.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const thStyle = {
  padding: `${msecBrand.spacing.md}px`,
  fontSize: msecBrand.typography.caption,
  fontWeight: msecBrand.fontWeights.semibold,
} as const;

const tdStyle = {
  padding: `${msecBrand.spacing.md}px`,
  fontSize: msecBrand.typography.body,
} as const;