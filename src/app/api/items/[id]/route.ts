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
          }
        },
        invoiceLines: {
          orderBy: { invoice: { date: "desc" } },
          include: {
            invoice: {
              include: {
                party: true,
              }
            }
          }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    let currentStock = 0
    item.stockMovements.forEach(m => {
      const q = Number(m.quantity)
      if (m.type === "IN") currentStock += q
      else if (m.type === "OUT") currentStock -= q
      else if (m.type === "ADJUST") currentStock = q
    })

    return NextResponse.json({
      success: true,
      item: {
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
        stockMovements: item.stockMovements.map(m => ({
          id: m.id,
          type: m.type,
          quantity: Number(m.quantity),
          referenceType: m.referenceType,
          date: m.date,
          godown: m.godown.name,
        })),
        salesHistory: item.invoiceLines.map(l => ({
          id: l.id,
          invoiceNumber: l.invoice.invoiceNumber,
          partyName: l.invoice.party.name,
          date: l.invoice.date,
          quantity: Number(l.quantity),
          rate: Number(l.rate),
          total: Number(l.total),
        }))
      }
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

    const updated = await db.item.update({
      where: {
        id,
        businessId: session.user.businessId,
      },
      data: {
        name: body.name,
        salesPrice: body.salesPrice,
        purchasePrice: body.purchasePrice || 0,
        hsnSac: body.hsnSac || null,
        sku: body.sku || null,
        barcode: body.barcode || null,
        categoryId: body.categoryId || null,
        unitId: body.unitId || null,
        taxRateId: body.taxRateId || null,
      }
    })

    return NextResponse.json({ success: true, item: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
