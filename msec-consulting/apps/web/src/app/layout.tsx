import type { Viewport } from 'next';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { msecBrand } from '@msec/ui';

import { METADATA } from '../data/content';

export const metadata: Metadata = METADATA;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
};

const navStyle = {
  color: msecBrand.colors.text,
  marginRight: msecBrand.spacing.lg,
  fontWeight: msecBrand.fontWeights.medium,
  fontSize: msecBrand.typography.body,
  textDecoration: 'none',
} as const;

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, backgroundColor: msecBrand.colors.background, color: msecBrand.colors.text }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${msecBrand.spacing.md}px ${msecBrand.spacing.xl}px`,
            borderBottom: `1px solid ${msecBrand.colors.border}`,
            backgroundColor: msecBrand.colors.surface,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <strong style={{ color: msecBrand.colors.primary, fontSize: msecBrand.typography.title }}>
            MSEC CONSULTING
          </strong>
          <nav>
            <Link style={navStyle} href="/">
              Accueil
            </Link>
            <Link style={navStyle} href="/references">
              Références
            </Link>
            <Link style={navStyle} href="/espace">
              Espace client
            </Link>
          </nav>
        </header>
        <main style={{ minHeight: 'calc(100vh - 140px)' }}>{children}</main>
        <footer
          style={{
            padding: `${msecBrand.spacing.lg}px ${msecBrand.spacing.xl}px`,
            color: msecBrand.colors.textMuted,
            fontSize: msecBrand.typography.caption,
          }}
        >
          © {new Date().getFullYear()} MSEC CONSULTING — Tous droits réservés.
        </footer>
      </body>
    </html>
  );
}