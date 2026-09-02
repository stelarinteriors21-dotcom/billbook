import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const quotation = await db.quotation.findFirst({
    where: { id, businessId: session.user.businessId },
    include: { party: true, lines: { include: { item: true } } },
  })
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: quotation })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const quotation = await db.quotation.update({
    where: { id },
    data: { status: body.status },
  })
  return NextResponse.json({ success: true, data: quotation })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.quotation.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
