import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { PartyDetailView } from "./party-detail-view"

export default async function PartyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
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
      },
      payments: {
        orderBy: { date: "desc" },
      },
    },
  })

  if (!party) {
    notFound()
  }

  // Combine and format transactions into unified ledger timeline
  const transactions: any[] = []

  party.invoices.forEach((inv) => {
    transactions.push({
      id: inv.id,
      type: inv.type,
      documentType:
        inv.type === "SALES"
          ? "Sales Invoice"
          : inv.type === "PURCHASE"
          ? "Purchase Bill"
          : "Sales Return",
      number: inv.invoiceNumber,
      date: inv.date.toISOString(),
      total: Number(inv.grandTotal),
      amountPaid: Number(inv.amountPaid),
      balance: Number(inv.grandTotal) - Number(inv.amountPaid),
      status: inv.status,
      url: `/sales/invoices/${inv.id}`,
    })
  })

  party.payments.forEach((pay) => {
    transactions.push({
      id: pay.id,
      type: "PAYMENT",
      documentType: "Payment Received",
      number: pay.referenceNumber || `PAY-${pay.id.substring(0, 6)}`,
      date: pay.date.toISOString(),
      total: Number(pay.amount),
      amountPaid: Number(pay.amount),
      balance: 0,
      mode: pay.mode,
      notes: pay.notes,
      status: "COMPLETED",
      url: `/sales/payment-in`,
    })
  })

  transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let netBalance = 0
  let totalSales = 0
  let totalReceived = 0

  party.invoices.forEach((inv) => {
    const g = Number(inv.grandTotal)
    const p = Number(inv.amountPaid)
    if (inv.type === "SALES") {
      totalSales += g
      netBalance += g - p
    } else if (inv.type === "PURCHASE") {
      netBalance -= g - p
    }
  })

  party.payments.forEach((pay) => {
    totalReceived += Number(pay.amount)
  })

  const serializedParty = {
    id: party.id,
    name: party.name,
    partyType: party.partyType,
    mobileNumber: party.mobileNumber || "-",
    email: party.email || "-",
    billingAddress: party.billingAddress || "-",
    shippingAddress: party.shippingAddress || "-",
    gstin: party.gstin || "-",
    creditLimit: party.creditLimit ? Number(party.creditLimit) : null,
    netBalance,
    totalSales,
    totalReceived,
    createdAt: party.createdAt.toISOString(),
  }

  return (
    <PartyDetailView party={serializedParty} transactions={transactions} />
  )
}
