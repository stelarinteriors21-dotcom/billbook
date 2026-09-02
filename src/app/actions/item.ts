"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function searchItems(query: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return []

  const items = await db.item.findMany({
    where: {
      businessId: session.user.businessId,
      name: { contains: query, mode: "insensitive" }
    },
    take: 10,
    include: {
      taxRate: true,
    }
  })

  return items.map((i) => ({
    id: i.id,
    name: i.name,
    itemType: i.itemType,
    sku: i.sku || null,
    barcode: i.barcode || null,
    hsnSac: i.hsnSac || null,
    salesPrice: Number(i.salesPrice),
    purchasePrice: Number(i.purchasePrice),
    categoryId: i.categoryId,
    unitId: i.unitId,
    taxRateId: i.taxRateId,
    taxRate: i.taxRate
      ? {
          id: i.taxRate.id,
          name: i.taxRate.name,
          rate: Number(i.taxRate.rate),
        }
      : null,
  }))
}
