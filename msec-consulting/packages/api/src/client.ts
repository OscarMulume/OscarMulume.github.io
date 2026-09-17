import { createTRPCClient, httpBatchLink } from '@trpc/client';

import type { AppRouter } from './server';

export interface TrpcClientOptions {
  readonly url: string;
  /** Récupère le jeton binaire signé (httpOnly cookie web / SecureStore mobile). */
  readonly getToken: () => Promise<string | null>;
}

export type MsecTrpcClient = ReturnType<typeof createMsecTrpcClient>;

export function createMsecTrpcClient(options: TrpcClientOptions) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: options.url,
        headers: async () => {
          const token = await options.getToken();
          return {
            authorization: token !== null ? `Bearer ${token}` : '',
            'x-requested-with': 'msec-consulting',
          };
        },
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Retry utilitaire (exposant un point de sortie codé, hors react-query)
// ---------------------------------------------------------------------------

function extractHttpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'httpStatus' in data) {
      return (data as { httpStatus?: number }).httpStatus;
    }
  }
  if (error instanceof TypeError) {
    return undefined; // réseau (DNS, CORS, fetch abort…)
  }
  return undefined;
}

export function isRetryableError(error: unknown): boolean {
  const status = extractHttpStatus(error);
  return status === undefined || status >= 500 || status === 429;
}

export interface RetryOptions {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
}

/**
 * Retry backoff exponentiel + jitter (0–25 % de la delay) : sert de pont
 * avant react-query côté web/mobile pour les appels serveur directs (server
 * actions, chargeurs de pages, etc.).
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1_000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (attempt === maxAttempts || !isRetryableError(error)) {
        throw error;
      }
      const delay = baseDelayMs * 2 ** (attempt - 1);
      const jitter = Math.round(delay * Math.random() * 0.25);
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }
  throw new Error('Unreachable');
}