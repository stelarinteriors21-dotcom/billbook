import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { InvoiceForm } from "@/components/invoice/invoice-form"
import { redirect } from "next/navigation"

export default async function NewInvoicePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  // Pre-fetch tax rates and default godown for the frontend dropdowns
  const dbTaxRates = await db.taxRate.findMany({
    where: { businessId: session.user.businessId }
  })
  
  const taxRates = dbTaxRates.map(t => ({
    id: t.id,
    name: t.name,
    rate: Number(t.rate)
  }))
  
  const dbGodowns = await db.godown.findMany({
    where: { businessId: session.user.businessId }
  })
  
  const godowns = dbGodowns.map(g => ({
    id: g.id,
    name: g.name
  }))

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <InvoiceForm taxRates={taxRates as any} godowns={godowns as any} />
    </div>
  )
}
