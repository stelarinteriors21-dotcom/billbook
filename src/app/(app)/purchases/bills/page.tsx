import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SalesDocumentList } from "@/components/sales/sales-document-list"

export default async function PurchaseBillsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const bills = await db.invoice.findMany({
    where: {
      businessId: session.user.businessId,
      type: "PURCHASE",
    },
    include: { party: true },
    orderBy: { date: "desc" },
    take: 50,
  })

  const totalPurchases = bills.reduce((acc, b) => acc + Number(b.grandTotal), 0)
  const totalPaid = bills.reduce((acc, b) => acc + Number(b.amountPaid), 0)
  const totalUnpaid = totalPurchases - totalPaid

  return (
    <SalesDocumentList
      title="Purchase Bills"
      createHref="/purchases/bills/new"
      createLabel="Create Purchase Bill"
      summaryCards={[
        { label: "Total Purchases", value: totalPurchases, color: "text-[#5c429e]" },
        { label: "Paid to Suppliers", value: totalPaid, color: "text-emerald-600" },
        { label: "Unpaid Balance", value: totalUnpaid, color: "text-red-500" },
        { label: "Total Invoices", value: bills.length, color: "text-gray-500" },
      ]}
      statusColors={{
        PAID: "bg-emerald-50 text-emerald-600",
        PARTIAL: "bg-orange-50 text-orange-600",
        UNPAID: "bg-red-50 text-red-500",
        CANCELLED: "bg-gray-100 text-gray-500",
      }}
      documents={bills.map(b => ({
        id: b.id,
        number: b.invoiceNumber,
        partyName: b.party.name,
        date: b.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        grandTotal: Number(b.grandTotal),
        amountPaid: Number(b.amountPaid),
        status: b.status,
        detailHref: `/purchases/bills/${b.id}`,
      }))}
      emptyMessage="No purchase bills recorded yet. Create your first purchase bill to track supplier payables."
    />
  )
}
