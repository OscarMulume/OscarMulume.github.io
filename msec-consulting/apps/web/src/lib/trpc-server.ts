import { createAppRouter, type ActorContext } from '@msec/api';

import { invoiceGateway, quoteGateway } from './gateways';

const appRouter = createAppRouter({ quotes: quoteGateway, invoices: invoiceGateway });

/** Appel tRPC serveur→serveur (RSC/Server Actions), RBAC garanti par le router. */
export function getTrpcCaller(actor: ActorContext) {
  return appRouter.createCaller(actor);
}