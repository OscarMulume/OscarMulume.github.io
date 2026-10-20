import { z } from 'zod';

import { TransactionIntegrityError } from './errors';

/** Devises supportées (aligné sur CURRENCY_MINOR_UNITS du module money). */
export const CURRENCY_CODES = ['XAF', 'XOF', 'EUR', 'USD'] as const;
export const CurrencySchema = z.enum(CURRENCY_CODES);

/** Montant en unités mineures : entier, jamais de flottant, non négatif. */
export const MoneyMinorSchema = z.number().int('Le montant doit être un entier (unité mineure)').min(0);

export const UuidSchema = z.string().uuid();
export const IdempotencyKeySchema = z.string().uuid();
export const DeviceIdSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^[A-Za-z0-9:_-]+$/, 'deviceId invalide');

export const PAYMENT_METHODS = ['CASH', 'CARD', 'NFC', 'MOBILE_MONEY', 'MIXED'] as const;
export const PaymentMethodSchema = z.enum(PAYMENT_METHODS);

export const LineItemSchema = z.object({
  id: UuidSchema,
  productId: UuidSchema,
  sku: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
  unitPriceMinor: MoneyMinorSchema,
  quantity: z.number().int().min(1).max(10_000),
  totalMinor: MoneyMinorSchema,
});

export const TenderSchema = z.object({
  id: UuidSchema,
  method: PaymentMethodSchema,
  amountMinor: MoneyMinorSchema,
  reference: z.string().max(64).optional(),
});

export const TransactionStatusSchema = z.enum(['PENDING', 'SUBMITTED', 'SETTLED', 'VOIDED']);

export const TotalsSchema = z.object({
  grossMinor: MoneyMinorSchema,
  discountMinor: MoneyMinorSchema,
  taxMinor: MoneyMinorSchema,
  netMinor: MoneyMinorSchema,
  tenderedMinor: MoneyMinorSchema,
  changeMinor: MoneyMinorSchema,
});

/**
 * Transaction de vente — modèle IMMUABLE (append-only).
 * `version` + `prevTransactionHash` matérialisent la chaîne d'audit.
 * Aucune entrée du ledger n'est jamais modifiée après création.
 */
export const TransactionBaseSchema = z.object({
  id: UuidSchema,
  version: z.number().int().min(1),
  idempotencyKey: IdempotencyKeySchema,
  deviceId: DeviceIdSchema,
  cashierId: UuidSchema,
  status: TransactionStatusSchema,
  lines: z.array(LineItemSchema).min(1, 'Au moins une ligne de vente'),
  tenders: z.array(TenderSchema).min(1, 'Au moins un moyen de paiement'),
  totals: TotalsSchema,
  createdAtMs: z.number().int().min(0),
  updatedAtMs: z.number().int().min(0),
  prevTransactionHash: z.string().nullable(),
});

export const TransactionSchema = TransactionBaseSchema.readonly();

export type Transaction = z.infer<typeof TransactionSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

/** Données minimales fournies par la caisse pour créer une transaction. */
export const TransactionInputSchema = TransactionBaseSchema.pick({
  id: true,
  version: true,
  idempotencyKey: true,
  deviceId: true,
  cashierId: true,
  lines: true,
  tenders: true,
  totals: true,
});

export type TransactionInput = z.infer<typeof TransactionInputSchema>;

function sum(values: readonly number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Vérifie la cohérence financière d'une transaction (fonction pure).
 * Lève {@link TransactionIntegrityError} si une invariante est violée.
 */
export function assertTransactionIntegrity(transaction: Transaction): void {
  for (const line of transaction.lines) {
    const expected = line.unitPriceMinor * line.quantity;
    if (line.totalMinor !== expected) {
      throw new TransactionIntegrityError(
        `Ligne ${line.sku}: totalMinor=${line.totalMinor} ≠ unitPrice×quantity=${expected}`,
      );
    }
  }

  const { totals } = transaction;
  const lineSum = sum(transaction.lines.map((l) => l.totalMinor));
  if (lineSum !== totals.grossMinor) {
    throw new TransactionIntegrityError(`grossMinor=${totals.grossMinor} ≠ Σ lignes=${lineSum}`);
  }

  if (totals.grossMinor - totals.discountMinor !== totals.netMinor) {
    throw new TransactionIntegrityError(
      `netMinor=${totals.netMinor} ≠ grossMinor(${totals.grossMinor}) - discountMinor(${totals.discountMinor})`,
    );
  }

  const tenderSum = sum(transaction.tenders.map((t) => t.amountMinor));
  if (tenderSum !== totals.tenderedMinor) {
    throw new TransactionIntegrityError(`tenderedMinor=${totals.tenderedMinor} ≠ Σ tenders=${tenderSum}`);
  }

  const expectedChange = Math.max(0, totals.tenderedMinor - totals.netMinor);
  if (totals.changeMinor !== expectedChange) {
    throw new TransactionIntegrityError(
      `changeMinor=${totals.changeMinor} ≠ attendu=${expectedChange}`,
    );
  }
}