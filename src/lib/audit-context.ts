import { AsyncLocalStorage } from "async_hooks";

interface AuditContext {
  userId: string;
  businessId: string;
}

export const auditContext = new AsyncLocalStorage<AuditContext>();

