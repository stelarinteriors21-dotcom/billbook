import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { ItemDetailView } from "./item-detail-view"

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const { id } = await params

  const item = await db.item.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      category: true,
      unit: true,
      taxRate: true,
      stockMovements: {
        orderBy: { date: "desc" },
        include: {
          godown: true,
        },
      },
      invoiceLines: {
        orderBy: { invoice: { date: "desc" } },
        include: {
          invoice: {
            include: {
              party: true,
            },
          },
        },
      },
    },
  })

  if (!item) {
    notFound()
  }

  let currentStock = 0
  item.stockMovements.forEach((m) => {
    const q = Number(m.quantity)
    if (m.type === "IN") currentStock += q
    else if (m.type === "OUT") currentStock -= q
    else if (m.type === "ADJUST") currentStock = q
  })

  const serializedItem = {
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    sku: item.sku || "-",
    barcode: item.barcode || "-",
    hsnSac: item.hsnSac || "-",
    salesPrice: Number(item.salesPrice),
    purchasePrice: Number(item.purchasePrice),
    category: item.category?.name || "Uncategorized",
    categoryId: item.categoryId || "",
    unit: item.unit?.shortName || "PCS",
    unitId: item.unitId || "",
    taxRate: item.taxRate ? `${item.taxRate.name} (${Number(item.taxRate.rate)}%)` : "No Tax",
    taxRateId: item.taxRateId || "",
    currentStock: item.itemType === "PRODUCT" ? currentStock : null,
    stockValue: item.itemType === "PRODUCT" ? currentStock * Number(item.purchasePrice || item.salesPrice) : null,
    createdAt: item.createdAt.toISOString(),
  }

  const stockMovements = item.stockMovements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: Number(m.quantity),
    referenceType: m.referenceType,
    date: m.date.toISOString(),
    godown: m.godown.name,
  }))

  const salesHistory = item.invoiceLines.map((l) => ({
    id: l.id,
    invoiceNumber: l.invoice.invoiceNumber,
    partyName: l.invoice.party.name,
    date: l.invoice.date.toISOString(),
    quantity: Number(l.quantity),
    rate: Number(l.rate),
    total: Number(l.total),
  }))

  return (
    <ItemDetailView
      item={serializedItem}
      stockMovements={stockMovements}
      salesHistory={salesHistory}
    />
  )
}
