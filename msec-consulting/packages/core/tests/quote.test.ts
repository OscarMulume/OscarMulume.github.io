import { describe, expect, it } from 'vitest';

import { computeTotals } from '../src';
import { QuoteSchema, type QuoteCreateInput } from '../src/documents/quote';

function baseQuote(): QuoteCreateInput {
  const lines = [
    {
      id: crypto.randomUUID(),
      productId: 'P-AUDIT-SEO',
      label: 'Audit SEO deep-dive',
      quantity: 1,
      unitPriceMinor: 50_000,
      taxRateBps: 2_000,
    },
  ];
  return {
    id: crypto.randomUUID(),
    number: 'DEV-2026-0001',
    clientId: crypto.randomUUID(),
    clientEmail: 'client@exemple.fr',
    currency: 'EUR',
    lines,
    status: 'PENDING',
    summary: computeTotals(lines),
    issuedAtMs: Date.UTC(2026, 0, 1),
    validUntilMs: Date.UTC(2026, 1, 1),
    keyId: 'k-doc-001',
  };
}

describe('QuoteSchema', () => {
  it('accepte un devis valide et range un statut', () => {
    const quote = QuoteSchema.parse(baseQuote());
    expect(quote.status).toBe('PENDING');
  });

  it('calcule la TVA ligne par ligne (2 000 bps = 20 %)', () => {
    const totals = computeTotals(baseQuote().lines);
    expect(totals.netMinor).toBe(50_000);
    expect(totals.taxMinor).toBe(10_000);
    expect(totals.totalMinor).toBe(60_000);
  });

  it('rejette des totaux incohérents avec les lignes', () => {
    const quote = baseQuote();
    quote.summary = { ...quote.summary, totalMinor: quote.summary.totalMinor + 1 };
    expect(() => QuoteSchema.parse(quote)).toThrow(/Totaux incohérents/u);
  });

  it('rejette un numéro qui ne suit pas DEV-AAAA-NNNN', () => {
    const quote = baseQuote();
    quote.number = 'FAC-2026-0001';
    expect(() => QuoteSchema.parse(quote)).toThrow(/DEV-AAAA-NNNN/u);
  });

  it('rejette une validité antérieure à l’émission', () => {
    const quote = baseQuote();
    quote.validUntilMs = quote.issuedAtMs - 1;
    expect(() => QuoteSchema.parse(quote)).toThrow(/postérieure/u);
  });

  it('rejette une quantité nulle (ligne strict)', () => {
    const quote = baseQuote();
    quote.lines[0] = { ...quote.lines[0]!, quantity: 0 };
    expect(() => QuoteSchema.parse(quote)).toThrow();
  });
});