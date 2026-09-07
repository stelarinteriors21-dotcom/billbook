import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

    const party = await db.party.findFirst({
      where: {
        id,
        businessId: session.user.businessId,
      },
      include: {
        invoices: {
          orderBy: { date: "desc" },
          include: {
            lines: {
              include: {
                item: true,
              }
            }
          }
        },
        payments: {
          orderBy: { date: "desc" },
        }
      }
    })

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 })
    }

    // Build unified chronological ledger timeline
    const transactions: any[] = []

    party.invoices.forEach(inv => {
      transactions.push({
        id: inv.id,
        type: inv.type,
        documentType: inv.type === "SALES" ? "Sales Invoice" : inv.type === "PURCHASE" ? "Purchase Bill" : "Sales Return",
        number: inv.invoiceNumber,
        date: inv.date,
        total: Number(inv.grandTotal),
        amountPaid: Number(inv.amountPaid),
        balance: Number(inv.grandTotal) - Number(inv.amountPaid),
        status: inv.status,
        url: `/sales/invoices/${inv.id}`,
      })
    })

    party.payments.forEach(pay => {
      transactions.push({
        id: pay.id,
        type: "PAYMENT",
        documentType: "Payment Received",
        number: pay.referenceNumber || `PAY-${pay.id.substring(0, 6)}`,
        date: pay.date,
        total: Number(pay.amount),
        amountPaid: Number(pay.amount),
        balance: 0,
        mode: pay.mode,
        notes: pay.notes,
        status: "COMPLETED",
        url: `/sales/payment-in`,
      })
    })

    // Sort chronologically desc
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate total net balance
    let netBalance = 0
    let totalSales = 0
    let totalReceived = 0

    party.invoices.forEach(inv => {
      const g = Number(inv.grandTotal)
      const p = Number(inv.amountPaid)
      if (inv.type === "SALES") {
        totalSales += g
        netBalance += (g - p)
      } else if (inv.type === "PURCHASE") {
        netBalance -= (g - p)
      }
    })

    party.payments.forEach(pay => {
      totalReceived += Number(pay.amount)
    })

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        name: party.name,
        partyType: party.partyType,
        mobileNumber: party.mobileNumber,
        email: party.email,
        billingAddress: party.billingAddress,
        shippingAddress: party.shippingAddress,
        gstin: party.gstin,
        panNumber: party.panNumber,
        creditLimit: party.creditLimit ? Number(party.creditLimit) : null,
        netBalance,
        totalSales,
        totalReceived,
        createdAt: party.createdAt,
      },
      transactions,
    })
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

    const updated = await db.party.update({
      where: {
        id,
        businessId: session.user.businessId,
      },
      data: {
        name: body.name,
        partyType: body.partyType,
        mobileNumber: body.mobileNumber,
        email: body.email === "" ? null : body.email,
        billingAddress: body.billingAddress,
        shippingAddress: body.shippingAddress,
        gstin: body.gstin?.trim() || null,
        panNumber: body.panNumber?.trim() || null,
        creditLimit: body.creditLimit ? Number(body.creditLimit) : null,
      }
    })

    return NextResponse.json({ success: true, party: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
