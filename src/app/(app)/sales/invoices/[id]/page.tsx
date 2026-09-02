import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { InvoiceDetailsView } from "./invoice-details-view"
import { serializeData } from "@/lib/utils"

export default async function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const [rawInvoice, rawTaxRates] = await Promise.all([
    db.invoice.findFirst({
      where: { 
        id: resolvedParams.id,
        businessId: session.user.businessId 
      },
      include: { 
        party: true,
        lines: {
          include: { item: true }
        },
        business: true
      }
    }),
    db.taxRate.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { rate: "asc" },
    }),
  ])

  if (!rawInvoice) {
    return <div className="p-8 text-center text-gray-500">Invoice not found or access denied.</div>
  }

  // Deeply serialize all Prisma Decimals and Dates to plain values
  const invoice = serializeData(rawInvoice)
  const taxRates = serializeData(rawTaxRates)

  return <InvoiceDetailsView invoice={invoice} taxRates={taxRates} />
}
