import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SalesDocumentList } from "@/components/sales/sales-document-list"

export default async function CreditNotesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) redirect("/login")

  const notes = await db.invoice.findMany({
    where: { businessId: session.user.businessId, type: "CREDIT_NOTE" },
    include: { party: true },
    orderBy: { date: "desc" },
  })

  const total = notes.reduce((a, n) => a + Number(n.grandTotal), 0)

  return (
    <SalesDocumentList
      title="Credit Note"
      createHref="/sales/credit-notes/new"
      createLabel="Create Credit Note"
      summaryCards={[
        { label: "Total Credit Notes", value: total, color: "text-[#5c429e]" },
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
      documents={notes.map(n => ({
        id: n.id,
        number: n.invoiceNumber,
        partyName: n.party.name,
        date: n.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        grandTotal: Number(n.grandTotal),
        status: n.status,
        detailHref: `/sales/credit-notes/${n.id}`,
      }))}
      emptyMessage="No credit notes yet."
    />
  )
}
