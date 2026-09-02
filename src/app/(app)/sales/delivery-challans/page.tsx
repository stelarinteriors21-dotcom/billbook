import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SalesDocumentList } from "@/components/sales/sales-document-list"

export default async function DeliveryChallansPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) redirect("/login")

  const challans = await db.deliveryChallan.findMany({
    where: { businessId: session.user.businessId },
    include: { party: true },
    orderBy: { date: "desc" },
  })

  const open = challans.filter(c => c.status === "OPEN").length
  const converted = challans.filter(c => c.status === "CONVERTED").length

  return (
    <SalesDocumentList
      title="Delivery Challan"
      createHref="/sales/delivery-challans/new"
      createLabel="Create Challan"
      summaryCards={[
        { label: "Total Challans", value: challans.length, color: "text-[#5c429e]" },
        { label: "Open", value: open, color: "text-orange-500" },
        { label: "Converted", value: converted, color: "text-emerald-600" },
        { label: "Cancelled", value: challans.filter(c => c.status === "CANCELLED").length, color: "text-gray-500" },
      ]}
      statusColors={{
        OPEN: "bg-orange-50 text-orange-600",
        CONVERTED: "bg-emerald-50 text-emerald-600",
        CANCELLED: "bg-gray-100 text-gray-500",
      }}
      documents={challans.map(c => ({
        id: c.id,
        number: c.number,
        partyName: c.party.name,
        date: c.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        grandTotal: 0,
        status: c.status,
        detailHref: `/sales/delivery-challans/${c.id}`,
      }))}
      emptyMessage="No delivery challans yet."
    />
  )
}
