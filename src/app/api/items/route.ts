import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { ItemType, MovementType } from "@prisma/client"

const itemSchema = z.object({
  name: z.string().min(1),
  itemType: z.enum(["PRODUCT", "SERVICE"]),
  salesPrice: z.number().min(0),
  purchasePrice: z.number().min(0).optional(),
  hsnSac: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  taxRateId: z.string().optional(),
  openingStock: z.number().optional(),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const categoryId = searchParams.get("categoryId")

    const whereClause: any = {
      businessId: session.user.businessId,
    }

    if (type && (type === "PRODUCT" || type === "SERVICE")) {
      whereClause.itemType = type as ItemType
    }

    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { hsnSac: { contains: search, mode: "insensitive" } },
      ]
    }

    const items = await db.item.findMany({
      where: whereClause,
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

    const formattedItems = items.map(item => {
      let currentStock = 0
      item.stockMovements.forEach(m => {
        const qty = Number(m.quantity)
        if (m.type === "IN") currentStock += qty
        else if (m.type === "OUT") currentStock -= qty
        else if (m.type === "ADJUST") currentStock = qty
      })

      const stockValue = currentStock * Number(item.purchasePrice || item.salesPrice)

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
        categoryId: item.categoryId,
        unit: item.unit?.shortName || "PCS",
        unitId: item.unitId,
        taxRate: item.taxRate ? `${item.taxRate.name} (${item.taxRate.rate}%)` : "No Tax",
        taxRateId: item.taxRateId,
        currentStock: item.itemType === "PRODUCT" ? currentStock : null,
        stockValue: item.itemType === "PRODUCT" ? stockValue : null,
        createdAt: item.createdAt,
      }
    })

    return NextResponse.json({ success: true, items: formattedItems })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = itemSchema.parse(body)

    const item = await db.$transaction(async (tx) => {
      const createdItem = await tx.item.create({
        data: {
          businessId: session.user.businessId,
          createdById: session.user.id,
          name: parsed.name,
          itemType: parsed.itemType,
          salesPrice: parsed.salesPrice,
          purchasePrice: parsed.purchasePrice || 0,
          hsnSac: parsed.hsnSac || null,
          sku: parsed.sku || null,
          barcode: parsed.barcode || null,
          categoryId: parsed.categoryId || null,
          unitId: parsed.unitId || null,
          taxRateId: parsed.taxRateId || null,
        }
      })

      // If opening stock provided and item is a PRODUCT, record stock movement
      if (parsed.itemType === "PRODUCT" && parsed.openingStock && parsed.openingStock > 0) {
        let godown = await tx.godown.findFirst({
          where: { businessId: session.user.businessId, isDefault: true }
        })
        if (!godown) {
          godown = await tx.godown.findFirst({
            where: { businessId: session.user.businessId }
          })
        }

        if (godown) {
          await tx.stockMovement.create({
            data: {
              businessId: session.user.businessId,
              itemId: createdItem.id,
              godownId: godown.id,
              type: MovementType.IN,
              quantity: parsed.openingStock,
              referenceType: "OPENING_BALANCE",
              referenceId: createdItem.id,
              date: new Date(),
              createdById: session.user.id,
            }
          })
        }
      }

      return createdItem
    })

    return NextResponse.json({ success: true, item })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
