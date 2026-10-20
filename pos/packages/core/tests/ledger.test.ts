import { describe, expect, it } from 'vitest';

import {
  DuplicateIdempotencyError,
  LedgerHashMismatchError,
  TransactionIntegrityError,
  appendTransaction,
  createLedger,
  findByIdempotencyKey,
  getLedgerBalance,
  verifyChain,
  verifyChainOrThrow,
} from '../src/index';
import type { Ledger, TransactionInput } from '../src/index';

const DEVICE_ID = 'device:test-0001';
const CASHIER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PRODUCT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function input(overrides: Partial<TransactionInput> = {}): TransactionInput {
  const base: TransactionInput = {
    id: '11111111-1111-4111-8111-111111111111',
    version: 1,
    idempotencyKey: '22222222-2222-4222-8222-222222222222',
    deviceId: DEVICE_ID,
    cashierId: CASHIER_ID,
    lines: [
      {
        id: '33333333-3333-4333-8333-333333333333',
        productId: PRODUCT_ID,
        sku: 'CAFE-250',
        label: 'Café 250g',
        unitPriceMinor: 1500,
        quantity: 2,
        totalMinor: 3000,
      },
    ],
    tenders: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        method: 'CASH',
        amountMinor: 5000,
      },
    ],
    totals: {
      grossMinor: 3000,
      discountMinor: 0,
      taxMinor: 0,
      netMinor: 3000,
      tenderedMinor: 5000,
      changeMinor: 2000,
    },
  };
  return { ...base, ...overrides };
}

describe('ledger append-only', () => {
  it('ajoute des transactions immuables et chaîne correctement les hash', () => {
    const empty = createLedger('shop-1');
    const first = appendTransaction(empty, input(), { recordedAtMs: 1_000 });

    expect(empty.entries).toHaveLength(0);
    expect(first.entries).toHaveLength(1);
    expect(first.entries[0]?.prevHash).toBeNull();
    expect(first.entries[0]?.transaction.status).toBe('PENDING');
    expect(verifyChain(first)).toBe(true);

    const second = appendTransaction(
      first,
      input({
        id: '55555555-5555-4555-8555-555555555555',
        idempotencyKey: '66666666-6666-4666-8666-666666666666',
      }),
      { recordedAtMs: 2_000 },
    );

    expect(second.entries).toHaveLength(2);
    expect(second.entries[1]?.prevHash).toBe(first.entries[0]?.hash);
    expect(verifyChainOrThrow(second)).toBeUndefined();

    const balance = getLedgerBalance(second);
    expect(balance.transactionCount).toBe(2);
    expect(balance.totalNetMinor).toBe(6000);
    expect(balance.byPaymentMethod.CASH).toBe(10_000);
  });

  it('rejette un replay de la même Idempotency-Key sur le même device', () => {
    const ledger = appendTransaction(createLedger('shop-1'), input(), { recordedAtMs: 1_000 });

    expect(() =>
      appendTransaction(
        ledger,
        input({ id: '99999999-9999-4999-8999-999999999999' }),
        { recordedAtMs: 3_000 },
      ),
    ).toThrow(DuplicateIdempotencyError);

    const replay = findByIdempotencyKey(ledger, DEVICE_ID, '22222222-2222-4222-8222-222222222222');
    expect(replay?.transaction.id).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('détecte une altération du registre (hash mismatch)', () => {
    const ledger = appendTransaction(createLedger('shop-1'), input(), { recordedAtMs: 1_000 });
    const entry = ledger.entries[0];
    if (entry === undefined) {
      throw new Error('entrée attendue');
    }

    const tampered: Ledger = {
      id: ledger.id,
      entries: [
        {
          ...entry,
          transaction: {
            ...entry.transaction,
            totals: { ...entry.transaction.totals, netMinor: 1 },
          },
        },
      ],
    };

    expect(verifyChain(tampered)).toBe(false);
    expect(() => verifyChainOrThrow(tampered)).toThrow(LedgerHashMismatchError);
  });

  it('refuse une transaction incohérente (intégrité financière)', () => {
    const bad = input({
      totals: {
        grossMinor: 9999,
        discountMinor: 0,
        taxMinor: 0,
        netMinor: 9999,
        tenderedMinor: 5000,
        changeMinor: 0,
      },
    });

    expect(() =>
      appendTransaction(createLedger('shop-1'), bad, { recordedAtMs: 1_000 }),
    ).toThrow(TransactionIntegrityError);
  });
});
