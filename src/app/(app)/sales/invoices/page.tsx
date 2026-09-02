import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SalesInvoicesView } from "./sales-invoices-view"
import { serializeData } from "@/lib/utils"

export default async function InvoiceHistoryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const rawInvoices = await db.invoice.findMany({
    where: { businessId: session.user.businessId, type: "SALES" },
    include: { party: true },
    orderBy: { date: "desc" },
    take: 100,
  })

  const invoices = serializeData(rawInvoices)

  return <SalesInvoicesView initialInvoices={invoices} />
}
