import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PartyListView } from "./party-list-view"

export default async function PartiesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const rawParties = await db.party.findMany({
    where: { businessId: session.user.businessId },
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

  // Format and calculate balances
  let totalReceivable = 0
  let totalPayable = 0

  const parties = rawParties.map(p => {
    let balance = 0
    p.invoices.forEach(inv => {
      const g = Number(inv.grandTotal)
      const a = Number(inv.amountPaid)
      if (inv.type === "SALES") {
        balance += (g - a)
      } else if (inv.type === "PURCHASE") {
        balance -= (g - a)
      } else if (inv.type === "SALES_RETURN") {
        balance -= (g - a)
      }
    })

    if (balance > 0) {
      totalReceivable += balance
    } else if (balance < 0) {
      totalPayable += Math.abs(balance)
    }

    return {
      id: p.id,
      name: p.name,
      partyType: p.partyType,
      mobileNumber: p.mobileNumber || "-",
      email: p.email || "-",
      billingAddress: p.billingAddress || "-",
      shippingAddress: p.shippingAddress || "-",
      gstin: p.gstin || "-",
      balance,
      createdAt: p.createdAt.toISOString(),
    }
  })

  return (
    <PartyListView
      initialParties={parties}
      totalReceivable={totalReceivable}
      totalPayable={totalPayable}
    />
  )
}
