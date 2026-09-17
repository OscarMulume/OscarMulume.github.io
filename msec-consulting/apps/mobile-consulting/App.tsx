import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { formatMinor, type Quote } from '@msec/core';
import { msecBrand } from '@msec/ui';

import { fetchQuotes } from './src/api/trpc';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

function QuoteRow({ quote }: { readonly quote: Quote }) {
  return (
    <Pressable style={styles.card} accessibilityLabel={`Devis ${quote.number}`}>
      <View style={styles.cardHeader}>
        <Text style={styles.number}>{quote.number}</Text>
        <Text style={styles.status}>{quote.status}</Text>
      </View>
      <Text style={styles.client} numberOfLines={1}>
        {quote.clientEmail}
      </Text>
      <Text style={styles.total}>
        {formatMinor(quote.summary.totalMinor, quote.currency)}
      </Text>
    </Pressable>
  );
}

function QuotesList() {
  const { data, isError, isLoading, refetch } = useQuery<readonly Quote[], Error>({
    queryKey: ['quotes'],
    queryFn: fetchQuotes,
  });

  const SectionHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.title}>Espace client</Text>
        <Text style={styles.subtitle}>
          Devis temps réel (tRPC + RBAC). Données sensibles chiffrées at-rest —
          token de session en Keychain/Keystore.
        </Text>
      </View>
    ),
    [],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        {SectionHeader}
        <ActivityIndicator size="large" color={msecBrand.colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        {SectionHeader}
        <Text style={styles.error}>Impossible de charger les devis (session requise ?).</Text>
        <Pressable onPress={() => void refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlashList
      data={[...(data ?? [])]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <QuoteRow quote={item} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={SectionHeader}
      ListEmptyComponent={
        <Text style={styles.empty}>
          Aucun devis pour ce compte (gateway mémoire). Connectez la BDD puis
          branchez le login réel.
        </Text>
      }
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        <QuotesList />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: msecBrand.colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: msecBrand.colors.background,
  },
  listContent: {
    paddingHorizontal: msecBrand.spacing.lg,
    paddingBottom: msecBrand.spacing.xxl,
  },
  header: {
    paddingTop: msecBrand.spacing.xxl + 24,
    paddingBottom: msecBrand.spacing.xl,
  },
  title: {
    color: msecBrand.colors.primary,
    fontSize: msecBrand.typography.heading,
    fontWeight: msecBrand.fontWeights.bold,
  },
  subtitle: {
    marginTop: msecBrand.spacing.sm,
    color: msecBrand.colors.textMuted,
    fontSize: msecBrand.typography.body,
    lineHeight: 20,
  },
  card: {
    backgroundColor: msecBrand.colors.surface,
    borderRadius: msecBrand.radii.md,
    borderWidth: 1,
    borderColor: msecBrand.colors.border,
    padding: msecBrand.spacing.lg,
    marginBottom: msecBrand.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  number: {
    color: msecBrand.colors.primary,
    fontWeight: msecBrand.fontWeights.bold,
    fontSize: msecBrand.typography.title,
  },
  status: {
    color: msecBrand.colors.accent,
    fontSize: msecBrand.typography.caption,
    textTransform: 'uppercase',
  },
  client: {
    marginTop: msecBrand.spacing.sm,
    color: msecBrand.colors.textMuted,
    fontSize: msecBrand.typography.body,
  },
  total: {
    marginTop: msecBrand.spacing.sm,
    color: msecBrand.colors.text,
    fontSize: msecBrand.typography.title,
    fontWeight: msecBrand.fontWeights.semibold,
  },
  empty: {
    color: msecBrand.colors.textMuted,
    fontSize: msecBrand.typography.body,
    paddingVertical: msecBrand.spacing.xl,
    textAlign: 'center',
  },
  error: {
    color: msecBrand.colors.danger,
    fontSize: msecBrand.typography.body,
    paddingHorizontal: msecBrand.spacing.lg,
    marginTop: msecBrand.spacing.lg,
  },
  retryButton: {
    marginTop: msecBrand.spacing.lg,
    alignSelf: 'flex-start',
    marginHorizontal: msecBrand.spacing.lg,
    backgroundColor: msecBrand.colors.primary,
    borderRadius: msecBrand.radii.sm,
    paddingHorizontal: msecBrand.spacing.lg,
    paddingVertical: msecBrand.spacing.sm,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: msecBrand.fontWeights.bold,
  },
});