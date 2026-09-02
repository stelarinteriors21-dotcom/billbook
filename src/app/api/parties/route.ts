import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { PartyType } from "@prisma/client"

const partySchema = z.object({
  name: z.string().min(1),
  partyType: z.enum(["CUSTOMER", "SUPPLIER"]),
  mobileNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  gstin: z.string().optional(),
  creditLimit: z.number().optional(),
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

    const whereClause: any = {
      businessId: session.user.businessId,
    }

    if (type && (type === "CUSTOMER" || type === "SUPPLIER")) {
      whereClause.partyType = type as PartyType
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobileNumber: { contains: search, mode: "insensitive" } },
        { gstin: { contains: search, mode: "insensitive" } },
      ]
    }

    const parties = await db.party.findMany({
      where: whereClause,
      include: {
        invoices: {
          select: {
            grandTotal: true,
            amountPaid: true,
            type: true,
          }
        },
        payments: {
          select: {
            amount: true,
          }
        }
      },
      orderBy: { name: "asc" }
    })

    // Calculate balance for each party
    const formattedParties = parties.map(party => {
      let balance = 0
      party.invoices.forEach(inv => {
        const grandTotal = Number(inv.grandTotal)
        const amountPaid = Number(inv.amountPaid)
        if (inv.type === "SALES") {
          balance += (grandTotal - amountPaid) // Customer owes us
        } else if (inv.type === "PURCHASE") {
          balance -= (grandTotal - amountPaid) // We owe supplier
        } else if (inv.type === "SALES_RETURN") {
          balance -= (grandTotal - amountPaid)
        }
      })

      return {
        id: party.id,
        name: party.name,
        partyType: party.partyType,
        mobileNumber: party.mobileNumber,
        email: party.email,
        billingAddress: party.billingAddress,
        shippingAddress: party.shippingAddress,
        gstin: party.gstin,
        creditLimit: party.creditLimit ? Number(party.creditLimit) : null,
        balance,
        createdAt: party.createdAt,
      }
    })

    return NextResponse.json({ success: true, parties: formattedParties })
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
    const parsed = partySchema.parse(body)

    const party = await db.party.create({
      data: {
        businessId: session.user.businessId,
        createdById: session.user.id,
        ...parsed,
        email: parsed.email === "" ? null : parsed.email,
      }
    })

    return NextResponse.json({ success: true, party })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
