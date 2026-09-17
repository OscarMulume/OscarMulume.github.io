import { describe, expect, it } from 'vitest';

import { computeTotals } from '../src';
import { InvoiceSchema, type InvoiceCreateInput } from '../src/documents/invoice';
import { QuoteLineSchema, type QuoteLine } from '../src/documents/quote';

function makeLines(): QuoteLine[] {
  const lines = [
    {
      id: crypto.randomUUID(),
      productId: 'P-CONSULT',
      label: 'Accompagnement transformation digitale',
      quantity: 2,
      unitPriceMinor: 75_000,
      taxRateBps: 0,
    },
  ];
  return QuoteLineSchema.array().parse(lines);
}

function baseInvoice(): InvoiceCreateInput {
  const lines = makeLines();
  return {
    id: crypto.randomUUID(),
    number: 'FAC-2026-0001',
    quoteId: crypto.randomUUID(),
    clientId: crypto.randomUUID(),
    clientEmail: 'client@exemple.fr',
    currency: 'EUR',
    lines,
    status: 'DUE',
    summary: computeTotals(lines),
    issuedAtMs: Date.UTC(2026, 0, 15),
    dueAtMs: Date.UTC(2026, 1, 15),
    paidAtMs: null,
    keyId: 'k-doc-002',
  };
}

describe('InvoiceSchema', () => {
  it('accepte une facture due sans date de paiement', () => {
    const invoice = InvoiceSchema.parse(baseInvoice());
    expect(invoice.status).toBe('DUE');
  });

  it('exige une date de paiement quand le statut est PAID', () => {
    const invoice = baseInvoice();
    invoice.status = 'PAID';
    const parsed = { ...invoice, paidAtMs: Date.UTC(2026, 1, 10) };
    expect(InvoiceSchema.parse(parsed).status).toBe('PAID');
    expect(() => InvoiceSchema.parse(invoice)).toThrow(/date de paiement/u);
  });

  it('interdit d’annuler une facture payée', () => {
    const invoice = baseInvoice();
    invoice.status = 'CANCELLED';
    invoice.paidAtMs = Date.UTC(2026, 1, 10);
    expect(() => InvoiceSchema.parse(invoice)).toThrow(/annulée/u);
  });

  it('rejette une échéance antérieure à l’émission', () => {
    const invoice = baseInvoice();
    invoice.dueAtMs = invoice.issuedAtMs - 1;
    expect(() => InvoiceSchema.parse(invoice)).toThrow(/postérieure/u);
  });

  it('rejette des totaux incohérents', () => {
    const invoice = baseInvoice();
    invoice.summary = { ...invoice.summary, netMinor: invoice.summary.netMinor + 5 };
    expect(() => InvoiceSchema.parse(invoice)).toThrow(/append-only/u);
  });
});