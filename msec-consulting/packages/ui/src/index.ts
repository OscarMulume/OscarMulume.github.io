export const msecBrand = {
  colors: {
    primary: '#0B2A4A',
    primaryPressed: '#0E3A66',
    accent: '#E8A33D',
    background: '#F6F7F9',
    surface: '#FFFFFF',
    border: '#E2E6EB',
    text: '#12202F',
    textMuted: '#5B6B7C',
    success: '#1E7D4F',
    danger: '#B3261E',
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
    body: 14,
    title: 18,
    heading: 24,
    display: 32,
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
} as const;

export type MsecBrand = typeof msecBrand;