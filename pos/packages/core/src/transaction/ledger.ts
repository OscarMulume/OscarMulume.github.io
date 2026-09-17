import {
  DuplicateIdempotencyError,
  LedgerHashMismatchError,
  LedgerSequenceError,
} from './errors';
import {
  PAYMENT_METHODS,
  TransactionInputSchema,
  TransactionSchema,
  assertTransactionIntegrity,
} from './schema';
import type { PaymentMethod, Transaction, TransactionInput } from './schema';

/** Fonction de hachage injectable (SHA-256 en prod, FNV-1a pur en test). */
export type HashFn = (payload: string) => string;

/** Repli pur, sans dépendance : à utiliser uniquement hors production. */
export function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const body = entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',');
  return `{${body}}`;
}

function computeHash(
  transaction: Transaction,
  prevHash: string | null,
  index: number,
  hashFn: HashFn,
): string {
  return hashFn(`${prevHash ?? 'GENESIS'}\n${index}\n${canonicalJson(transaction)}`);
}

/** Une entrée du registre : transaction immuable + chaînage cryptographique. */
export interface LedgerEntry {
  readonly index: number;
  readonly transaction: Transaction;
  readonly prevHash: string | null;
  readonly hash: string;
  readonly recordedAtMs: number;
}

/** Registre append-only : la seule mutation autorisée est l'ajout en fin. */
export interface Ledger {
  readonly id: string;
  readonly entries: readonly LedgerEntry[];
}

export function createLedger(id: string): Ledger {
  return Object.freeze({ id, entries: Object.freeze([]) as readonly LedgerEntry[] });
}

export interface AppendOptions {
  readonly recordedAtMs: number;
  readonly hashFn?: HashFn;
}

/** Retrouve une transaction par (deviceId, idempotencyKey) — détection de replay. */
export function findByIdempotencyKey(
  ledger: Ledger,
  deviceId: string,
  idempotencyKey: string,
): LedgerEntry | null {
  return (
    ledger.entries.find(
      (entry) =>
        entry.transaction.deviceId === deviceId &&
        entry.transaction.idempotencyKey === idempotencyKey,
    ) ?? null
  );
}

/**
 * Ajoute une transaction au registre. Fonction PURE : renvoie un nouveau ledger,
 * ne mute jamais l'ancien. Lève une erreur si la clé d'idempotence est déjà
 * exploitée (replay) ou si les invariantes financières sont violées.
 */
export function appendTransaction(
  ledger: Ledger,
  input: TransactionInput,
  options: AppendOptions,
): Ledger {
  const hashFn = options.hashFn ?? fnv1a;
  const parsedInput = TransactionInputSchema.parse(input);

  const replay = findByIdempotencyKey(ledger, parsedInput.deviceId, parsedInput.idempotencyKey);
  if (replay !== null) {
    throw new DuplicateIdempotencyError(replay.transaction.id);
  }

  const lastEntry = ledger.entries[ledger.entries.length - 1];
  const index = ledger.entries.length;
  const prevHash = lastEntry === undefined ? null : lastEntry.hash;

  if (lastEntry !== undefined && lastEntry.index !== index - 1) {
    throw new LedgerSequenceError(`Index incohérent: attendu ${index - 1}, trouvé ${lastEntry.index}`);
  }

  const transaction: Transaction = TransactionSchema.parse({
    ...parsedInput,
    status: 'PENDING',
    createdAtMs: options.recordedAtMs,
    updatedAtMs: options.recordedAtMs,
    prevTransactionHash: prevHash,
  });

  assertTransactionIntegrity(transaction);

  const entry: LedgerEntry = Object.freeze({
    index,
    transaction,
    prevHash,
    hash: computeHash(transaction, prevHash, index, hashFn),
    recordedAtMs: options.recordedAtMs,
  });

  return Object.freeze({
    id: ledger.id,
    entries: Object.freeze([...ledger.entries, entry]) as readonly LedgerEntry[],
  });
}

/** Vérifie l'intégrité complète de la chaîne (index + hash). */
export function verifyChain(ledger: Ledger, hashFn: HashFn = fnv1a): boolean {
  let prevHash: string | null = null;
  for (let i = 0; i < ledger.entries.length; i += 1) {
    const entry = ledger.entries[i];
    if (entry === undefined || entry.index !== i || entry.prevHash !== prevHash) {
      return false;
    }
    const expected = computeHash(entry.transaction, prevHash, i, hashFn);
    if (expected !== entry.hash) {
      return false;
    }
    prevHash = entry.hash;
  }
  return true;
}

/** Variante stricte : lève l'erreur de diagnostic au lieu de retourner false. */
export function verifyChainOrThrow(ledger: Ledger, hashFn: HashFn = fnv1a): void {
  let prevHash: string | null = null;
  for (let i = 0; i < ledger.entries.length; i += 1) {
    const entry = ledger.entries[i];
    if (entry === undefined || entry.index !== i) {
      throw new LedgerSequenceError(`Entrée manquante ou index invalide à la position ${i}`);
    }
    if (entry.prevHash !== prevHash) {
      throw new LedgerSequenceError(`prevHash incohérent à l'index ${i}`);
    }
    if (computeHash(entry.transaction, prevHash, i, hashFn) !== entry.hash) {
      throw new LedgerHashMismatchError(i);
    }
    prevHash = entry.hash;
  }
}

export interface LedgerBalance {
  readonly totalGrossMinor: number;
  readonly totalNetMinor: number;
  readonly transactionCount: number;
  readonly byPaymentMethod: Readonly<Record<PaymentMethod, number>>;
}

/** Agrégats du registre — ignore les transactions annulées (VOIDED). */
export function getLedgerBalance(ledger: Ledger): LedgerBalance {
  const byPaymentMethod: Record<PaymentMethod, number> = {} as Record<PaymentMethod, number>;
  for (const method of PAYMENT_METHODS) {
    byPaymentMethod[method] = 0;
  }

  let totalGrossMinor = 0;
  let totalNetMinor = 0;
  let transactionCount = 0;

  for (const entry of ledger.entries) {
    const { transaction } = entry;
    if (transaction.status === 'VOIDED') {
      continue;
    }
    totalGrossMinor += transaction.totals.grossMinor;
    totalNetMinor += transaction.totals.netMinor;
    transactionCount += 1;
    for (const tender of transaction.tenders) {
      byPaymentMethod[tender.method] += tender.amountMinor;
    }
  }

  return Object.freeze({
    totalGrossMinor,
    totalNetMinor,
    transactionCount,
    byPaymentMethod: Object.freeze(byPaymentMethod),
  });
}