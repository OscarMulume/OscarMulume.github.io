import { MsecError } from '../errors';

/** Devises gérées par MSEC CONSULTING (représentation en minor units). */
export type Currency = 'EUR' | 'USD' | 'XAF';

export const CURRENCIES: readonly Currency[] = ['EUR', 'USD', 'XAF'];

export interface Money {
  readonly minorUnits: number;
  readonly currency: Currency;
}

const MAX_SAFE_MINOR = Number.MAX_SAFE_INTEGER;

/**
 * Montant en minor units (ex. 12,34 EUR → 1234). TOUJOURS entier, jamais flottant.
 */
export function money(minorUnits: number, currency: Currency): Money {
  assertValidMinor(minorUnits);
  return { minorUnits, currency };
}

export function assertValidMinor(units: number): void {
  if (!Number.isSafeInteger(units) || units < 0) {
    throw new MsecError('MONEY_INVALID', `montant en minor units invalide : ${String(units)}`);
  }
}

/** Addition d'entiers avec garde-fou anti-dépassement. */
export function addMinor(a: number, b: number): number {
  const sum = Number(a) + Number(b);
  if (!Number.isSafeInteger(sum)) {
    throw new MsecError('MONEY_OVERFLOW', 'dépassement de capacité sur addition monétaire');
  }
  return sum;
}

function scaleHalfUpCompatible(amount: number): number {
  return Math.round(amount);
}

/**
 * Taxe en minor units pour une ligne : `gross * taxRateBps / 10_000`,
 * arrondie au plus proche (même règle des deux côtés, web + mobile).
 */
export function computeLineTaxMinor(unitPriceMinor: number, quantity: number, taxRateBps: number): number {
  assertValidMinor(unitPriceMinor);
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new MsecError('MONEY_INVALID', `quantité invalide : ${String(quantity)}`);
  }
  const gross = unitPriceMinor * quantity;
  if (!Number.isSafeInteger(gross)) {
    throw new MsecError('MONEY_OVERFLOW', 'dépassement de capacité sur le prix de la ligne');
  }
  const tax = scaleHalfUpCompatible((gross * taxRateBps) / 10_000);
  assertValidMinor(tax);
  return tax;
}

/**
 * Parse « 1234.50 » (ou « 1234,50 ») vers minor units. Rejette tout ce qui
 * déborde, est négatif ou a plus de 2 décimales.
 */
export function parseAmountMinor(input: string): number {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(normalized)) {
    throw new MsecError('MONEY_INVALID', `montant illisible : "${input}"`);
  }
  const [intPart = '0', frac = ''] = normalized.split('.');
  const units = Number(intPart) * 100 + Number(frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(units) || units > MAX_SAFE_MINOR) {
    throw new MsecError('MONEY_INVALID', `montant hors limites : "${input}"`);
  }
  return units;
}

export function formatMinor(minorUnits: number, currency: Currency): string {
  assertValidMinor(minorUnits);
  const major = Math.trunc(minorUnits / 100);
  const cents = String(minorUnits % 100).padStart(2, '0');
  return `${major},${cents} ${currency}`;
}