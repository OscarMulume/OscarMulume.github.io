import * as SecureStore from 'expo-secure-store';

/** Petites valeurs (thème, tokens, clés API, sessions...). */
const OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY } as const;

export async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key, OPTIONS);
  } catch {
    return null;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value, OPTIONS);
  } catch {
    // SecureStore peut échouer sur des appareils sans keystore initialisé.
  }
}

export async function secureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key, OPTIONS);
  } catch {
    // Non bloquant.
  }
}

/** Boolean helpers */
export const secureGetBool = async (key: string): Promise<boolean | null> => {
  const v = await secureGet(key);
  return v === null ? null : v === 'true';
};

export const secureSetBool = (key: string, value: boolean): Promise<void> =>
  secureSet(key, String(value));