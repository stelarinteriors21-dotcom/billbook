import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SalesDocumentList } from "@/components/sales/sales-document-list"

export default async function EstimatesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) redirect("/login")

  const quotations = await db.quotation.findMany({
    where: { businessId: session.user.businessId },
    include: { party: true },
    orderBy: { date: "desc" },
    take: 50,
  })

  const totalValue = quotations.reduce((a, q) => a + Number(q.grandTotal), 0)
  const accepted = quotations.filter(q => q.status === "ACCEPTED").reduce((a, q) => a + Number(q.grandTotal), 0)
  const pending = quotations.filter(q => q.status === "DRAFT" || q.status === "SENT").reduce((a, q) => a + Number(q.grandTotal), 0)
  const expired = quotations.filter(q => q.status === "EXPIRED").reduce((a, q) => a + Number(q.grandTotal), 0)

  return (
    <SalesDocumentList
      title="Quotation / Estimate"
      createHref="/sales/estimates/new"
      createLabel="Create Estimate"
      summaryCards={[
        { label: "Total Value", value: totalValue, color: "text-[#5c429e]" },
        { label: "Accepted", value: accepted, color: "text-emerald-600" },
        { label: "Pending", value: pending, color: "text-orange-500" },
        { label: "Expired", value: expired, color: "text-gray-500" },
      ]}
      statusColors={{
        DRAFT: "bg-gray-100 text-gray-600",
        SENT: "bg-blue-50 text-blue-600",
        ACCEPTED: "bg-emerald-50 text-emerald-600",
        REJECTED: "bg-red-50 text-red-500",
        EXPIRED: "bg-gray-100 text-gray-500",
      }}
      documents={quotations.map(q => ({
        id: q.id,
        number: q.number,
        partyName: q.party.name,
        date: q.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        grandTotal: Number(q.grandTotal),
        status: q.status,
        detailHref: `/sales/estimates/${q.id}`,
      }))}
      emptyMessage="No estimates yet. Create your first quotation."
    />
  )
}
