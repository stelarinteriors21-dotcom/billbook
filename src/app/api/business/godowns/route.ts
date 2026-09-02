import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Godown name is required" }, { status: 400 })
    }

    const godown = await db.godown.create({
      data: {
        businessId: session.user.businessId,
        name: name.trim(),
        isDefault: false,
      },
    })

    return NextResponse.json({ success: true, godown })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
