import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const quotation = await db.quotation.findFirst({
      where: {
        id,
        businessId: session.user.businessId,
      },
      include: {
        lines: true,
      }
    })

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    if (quotation.convertedToInvoiceId) {
      return NextResponse.json({
        error: "Quotation has already been converted to an invoice",
        invoiceId: quotation.convertedToInvoiceId
      }, { status: 400 })
    }

    const createdInvoice = await db.$transaction(async (tx) => {
      // Find latest sequence for sales
      const last = await tx.invoice.findFirst({
        where: {
          businessId: session.user.businessId,
          type: "SALES",
        },
        orderBy: { invoiceSequence: "desc" },
        select: { invoiceSequence: true }
      })
      const sequence = (last?.invoiceSequence ?? 0) + 1
      const invoiceNumber = `INV-${String(sequence).padStart(4, "0")}`

      const invoice = await tx.invoice.create({
        data: {
          businessId: session.user.businessId,
          createdById: session.user.id,
          partyId: quotation.partyId,
          type: "SALES",
          status: "UNPAID",
          invoicePrefix: "INV",
          invoiceSequence: sequence,
          invoiceNumber,
          date: new Date(),
          reference: `Quotation: ${quotation.number}`,
          subTotal: quotation.subTotal,
          totalDiscount: quotation.totalDiscount,
          taxableAmount: quotation.subTotal,
          totalTax: quotation.totalTax,
          roundOff: quotation.roundOff,
          grandTotal: quotation.grandTotal,
          amountPaid: 0,
          lines: {
            create: quotation.lines.map((l) => ({
              itemId: l.itemId,
              quantity: l.quantity,
              rate: l.rate,
              discountAmount: l.discountAmount,
              taxRateId: l.taxRateId,
              taxPercentage: l.taxPercentage,
              taxAmount: l.taxAmount,
              taxableAmount: Number(l.quantity) * Number(l.rate) - Number(l.discountAmount),
              total: l.total,
            }))
          }
        }
      })

      // Mark quotation as accepted and converted
      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: "ACCEPTED",
          convertedToInvoiceId: invoice.id,
        }
      })

      return invoice
    })

    return NextResponse.json({ success: true, invoice: createdInvoice })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
