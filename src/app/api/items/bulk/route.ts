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
    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    const created = await db.item.createMany({
      data: items.map((i: any) => ({
        businessId: session.user.businessId,
        createdById: session.user.id,
        name: i.name,
        itemType: i.itemType || "PRODUCT",
        salesPrice: Number(i.salesPrice) || 0,
        purchasePrice: Number(i.purchasePrice) || 0,
        hsnSac: i.hsnSac || null,
        sku: i.sku || null,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, count: created.count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
