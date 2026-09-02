import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ItemListView } from "./item-list-view"

export default async function ItemsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const rawItems = await db.item.findMany({
    where: { businessId: session.user.businessId },
    include: {
      category: true,
      unit: true,
      taxRate: true,
      stockMovements: {
        select: {
          type: true,
          quantity: true,
        }
      }
    },
    orderBy: { name: "asc" }
  })

  const taxRates = await db.taxRate.findMany({
    where: { businessId: session.user.businessId },
    select: { id: true, name: true, rate: true }
  })

  const categories = await db.category.findMany({
    where: { businessId: session.user.businessId },
    select: { id: true, name: true }
  })

  const units = await db.unit.findMany({
    where: { businessId: session.user.businessId },
    select: { id: true, name: true, shortName: true }
  })

  let totalStockValue = 0
  let lowStockCount = 0

  const items = rawItems.map(item => {
    let currentStock = 0
    item.stockMovements.forEach(m => {
      const q = Number(m.quantity)
      if (m.type === "IN") currentStock += q
      else if (m.type === "OUT") currentStock -= q
      else if (m.type === "ADJUST") currentStock = q
    })

    const stockValue = currentStock * Number(item.purchasePrice || item.salesPrice)
    if (item.itemType === "PRODUCT") {
      totalStockValue += stockValue
      if (currentStock <= 10) {
        lowStockCount++
      }
    }

    return {
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
      stockValue: item.itemType === "PRODUCT" ? stockValue : null,
      createdAt: item.createdAt.toISOString(),
    }
  })

  return (
    <ItemListView
      initialItems={items}
      totalStockValue={totalStockValue}
      lowStockCount={lowStockCount}
      taxRates={taxRates.map(t => ({ id: t.id, name: t.name, rate: Number(t.rate) }))}
      categories={categories}
      units={units}
    />
  )
}
