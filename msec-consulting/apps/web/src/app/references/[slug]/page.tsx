import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { msecBrand } from '@msec/ui';

import { REFERENCES } from '../../../data/content';

interface ReferencePageParams {
  readonly slug: string;
}

/** ISR : régénération périodique, coût serveur nul en pic. */
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams(): ReferencePageParams[] {
  return REFERENCES.map((reference) => ({ slug: reference.slug }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<ReferencePageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const reference = REFERENCES.find((item) => item.slug === slug);
  if (reference === undefined) {
    return { title: 'Introuvable' };
  }
  return { title: reference.title, description: reference.excerpt };
}

export default async function ReferencePage({
  params,
}: {
  readonly params: Promise<ReferencePageParams>;
}) {
  const { slug } = await params;
  const reference = REFERENCES.find((item) => item.slug === slug);
  if (reference === undefined) {
    notFound();
  }

  return (
    <article style={{ padding: msecBrand.spacing.xxl, maxWidth: 760 }}>
      <p style={{ margin: 0, color: msecBrand.colors.accent, fontWeight: msecBrand.fontWeights.bold }}>
        {reference.client}
      </p>
      <h1 style={{ margin: `${msecBrand.spacing.sm}px 0`, fontSize: msecBrand.typography.heading }}>
        {reference.title}
      </h1>
      <p style={{ color: msecBrand.colors.textMuted }}>{reference.excerpt}</p>
      <ul style={{ display: 'flex', gap: msecBrand.spacing.sm, listStyle: 'none', padding: 0 }}>
        {reference.tags.map((tag) => (
          <li
            key={tag}
            style={{
              padding: `${msecBrand.spacing.xs}px ${msecBrand.spacing.md}px`,
              borderRadius: msecBrand.radii.pill,
              backgroundColor: msecBrand.colors.primary,
              color: '#ffffff',
              fontSize: msecBrand.typography.caption,
            }}
          >
            {tag}
          </li>
        ))}
      </ul>
      <p style={{ marginTop: msecBrand.spacing.xl }}>
        Contenu complet détaillé à rédiger (cas d’usage, métriques avant/après,
        stack technique). Page ISR régénérée toutes les heures — adaptée au
        contenu marketing éditorial.
      </p>
    </article>
  );
}