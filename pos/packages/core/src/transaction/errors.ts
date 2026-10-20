/** Codes d'erreur typés du domaine POS. */
export type PosErrorCode =
  | 'TRANSACTION_INTEGRITY'
  | 'DUPLICATE_IDEMPOTENCY'
  | 'LEDGER_SEQUENCE'
  | 'LEDGER_HASH_MISMATCH'
  | 'INVALID_TRANSACTION'
  | 'RETRIES_EXHAUSTED';

export abstract class PosError extends Error {
  public readonly code: PosErrorCode;

  protected constructor(code: PosErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.code = code;
  }
}

/** Les totaux déclarés ne correspondent pas aux lignes/tenders (intégrité financière). */
export class TransactionIntegrityError extends PosError {
  constructor(message: string, options?: ErrorOptions) {
    super('TRANSACTION_INTEGRITY', message, options);
  }
}

/** Tentative d'append d'une transaction déjà présente pour (deviceId, idempotencyKey). */
export class DuplicateIdempotencyError extends PosError {
  public readonly existingTransactionId: string;

  constructor(existingTransactionId: string, options?: ErrorOptions) {
    super(
      'DUPLICATE_IDEMPOTENCY',
      `Idempotency-Key exploitée: transaction ${existingTransactionId} déjà enregistrée`,
      options,
    );
    this.existingTransactionId = existingTransactionId;
  }
}

/** Rupture de séquence du ledger (index non contigu ou prevHash incohérent). */
export class LedgerSequenceError extends PosError {
  constructor(message: string, options?: ErrorOptions) {
    super('LEDGER_SEQUENCE', message, options);
  }
}

/** Altération détectée : le hash recalculé d'une entrée diffère du hash stocké. */
export class LedgerHashMismatchError extends PosError {
  public readonly index: number;

  constructor(index: number, options?: ErrorOptions) {
    super('LEDGER_HASH_MISMATCH', `Intégrité du ledger compromise à l'index ${index}`, options);
    this.index = index;
  }
}

/** Données entrantes invalides (échec de validation Zod). */
export class InvalidTransactionError extends PosError {
  constructor(message: string, options?: ErrorOptions) {
    super('INVALID_TRANSACTION', message, options);
  }
}