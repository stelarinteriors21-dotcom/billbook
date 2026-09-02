import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { auditContext } from "./audit-context"

export function withAudit(handler: Function) {
  return async (...args: any[]) => {
    const session = await getServerSession(authOptions)
    if (session?.user?.businessId && session?.user?.id) {
      return auditContext.run(
        { userId: session.user.id, businessId: session.user.businessId },
        () => handler(...args)
      )
    }
    return handler(...args)
  }
}

