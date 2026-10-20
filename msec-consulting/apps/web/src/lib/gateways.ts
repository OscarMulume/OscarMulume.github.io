import type { Invoice, Quote } from '@msec/core';
import type { InvoiceDatabase, QuoteDatabase } from '@msec/api';

/**
 * Ports d'accès aux données. Boilerplate : remplacez par votre pool
 * PostgreSQL/Prisma en gardant cette interface (le reste du système est déjà
 * typé contre elle).
 */
const EMPTY_QUOTES: readonly Quote[] = [];
const EMPTY_INVOICES: readonly Invoice[] = [];

export const quoteGateway: QuoteDatabase = {
  async listByClient(_clientId: string, _limit: number): Promise<readonly Quote[]> {
    return EMPTY_QUOTES;
  },
  async listAll(_limit: number): Promise<readonly Quote[]> {
    return EMPTY_QUOTES;
  },
};

export const invoiceGateway: InvoiceDatabase = {
  async listByClient(_clientId: string, _limit: number): Promise<readonly Invoice[]> {
    return EMPTY_INVOICES;
  },
  async listAll(_limit: number): Promise<readonly Invoice[]> {
    return EMPTY_INVOICES;
  },
};