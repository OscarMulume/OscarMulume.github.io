import { z } from 'zod';

import { QuoteLineSchema } from './quote';
import { computeTotals } from './aggregate';

export const INVOICE_NUMBER_PATTERN = /^FAC-\d{4}-\d{4}$/;

export const InvoiceStatusSchema = z.enum(['DUE', 'PAID', 'OVERDUE', 'CANCELLED']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

const invoiceDataSchema = z
  .object({
    id: z.string().uuid(),
    number: z.string().regex(INVOICE_NUMBER_PATTERN, 'numéro attendu : FAC-AAAA-NNNN'),
    quoteId: z.string().uuid().optional().nullable(),
    clientId: z.string().uuid(),
    clientEmail: z.string().email().max(254),
    currency: z.enum(['EUR', 'USD', 'XAF']),
    lines: z.array(QuoteLineSchema).min(1).max(200),
    status: InvoiceStatusSchema,
    summary: z.object({
      netMinor: z.number().int().min(0),
      taxMinor: z.number().int().min(0),
      totalMinor: z.number().int().min(0),
    }).strict(),
    issuedAtMs: z.number().int().min(0),
    dueAtMs: z.number().int().min(0),
    paidAtMs: z.number().int().min(0).optional().nullable(),
    keyId: z.string().min(1).max(128),
  })
  .strict()
  .superRefine((invoice, ctx) => {
    if (invoice.dueAtMs <= invoice.issuedAtMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dueAtMs'],
        message: 'L’échéance doit être postérieure à la date d’émission',
      });
    }
    if (invoice.paidAtMs !== null && invoice.paidAtMs !== undefined && invoice.paidAtMs < invoice.issuedAtMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paidAtMs'],
        message: 'La date de paiement ne peut pas précéder l’émission',
      });
    }
    if (invoice.status === 'PAID' && (invoice.paidAtMs === null || invoice.paidAtMs === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paidAtMs'],
        message: 'Une facture « payée » doit porter une date de paiement',
      });
    }
    if (invoice.status === 'CANCELLED' && invoice.paidAtMs !== null && invoice.paidAtMs !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'Une facture annulée ne peut pas porter de paiement',
      });
    }
    const expected = computeTotals(invoice.lines);
    if (
      expected.netMinor !== invoice.summary.netMinor ||
      expected.taxMinor !== invoice.summary.taxMinor ||
      expected.totalMinor !== invoice.summary.totalMinor
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['summary'],
        message: 'Totaux incohérents avec les lignes (append-only)',
      });
    }
  });

export const InvoiceCreateSchema = invoiceDataSchema;
export type InvoiceCreateInput = z.infer<typeof InvoiceCreateSchema>;

export const InvoiceSchema = invoiceDataSchema.readonly();
export type Invoice = z.infer<typeof InvoiceSchema>;