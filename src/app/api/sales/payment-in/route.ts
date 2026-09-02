import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PaymentMode } from "@prisma/client"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payments = await db.payment.findMany({
    where: { businessId: session.user.businessId },
    include: { party: true, invoice: true },
    orderBy: { date: "desc" },
    take: 50,
  })
  return NextResponse.json({ success: true, data: payments })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { partyId, invoiceId, amount, date, mode, referenceNumber, notes } = body

  if (!partyId || !amount || !date || !mode) {
    return NextResponse.json({ error: "partyId, amount, date and mode are required" }, { status: 400 })
  }

  const payment = await db.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        businessId: session.user.businessId,
        partyId,
        invoiceId: invoiceId || null,
        amount: Number(amount),
        date: new Date(date),
        mode: mode as PaymentMode,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        createdById: session.user.id,
      },
    })

    if (invoiceId) {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } })
      if (invoice) {
        const newPaid = Number(invoice.amountPaid) + Number(amount)
        const total = Number(invoice.grandTotal)
        const status = newPaid >= total ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID"
        await tx.invoice.update({ where: { id: invoiceId }, data: { amountPaid: newPaid, status } })
      }
    }

    return p
  })

  return NextResponse.json({ success: true, data: payment })
}
