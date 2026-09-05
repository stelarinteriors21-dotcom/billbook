import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { MovementType } from "@prisma/client"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bills = await db.invoice.findMany({
    where: {
      businessId: session.user.businessId,
      type: "PURCHASE",
    },
    include: {
      party: true,
      lines: {
        include: { item: true }
      }
    },
    orderBy: { date: "desc" },
    take: 50,
  })

  return NextResponse.json({ success: true, bills })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const {
    partyId,
    invoiceNumber,
    billDate,
    dueDate,
    paymentTerms,
    reference,
    lines,
    discountAmount = 0,
    roundOff = 0,
    amountPaid = 0,
  } = body

  if (!partyId || !lines || lines.length === 0) {
    return NextResponse.json({ error: "partyId and lines are required" }, { status: 400 })
  }

  try {
    const createdBill = await db.$transaction(async (tx) => {
      // Find latest sequence for purchase
      const last = await tx.invoice.findFirst({
        where: {
          businessId: session.user.businessId,
          type: "PURCHASE",
        },
        orderBy: { invoiceSequence: "desc" },
        select: { invoiceSequence: true }
      })
      const sequence = (last?.invoiceSequence ?? 0) + 1
      const num = invoiceNumber || `BILL-${String(sequence).padStart(4, "0")}`

      // Calculate totals
      let subTotal = 0
      let totalTax = 0

      const processedLines = lines.map((l: any) => {
        const qty = Number(l.quantity)
        const rate = Number(l.rate)
        const disc = Number(l.discountAmount || 0)
        const taxPct = Number(l.taxRatePercent || 0)
        const taxable = qty * rate - disc
        const tax = (taxable * taxPct) / 100
        const total = taxable + tax

        subTotal += taxable
        totalTax += tax

        return {
          itemId: l.itemId,
          quantity: qty,
          rate: rate,
          discountAmount: disc,
          taxRateId: l.taxRateId || null,
          taxPercentage: taxPct,
          taxAmount: tax,
          taxableAmount: taxable,
          total: total,
          godownId: l.godownId || null,
        }
      })

      const grandTotal = subTotal + totalTax - Number(discountAmount) + Number(roundOff)
      const paid = Number(amountPaid)
      const status = paid >= grandTotal ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID"

      const bill = await tx.invoice.create({
        data: {
          businessId: session.user.businessId,
          createdById: session.user.id,
          partyId,
          type: "PURCHASE",
          status,
          invoicePrefix: "BILL",
          invoiceSequence: sequence,
          invoiceNumber: num,
          date: new Date(billDate || new Date()),
          dueDate: dueDate ? new Date(dueDate) : null,
          paymentTerms: paymentTerms || null,
          reference: reference || null,
          subTotal,
          totalDiscount: Number(discountAmount),
          taxableAmount: subTotal,
          totalTax,
          roundOff: Number(roundOff),
          grandTotal,
          amountPaid: paid,
          lines: {
            create: processedLines.map((l: any) => ({
              itemId: l.itemId,
              quantity: l.quantity,
              rate: l.rate,
              discountAmount: l.discountAmount,
              taxRateId: l.taxRateId,
              taxPercentage: l.taxPercentage,
              taxAmount: l.taxAmount,
              taxableAmount: l.taxableAmount,
              total: l.total,
            }))
          }
        }
      })

      // Increase stock for each product purchased
      let godown = await tx.godown.findFirst({
        where: { businessId: session.user.businessId, isDefault: true }
      })
      if (!godown) {
        godown = await tx.godown.findFirst({
          where: { businessId: session.user.businessId }
        })
      }
      if (!godown) {
        godown = await tx.godown.create({
          data: {
            businessId: session.user.businessId,
            name: "Main Godown",
            isDefault: true
          }
        })
      }

      for (const line of processedLines) {
        const item = await tx.item.findUnique({ where: { id: line.itemId } })
        if (item && item.itemType === "PRODUCT") {
          await tx.stockMovement.create({
            data: {
              businessId: session.user.businessId,
              itemId: item.id,
              godownId: line.godownId || godown?.id || "",
              type: MovementType.IN,
              quantity: line.quantity,
              referenceType: "PURCHASE_BILL",
              referenceId: bill.id,
              date: bill.date,
              createdById: session.user.id,
            }
          })
        }
      }

      // If initial payment was made, record payment voucher
      if (paid > 0) {
        await tx.payment.create({
          data: {
            businessId: session.user.businessId,
            partyId,
            invoiceId: bill.id,
            amount: paid,
            date: bill.date,
            mode: "BANK",
            referenceNumber: `BILL-PAY-${bill.id.substring(0, 6)}`,
            createdById: session.user.id,
          }
        })
      }

      return bill
    })

    return NextResponse.json({ success: true, bill: createdBill })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
