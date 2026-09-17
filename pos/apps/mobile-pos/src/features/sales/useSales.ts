import { usePowerSync, useQuery as usePowerSyncQuery } from '@powersync/react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { TransactionSchema } from '@pos/core';
import type { Transaction, TransactionInput } from '@pos/core';

import { usePosApi } from '../../api/client';

interface SalesRow {
  readonly id: string;
  readonly data_json: string;
  readonly created_at: string;
}

function parseRow(row: SalesRow): Transaction {
  const json: unknown = JSON.parse(row.data_json);
  return TransactionSchema.parse(json);
}

/** Lecture de l'historique DIRECTEMENT en base locale (instantané, offline). */
export function useSalesHistory(limit = 50): { readonly transactions: readonly Transaction[] } {
  const { data } = usePowerSyncQuery<SalesRow>(
    'SELECT id, data_json, created_at FROM transactions ORDER BY created_at DESC LIMIT ?',
    [limit],
  );
  return { transactions: data === undefined || data === null ? [] : data.map(parseRow) };
}

/** Soumission d'une vente : tentative réseau avec retry idempotent. */
export function useSubmitTransaction() {
  const api = usePosApi();
  const powerSync = usePowerSync();
  const queryClient = useQueryClient();

  const insertLocal = useCallback(
    async (transaction: Transaction): Promise<void> => {
      await powerSync.writeTransaction((tx) => {
        return tx.execute(
          `INSERT INTO transactions
             (id, idempotency_key, device_id, status, data_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            transaction.id,
            transaction.idempotencyKey,
            transaction.deviceId,
            transaction.status,
            JSON.stringify(transaction),
            new Date(transaction.createdAtMs).toISOString(),
          ],
        );
      });
    },
    [powerSync],
  );

  return useMutation({
    mutationFn: (input: TransactionInput) => api.submitTransaction(input),
    onSuccess: async (response) => {
      await insertLocal(response.transaction);
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}