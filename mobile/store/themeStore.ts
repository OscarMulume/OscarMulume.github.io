import { create } from 'zustand';
import type { ThemeMode, ThemePreference } from '../theme/tokens';

interface ThemeState {
  /** Choix utilisateur explicite ('system' suit l'OS). */
  preference: ThemePreference;
  /** Schéma couleur du système détecté (null = indéterminé). */
  systemScheme: 'light' | 'dark' | null;
  /** Hydratation terminée (lecture SecureStore ensuite). */
  hydrated: boolean;
  setPreference: (pref: ThemePreference) => void;
  setSystemScheme: (scheme: 'light' | 'dark' | null) => void;
  setHydrated: (v: boolean) => void;
}

/**
 * Zustand store du thème — source de vérité unique.
 * Le mode réel rendu est dérivé : preference === 'system'
 * → systemScheme ?? 'light', sinon preference.
 */
export const useThemeStore = create<ThemeState>()((set) => ({
  preference: 'system',
  systemScheme: null,
  hydrated: false,
  setPreference: (preference) => set({ preference }),
  setSystemScheme: (systemScheme) => set({ systemScheme }),
  setHydrated: (hydrated) => set({ hydrated }),
}));

/** Sélecteur : mode effectif rendu à l'écran. */
export function selectEffectiveMode(state: ThemeState): ThemeMode {
  if (state.preference === 'system') {
    return state.systemScheme ?? 'light';
  }
  return state.preference;
}