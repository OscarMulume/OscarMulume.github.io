/**
 * M-Sec Mobile — Tokens de thème
 * Tri-mode : light (clair), dark (Lumière Basse), high-contrast (accessibilité)
 */

/** Modes d'affichage réellement rendus à l'écran. */
export type ThemeMode = 'light' | 'dark' | 'high-contrast';

/**
 * Préférence utilisateur.
 * - 'system' : suit automatiquement le schéma OS (light/dark uniquement).
 * - 'light' | 'dark' | 'high-contrast' : choix manuel explicite.
 */
export type ThemePreference = 'system' | ThemeMode;

/**
 * Clés de couleur exposées aux composants via `useTheme()`.
 * Chaque entrée est un triplet RGB (0-255) pour être utilisée avec
 * `rgb(var(--token) / <alpha-value>)` côté NativeWind.
 */
export interface Palette {
  bg: readonly [number, number, number];
  card: readonly [number, number, number];
  text: readonly [number, number, number];
  'text-muted': readonly [number, number, number];
  'text-faint': readonly [number, number, number];
  primary: readonly [number, number, number];
  'primary-bright': readonly [number, number, number];
  accent: readonly [number, number, number];
  border: readonly [number, number, number];
  danger: readonly [number, number, number];
  success: readonly [number, number, number];
}

export type PaletteKey = keyof Palette;

/** Constante de stockage sécurisé (expo-secure-store). */
export const THEME_STORAGE_KEY = 'msec.mobile.theme';

/** Shim colors — utilisées pour le StatusBar / fond natif. */
export function rgb(palette: Palette, key: PaletteKey): string {
  const [r, g, b] = palette[key];
  return `rgb(${r},${g},${b})`;
}

export const SYSTEM_THEME_KEY = 'msec.mobile.systemColorScheme';