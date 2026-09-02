import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const business = await db.business.findUnique({
      where: { id: session.user.businessId },
      include: {
        users: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            role: true,
          }
        },
        godowns: true,
      }
    })

    return NextResponse.json({ success: true, business })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const updated = await db.business.update({
      where: { id: session.user.businessId },
      data: {
        name: body.name,
        gstin: body.gstin || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
      }
    })

    return NextResponse.json({ success: true, business: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
