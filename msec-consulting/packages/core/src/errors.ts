/**
 * Erreur métier MSEC, portable (web/Node/mobile).
 * Format stable pour les réponses tRPC/fetch : `code` + `status` HTTP.
 */
export type MsecErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'MONEY_INVALID'
  | 'MONEY_OVERFLOW'
  | 'CRYPTO'
  | 'DOCUMENT_INVALID';

export const MSEC_HTTP_STATUS: Readonly<Record<MsecErrorCode, number>> = {
  VALIDATION: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  MONEY_INVALID: 422,
  MONEY_OVERFLOW: 422,
  CRYPTO: 500,
  DOCUMENT_INVALID: 422,
};

export interface MsecErrorOptions {
  readonly cause?: unknown;
  readonly details?: Readonly<Record<string, unknown>>;
}

export class MsecError extends Error {
  readonly code: MsecErrorCode;
  readonly status: number;
  readonly details: Readonly<Record<string, unknown>> | null;

  constructor(code: MsecErrorCode, message: string, options: MsecErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'MsecError';
    this.code = code;
    this.status = MSEC_HTTP_STATUS[code];
    this.details = options.details ?? null;
  }

  toJSON(): {
    readonly name: string;
    readonly code: MsecErrorCode;
    readonly status: number;
    readonly message: string;
    readonly details: Readonly<Record<string, unknown>> | null;
  } {
    return {
      name: this.name,
      code: this.code,
      status: this.status,
      message: this.message,
      details: this.details,
    };
  }
}

export function isMsecError(value: unknown): value is MsecError {
  return value instanceof MsecError;
}