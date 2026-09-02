import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const quotations = await db.quotation.findMany({
    where: { businessId: session.user.businessId },
    include: { party: true },
    orderBy: { date: "desc" },
    take: 50,
  })

  return NextResponse.json({ success: true, data: quotations })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { partyId, date, expiryDate, reference, notes, discountAmount, roundOff, lines } = body

  if (!partyId || !lines || lines.length === 0) {
    return NextResponse.json({ error: "partyId and lines are required" }, { status: 400 })
  }

  // Compute sequence
  const last = await db.quotation.findFirst({
    where: { businessId: session.user.businessId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  })
  const sequence = (last?.sequence ?? 0) + 1
  const prefix = "EST"
  const number = `${prefix}-${String(sequence).padStart(4, "0")}`

  // Calculate totals
  let subTotal = 0
  let totalTax = 0
  const processedLines = lines.map((l: any) => {
    const qty = Number(l.quantity)
    const rate = Number(l.rate)
    const disc = Number(l.discountAmount || 0)
    const taxPct = Number(l.taxRatePercent || 0)
    const taxableAmount = qty * rate - disc
    const taxAmount = (taxableAmount * taxPct) / 100
    const total = taxableAmount + taxAmount
    subTotal += taxableAmount
    totalTax += taxAmount
    return { ...l, taxAmount, total }
  })

  const grandTotal = subTotal + totalTax - Number(discountAmount || 0) + Number(roundOff || 0)

  const quotation = await db.quotation.create({
    data: {
      businessId: session.user.businessId,
      partyId,
      prefix,
      sequence,
      number,
      date: new Date(date),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      reference: reference || null,
      notes: notes || null,
      subTotal,
      totalDiscount: Number(discountAmount || 0),
      totalTax,
      roundOff: Number(roundOff || 0),
      grandTotal,
      createdById: session.user.id,
      lines: {
        create: processedLines.map((l: any) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          rate: l.rate,
          discountAmount: l.discountAmount || 0,
          taxRateId: l.taxRateId || null,
          taxPercentage: l.taxRatePercent || 0,
          taxAmount: l.taxAmount,
          total: l.total,
        })),
      },
    },
    include: { party: true, lines: { include: { item: true } } },
  })

  return NextResponse.json({ success: true, data: quotation })
}
