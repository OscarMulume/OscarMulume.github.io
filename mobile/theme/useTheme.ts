import { useMemo } from 'react';
import { PALETTES } from './palettes';
import { rgb, type Palette, type PaletteKey, type ThemeMode } from './tokens';
import { selectEffectiveMode, useThemeStore } from '../store/themeStore';

interface Theme {
  /** Mode réellement rendu. */
  mode: ThemeMode;
  /** Palette RGB du mode actif. */
  palette: Palette;
  /** Couleur CSS `rgb(r,g,b)` pour les styles dynamiques. */
  color: (key: PaletteKey, alpha?: number) => string;
}

/**
 * Hook principal de thème mobile.
 * Usage :
 *   const { mode, palette, color } = useTheme();
 *   style={{ backgroundColor: color('bg') }}
 */
export function useTheme(): Theme {
  const preference = useThemeStore((s) => s.preference);
  const systemScheme = useThemeStore((s) => s.systemScheme);
  const hydrated = useThemeStore((s) => s.hydrated);
  const setPreference = useThemeStore((s) => s.setPreference);
  const setSystemScheme = useThemeStore((s) => s.setSystemScheme);
  const setHydrated = useThemeStore((s) => s.setHydrated);

  const mode = selectEffectiveMode({
    preference,
    systemScheme,
    hydrated,
    setPreference,
    setSystemScheme,
    setHydrated,
  });

  return useMemo(() => {
    const palette = PALETTES[mode];
    return {
      mode,
      palette,
      color: (key: PaletteKey, alpha?: number) => {
        const [r, g, b] = palette[key];
        return alpha === undefined ? rgb(palette, key) : `rgb(${r},${g},${b},${alpha})`;
      },
    };
  }, [mode]);
}

export type { PaletteKey };