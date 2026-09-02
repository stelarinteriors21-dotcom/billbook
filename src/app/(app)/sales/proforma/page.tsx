import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SalesDocumentList } from "@/components/sales/sales-document-list"

export default async function ProformaPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) redirect("/login")

  const proformas = await db.invoice.findMany({
    where: { businessId: session.user.businessId, type: "PROFORMA" },
    include: { party: true },
    orderBy: { date: "desc" },
  })

  const total = proformas.reduce((a, p) => a + Number(p.grandTotal), 0)

  return (
    <SalesDocumentList
      title="Proforma Invoice"
      createHref="/sales/proforma/new"
      createLabel="Create Proforma"
      summaryCards={[
        { label: "Total Proformas", value: total, color: "text-[#5c429e]" },
        { label: "This Month", value: 0, color: "text-gray-500" },
        { label: "Converted", value: 0, color: "text-emerald-600" },
        { label: "Pending", value: total, color: "text-orange-500" },
      ]}
      statusColors={{
        UNPAID: "bg-orange-50 text-orange-600",
        PAID: "bg-emerald-50 text-emerald-600",
        PARTIAL: "bg-blue-50 text-blue-600",
        CANCELLED: "bg-gray-100 text-gray-500",
      }}
      documents={proformas.map(p => ({
        id: p.id,
        number: p.invoiceNumber,
        partyName: p.party.name,
        date: p.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        grandTotal: Number(p.grandTotal),
        amountPaid: Number(p.amountPaid),
        status: p.status,
        detailHref: `/sales/proforma/${p.id}`,
      }))}
      emptyMessage="No proforma invoices yet."
    />
  )
}
