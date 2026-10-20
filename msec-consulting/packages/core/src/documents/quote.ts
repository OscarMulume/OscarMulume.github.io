import { z } from 'zod';

import { computeTotals } from './aggregate';

/**
 * Schémas « critique » partagés entre web, mobile et serveur : le devis est
 * la racine d'Audit. Contraintes, calcul des totaux et loi de non-régression
 * sont vérifiés ici UNE fois pour toutes (schéma `.strict()`, append-only).
 */

export const QUOTE_NUMBER_PATTERN = /^DEV-\d{4}-\d{4}$/;

export const QuoteLineSchema = z
  .object({
    id: z.string().uuid(),
    productId: z.string().min(1).max(64),
    label: z.string().trim().min(1).max(200),
    quantity: z.number().int().min(1).max(1_000_000),
    unitPriceMinor: z.number().int().min(0).max(1_000_000_000),
    taxRateBps: z.number().int().min(0).max(10_000),
  })
  .strict();

export type QuoteLine = z.infer<typeof QuoteLineSchema>;

export const QuoteStatusSchema = z.enum(['DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']);
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;

export const QuoteTotalsSchema = z
  .object({
    netMinor: z.number().int().min(0),
    taxMinor: z.number().int().min(0),
    totalMinor: z.number().int().min(0),
  })
  .strict();

export type QuoteTotals = z.infer<typeof QuoteTotalsSchema>;

const quoteDataSchema = z
  .object({
    id: z.string().uuid(),
    number: z.string().regex(QUOTE_NUMBER_PATTERN, 'numéro attendu : DEV-AAAA-NNNN'),
    clientId: z.string().uuid(),
    clientEmail: z.string().email().max(254),
    currency: z.enum(['EUR', 'USD', 'XAF']),
    lines: z.array(QuoteLineSchema).min(1).max(200),
    status: QuoteStatusSchema,
    summary: QuoteTotalsSchema,
    issuedAtMs: z.number().int().min(0),
    validUntilMs: z.number().int().min(0),
    /** Identifiant de la clé AES-GCM déduite (rotation document authentifiée). */
    keyId: z.string().min(1).max(128),
  })
  .strict()
  .superRefine((quote, ctx) => {
    if (quote.validUntilMs <= quote.issuedAtMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validUntilMs'],
        message: 'La validité doit être postérieure à la date d’émission',
      });
    }
    const expected = computeTotals(quote.lines);
    if (
      expected.netMinor !== quote.summary.netMinor ||
      expected.taxMinor !== quote.summary.taxMinor ||
      expected.totalMinor !== quote.summary.totalMinor
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['summary'],
        message: 'Totaux incohérents avec les lignes (les documents sont append-only)',
      });
    }
  });

/** Données brutes acceptées à la création (avant lecture seule). */
export const QuoteCreateSchema = quoteDataSchema;
export type QuoteCreateInput = z.infer<typeof QuoteCreateSchema>;

/** Devis tel que stocké : en lecture seule, immuable après écriture. */
export const QuoteSchema = quoteDataSchema.readonly();
export type Quote = z.infer<typeof QuoteSchema>;