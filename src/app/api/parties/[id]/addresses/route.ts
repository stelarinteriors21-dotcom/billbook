import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const session = await getServerSession(authOptions)
    // if (!session?.user?.businessId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const { id: partyId } = await params
    const businessId = "e7fb61b9-052d-48cb-8e82-73826c993699" // session.user.businessId

    // Get all distinct shipping addresses used in previous invoices for this party
    const invoices = await db.invoice.findMany({
      where: {
        businessId,
        partyId,
        shippingAddress: { not: null }
      },
      select: { shippingAddress: true },
      distinct: ['shippingAddress'],
      orderBy: { createdAt: 'desc' }
    })
    
    // Filter out empty strings
    const addresses = invoices.map(i => i.shippingAddress).filter(addr => addr && addr.trim() !== "")

    return NextResponse.json({ success: true, addresses })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
