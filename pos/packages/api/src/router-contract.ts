/**
 * CONTRAT de l'API POS (type-only).
 *
 * Ce module décrit la forme du routeur tRPC côté serveur afin que le client
 * soit typé de bout en bout SANS embarquer de code serveur : il est importé
 * exclusivement via `import type` (effacé au bundling). Remplacez-le par
 * l'export `AppRouter` réel une fois le backend publié.
 */
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

import { TransactionInputSchema, TransactionSchema } from '@pos/core';

const t = initTRPC.create();

const contractOnly = (): never => {
  throw new Error('@pos/api: contrat type-only — non exécutable');
};

export const SubmitTransactionResponseSchema = z.object({
  transaction: TransactionSchema,
  replayed: z.boolean(),
});

export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  serverTimeMs: z.number().int().min(0),
});

export const posAppRouter = t.router({
  transactions: t.router({
    submit: t.procedure
      .input(TransactionInputSchema)
      .output(SubmitTransactionResponseSchema)
      .mutation(contractOnly),
    byId: t.procedure.input(z.string().uuid()).output(TransactionSchema).query(contractOnly),
  }),
  system: t.router({
    health: t.procedure.output(HealthResponseSchema).query(contractOnly),
  }),
});

export type PosAppRouter = typeof posAppRouter;