import type { Metadata } from 'next';
import Link from 'next/link';

import { msecBrand } from '@msec/ui';

import { loginAction } from './actions';

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false, follow: false },
};

const inputStyle = {
  width: '100%',
  padding: `${msecBrand.spacing.sm}px ${msecBrand.spacing.md}px`,
  borderRadius: msecBrand.radii.sm,
  border: `1px solid ${msecBrand.colors.border}`,
  fontSize: msecBrand.typography.body,
  boxSizing: 'border-box' as const,
} as const;

const labelStyle = {
  display: 'block',
  marginBottom: msecBrand.spacing.xs,
  fontWeight: msecBrand.fontWeights.medium,
  fontSize: msecBrand.typography.caption,
  color: msecBrand.colors.textMuted,
} as const;

export default function ConnexionPage() {
  return (
    <section
      aria-label="Connexion"
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: `${msecBrand.spacing.xxl}px ${msecBrand.spacing.xl}px`,
      }}
    >
      <h1 style={{ marginTop: 0, fontSize: msecBrand.typography.heading }}>Connexion</h1>
      <p style={{ color: msecBrand.colors.textMuted }}>
        Boilerplate : la session est posée dans un cookie httpOnly. Choisissez un rôle pour
        tester le RBAC, puis rendez-vous sur <Link href="/espace">/espace</Link> ou{' '}
        <Link href="/admin">/admin</Link>.
      </p>
      <form
        action={loginAction}
        style={{
          display: 'grid',
          gap: msecBrand.spacing.lg,
          marginTop: msecBrand.spacing.xl,
          padding: msecBrand.spacing.xl,
          backgroundColor: msecBrand.colors.surface,
          border: `1px solid ${msecBrand.colors.border}`,
          borderRadius: msecBrand.radii.lg,
        }}
      >
        <div>
          <label htmlFor="email" style={labelStyle}>
            Adresse e-mail
          </label>
          <input id="email" name="email" type="email" required maxLength={254} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="role" style={labelStyle}>
            Rôle (démo RBAC)
          </label>
          <select id="role" name="role" defaultValue="CLIENT" style={inputStyle}>
            <option value="CLIENT">Client</option>
            <option value="STAFF">Équipe</option>
            <option value="ADMIN">Administration</option>
            <option value="OWNER">Propriétaire</option>
          </select>
        </div>
        <div>
          <label htmlFor="clientId" style={labelStyle}>
            ID client (uniquement si « Client »)
          </label>
          <input id="clientId" name="clientId" type="text" placeholder="uuid du client" style={inputStyle} />
        </div>
        <button
          type="submit"
          style={{
            padding: `${msecBrand.spacing.md}px ${msecBrand.spacing.xl}px`,
            borderRadius: msecBrand.radii.md,
            backgroundColor: msecBrand.colors.primary,
            color: '#ffffff',
            border: 'none',
            fontWeight: msecBrand.fontWeights.bold,
            fontSize: msecBrand.typography.body,
            cursor: 'pointer',
          }}
        >
          Se connecter
        </button>
      </form>
    </section>
  );
}