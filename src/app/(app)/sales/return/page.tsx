import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SalesDocumentList } from "@/components/sales/sales-document-list"

export default async function SalesReturnPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) redirect("/login")

  const returns = await db.invoice.findMany({
    where: { businessId: session.user.businessId, type: "SALES_RETURN" },
    include: { party: true },
    orderBy: { date: "desc" },
  })

  const total = returns.reduce((a, r) => a + Number(r.grandTotal), 0)

  return (
    <SalesDocumentList
      title="Sales Return"
      createHref="/sales/return/new"
      createLabel="Create Sales Return"
      summaryCards={[
        { label: "Total Returns", value: total, color: "text-red-500" },
        { label: "This Month", value: 0, color: "text-gray-500" },
        { label: "Adjusted", value: 0, color: "text-emerald-600" },
        { label: "Pending", value: total, color: "text-orange-500" },
      ]}
      statusColors={{
        UNPAID: "bg-red-50 text-red-500",
        PAID: "bg-emerald-50 text-emerald-600",
        PARTIAL: "bg-orange-50 text-orange-600",
        CANCELLED: "bg-gray-100 text-gray-500",
      }}
      documents={returns.map(r => ({
        id: r.id,
        number: r.invoiceNumber,
        partyName: r.party.name,
        date: r.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        grandTotal: Number(r.grandTotal),
        amountPaid: Number(r.amountPaid),
        status: r.status,
        detailHref: `/sales/return/${r.id}`,
      }))}
      emptyMessage="No sales returns yet."
    />
  )
}
