import {
  createMsecTrpcClient,
  withRetry,
  type MsecTrpcClient,
} from '@msec/api';
import { SESSION_TOKEN_KEY, SecureTokenStorage } from '@msec/security/mobile';
import type { Quote } from '@msec/core';

import { DEMO_CLIENT_ID, MSEC_API_URL } from '../config';

/**
 * Client tRPC du portail mobile.
 * - jeton lu depuis le Keychain/Keystore (expo-secure-store),
 * - qd absent, la requête part anonyme et le router répondra FORBIDDEN (RBAC),
 * - httpBatchLink regroupe les appels (une seule round-trip),
 * - withRetry : backoff + jitter sur les erreurs réseau / 5xx.
 */
const storage = new SecureTokenStorage('msec');

export const trpcClient: MsecTrpcClient = createMsecTrpcClient({
  url: MSEC_API_URL,
  getToken: async () => storage.getItem(SESSION_TOKEN_KEY),
});

export const fetchQuotes = (): Promise<readonly Quote[]> =>
  withRetry(() => trpcClient.quotes.list.query({ limit: 50 }));

export const DEMO_CLIENT_ID_FOR_TEST = DEMO_CLIENT_ID;