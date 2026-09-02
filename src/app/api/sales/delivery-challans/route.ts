import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const challans = await db.deliveryChallan.findMany({
    where: { businessId: session.user.businessId },
    include: { party: true },
    orderBy: { date: "desc" },
    take: 50,
  })
  return NextResponse.json({ success: true, data: challans })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { partyId, date, vehicleNumber, deliveryAddress, notes, lines } = body

  if (!partyId || !lines || lines.length === 0) {
    return NextResponse.json({ error: "partyId and lines are required" }, { status: 400 })
  }

  const last = await db.deliveryChallan.findFirst({
    where: { businessId: session.user.businessId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  })
  const sequence = (last?.sequence ?? 0) + 1
  const prefix = "DC"
  const number = `${prefix}-${String(sequence).padStart(4, "0")}`

  const challan = await db.deliveryChallan.create({
    data: {
      businessId: session.user.businessId,
      partyId,
      prefix,
      sequence,
      number,
      date: new Date(date),
      vehicleNumber: vehicleNumber || null,
      deliveryAddress: deliveryAddress || null,
      notes: notes || null,
      createdById: session.user.id,
      lines: {
        create: lines.map((l: any) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          rate: l.rate,
          total: Number(l.quantity) * Number(l.rate),
        })),
      },
    },
    include: { party: true },
  })
  return NextResponse.json({ success: true, data: challan })
}
