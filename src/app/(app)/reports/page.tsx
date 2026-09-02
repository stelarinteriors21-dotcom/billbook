import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReportsView } from "./reports-view"

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  // 1. Fetch Invoices for Sales & Tax Reports
  const invoices = await db.invoice.findMany({
    where: { businessId: session.user.businessId },
    include: {
      party: true,
      lines: {
        include: { item: true },
      },
    },
    orderBy: { date: "desc" },
  })

  // 2. Fetch Payments for Daybook & Cashflow
  const payments = await db.payment.findMany({
    where: { businessId: session.user.businessId },
    include: { party: true },
    orderBy: { date: "desc" },
  })

  // 3. Fetch Items with current stock for Stock Summary
  const items = await db.item.findMany({
    where: { businessId: session.user.businessId },
    include: {
      category: true,
      unit: true,
      stockMovements: {
        select: { type: true, quantity: true },
      },
    },
  })

  // Calculations for P&L and GST
  const salesInvoices = invoices.filter((i) => i.type === "SALES")
  const purchaseBills = invoices.filter((i) => i.type === "PURCHASE")

  const totalSalesRevenue = salesInvoices.reduce((a, s) => a + Number(s.subTotal), 0)
  const totalPurchaseCost = purchaseBills.reduce((a, p) => a + Number(p.subTotal), 0)
  const grossProfit = totalSalesRevenue - totalPurchaseCost

  const totalGstOutput = salesInvoices.reduce((a, s) => a + Number(s.totalTax), 0)
  const totalGstInput = purchaseBills.reduce((a, p) => a + Number(p.totalTax), 0)
  const netGstPayable = Math.max(0, totalGstOutput - totalGstInput)

  const formattedItems = items.map((i) => {
    let stock = 0
    i.stockMovements.forEach((m) => {
      const q = Number(m.quantity)
      if (m.type === "IN") stock += q
      else if (m.type === "OUT") stock -= q
      else if (m.type === "ADJUST") stock = q
    })
    return {
      id: i.id,
      name: i.name,
      category: i.category?.name || "Uncategorized",
      unit: i.unit?.shortName || "PCS",
      salesPrice: Number(i.salesPrice),
      purchasePrice: Number(i.purchasePrice),
      currentStock: stock,
      stockValue: stock * Number(i.purchasePrice || i.salesPrice),
    }
  })

  const formattedInvoices = invoices.map((inv) => ({
    id: inv.id,
    type: inv.type,
    number: inv.invoiceNumber,
    date: inv.date.toISOString(),
    partyName: inv.party.name,
    partyGstin: inv.party.gstin || "Unregistered",
    taxableAmount: Number(inv.taxableAmount),
    totalTax: Number(inv.totalTax),
    grandTotal: Number(inv.grandTotal),
    status: inv.status,
  }))

  const formattedPayments = payments.map((pay) => ({
    id: pay.id,
    date: pay.date.toISOString(),
    partyName: pay.party.name,
    mode: pay.mode,
    amount: Number(pay.amount),
    reference: pay.referenceNumber || "-",
  }))

  return (
    <ReportsView
      totalSalesRevenue={totalSalesRevenue}
      totalPurchaseCost={totalPurchaseCost}
      grossProfit={grossProfit}
      totalGstOutput={totalGstOutput}
      totalGstInput={totalGstInput}
      netGstPayable={netGstPayable}
      invoices={formattedInvoices}
      payments={formattedPayments}
      items={formattedItems}
    />
  )
}
