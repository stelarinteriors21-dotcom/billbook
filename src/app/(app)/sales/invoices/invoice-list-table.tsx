"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreVertical, Trash2, Eye, Edit } from "lucide-react"

interface InvoiceListTableProps {
  initialInvoices: any[]
}

export function InvoiceListTable({ initialInvoices }: InvoiceListTableProps) {
  const router = useRouter()
  const [invoices, setInvoices] = React.useState(initialInvoices)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setInvoices(initialInvoices)
  }, [initialInvoices])

  const handleDelete = async (e: React.MouseEvent, id: string, invoiceNumber: string) => {
    e.stopPropagation()
    e.preventDefault()

    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/sales/invoices/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok && data.success) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== id))
        router.refresh()
      } else {
        alert(data.error || "Failed to delete invoice")
      }
    } catch {
      alert("Error deleting invoice")
    } finally {
      setDeletingId(null)
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        No invoices found. Click "Create Sales Invoice" to get started.
      </div>
    )
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-gray-600 bg-gray-100 border-b border-gray-200">
        <tr>
          <th className="px-4 py-3 w-12 text-center">
            <input type="checkbox" className="rounded border-gray-300" />
          </th>
          <th className="px-4 py-3 font-semibold w-32 cursor-pointer hover:bg-gray-200 transition-colors">
            Date <span className="inline-block text-[10px] ml-1">↕</span>
          </th>
          <th className="px-4 py-3 font-semibold w-40">Invoice Number</th>
          <th className="px-4 py-3 font-semibold">Party Name</th>
          <th className="px-4 py-3 font-semibold w-24">Due In</th>
          <th className="px-4 py-3 font-semibold w-40 cursor-pointer hover:bg-gray-200 transition-colors">
            Amount <span className="inline-block text-[10px] ml-1">↕</span>
          </th>
          <th className="px-4 py-3 font-semibold w-24">Status</th>
          <th className="px-4 py-3 w-28 text-center font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice, i) => {
          const amtPaid = Number(invoice.amountPaid || 0)
          const total = Number(invoice.grandTotal || 0)
          const unpaid = Math.max(0, total - amtPaid)
          const isDeleting = deletingId === invoice.id

          return (
            <tr
              key={invoice.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                i % 2 === 1 ? "bg-[#f8f9fc]" : "bg-white"
              } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
            >
              <td className="px-4 py-3 text-center">
                <input type="checkbox" className="rounded border-gray-300 text-brand-primary" />
              </td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                {new Date(invoice.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900">{invoice.invoiceNumber}</td>
              <td className="px-4 py-3 font-medium text-gray-700">{invoice.party?.name}</td>
              <td className="px-4 py-3 text-gray-500">-</td>
              <td className="px-4 py-3">
                <div className="text-gray-900 font-semibold">
                  ₹ {total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                {unpaid > 0 && (
                  <div className="text-xs text-red-500 font-medium">
                    (₹ {unpaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })} unpaid)
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {invoice.status === "PAID" && (
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-600 rounded border border-emerald-200">
                    Paid
                  </span>
                )}
                {invoice.status === "UNPAID" && (
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-red-50 text-red-500 rounded border border-red-200">
                    Unpaid
                  </span>
                )}
                {invoice.status === "PARTIAL" && (
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-600 rounded border border-orange-200">
                    Partial
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Link
                    href={`/sales/invoices/${invoice.id}`}
                    className="p-1.5 hover:bg-purple-50 text-[#5c429e] rounded transition-colors"
                    title="View Tax Invoice"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/sales/invoices/${invoice.id}/edit`}
                    className="p-1.5 hover:bg-purple-50 text-[#5c429e] rounded transition-colors"
                    title="Edit Invoice"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, invoice.id, invoice.invoiceNumber)}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded transition-colors"
                    title="Delete Invoice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
