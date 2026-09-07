import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/billing-engine"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const invoice = await db.invoice.findFirst({
      where: { id, businessId: session.user.businessId },
      include: {
        party: true,
        lines: { include: { item: true } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, invoice })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { partyId, date, lines, discountAmount = 0, roundOff = 0, amountPaid, reference, dueDate, notes, paymentTerms, bankDetails, invoicePrefix, invoiceNumber, billingAddress, shippingAddress } = body

    const businessId = session.user.businessId

    // Existing invoice
    const existing = await db.invoice.findFirst({
      where: { id, businessId },
      include: { lines: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Fetch tax rates
    const taxRates = await db.taxRate.findMany({
      where: { businessId },
    })
    const taxRateMap = new Map(taxRates.map((t) => [t.id, Number(t.rate)]))

    // Recalculate totals
    const calcInput = {
      discountAmount: Number(discountAmount || 0),
      roundOff: Number(roundOff || 0),
      lines: lines.map((line: any) => {
        const tr = line.taxRateId ? taxRateMap.get(line.taxRateId) ?? Number(line.taxRatePercent || line.taxPercentage || 0) : Number(line.taxRatePercent || line.taxPercentage || 0)
        return {
          quantity: Number(line.quantity),
          rate: Number(line.rate),
          discountAmount: Number(line.discountAmount || 0),
          taxRatePercent: tr,
        }
      }),
    }

    const totals = calculateInvoiceTotals(calcInput)

    const updated = await db.$transaction(async (tx) => {
      // Delete old line items
      await tx.invoiceLineItem.deleteMany({
        where: { invoiceId: id },
      })

      // Update invoice and create new lines
      const inv = await tx.invoice.update({
        where: { id },
        data: {
          party: { connect: { id: partyId !== undefined ? partyId : existing.partyId } },
          date: date ? new Date(date) : existing.date,
          subTotal: totals.subTotal,
          totalDiscount: Number(discountAmount || 0),
          totalTax: totals.totalTax,
          roundOff: Number(roundOff || 0),
          grandTotal: totals.grandTotal,
          amountPaid: amountPaid !== undefined ? Number(amountPaid) : existing.amountPaid,
          status:
            (amountPaid !== undefined ? Number(amountPaid) : Number(existing.amountPaid)) >= totals.grandTotal
              ? "PAID"
              : (amountPaid !== undefined ? Number(amountPaid) : Number(existing.amountPaid)) > 0
              ? "PARTIAL"
              : "UNPAID",
          reference: reference !== undefined ? reference : existing.reference,
          billingAddress: billingAddress !== undefined ? billingAddress : existing.billingAddress,
          shippingAddress: shippingAddress !== undefined ? shippingAddress : existing.shippingAddress,
          notes: notes !== undefined ? notes : existing.notes,
          paymentTerms: paymentTerms !== undefined ? paymentTerms : existing.paymentTerms,
          bankDetails: bankDetails !== undefined ? bankDetails : existing.bankDetails,
          invoicePrefix: invoicePrefix !== undefined ? invoicePrefix : existing.invoicePrefix,
          invoiceNumber: (() => {
            const p = invoicePrefix !== undefined ? invoicePrefix : existing.invoicePrefix;
            let n = invoiceNumber !== undefined ? invoiceNumber : existing.invoiceNumber;
            // Clean up: if the sequence already starts with the prefix (with or without hyphen), strip it out
            if (p && n.startsWith(p + '-')) n = n.substring(p.length + 1);
            else if (p && n.startsWith(p)) n = n.substring(p.length);
            return `${p}${n}`;
          })(),
          dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
          lines: {
            create: lines.map((line: any, idx: number) => {
              const lineCalc = calculateLineTotal(calcInput.lines[idx])
              return {
                item: { connect: { id: line.itemId } },
                quantity: Number(line.quantity),
                rate: Number(line.rate),
                discountAmount: Number(line.discountAmount || 0),
                taxRateId: line.taxRateId || undefined,
                taxPercentage: calcInput.lines[idx].taxRatePercent,
                taxAmount: lineCalc.taxAmount,
                total: lineCalc.total,
              }
            }),
          },
        },
        include: {
          party: true,
          lines: { include: { item: true } },
        },
      })

      return inv
    })

    return NextResponse.json({ success: true, invoice: updated })
  } catch (error: any) {
    console.error("Invoice update error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const businessId = session.user.businessId

    const existing = await db.invoice.findFirst({
      where: { id, businessId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Delete all related records in the correct order to avoid FK constraint errors
    await db.$transaction(async (tx) => {
      // 1. Delete ledger entries referencing this invoice
      await tx.ledgerEntry.deleteMany({ where: { referenceId: id } })

      // 2. Delete payments referencing this invoice and their ledger entries
      const payments = await tx.payment.findMany({ where: { invoiceId: id }, select: { id: true } })
      for (const p of payments) {
        await tx.ledgerEntry.deleteMany({ where: { referenceId: p.id } })
      }
      await tx.payment.deleteMany({ where: { invoiceId: id } })

      // 3. Delete stock movements referencing this invoice
      await tx.stockMovement.deleteMany({ where: { referenceId: id } })

      // 4. Delete invoice line items (cascade would handle this too, but explicit is safer)
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } })

      // 5. Finally delete the invoice itself
      await tx.invoice.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
