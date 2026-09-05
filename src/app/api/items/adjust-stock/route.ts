import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { MovementType } from "@prisma/client"
import { z } from "zod"

const adjustSchema = z.object({
  itemId: z.string().min(1),
  adjustmentType: z.enum(["ADD", "REDUCE", "SET"]),
  quantity: z.number().min(0.0001),
  reason: z.string().optional(),
  godownId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = adjustSchema.parse(body)

    let godownId = parsed.godownId
    if (!godownId) {
      let defaultGodown = await db.godown.findFirst({
        where: { businessId: session.user.businessId, isDefault: true }
      })
      if (!defaultGodown) {
        defaultGodown = await db.godown.findFirst({
          where: { businessId: session.user.businessId }
        })
      }
      if (!defaultGodown) {
        defaultGodown = await db.godown.create({
          data: {
            businessId: session.user.businessId,
            name: "Main Godown",
            isDefault: true
          }
        })
      }
      godownId = defaultGodown.id
    }

    let movementType: MovementType = MovementType.IN
    if (parsed.adjustmentType === "REDUCE") {
      movementType = MovementType.OUT
    } else if (parsed.adjustmentType === "SET") {
      movementType = MovementType.ADJUST
    }

    const movement = await db.stockMovement.create({
      data: {
        businessId: session.user.businessId,
        itemId: parsed.itemId,
        godownId: godownId,
        type: movementType,
        quantity: parsed.quantity,
        referenceType: parsed.reason || "MANUAL_ADJUSTMENT",
        referenceId: "MANUAL",
        date: new Date(),
        createdById: session.user.id,
      }
    })

    return NextResponse.json({ success: true, movement })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
