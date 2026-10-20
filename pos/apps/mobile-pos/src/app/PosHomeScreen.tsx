import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { buildTransactionInput, selectGrossMinor, useCartStore } from '../store/cartStore';
import { useSalesHistory, useSubmitTransaction } from '../features/sales/useSales';
import { SalesHistory } from '../features/sales/SalesHistory';
import { deviceId } from '../config';
import { posBrand } from '@pos/ui';
import { formatMinor } from '@pos/core';
import type { Currency } from '@pos/core';

const DEMO_CASHIER_ID = 'dc6500b5-89e5-4100-8a9a-c9e6c9a59941';
const DEVICE_CURRENCY: Currency = 'XAF';

function ShoppingCart() {
  const lines = useCartStore((state) => state.lines);
  const clear = useCartStore((state) => state.clear);
  const submit = useSubmitTransaction();
  const gross = selectGrossMinor(lines);

  const handleCheckout = useCallback(() => {
    if (lines.length === 0) {
      return;
    }
    const input = buildTransactionInput(lines, DEMO_CASHIER_ID, deviceId);
    void submit.mutateAsync(input).then(() => {
      clear();
    });
  }, [lines, clear, submit]);

  return (
    <View style={styles.cart}>
      <View style={styles.cartHeader}>
        <Text style={styles.cartTitle}>Panier en cours</Text>
        <Text style={styles.cartTotal}>{formatMinor(gross, DEVICE_CURRENCY)}</Text>
      </View>
      <Pressable
        onPress={handleCheckout}
        disabled={lines.length === 0 || submit.isPending}
        style={({ pressed }) => [
          styles.checkout,
          (lines.length === 0 || submit.isPending) && styles.checkoutDisabled,
          pressed && styles.checkoutPressed,
        ]}
      >
        <Text style={styles.checkoutLabel}>
          {submit.isPending ? 'Envoi…' : 'Encaisser la vente'}
        </Text>
      </Pressable>
    </View>
  );
}

export function PosHomeScreen() {
  const { transactions } = useSalesHistory();

  return (
    <View style={styles.root}>
      <ShoppingCart />
      <SalesHistory transactions={transactions} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: posBrand.colors.background,
  },
  cart: {
    backgroundColor: posBrand.colors.surface,
    padding: posBrand.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: posBrand.colors.border,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: posBrand.spacing.lg,
  },
  cartTitle: {
    color: posBrand.colors.text,
    fontWeight: posBrand.fontWeights.semibold,
    fontSize: posBrand.typography.title,
  },
  cartTotal: {
    color: posBrand.colors.primary,
    fontWeight: posBrand.fontWeights.bold,
    fontSize: posBrand.typography.heading,
  },
  checkout: {
    backgroundColor: posBrand.colors.primary,
    borderRadius: posBrand.radii.md,
    paddingVertical: posBrand.spacing.md,
    alignItems: 'center',
  },
  checkoutPressed: {
    backgroundColor: posBrand.colors.primaryPressed,
  },
  checkoutDisabled: {
    opacity: 0.5,
  },
  checkoutLabel: {
    color: '#ffffff',
    fontWeight: posBrand.fontWeights.bold,
    fontSize: posBrand.typography.body,
  },
});