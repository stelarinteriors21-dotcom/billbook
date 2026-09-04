import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

declare global {
  var prisma: ReturnType<typeof getPrismaClient> | undefined;
}

function getPrismaClient() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  const baseClient = new PrismaClient({ adapter });

  // Add the audit extension
  const extendedClient = baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);
          
          if (["create", "update", "delete"].includes(operation) && model !== "AuditLog") {
            let session;
            try {
              session = await getServerSession(authOptions);
            } catch (e) {
              // Ignore
            }

            if (session?.user?.id && session?.user?.businessId) {
              let entityId = (result as any)?.id || "UNKNOWN";
              
              baseClient.auditLog.create({
                data: {
                  businessId: session.user.businessId,
                  userId: session.user.id,
                  action: operation.toUpperCase(),
                  entity: model || "UNKNOWN",
                  entityId: entityId,
                  changes: (args as any)?.data || null,
                }
              }).catch(err => console.error("Audit log failed:", err));
            }
          }

          return result;
        }
      }
    }
  });

  return extendedClient;
}

export const db = globalThis.prisma || getPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
