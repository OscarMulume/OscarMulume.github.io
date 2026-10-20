import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ExpoSecureStorage } from '@pos/security/mobile';
import { posBrand } from '@pos/ui';

import { usePosApi } from './src/api/client';
import { PosHomeScreen } from './src/app/PosHomeScreen';
import { posConfig } from './src/config';
import { PosBackendConnector } from './src/db/connector';
import { createPowerSyncDatabase, initializePosDatabase } from './src/db/database';
import { PowerSyncProvider } from './src/db/PowerSyncProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function useInitializeDatabase() {
  const [database] = useState(() => createPowerSyncDatabase());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const connector = new PosBackendConnector({
      syncEndpoint: posConfig.syncEndpoint,
      storage: new ExpoSecureStorage(),
    });

    void initializePosDatabase(database, connector)
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch((failure: unknown) => {
        if (!cancelled) {
          setError(String(failure));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [database]);

  return { database, ready, error };
}

function Shell() {
  const { database, ready, error } = useInitializeDatabase();

  if (error !== null) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Initialisation impossible : {error}</Text>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={posBrand.colors.primary} />
        <Text style={styles.loadingText}>Initialisation de la caisse…</Text>
      </SafeAreaView>
    );
  }

  return (
    <PowerSyncProvider database={database}>
      <PosHomeScreen />
    </PowerSyncProvider>
  );
}

export default function App() {
  // Force une connexion API dès le démarrage (vérifie le health + pinning).
  void usePosApi()
    .health()
    .catch((error: unknown) => {
      console.warn('[pos] API indisponible au démarrage (offline-first) :', String(error));
    });

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Shell />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: posBrand.colors.background,
  },
  loadingText: {
    color: posBrand.colors.textMuted,
    marginTop: posBrand.spacing.lg,
  },
  errorText: {
    color: posBrand.colors.danger,
    paddingHorizontal: posBrand.spacing.xl,
    textAlign: 'center',
  },
});