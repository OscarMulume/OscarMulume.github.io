import { Schema, Table, column } from '@powersync/common';

/**
 * Schéma local (SQLite via PowerSync v2 / OP-SQLite).
 *
 * Modèle OFFline-first : toute transaction est écrite en base LOCALE d'abord
 * (`INSERT`), puis synchronisée en arrière-plan vers le ledger serveur.
 * La table `transactions` est IMMUABLE (append-only) : `insertOnly` empêche
 * le codage d'UPDATE/DELETE locaux dans la file de synchro.
 */
export const AppSchema = new Schema({
  transactions: new Table(
    {
      id: column.text,
      idempotency_key: column.text,
      device_id: column.text,
      // Sélecteur de portée de synchronisation (paramètre de liste → synchro partielle).
      status: column.text,
      // Payload JSON complet — pile d'audit, jamais modifié.
      data_json: column.text,
      created_at: column.text,
    },
    {
      insertOnly: true,
      indexes: {
        pending_lookup: ['status', 'created_at'],
        idempotency_lookup: ['idempotency_key'],
      },
    },
  ),
});