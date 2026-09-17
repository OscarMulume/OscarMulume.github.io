import type {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
} from '@powersync/common';

import type { SecureStorage } from '@pos/security';

export interface SyncCredentialsOptions {
  readonly syncEndpoint: string;
  readonly storage: SecureStorage;
}

interface CredentialsResponse {
  readonly endpoint: string;
  readonly token: string;
}

/**
 * Raccord souffère de PowerSync au ledger serveur.
 *  - télécharge les ops locales non encore envoyées (uploadData)
 *  - reçoit les écritures des autres caisses en temps réel
 */
export class PosBackendConnector implements PowerSyncBackendConnector {
  private readonly endpoint: string;
  private readonly storage: SecureStorage;

  constructor(options: SyncCredentialsOptions) {
    this.endpoint = options.syncEndpoint;
    this.storage = options.storage;
  }

  async fetchCredentials(): Promise<CredentialsResponse> {
    const token = await this.storage.getItem('pos.sync.token');
    if (token === null) {
      throw new Error('Jeton de synchronisation absent du stockage sécurisé');
    }
    return { endpoint: this.endpoint, token };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const batch = await database.getCrudBatch();
    if (batch === null) {
      return;
    }

    // POST idempotent : l'API déduplique sur (device_id, idempotency_key).
    // Le client PowerSync relit le statut via le flux de sync.
    const ops = batch.crud.map((entry) => ({
      table: entry.table,
      op: entry.op,
      id: entry.id,
      opData: entry.opData ?? {},
    }));

    const response = await fetch(`${this.endpoint}/upload-ops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ops),
    });
    if (!response.ok) {
      throw new Error(`Upload ops refusé (HTTP ${response.status})`);
    }

    // Ne PAS appeler complete() en cas d'erreur : les données locales restent
    // en file et seront rejouées à la prochaine tentative (aucun risque de perte).
    await batch.complete();
  }
}