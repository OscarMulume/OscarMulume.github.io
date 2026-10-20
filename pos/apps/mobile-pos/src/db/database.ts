import { PowerSyncDatabase } from '@powersync/react-native';

import { AppSchema } from './schema';

import type { PosBackendConnector } from './connector';

/**
 * Instance unique de la base locale (PowerSync v2 / OP-SQLite).
 * Pattern « local-first » : l'UI lit TOUJOURS depuis cette base ; le réseau
 * ne sert qu'à la synchronisation (lecture instantanée même hors-ligne).
 */
export function createPowerSyncDatabase(): PowerSyncDatabase {
  return new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: 'msec-pos.db',
    },
  });
}

/** Connexion à la réplication (options de synchro en v2 sur connect()). */
export async function initializePosDatabase(
  database: PowerSyncDatabase,
  connector: PosBackendConnector,
): Promise<void> {
  await database.connect(connector, {
    retryDelayMs: 1_000,
  });
}