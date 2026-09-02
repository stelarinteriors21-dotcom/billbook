import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { EstimateDetailView } from "./estimate-detail-view"

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const { id } = await params

  const quotation = await db.quotation.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      party: true,
      lines: {
        include: { item: true },
      },
    },
  })

  if (!quotation) {
    notFound()
  }

  const serializedQuotation = {
    id: quotation.id,
    number: quotation.number,
    date: quotation.date.toISOString(),
    expiryDate: quotation.expiryDate?.toISOString() || null,
    status: quotation.status,
    convertedToInvoiceId: quotation.convertedToInvoiceId || null,
    subTotal: Number(quotation.subTotal),
    totalDiscount: Number(quotation.totalDiscount),
    totalTax: Number(quotation.totalTax),
    grandTotal: Number(quotation.grandTotal),
    party: {
      id: quotation.party.id,
      name: quotation.party.name,
      mobileNumber: quotation.party.mobileNumber || "-",
      billingAddress: quotation.party.billingAddress || "-",
      gstin: quotation.party.gstin || "-",
    },
    lines: quotation.lines.map((l) => ({
      id: l.id,
      itemName: l.item.name,
      quantity: Number(l.quantity),
      rate: Number(l.rate),
      taxPercentage: Number(l.taxPercentage),
      total: Number(l.total),
    })),
  }

  return <EstimateDetailView quotation={serializedQuotation} />
}
