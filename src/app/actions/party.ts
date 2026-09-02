"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function searchParties(query: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) return []

  const parties = await db.party.findMany({
    where: {
      businessId: session.user.businessId,
      name: { contains: query, mode: "insensitive" }
    },
    take: 10,
    select: {
      id: true,
      name: true,
      mobileNumber: true,
      billingAddress: true,
      shippingAddress: true,
      gstin: true,
    }
  })

  return parties
}
