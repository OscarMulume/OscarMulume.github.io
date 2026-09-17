/**
 * Retry avec backoff exponentiel + jitter complet.
 * Conçu pour les coupures réseau d'une caisse : chaque tentative doit porter
 * la MÊME Idempotency-Key pour éviter tout double encaissement.
 */

export interface RetryPolicy {
  /** Nombre total de tentatives (>= 1). */
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly enableJitter: boolean;
  /** Prédicat : faut-il retenter après cette erreur ? */
  readonly retryOn: (error: unknown, attempt: number) => boolean;
}

export class RetriesExhaustedError extends Error {
  public readonly attempts: number;

  constructor(attempts: number, cause: unknown) {
    super(`Échec après ${attempts} tentatives`, { cause });
    this.name = 'RetriesExhaustedError';
    this.attempts = attempts;
  }
}

function httpStatusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('data' in error)) {
    return undefined;
  }
  const data = (error as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null || !('httpStatus' in data)) {
    return undefined;
  }
  const status = (data as { httpStatus?: unknown }).httpStatus;
  return typeof status === 'number' ? status : undefined;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function isZodError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZodError';
}

/** Erreurs transitoires : réseau, timeout, 408/429, 5xx. Les erreurs métier ne se retentent pas. */
export function isRetryableError(error: unknown): boolean {
  if (isZodError(error)) {
    return false;
  }
  const status = httpStatusOf(error);
  if (status !== undefined) {
    return status === 408 || status === 429 || status >= 500;
  }
  if (isAbortError(error)) {
    return true;
  }
  return error instanceof Error;
}

export const defaultPosRetryPolicy: RetryPolicy = {
  maxAttempts: 4,
  baseDelayMs: 200,
  maxDelayMs: 4_000,
  enableJitter: true,
  retryOn: (error) => isRetryableError(error),
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryDependencies {
  readonly sleep?: (ms: number) => Promise<void>;
  readonly random?: () => number;
}

function backoffDelay(
  attempt: number,
  policy: RetryPolicy,
  random: () => number,
): number {
  const exponential = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt);
  if (!policy.enableJitter) {
    return exponential;
  }
  // Jitter complet : uniforme dans [0, exponential].
  return Math.floor(random() * exponential);
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy = defaultPosRetryPolicy,
  dependencies: RetryDependencies = {},
): Promise<T> {
  const sleep = dependencies.sleep ?? delay;
  const random = dependencies.random ?? Math.random;
  const maxAttempts = Math.max(1, policy.maxAttempts);

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const isLast = attempt === maxAttempts - 1;
      if (isLast || !policy.retryOn(error, attempt)) {
        break;
      }
      await sleep(backoffDelay(attempt, policy, random));
    }
  }

  if (lastError instanceof RetriesExhaustedError) {
    throw lastError;
  }
  throw new RetriesExhaustedError(maxAttempts, lastError);
}