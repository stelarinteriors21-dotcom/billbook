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
    const { name, rate } = body

    if (!name?.trim() || rate === undefined || isNaN(Number(rate))) {
      return NextResponse.json({ error: "Name and numeric tax rate percentage are required" }, { status: 400 })
    }

    const taxRate = await db.taxRate.create({
      data: {
        businessId: session.user.businessId,
        name: name.trim(),
        rate: Number(rate),
      },
    })

    return NextResponse.json({ success: true, taxRate: { id: taxRate.id, name: taxRate.name, rate: Number(taxRate.rate) } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
