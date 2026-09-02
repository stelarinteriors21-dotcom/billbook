import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PurchaseBillForm } from "@/app/(app)/purchases/bills/new/purchase-bill-form"

export default async function NewPurchaseReturnPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const dbTaxRates = await db.taxRate.findMany({
    where: { businessId: session.user.businessId },
  })
  const taxRates = dbTaxRates.map((t) => ({
    id: t.id,
    name: t.name,
    rate: Number(t.rate),
  }))

  const dbGodowns = await db.godown.findMany({
    where: { businessId: session.user.businessId },
  })
  const godowns = dbGodowns.map((g) => ({
    id: g.id,
    name: g.name,
  }))

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <PurchaseBillForm taxRates={taxRates} godowns={godowns} />
    </div>
  )
}
