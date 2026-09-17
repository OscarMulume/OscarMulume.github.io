import type { Metadata } from 'next';

/** Données publiques de la vitrine — SSG à la compilation, aucune requête dynamique. */
export interface Reference {
  readonly slug: string;
  readonly title: string;
  readonly client: string;
  readonly excerpt: string;
  readonly tags: readonly string[];
}

export const REFERENCES: readonly Reference[] = [
  {
    slug: 'seo',
    title: 'Refonte SEO d’un e-commerce B2B',
    client: 'Groupe Industriel Atlas',
    excerpt: '+163 % de trafic organique en 6 mois par une architecture orientée Core Web Vitals.',
    tags: ['SEO', 'Core Web Vitals', 'Next.js'],
  },
  {
    slug: 'local-first',
    title: 'Caisse locale-first haute disponibilité',
    client: 'Retail & Distribution',
    excerpt: 'Point de vente disponsible hors-ligne — 99,99 % de disponibilité constatée en boutique.',
    tags: ['Local-first', 'Edge', 'TypeScript'],
  },
  {
    slug: 'fintech',
    title: 'Parcours de facturation conformément',
    client: 'FinTech Scale',
    excerpt: 'Cycle devis → facture → paiement avec signature documentaire et chiffrement at-rest.',
    tags: ['tRPC', 'RBAC', 'AES-256'],
  },
];

export const METADATA: Metadata = {
  title: {
    default: 'MSEC CONSULTING',
    template: '%s — MSEC CONSULTING',
  },
  description:
    'MSEC CONSULTING accompagne les entreprises sur la performance web, les architectures locales-first haute disponibilité et la sécurité des données.',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    title: 'MSEC CONSULTING',
    description: 'Performance web, architectures haute disponibilité, sécurité.',
  },
};