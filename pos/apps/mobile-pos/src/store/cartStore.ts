import { create } from 'zustand';

import { newIdempotencyKey } from '@pos/core';
import { uuidv4 } from '@pos/core';
import type { TransactionInput } from '@pos/core';

export interface CartLine {
  readonly productId: string;
  readonly sku: string;
  readonly label: string;
  readonly unitPriceMinor: number;
  readonly quantity: number;
}

export interface CartState {
  readonly lines: readonly CartLine[];
  addLine: (line: CartLine) => void;
  changeQuantity: (sku: string, delta: number) => void;
  clear: () => void;
}

function upsertLine(lines: readonly CartLine[], line: CartLine): readonly CartLine[] {
  const existing = lines.find((l) => l.sku === line.sku);
  if (existing === undefined) {
    return [...lines, line];
  }
  return lines.map((l) =>
    l.sku === line.sku ? { ...l, quantity: l.quantity + line.quantity } : l,
  );
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  addLine: (line) => set((state) => ({ lines: upsertLine(state.lines, line) })),
  changeQuantity: (sku, delta) =>
    set((state) => ({
      lines: state.lines
        .map((l) => (l.sku === sku ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0),
    })),
  clear: () => set({ lines: [] }),
}));

export function selectGrossMinor(lines: readonly CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.unitPriceMinor * l.quantity, 0);
}

/**
 * Construit la donnée d'entrée d'une transaction (append-only, idempotente).
 * Modèle identifiants UUID + Une Idempotency-Key par transaction logique.
 */
export function buildTransactionInput(
  lines: readonly CartLine[],
  cashierId: string,
  deviceIdValue: string,
): TransactionInput {
  const grossMinor = selectGrossMinor(lines);
  const netMinor = grossMinor;

  const transactionLines = lines.map((l) => ({
    id: uuidv4(),
    productId: l.productId,
    sku: l.sku,
    label: l.label,
    unitPriceMinor: l.unitPriceMinor,
    quantity: l.quantity,
    totalMinor: l.unitPriceMinor * l.quantity,
  }));

  return {
    id: uuidv4(),
    version: 1,
    idempotencyKey: newIdempotencyKey(),
    deviceId: deviceIdValue,
    cashierId,
    lines: transactionLines,
    // Par défaut : encaissement espèces exact. La caisse ajuste les tenders.
    tenders: [
      {
        id: uuidv4(),
        method: 'CASH',
        amountMinor: netMinor,
      },
    ],
    totals: {
      grossMinor,
      discountMinor: 0,
      taxMinor: 0,
      netMinor,
      tenderedMinor: netMinor,
      changeMinor: 0,
    },
  };
}