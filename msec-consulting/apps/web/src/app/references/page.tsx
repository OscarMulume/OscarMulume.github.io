import type { Metadata } from 'next';
import Link from 'next/link';

import { msecBrand } from '@msec/ui';

import { REFERENCES } from '../../data/content';

export const metadata: Metadata = {
  title: 'Références',
  description: 'Études de cas MSEC CONSULTING : SEO, local-first, facturation sécurisée.',
};

/** Liste statique SSG — générée une fois à la compilation. */
export const revalidate = false;

export default function ReferencesPage() {
  return (
    <section aria-label="Références" style={{ padding: msecBrand.spacing.xxl }}>
      <h1 style={{ marginTop: 0, fontSize: msecBrand.typography.heading }}>Références</h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: msecBrand.spacing.lg }}>
        {REFERENCES.map((reference) => (
          <li key={reference.slug}>
            <Link
              href={`/references/${reference.slug}`}
              style={{
                display: 'block',
                padding: msecBrand.spacing.lg,
                backgroundColor: msecBrand.colors.surface,
                border: `1px solid ${msecBrand.colors.border}`,
                borderRadius: msecBrand.radii.lg,
                color: msecBrand.colors.text,
                textDecoration: 'none',
              }}
            >
              <h2 style={{ margin: 0, color: msecBrand.colors.primary }}>{reference.title}</h2>
              <p style={{ color: msecBrand.colors.textMuted, marginBottom: 0 }}>{reference.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}