/**
 * Tokens de marque du POS — communs à React Native, Web et Desktop.
 * Pures données : aucune dépendance, parfaitement utilisables avec
 * StyleSheet / style inline / Tailwind.
 */
export const posBrand = {
  colors: {
    primary: '#2563eb',
    primaryPressed: '#1d4ed8',
    background: '#f6f7fb',
    surface: '#ffffff',
    surfaceAlt: '#eef2f7',
    border: '#d7dee8',
    text: '#0f172a',
    textMuted: '#64748b',
    success: '#16a34a',
    danger: '#dc2626',
    warning: '#d97706',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 16,
    pill: 999,
  },
  typography: {
    caption: 12,
    body: 15,
    title: 20,
    heading: 28,
  },
  fontWeights: {
    regular: '400',
    semibold: '600',
    bold: '700',
  } as const,
} as const;

export type PosBrand = typeof posBrand;