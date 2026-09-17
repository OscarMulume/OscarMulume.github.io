import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import type { PropsWithChildren } from 'react';
import { PALETTES } from './palettes';
import { rgb, THEME_STORAGE_KEY } from './tokens';
import { selectEffectiveMode, useThemeStore } from '../store/themeStore';
import { secureGet, secureSet } from '../lib/secureStorage';

const PREFERENCES = ['system', 'light', 'dark', 'high-contrast'] as const;
type StoredPreference = (typeof PREFERENCES)[number];

function isStoredPreference(value: unknown): value is StoredPreference {
  return typeof value === 'string' && (PREFERENCES as readonly string[]).includes(value);
}

/**
 * ThemeProvider mobile — gère les 3 modes (light / dark / high-contrast).
 *
 * Responsabilités :
 *  1. Lire la préférence persistée (expo-secure-store) au montage.
 *  2. Suivre le schéma OS via useColorScheme() (détection système).
 *  3. Exposer le mode effectif + la palette via useTheme().
 *  4. Persister la préférence utilisateur en cas de changement.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme() ?? null;
  const preference = useThemeStore((s) => s.preference);
  const hydrated = useThemeStore((s) => s.hydrated);
  const setPreference = useThemeStore((s) => s.setPreference);
  const setSystemScheme = useThemeStore((s) => s.setSystemScheme);
  const setHydrated = useThemeStore((s) => s.setHydrated);

  // 1. Hydratation depuis SecureStore
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await secureGet(THEME_STORAGE_KEY);
      if (!cancelled && isStoredPreference(stored)) {
        setPreference(stored);
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [setPreference, setHydrated]);

  // 2. Détection système
  useEffect(() => {
    setSystemScheme(systemScheme);
  }, [systemScheme, setSystemScheme]);

  // 3. Persistance de la préférence utilisateur
  useEffect(() => {
    if (!hydrated) return;
    void secureSet(THEME_STORAGE_KEY, preference);
  }, [preference, hydrated]);

  const activeMode = selectEffectiveMode({
    preference,
    systemScheme,
    hydrated,
    setPreference,
    setSystemScheme,
    setHydrated,
  });

  const palette = PALETTES[activeMode];

  return (
    <>
      <StatusBar
        style={activeMode === 'light' ? 'dark' : 'light'}
        backgroundColor={rgb(palette, 'bg')}
      />
      {children}
    </>
  );
}