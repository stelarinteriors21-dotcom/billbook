import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const notes = await db.invoice.findMany({
    where: { businessId: session.user.businessId, type: "CREDIT_NOTE" },
    include: { party: true },
    orderBy: { date: "desc" },
    take: 50,
  })
  return NextResponse.json({ success: true, data: notes })
}
