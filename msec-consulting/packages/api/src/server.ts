import { initTRPC } from '@trpc/server';
import { z } from 'zod';

import {
  InvoiceSchema,
  MsecError,
  QuoteSchema,
  assertPermission,
  toRole,
  type Invoice,
  type Quote,
  type Role,
} from '@msec/core';

/**
 * Contexte authentifié injecté par l'application hôte (Next.js route handler,
 * dev serveur). La confiance vient DU ROUTER, jamais du client.
 */
export interface ActorContext {
  readonly role: Role;
  readonly subjectClientId: string | null;
}

/** Ports d'accès aux données — implémentés par l'infra (DB) hors package. */
export interface QuoteDatabase {
  listByClient(clientId: string, limit: number): Promise<readonly Quote[]>;
  listAll(limit: number): Promise<readonly Quote[]>;
}

export interface InvoiceDatabase {
  listByClient(clientId: string, limit: number): Promise<readonly Invoice[]>;
  listAll(limit: number): Promise<readonly Invoice[]>;
}

export interface MsecGateways {
  readonly quotes: QuoteDatabase;
  readonly invoices: InvoiceDatabase;
}

const listInput = z.object({ limit: z.number().int().min(1).max(100).default(20) });

/**
 * Router tRPC central : un seul contrat TypeScript pour web et mobile.
 * `AppRouter` est importé côté client en « import type » (aucun code serveur
 * ne devra fuiter vers le bundle).
 */
export function createAppRouter(gateways: MsecGateways) {
  const t = initTRPC.context<ActorContext>().create();

  const portalProcedure = t.procedure.use(({ ctx, next }) => {
    if (ctx.role === 'VISITOR') {
      throw new MsecError('FORBIDDEN', 'Portail réservé aux utilisateurs authentifiés');
    }
    return next({ ctx });
  });

  const contextClientId = (ctx: ActorContext): string => {
    if (ctx.subjectClientId === null) {
      throw new MsecError('FORBIDDEN', 'Session client hors sujet');
    }
    return ctx.subjectClientId;
  };

  return t.router({
    health: t.procedure.query(() => ({ ok: true as const, uptimeMs: Date.now() })),

    quotes: t.router({
      list: portalProcedure
        .input(listInput)
        .output(z.array(QuoteSchema).readonly())
        .query(async ({ ctx, input }) => {
          if (ctx.role === 'CLIENT') {
            return gateways.quotes.listByClient(contextClientId(ctx), input.limit);
          }
          assertPermission(ctx.role, 'quote:read:all');
          return gateways.quotes.listAll(input.limit);
        }),
    }),

    invoices: t.router({
      list: portalProcedure
        .input(listInput)
        .output(z.array(InvoiceSchema).readonly())
        .query(async ({ ctx, input }) => {
          if (ctx.role === 'CLIENT') {
            return gateways.invoices.listByClient(contextClientId(ctx), input.limit);
          }
          assertPermission(ctx.role, 'invoice:read:all');
          return gateways.invoices.listAll(input.limit);
        }),
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

/** Construction d'un contexte depuis des valeurs d'entrée non fiables (cookie header). */
export function buildActorContext(input: {
  readonly role: string | null | undefined;
  readonly subjectClientId: string | null | undefined;
}): ActorContext {
  const role = toRole(input.role ?? null);
  if (role !== 'CLIENT' && role !== 'VISITOR') {
    return { role, subjectClientId: null };
  }
  return { role, subjectClientId: input.subjectClientId ?? null };
}