import Link from 'next/link';

import { msecBrand } from '@msec/ui';

/**
 * Page vitrine — 100 % serveur (SSG) : aucun JavaScript client, HTML minimum,
 * objectif FCP &lt; 1,5 s. Le chargement de chaque bloc est borné pour un
 * rendu déterministe (pas de `Date.now()` ni de random).
 */
export const revalidate = false;

const SERVICE_THEMES = [
  { title: 'Performance web', text: 'Core Web Vitals, FCP < 1,5 s, budgets de bundle.' },
  { title: 'Architectures résilientes', text: 'Local-first, offline-first, anti-faille de disponibilité.' },
  { title: 'Sécurité des données', text: 'RBAC, sessions signées, chiffrement at-rest des documents.' },
] as const;

const sectionStyle = {
  padding: `${msecBrand.spacing.xxl}px ${msecBrand.spacing.xxl}px`,
} as const;

export default function HomePage() {
  return (
    <>
      <section
        aria-label="Présentation"
        style={{
          ...sectionStyle,
          backgroundColor: msecBrand.colors.surface,
          borderBottom: `1px solid ${msecBrand.colors.border}`,
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: msecBrand.typography.display, color: msecBrand.colors.primary }}>
          La performance au service de vos revenus
        </h1>
        <p style={{ maxWidth: 720, color: msecBrand.colors.textMuted, fontSize: msecBrand.typography.title }}>
          MSEC CONSULTING conçoit des produits numériques rapides, disponibles et
          sécurisés : vitrine ROI SEO, portail client (devis, factures) et caisses
          locales-first.
        </p>
        <Link
          href="/references"
          style={{
            display: 'inline-block',
            marginTop: msecBrand.spacing.lg,
            padding: `${msecBrand.spacing.md}px ${msecBrand.spacing.xl}px`,
            borderRadius: msecBrand.radii.md,
            backgroundColor: msecBrand.colors.primary,
            color: '#ffffff',
            textDecoration: 'none',
            fontWeight: msecBrand.fontWeights.bold,
          }}
        >
          Voir les références
        </Link>
      </section>

      <section aria-label="Expertises" style={sectionStyle}>
        <h2 style={{ fontSize: msecBrand.typography.heading }}>Expertises</h2>
        <div style={{ display: 'grid', gap: msecBrand.spacing.lg, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {SERVICE_THEMES.map((service) => (
            <article
              key={service.title}
              style={{
                backgroundColor: msecBrand.colors.surface,
                border: `1px solid ${msecBrand.colors.border}`,
                borderRadius: msecBrand.radii.lg,
                padding: msecBrand.spacing.lg,
              }}
            >
              <h3 style={{ marginTop: 0, color: msecBrand.colors.primary }}>{service.title}</h3>
              <p style={{ color: msecBrand.colors.textMuted, marginBottom: 0 }}>{service.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}