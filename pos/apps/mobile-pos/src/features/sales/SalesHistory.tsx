import { FlashList } from '@shopify/flash-list';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatMinor } from '@pos/core';
import type { Currency, Transaction } from '@pos/core';
import { posBrand } from '@pos/ui';

const DEVICE_CURRENCY: Currency = 'XAF';

function formatDate(createdAtMs: number): string {
  return new Date(createdAtMs).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SaleRow = memo(function SaleRow({
  transaction,
}: {
  readonly transaction: Transaction;
}) {
  const { totals, status } = transaction;
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.sku}>{transaction.deviceId}</Text>
        <Text style={styles.meta}>
          {formatDate(transaction.createdAtMs)} · {transaction.lines.length} ligne(s) · {status}
        </Text>
      </View>
      <Text style={styles.amount}>{formatMinor(totals.netMinor, DEVICE_CURRENCY)}</Text>
    </View>
  );
});

export function SalesHistory({
  transactions,
}: {
  readonly transactions: readonly Transaction[];
}) {
  return (
    <FlashList
      data={transactions}
      renderItem={({ item }) => <SaleRow transaction={item} />}
      keyExtractor={(item: Transaction) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <Text style={styles.empty}>Aucune vente enregistrée sur cette caisse.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: posBrand.spacing.lg,
    paddingBottom: posBrand.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: posBrand.colors.surface,
    borderRadius: posBrand.radii.md,
    borderWidth: 1,
    borderColor: posBrand.colors.border,
    padding: posBrand.spacing.lg,
    marginBottom: posBrand.spacing.sm,
  },
  rowLeft: {
    flex: 1,
    marginRight: posBrand.spacing.md,
  },
  sku: {
    color: posBrand.colors.text,
    fontWeight: posBrand.fontWeights.semibold,
    fontSize: posBrand.typography.body,
  },
  meta: {
    color: posBrand.colors.textMuted,
    fontSize: posBrand.typography.caption,
    marginTop: posBrand.spacing.xs,
  },
  amount: {
    color: posBrand.colors.primary,
    fontWeight: posBrand.fontWeights.bold,
    fontSize: posBrand.typography.title,
  },
  empty: {
    color: posBrand.colors.textMuted,
    textAlign: 'center',
    marginTop: posBrand.spacing.xl,
  },
});