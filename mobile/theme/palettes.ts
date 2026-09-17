import type { Palette, ThemeMode } from './tokens';

/**
 * M-Sec Mobile — Palettes tri-mode.
 * Chaque palette est un triplet RGB (0-255), injectable dans les tokens
 * NativeWind via `rgb(var(--token) / <alpha-value>)`.
 */
export const PALETTES: Record<ThemeMode, Palette> = {
  /** Mode clair équilibré, fond lumineux discret, surface verre. */
  light: {
    bg: [248, 249, 252],
    card: [255, 255, 255],
    text: [15, 23, 41],
    'text-muted': [74, 80, 104],
    'text-faint': [124, 129, 152],
    primary: [37, 99, 235],
    'primary-bright': [59, 130, 246],
    accent: [79, 70, 229],
    border: [214, 220, 233],
    danger: [220, 38, 38],
    success: [22, 163, 74],
  },

  /** Mode sombre doux ("Lumière Basse") — reposant pour les yeux. */
  dark: {
    bg: [12, 13, 20],
    card: [24, 26, 38],
    text: [232, 233, 240],
    'text-muted': [138, 141, 168],
    'text-faint': [82, 86, 122],
    primary: [59, 130, 246],
    'primary-bright': [96, 165, 250],
    accent: [99, 102, 241],
    border: [36, 39, 59],
    danger: [239, 68, 68],
    success: [34, 197, 94],
  },

  /** Mode contraste élevé — accessibilité. Noir pur / blanc pur. */
  'high-contrast': {
    bg: [0, 0, 0],
    card: [10, 10, 10],
    text: [255, 255, 255],
    'text-muted': [208, 208, 208],
    'text-faint': [176, 176, 176],
    primary: [85, 170, 255],
    'primary-bright': [136, 204, 255],
    accent: [153, 153, 255],
    border: [110, 110, 110],
    danger: [255, 85, 85],
    success: [85, 238, 119],
  },
};

/** Ordre de rotation du bouton de bascule light → dark → high-contrast. */
export const THEME_CYCLE: readonly ThemeMode[] = ['light', 'dark', 'high-contrast'];

/** Grâce à quoi le thème high-contrast reste toujours actif côté native. */
export const CONTRAST_META = { name: 'Contraste élevé', symbol: 'Aa' } as const;