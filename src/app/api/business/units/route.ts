import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, shortName } = body

    if (!name?.trim() || !shortName?.trim()) {
      return NextResponse.json({ error: "Unit full name and short code are required" }, { status: 400 })
    }

    const unit = await db.unit.create({
      data: {
        businessId: session.user.businessId,
        name: name.trim(),
        shortName: shortName.trim().toUpperCase(),
      },
    })

    return NextResponse.json({ success: true, unit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
