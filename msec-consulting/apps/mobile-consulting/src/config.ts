/**
 * Lecture d'environnement sans dépendance @types/node (mobile). Var déclarées
 * dans .env / EAS : EXPO_PUBLIC_MSEC_API_URL.
 */
const runtimeEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const MSEC_API_URL = runtimeEnv['EXPO_PUBLIC_MSEC_API_URL'] ?? 'http://localhost:3000';

export const DEMO_CLIENT_ID = runtimeEnv['EXPO_PUBLIC_MSEC_DEMO_CLIENT_ID'] ?? null;