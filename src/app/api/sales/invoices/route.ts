import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/billing-engine"
import { InvoiceType, MovementType } from "@prisma/client"
import { z } from "zod"

const invoiceSchema = z.object({
  partyId: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string().optional(),
  discountAmount: z.number().default(0),
  roundOff: z.number().default(0),
  amountPaid: z.number().default(0),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  bankDetails: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  lines: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().min(0.01),
      rate: z.number().min(0),
      discountAmount: z.number().default(0),
      taxRateId: z.string(),
      godownId: z.string(),
    })
  ).min(1),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businessId = session.user.businessId
    const userId = session.user.id
    
    const body = await req.json()
    const parsed = invoiceSchema.parse(body)

    // 1. Fetch tax rates for the items to validate
    const taxRateIds = parsed.lines.map(l => l.taxRateId)
    const taxRates = await db.taxRate.findMany({
      where: { id: { in: taxRateIds }, businessId }
    })
    
    const taxRateMap = new Map(taxRates.map(t => [t.id, t.rate]))

    // 2. Authoritative Recalculation
    const calculationInput = {
      discountAmount: parsed.discountAmount,
      roundOff: parsed.roundOff,
      lines: parsed.lines.map(line => ({
        quantity: line.quantity,
        rate: line.rate,
        discountAmount: line.discountAmount,
        taxRatePercent: Number(taxRateMap.get(line.taxRateId) || 0),
      }))
    }

    const totals = calculateInvoiceTotals(calculationInput)

    // 3. (Skipped account lookup since LedgerEntry uses accountName directly)

    // 4. Generate Invoice Number (Simple sequential generation for MVP)
    const count = await db.invoice.count({ where: { businessId, type: InvoiceType.SALES } })
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

    // 5. Transaction: Atomic Save
    const result = await db.$transaction(async (tx) => {
      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          businessId,
          type: InvoiceType.SALES,
          invoiceNumber,
          invoiceSequence: count + 1,
          partyId: parsed.partyId,
          date: new Date(parsed.invoiceDate),
          dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
          billingAddress: parsed.billingAddress,
          shippingAddress: parsed.shippingAddress,
          notes: parsed.notes,
          paymentTerms: parsed.paymentTerms,
          bankDetails: parsed.bankDetails,
          subTotal: totals.subTotal,
          discountValue: parsed.discountAmount,
          totalDiscount: parsed.discountAmount,
          totalTax: totals.totalTax,
          roundOff: parsed.roundOff,
          grandTotal: totals.grandTotal,
          amountPaid: parsed.amountPaid,
          
          createdById: userId,
          
          lines: {
            create: parsed.lines.map((line, idx) => {
              const lineCalc = calculateLineTotal(calculationInput.lines[idx])
              return {
                itemId: line.itemId,
                quantity: line.quantity,
                rate: line.rate,
                discountAmount: line.discountAmount,
                taxRateId: line.taxRateId || undefined,
                taxAmount: lineCalc.taxAmount,
                total: lineCalc.total
              }
            })
          }
        },
        include: { lines: true }
      })

      // Double-entry Ledger: Sales Invoice
      // Debit: AR, Credit: Sales Revenue
      await tx.ledgerEntry.createMany({
        data: [
          {
            businessId,
            accountName: 'Accounts Receivable',
            partyId: parsed.partyId,
            debit: totals.grandTotal,
            credit: 0,
            date: invoice.date,
            referenceType: 'INVOICE',
            referenceId: invoice.id,
            createdById: userId
          },
          {
            businessId,
            accountName: 'Sales Revenue',
            debit: 0,
            credit: totals.grandTotal,
            date: invoice.date,
            referenceType: 'INVOICE',
            referenceId: invoice.id,
            createdById: userId
          }
        ]
      })

      // Payment (if any)
      if (parsed.amountPaid > 0) {
        const payment = await tx.payment.create({
          data: {
            businessId,
            partyId: parsed.partyId,
            invoiceId: invoice.id,
            amount: parsed.amountPaid,
            date: new Date(),
            mode: 'CASH', // Default for MVP
            referenceNumber: `PAY-${invoiceNumber}`,
            createdById: userId,
          }
        })

        // Ledger: Payment Received
        // Debit: Cash, Credit: AR
        await tx.ledgerEntry.createMany({
          data: [
            {
              businessId,
              accountName: 'Cash',
              debit: parsed.amountPaid,
              credit: 0,
              date: payment.date,
              referenceType: 'PAYMENT',
              referenceId: payment.id,
              createdById: userId
            },
            {
              businessId,
              accountName: 'Accounts Receivable',
              partyId: parsed.partyId,
              debit: 0,
              credit: parsed.amountPaid,
              date: payment.date,
              referenceType: 'PAYMENT',
              referenceId: payment.id,
              createdById: userId
            }
          ]
        })
      }

      // Fetch items to know if they are PRODUCT or SERVICE
      const itemIds = parsed.lines.map(l => l.itemId)
      const items = await tx.item.findMany({
        where: { id: { in: itemIds }, businessId }
      })
      const itemTypeMap = new Map(items.map(i => [i.id, i.itemType]))

      // Stock Movement (Inventory FIFO / Reduction)
      for (let i = 0; i < invoice.lines.length; i++) {
        const dbLine = invoice.lines[i];
        const parsedLine = parsed.lines[i];
        
        // Only track stock for PRODUCTS
        if (itemTypeMap.get(dbLine.itemId) === "PRODUCT") {
          let targetGodownId = parsedLine.godownId;
          
          // Auto-create/fallback godown if empty
          if (!targetGodownId) {
            let defaultGodown = await tx.godown.findFirst({
              where: { businessId, isDefault: true }
            })
            if (!defaultGodown) {
               defaultGodown = await tx.godown.findFirst({
                 where: { businessId }
               })
            }
            if (!defaultGodown) {
               defaultGodown = await tx.godown.create({
                 data: {
                   businessId,
                   name: "Main Godown",
                   isDefault: true
                 }
               })
            }
            targetGodownId = defaultGodown.id;
          }

          await tx.stockMovement.create({
            data: {
              businessId,
              itemId: dbLine.itemId,
              godownId: targetGodownId,
              type: MovementType.OUT,
              quantity: parsedLine.quantity,
              date: invoice.date,
              referenceType: 'SALES_INVOICE',
              referenceId: invoice.id,
              createdById: userId
            }
          })
        }
      }

      return invoice
    })

    return NextResponse.json({ success: true, invoice: result })

  } catch (error: any) {
    console.error("Invoice save error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save invoice" },
      { status: 400 }
    )
  }
}
