"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Printer, Edit, Check, Save, Trash2, X } from "lucide-react"
import { EditPartyModal } from "@/components/party/edit-party-modal"
import { PrintableInvoiceTemplate } from "@/components/invoice/printable-invoice-template"
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/billing-engine"

interface InvoiceDetailsViewProps {
  invoice: any
  taxRates?: any[]
}

function formatINR(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function InvoiceDetailsView({ invoice: initialInvoice, taxRates = [] }: InvoiceDetailsViewProps) {
  const router = useRouter()
  const [invoice, setInvoice] = React.useState(initialInvoice)
  const [isEditPartyModalOpen, setIsEditPartyModalOpen] = React.useState(false)
  const [isEditingItems, setIsEditingItems] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = React.useState("")

  // Editable lines state
  const [lines, setLines] = React.useState<any[]>(initialInvoice.lines || [])

  // Sync lines if initialInvoice changes
  React.useEffect(() => {
    setInvoice(initialInvoice)
    setLines(initialInvoice.lines || [])
  }, [initialInvoice])

  // Recalculate totals for active lines
  const computedTotals = React.useMemo(() => {
    const rawTotals = calculateInvoiceTotals({
      lines: lines.map((l: any) => ({
        quantity: Number(l.quantity),
        rate: Number(l.rate),
        discountAmount: Number(l.discountAmount || 0),
        taxRatePercent: Number(l.taxPercentage || 0),
      })),
      discountAmount: Number(invoice.totalDiscount || 0),
      roundOff: Number(invoice.roundOff || 0),
    })
    return rawTotals
  }, [lines, invoice.totalDiscount, invoice.roundOff])

  const amtPaid = Number(invoice.amountPaid || 0)
  const grandTotal = isEditingItems ? computedTotals.grandTotal : Number(invoice.grandTotal || 0)
  const subTotal = isEditingItems ? computedTotals.subTotal : Number(invoice.subTotal || 0)
  const totalTax = isEditingItems ? computedTotals.totalTax : Number(invoice.totalTax || 0)
  const balance = Math.max(0, grandTotal - amtPaid)

  // Line update handlers
  const updateLineQty = (id: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const computed = calculateLineTotal({
          quantity: qty,
          rate: Number(l.rate),
          discountAmount: Number(l.discountAmount || 0),
          taxRatePercent: Number(l.taxPercentage || 0),
        })
        return {
          ...l,
          quantity: qty,
          amount: computed.amount,
          taxAmount: computed.taxAmount,
          total: computed.total,
        }
      })
    )
  }

  const updateLineRate = (id: string, rate: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const computed = calculateLineTotal({
          quantity: Number(l.quantity),
          rate,
          discountAmount: Number(l.discountAmount || 0),
          taxRatePercent: Number(l.taxPercentage || 0),
        })
        return {
          ...l,
          rate,
          amount: computed.amount,
          taxAmount: computed.taxAmount,
          total: computed.total,
        }
      })
    )
  }

  const updateLineDiscount = (id: string, disc: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const computed = calculateLineTotal({
          quantity: Number(l.quantity),
          rate: Number(l.rate),
          discountAmount: disc,
          taxRatePercent: Number(l.taxPercentage || 0),
        })
        return {
          ...l,
          discountAmount: disc,
          amount: computed.amount,
          taxAmount: computed.taxAmount,
          total: computed.total,
        }
      })
    )
  }

  const updateLineTax = (id: string, taxRateId: string, taxRatePercent: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const computed = calculateLineTotal({
          quantity: Number(l.quantity),
          rate: Number(l.rate),
          discountAmount: Number(l.discountAmount || 0),
          taxRatePercent,
        })
        return {
          ...l,
          taxRateId,
          taxPercentage: taxRatePercent,
          amount: computed.amount,
          taxAmount: computed.taxAmount,
          total: computed.total,
        }
      })
    )
  }

  const updateLineTotal = (id: string, total: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const taxMultiplier = 1 + (Number(l.taxPercentage) || 0) / 100
        const taxableAmount = total / taxMultiplier
        const taxAmount = total - taxableAmount
        const qty = Number(l.quantity) || 1
        const rate = (taxableAmount + Number(l.discountAmount || 0)) / qty
        return {
          ...l,
          rate: Math.round(rate * 100) / 100,
          amount: taxableAmount,
          taxAmount,
          total,
        }
      })
    )
  }

  const handleSaveInvoiceItems = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/sales/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({
            itemId: l.itemId || l.item?.id,
            quantity: Number(l.quantity),
            rate: Number(l.rate),
            discountAmount: Number(l.discountAmount || 0),
            taxRateId: l.taxRateId,
            taxPercentage: Number(l.taxPercentage || 0),
          })),
          discountAmount: Number(invoice.totalDiscount || 0),
          roundOff: Number(invoice.roundOff || 0),
          amountPaid: Number(invoice.amountPaid || 0),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success && data.invoice) {
        setInvoice(data.invoice)
        setLines(data.invoice.lines)
        setIsEditingItems(false)
        setSaveSuccessMsg("Rates, discounts and taxes updated successfully!")
        setTimeout(() => setSaveSuccessMsg(""), 4000)
      } else {
        alert(data.error || "Failed to save invoice changes")
      }
    } catch (e: any) {
      alert("Error saving invoice changes")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePartyUpdateSuccess = (updatedParty: any) => {
    setInvoice((prev: any) => ({
      ...prev,
      party: {
        ...prev.party,
        name: updatedParty.name,
        mobileNumber: updatedParty.mobileNumber,
        billingAddress: updatedParty.billingAddress,
        shippingAddress: updatedParty.shippingAddress,
        gstin: updatedParty.gstin,
      },
    }))
  }

  const handleDeleteInvoice = async () => {
    if (!confirm(`Are you sure you want to permanently delete Invoice ${invoice.invoiceNumber}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/sales/invoices/${invoice.id}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok && data.success) {
        router.push("/sales/invoices")
        router.refresh()
      } else {
        alert(data.error || "Failed to delete invoice")
        setIsDeleting(false)
      }
    } catch {
      alert("Error deleting invoice")
      setIsDeleting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] font-sans overflow-y-auto overflow-x-hidden relative pb-10 print:bg-white print:p-0 print:pb-0">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/sales/invoices"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Exit
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Invoice Details</h1>
          {invoice.status === "PAID" && (
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 rounded">
              Paid
            </span>
          )}
          {invoice.status === "UNPAID" && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-500 border border-red-200 rounded">
              Unpaid
            </span>
          )}
          {invoice.status === "PARTIAL" && (
            <span className="px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 rounded">
              Partial
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#4d3ab3] text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-[#3d2a93] transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" /> Print Tax Invoice
          </button>

          <button
            type="button"
            onClick={() => setIsEditPartyModalOpen(true)}
            className="flex items-center gap-1.5 bg-white text-gray-700 border border-gray-300 px-3.5 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-3.5 w-3.5 text-[#5c429e]" /> Edit Party
          </button>

          <Link
            href={`/sales/invoices/${invoice.id}/edit`}
            className="flex items-center gap-1.5 bg-[#f0edff] text-[#5c429e] border border-purple-200 px-4 py-1.5 rounded-md text-sm font-bold hover:bg-[#e0dbff] transition-colors shadow-sm"
          >
            <Edit className="h-4 w-4" /> Edit Invoice
          </Link>


          <button
            type="button"
            onClick={handleDeleteInvoice}
            disabled={isDeleting}
            className="flex items-center gap-1.5 bg-white text-red-600 border border-red-200 px-3.5 py-1.5 rounded-md text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete this invoice"
          >
            <Trash2 className="h-4 w-4" /> {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2 print:hidden">
          <Check className="h-4 w-4" /> {saveSuccessMsg}
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-4 mx-auto w-full max-w-5xl mt-4 print:m-0 print:p-0 print:max-w-none">
        {isEditingItems ? (
          /* Interactive Inline Rate, Disc & Tax Editor */
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Editing Line Items, Discounts & Taxes</h2>
                <p className="text-xs text-gray-500">Edit quantities, rates, discounts and applicable GST slabs</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 mr-2">Recalculated Grand Total:</span>
                <span className="text-lg font-bold text-[#5c429e]">₹ {formatINR(grandTotal)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-[#f8f9fc] border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-4 py-3">ITEM</th>
                    <th className="px-4 py-3 w-24 text-center">QTY</th>
                    <th className="px-4 py-3 w-32 text-right">RATE (₹)</th>
                    <th className="px-4 py-3 w-28 text-right">DISC (₹)</th>
                    <th className="px-4 py-3 w-28 text-center">TAX</th>
                    <th className="px-4 py-3 w-32 text-right">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line: any, idx: number) => (
                    <tr key={line.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{line.item?.name || "Item"}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLineQty(line.id, parseFloat(e.target.value) || 1)}
                          className="w-16 border border-gray-300 rounded px-1.5 py-1 text-center font-bold focus:border-[#5c429e] outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end border border-gray-300 focus-within:border-[#5c429e] rounded px-2 py-1 bg-white ml-auto w-28">
                          <span className="text-gray-400 text-xs mr-1">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.rate}
                            onChange={(e) => updateLineRate(line.id, parseFloat(e.target.value) || 0)}
                            className="w-full text-right outline-none font-semibold text-gray-800 text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end border border-gray-300 focus-within:border-[#5c429e] rounded px-2 py-1 bg-white ml-auto w-24">
                          <span className="text-gray-400 text-xs mr-1">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.discountAmount || 0}
                            onChange={(e) => updateLineDiscount(line.id, parseFloat(e.target.value) || 0)}
                            className="w-full text-right outline-none font-semibold text-gray-800 text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={line.taxRateId || ""}
                          onChange={(e) => {
                            const selectedTax = taxRates.find((t: any) => t.id === e.target.value)
                            updateLineTax(line.id, e.target.value, selectedTax ? Number(selectedTax.rate) : 0)
                          }}
                          className="border border-gray-300 focus:border-[#5c429e] rounded px-2 py-1 text-xs font-semibold text-gray-700 bg-white outline-none cursor-pointer w-24"
                        >
                          <option value="">0% Tax</option>
                          {taxRates.map((t: any) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({Number(t.rate)}%)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end border border-gray-300 focus-within:border-[#5c429e] rounded px-2 py-1 bg-white ml-auto w-32">
                          <span className="text-gray-400 text-xs mr-1">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.total}
                            onChange={(e) => updateLineTotal(line.id, parseFloat(e.target.value) || 0)}
                            className="w-full text-right outline-none font-bold text-gray-900 text-sm"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setLines(invoice.lines)
                  setIsEditingItems(false)
                }}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveInvoiceItems}
                disabled={isSaving}
                className="px-6 py-2 bg-[#4d3ab3] text-white rounded-lg text-sm font-bold hover:bg-[#3d2a93] shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Invoice Changes"}
              </button>
            </div>
          </div>
        ) : (
          /* Pixel-Perfect Physical Print Invoice Template */
          <PrintableInvoiceTemplate invoice={invoice} />
        )}
      </div>

      {/* Edit Party Modal */}
      <EditPartyModal
        isOpen={isEditPartyModalOpen}
        onClose={() => setIsEditPartyModalOpen(false)}
        party={invoice.party}
        onSuccess={handlePartyUpdateSuccess}
      />
    </div>
  )
}
