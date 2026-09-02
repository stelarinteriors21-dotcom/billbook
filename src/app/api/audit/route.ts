import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const entity = searchParams.get("entity")
    const entityId = searchParams.get("entityId")
    
    const where: any = { businessId: session.user.businessId }
    if (entity) where.entity = entity
    if (entityId) where.entityId = entityId

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } }
      },
      take: 50 // Limit to recent 50 for now
    })

    return NextResponse.json({ success: true, logs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

