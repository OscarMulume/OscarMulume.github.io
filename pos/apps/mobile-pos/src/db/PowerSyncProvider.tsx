import { PowerSyncContext } from '@powersync/react-native';
import type { PowerSyncDatabase } from '@powersync/react-native';
import type { ReactNode } from 'react';

/**
 * Fournit l'instance locale PowerSync aux hooks (`usePowerSync`, `useQuery`).
 * Remplace l'ancien `PowerSyncProvider` supprimé en SDK v2.
 */
export function PowerSyncProvider({
  database,
  children,
}: {
  readonly database: PowerSyncDatabase;
  readonly children: ReactNode;
}): ReactNode {
  return <PowerSyncContext.Provider value={database}>{children}</PowerSyncContext.Provider>;
}