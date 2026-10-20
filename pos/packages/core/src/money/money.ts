/**
 * Manipulation des montants en valeurs ENTIÈRES (unités mineures).
 * Règle d'or POS : ne JAMAIS utiliser de flottants pour l'argent.
 * Avec `currency` les devises à subdivisions radicales (XAF/XOF → 0) sont
 * gérées de manière homogène.
 */

export const CURRENCY_MINOR_UNITS = {
  XAF: 0,
  XOF: 0,
  EUR: 2,
  USD: 2,
} as const satisfies Record<string, number>;

export type Currency = keyof typeof CURRENCY_MINOR_UNITS;

/** Montant strictement entier, capturé en unités mineures (aucun flottant). */
export interface Money {
  readonly valueMinor: number;
  readonly currency: Currency;
}

function assertCurrency(currency: string): asserts currency is Currency {
  if (!Object.prototype.hasOwnProperty.call(CURRENCY_MINOR_UNITS, currency)) {
    throw new TypeError(`Devise non supportée: ${currency}`);
  }
}

export function money(valueMinor: number, currency: Currency): Money {
  if (!Number.isInteger(valueMinor)) {
    throw new TypeError('valueMinor doit être un entier (pas de flottant)');
  }
  return Object.freeze({ valueMinor, currency });
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new TypeError(`Addition de devises différentes: ${a.currency} + ${b.currency}`);
  }
  return money(a.valueMinor + b.valueMinor, a.currency);
}

export function sumMoney(values: readonly Money[]): Money {
  if (values.length === 0) {
    throw new TypeError('sumMoney: liste vide');
  }
  const currency = values[0]?.currency as Currency;
  const total = values.reduce((acc, v) => {
    if (v.currency !== currency) {
      throw new TypeError(`Devises hétérogènes: ${v.currency}`);
    }
    return acc + v.valueMinor;
  }, 0);
  return money(total, currency);
}

export function isZeroMoney(m: Money): boolean {
  return m.valueMinor === 0;
}

/** Formate sans localisation (déterministe, testable) — ex. "1 234,56" ou "5 000" pour XAF. */
export function formatMinor(valueMinor: number, currency: Currency): string {
  assertCurrency(currency);
  if (!Number.isInteger(valueMinor)) {
    throw new TypeError('valueMinor doit être un entier');
  }
  const units = CURRENCY_MINOR_UNITS[currency];
  if (units === undefined) {
    throw new TypeError(`Devise non supportée: ${currency}`);
  }
  const sign = valueMinor < 0 ? '-' : '';
  const abs = Math.abs(valueMinor).toString();
  const padded = abs.padStart(units + 1, '0');
  const grouped = padded.slice(0, -units).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (units === 0) {
    return `${sign}${grouped}`;
  }
  return `${sign}${grouped},${padded.slice(-units)}`;
}