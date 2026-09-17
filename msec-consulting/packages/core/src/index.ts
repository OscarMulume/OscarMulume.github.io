export { MsecError, isMsecError, MSEC_HTTP_STATUS } from './errors';
export type { MsecErrorCode, MsecErrorOptions } from './errors';

export {
  CURRENCIES,
  addMinor,
  assertValidMinor,
  computeLineTaxMinor,
  formatMinor,
  money,
  parseAmountMinor,
} from './money/money';
export type { Currency, Money } from './money/money';

export { computeTotals } from './documents/aggregate';
export type { DocumentTotals, TaxableLine } from './documents/aggregate';

export {
  INVOICE_NUMBER_PATTERN,
  InvoiceCreateSchema,
  InvoiceSchema,
  InvoiceStatusSchema,
} from './documents/invoice';
export type { Invoice, InvoiceCreateInput, InvoiceStatus } from './documents/invoice';

export {
  QUOTE_NUMBER_PATTERN,
  QuoteCreateSchema,
  QuoteLineSchema,
  QuoteSchema,
  QuoteStatusSchema,
  QuoteTotalsSchema,
} from './documents/quote';
export type { Quote, QuoteCreateInput, QuoteLine, QuoteStatus, QuoteTotals } from './documents/quote';

export { ROLES, isAtLeast, isRole, toRole } from './rbac/roles';
export type { Role } from './rbac/roles';

export { PERMISSIONS, PORTAL_ROLES, ROLE_PERMISSIONS } from './rbac/permissions';
export type { Permission } from './rbac/permissions';

export {
  assertPermission,
  assertPortalRole,
  assertResourceAccess,
  assertRole,
  hasPermission,
} from './rbac/access';
export type { OwnershipContext } from './rbac/access';

export {
  createDocumentKey,
  decryptDocument,
  encryptDocument,
  hashDocument,
} from './crypto/aes-gcm';
export type { EncryptedDocument } from './crypto/aes-gcm';