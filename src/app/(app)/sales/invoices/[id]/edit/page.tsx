import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { InvoiceForm } from "@/components/invoice/invoice-form"
import { serializeData } from "@/lib/utils"

export default async function EditSalesInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  const { id } = await params
  const businessId = session.user.businessId

  const [rawInvoice, rawTaxRates, rawGodowns] = await Promise.all([
    db.invoice.findFirst({
      where: { id, businessId },
      include: {
        party: true,
        lines: {
          include: { item: true },
        },
      },
    }),
    db.taxRate.findMany({
      where: { businessId },
      orderBy: { rate: "asc" },
    }),
    db.godown.findMany({
      where: { businessId },
    }),
  ])

  if (!rawInvoice) {
    notFound()
  }

  const invoice = serializeData(rawInvoice)
  const taxRates = serializeData(rawTaxRates)
  const godowns = serializeData(rawGodowns)

  return (
    <div className="h-full w-full">
      <InvoiceForm
        taxRates={taxRates}
        godowns={godowns}
        initialData={invoice}
        isEdit={true}
        invoiceId={id}
      />
    </div>
  )
}
