import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { ChallanDetailView } from "./challan-detail-view"

export default async function DeliveryChallanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const { id } = await params

  const challan = await db.deliveryChallan.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      party: true,
      lines: {
        include: { item: true },
      },
    },
  })

  if (!challan) {
    notFound()
  }

  const serializedChallan = {
    id: challan.id,
    number: challan.number,
    date: challan.date.toISOString(),
    vehicleNumber: challan.vehicleNumber || "-",
    deliveryAddress: challan.deliveryAddress || "-",
    notes: challan.notes || "-",
    status: challan.status,
    convertedToInvoiceId: challan.convertedToInvoiceId || null,
    party: {
      id: challan.party.id,
      name: challan.party.name,
      mobileNumber: challan.party.mobileNumber || "-",
      billingAddress: challan.party.billingAddress || "-",
      gstin: challan.party.gstin || "-",
    },
    lines: challan.lines.map((l) => ({
      id: l.id,
      itemName: l.item.name,
      quantity: Number(l.quantity),
      rate: Number(l.rate),
      total: Number(l.total),
    })),
  }

  return <ChallanDetailView challan={serializedChallan} />
}
