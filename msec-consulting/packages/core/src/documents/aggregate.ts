import { addMinor, computeLineTaxMinor } from '../money/money';

export interface DocumentTotals {
  readonly netMinor: number;
  readonly taxMinor: number;
  readonly totalMinor: number;
}

export interface TaxableLine {
  readonly unitPriceMinor: number;
  readonly quantity: number;
  readonly taxRateBps: number;
}

/**
 * Recalcule les totaux depuis les lignes. Source de vérité unique : toute somme
 * persistée est SANS FOI de ce calcul (append-only), et le schéma Zod rejette
 * les écritures incohérentes.
 */
export function computeTotals(lines: readonly TaxableLine[]): DocumentTotals {
  let netMinor = 0;
  let taxMinor = 0;
  for (const line of lines) {
    netMinor = addMinor(netMinor, line.unitPriceMinor * line.quantity);
    taxMinor = addMinor(taxMinor, computeLineTaxMinor(line.unitPriceMinor, line.quantity, line.taxRateBps));
  }
  return { netMinor, taxMinor, totalMinor: addMinor(netMinor, taxMinor) };
}