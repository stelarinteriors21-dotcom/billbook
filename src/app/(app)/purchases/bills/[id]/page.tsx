import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { BillDetailView } from "./bill-detail-view"

export default async function PurchaseBillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const { id } = await params

  const bill = await db.invoice.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
      type: "PURCHASE",
    },
    include: {
      party: true,
      lines: {
        include: { item: true },
      },
    },
  })

  if (!bill) {
    notFound()
  }

  const serializedBill = {
    id: bill.id,
    number: bill.invoiceNumber,
    date: bill.date.toISOString(),
    status: bill.status,
    subTotal: Number(bill.subTotal),
    totalTax: Number(bill.totalTax),
    grandTotal: Number(bill.grandTotal),
    amountPaid: Number(bill.amountPaid),
    balanceDue: Number(bill.grandTotal) - Number(bill.amountPaid),
    party: {
      id: bill.party.id,
      name: bill.party.name,
      mobileNumber: bill.party.mobileNumber || "-",
      billingAddress: bill.party.billingAddress || "-",
      gstin: bill.party.gstin || "-",
    },
    lines: bill.lines.map((l) => ({
      id: l.id,
      itemName: l.item.name,
      quantity: Number(l.quantity),
      rate: Number(l.rate),
      taxPercentage: Number(l.taxPercentage),
      total: Number(l.total),
    })),
  }

  return <BillDetailView bill={serializedBill} />
}
