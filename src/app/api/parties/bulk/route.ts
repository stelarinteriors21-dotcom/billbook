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
    const { parties } = body

    if (!Array.isArray(parties) || parties.length === 0) {
      return NextResponse.json({ error: "No parties provided" }, { status: 400 })
    }

    const created = await db.party.createMany({
      data: parties.map((p: any) => ({
        businessId: session.user.businessId,
        createdById: session.user.id,
        name: p.name,
        partyType: p.partyType || "CUSTOMER",
        mobileNumber: p.mobileNumber || null,
        email: p.email || null,
        billingAddress: p.billingAddress || null,
        gstin: p.gstin || null,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, count: created.count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
