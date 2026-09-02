import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PaymentMode } from "@prisma/client"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payments = await db.payment.findMany({
    where: {
      businessId: session.user.businessId,
      party: { partyType: "SUPPLIER" },
    },
    include: { party: true, invoice: true },
    orderBy: { date: "desc" },
    take: 50,
  })

  return NextResponse.json({ success: true, payments })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { partyId, invoiceId, amount, date, mode, referenceNumber, notes } = body

  if (!partyId || !amount || !date || !mode) {
    return NextResponse.json({ error: "partyId, amount, date and mode are required" }, { status: 400 })
  }

  try {
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
        }
      })

      // If linked to a purchase bill, update invoice amountPaid and status
      if (invoiceId) {
        const bill = await tx.invoice.findUnique({ where: { id: invoiceId } })
        if (bill) {
          const newPaid = Number(bill.amountPaid) + Number(amount)
          const total = Number(bill.grandTotal)
          const status = newPaid >= total ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID"
          await tx.invoice.update({
            where: { id: invoiceId },
            data: { amountPaid: newPaid, status }
          })
        }
      }

      return p
    })

    return NextResponse.json({ success: true, payment })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
