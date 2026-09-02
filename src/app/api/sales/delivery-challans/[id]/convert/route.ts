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
    const challan = await db.deliveryChallan.findFirst({
      where: {
        id,
        businessId: session.user.businessId,
      },
      include: {
        lines: true,
      }
    })

    if (!challan) {
      return NextResponse.json({ error: "Delivery Challan not found" }, { status: 404 })
    }

    if (challan.convertedToInvoiceId) {
      return NextResponse.json({
        error: "Delivery Challan has already been converted to an invoice",
        invoiceId: challan.convertedToInvoiceId
      }, { status: 400 })
    }

    const createdInvoice = await db.$transaction(async (tx) => {
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

      let subTotal = 0
      challan.lines.forEach((l) => {
        subTotal += Number(l.total)
      })

      const invoice = await tx.invoice.create({
        data: {
          businessId: session.user.businessId,
          createdById: session.user.id,
          partyId: challan.partyId,
          type: "SALES",
          status: "UNPAID",
          invoicePrefix: "INV",
          invoiceSequence: sequence,
          invoiceNumber,
          date: new Date(),
          reference: `Challan: ${challan.number}`,
          subTotal,
          totalDiscount: 0,
          taxableAmount: subTotal,
          totalTax: 0,
          roundOff: 0,
          grandTotal: subTotal,
          amountPaid: 0,
          lines: {
            create: challan.lines.map((l) => ({
              itemId: l.itemId,
              quantity: l.quantity,
              rate: l.rate,
              discountAmount: 0,
              taxPercentage: 0,
              taxAmount: 0,
              taxableAmount: l.total,
              total: l.total,
            }))
          }
        }
      })

      await tx.deliveryChallan.update({
        where: { id: challan.id },
        data: {
          status: "CONVERTED",
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
