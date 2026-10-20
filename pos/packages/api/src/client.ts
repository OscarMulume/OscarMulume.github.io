/**
 * Client d'API du POS.
 *
 * Garanties :
 *  - Idempotence : une clé unique est générée par transaction LOGIQUE puis
 *    RÉUTILISÉE sur toutes les tentatives de retry.
 *  - Robustesse : backoff exponentiel + jitter sur les erreurs transitoires.
 *  - Sécurité : le jeton est fourni par un `tokenProvider` (jamais stocké ici).
 */
import { newIdempotencyKey } from '@pos/core';
import type { Transaction, TransactionInput } from '@pos/core';
import { createTRPCClient, httpLink } from '@trpc/client';

import { defaultPosRetryPolicy, retryWithBackoff } from './retry';
import type { RetryPolicy } from './retry';
import type { PosAppRouter } from './router-contract';

export interface SubmitTransactionResponse {
  readonly transaction: Transaction;
  readonly replayed: boolean;
}

export interface ServerHealth {
  readonly ok: boolean;
  readonly serverTimeMs: number;
}

export interface PosApiOptions {
  readonly url: string;
  readonly deviceId: string;
  readonly appVersion: string;
  /** Récupère le jeton depuis le stockage sécurisé (ex. @pos/security). */
  readonly tokenProvider: () => Promise<string | null>;
  readonly retryPolicy?: RetryPolicy;
}

export interface PosApi {
  submitTransaction(input: TransactionInput): Promise<SubmitTransactionResponse>;
  getTransaction(id: string): Promise<Transaction>;
  health(): Promise<ServerHealth>;
}

function baseHeaders(
  token: string | null,
  deviceId: string,
  appVersion: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-POS-Device': deviceId,
    'X-POS-Client-Version': appVersion,
  };
  if (token !== null && token !== '') {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function createPosApi(options: PosApiOptions): PosApi {
  const policy = options.retryPolicy ?? defaultPosRetryPolicy;

  const readClient = createTRPCClient<PosAppRouter>({
    links: [
      httpLink({
        url: options.url,
        headers: async () =>
          baseHeaders(await options.tokenProvider(), options.deviceId, options.appVersion),
      }),
    ],
  });

  return {
    async submitTransaction(input: TransactionInput): Promise<SubmitTransactionResponse> {
      // Clé générée UNE fois : identique pour chaque tentative → dédoublonnage serveur.
      const idempotencyKey = newIdempotencyKey();
      const token = await options.tokenProvider();

      const writeClient = createTRPCClient<PosAppRouter>({
        links: [
          httpLink({
            url: options.url,
            headers: () => ({
              ...baseHeaders(token, options.deviceId, options.appVersion),
              'Idempotency-Key': idempotencyKey,
            }),
          }),
        ],
      });

      return retryWithBackoff(
        () => writeClient.transactions.submit.mutate(input),
        policy,
      );
    },

    async getTransaction(id: string): Promise<Transaction> {
      return retryWithBackoff(() => readClient.transactions.byId.query(id), policy);
    },

    async health(): Promise<ServerHealth> {
      return retryWithBackoff(() => readClient.system.health.query(), policy);
    },
  };
}