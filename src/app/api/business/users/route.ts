import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, role, password } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const roleName = role === "ADMIN" ? "ADMIN" : "STAFF"

    // Ensure role exists in DB
    let dbRole = await db.role.findUnique({ where: { name: roleName } })
    if (!dbRole) {
      dbRole = await db.role.create({
        data: {
          name: roleName,
          permissions: roleName === "ADMIN" ? ["*"] : ["VIEW_SALES", "CREATE_INVOICE"],
        },
      })
    }

    const existing = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password || "password123", 10)

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        businesses: {
          create: {
            businessId: session.user.businessId,
            roleId: dbRole.id,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: roleName },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
