"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Settings, Edit, Eye, Plus, ScanBarcode, Trash2, X, Upload } from "lucide-react"
import { searchParties } from "@/app/actions/party"
import { searchItems } from "@/app/actions/item"
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/billing-engine"

import { PartyCombobox } from "@/components/invoice/party-combobox"
import { CreatePartyModal } from "@/components/party/create-party-modal"
import { CreateItemModal } from "@/components/item/create-item-modal"
import { AddItemsModal } from "@/components/invoice/add-items-modal"

interface PurchaseBillFormProps {
  taxRates: { id: string; name: string; rate: number }[]
  godowns: { id: string; name: string }[]
}

interface LineItemState {
  id: string
  itemId: string
  itemName: string
  quantity: number
  rate: number
  discountAmount: number
  taxRateId: string
  taxRatePercent: number
  godownId: string
  amount: number
  taxAmount: number
  total: number
}

export function PurchaseBillForm({ taxRates, godowns }: PurchaseBillFormProps) {
  const router = useRouter()

  const [partyId, setPartyId] = React.useState("")
  const [partyName, setPartyName] = React.useState("")
  const [billNumber, setBillNumber] = React.useState("")
  const [billDate, setBillDate] = React.useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = React.useState("")
  const [showDueDate, setShowDueDate] = React.useState(false)

  const [lines, setLines] = React.useState<LineItemState[]>([])
  const [discountAmount, setDiscountAmount] = React.useState(0)
  const [roundOff, setRoundOff] = React.useState(0)
  const [amountPaid, setAmountPaid] = React.useState(0)
  const [isFullyPaid, setIsFullyPaid] = React.useState(false)

  const [isPartyModalOpen, setIsPartyModalOpen] = React.useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = React.useState(false)
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const totals = React.useMemo(() => {
    return calculateInvoiceTotals({
      lines: lines.map((l) => ({
        quantity: l.quantity,
        rate: l.rate,
        discountAmount: l.discountAmount,
        taxRatePercent: l.taxRatePercent,
      })),
      discountAmount,
      roundOff,
    })
  }, [lines, discountAmount, roundOff])

  React.useEffect(() => {
    if (isFullyPaid) {
      setAmountPaid(totals.grandTotal)
    }
  }, [isFullyPaid, totals.grandTotal])

  const handleAddItemsFromModal = (items: any[]) => {
    const newLines = items.map((item) => {
      const taxRatePercent = item.taxRate ? Number(item.taxRate.rate) : 0
      const unitRate = item.purchasePrice || item.salesPrice || 0
      const computed = calculateLineTotal({
        quantity: 1,
        rate: unitRate,
        discountAmount: 0,
        taxRatePercent,
      })
      return {
        id: Math.random().toString(36).substring(7),
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        rate: unitRate,
        discountAmount: 0,
        taxRateId: item.taxRateId || taxRates[0]?.id || "",
        taxRatePercent,
        godownId: godowns[0]?.id || "",
        amount: computed.amount,
        taxAmount: computed.taxAmount,
        total: computed.total,
      }
    })
    setLines((prev) => [...prev, ...newLines])
  }

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  const updateLineQty = (id: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const computed = calculateLineTotal({
          quantity: qty,
          rate: l.rate,
          discountAmount: l.discountAmount,
          taxRatePercent: l.taxRatePercent,
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
          quantity: l.quantity,
          rate: rate,
          discountAmount: l.discountAmount,
          taxRatePercent: l.taxRatePercent,
        })
        return {
          ...l,
          rate: rate,
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
        const taxMultiplier = 1 + (l.taxRatePercent || 0) / 100
        const taxableAmount = total / taxMultiplier
        const taxAmount = total - taxableAmount
        const qty = l.quantity || 1
        const rate = (taxableAmount + (l.discountAmount || 0)) / qty
        return {
          ...l,
          rate: Math.round(rate * 100) / 100,
          amount: taxableAmount,
          taxAmount: taxAmount,
          total: total,
        }
      })
    )
  }

  const handleSubmit = async () => {
    if (!partyId) return alert("Please select a supplier")
    if (lines.length === 0) return alert("Please add at least one item")

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/purchases/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId,
          invoiceNumber: billNumber || undefined,
          billDate: new Date(billDate).toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          discountAmount,
          roundOff,
          amountPaid,
          lines: lines.map((l) => ({
            itemId: l.itemId,
            quantity: l.quantity,
            rate: l.rate,
            discountAmount: l.discountAmount,
            taxRateId: l.taxRateId,
            godownId: l.godownId,
          })),
        }),
      })

      const data = await response.json()
      if (data.success) {
        router.push("/purchases/bills")
      } else {
        alert("Error: " + data.error)
      }
    } catch (error) {
      alert("Failed to save purchase bill")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] font-sans overflow-y-auto overflow-x-hidden relative pb-10">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Exit
          </button>
          <h1 className="text-lg font-bold text-gray-900">Record Purchase Bill</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-6 py-1.5 rounded-md text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? "Saving..." : "Save Purchase Bill"}
          </button>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="p-4 mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Supplier Pane */}
          <div className="col-span-5 bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
            <label className="text-xs font-semibold text-gray-500 mb-2 tracking-wide uppercase">
              Supplier Details (Bill From)
            </label>
            <div className="flex-1 mt-2">
              <PartyCombobox
                value={partyName}
                onChange={(id, name) => {
                  setPartyId(id)
                  setPartyName(name)
                }}
                onSearch={async (q) => {
                  const res = await searchParties(q)
                  return res.map((p) => ({
                    id: p.id,
                    name: p.name,
                    balance: 0,
                  }))
                }}
                onCreateNew={() => setIsPartyModalOpen(true)}
              />
            </div>
          </div>

          {/* Bill Info Pane */}
          <div className="col-span-7 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <label className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-4 block">
              Bill Meta
            </label>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Supplier Bill #
                </label>
                <input
                  type="text"
                  placeholder="e.g. SUP-9021"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Bill Date
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Godown / Warehouse
                </label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e] bg-white">
                  {godowns.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 flex flex-col">
          <div className="overflow-x-auto rounded-t-lg">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-[#f8f9fc] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">PURCHASE ITEM</th>
                  <th className="px-4 py-3 w-28 text-center">QTY</th>
                  <th className="px-4 py-3 w-32 text-right">PURCHASE PRICE (₹)</th>
                  <th className="px-4 py-3 w-24 text-right">TAX</th>
                  <th className="px-4 py-3 w-32 text-right">AMOUNT (₹)</th>
                  <th className="px-4 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{line.itemName}</td>
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
                    <td className="px-4 py-3 text-right text-gray-600 font-medium">{line.taxRatePercent}%</td>
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
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeLine(line.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
            <button
              onClick={() => setIsAddItemsModalOpen(true)}
              className="w-full border-2 border-dashed border-purple-300 bg-[#f8f6ff] text-[#5c429e] rounded-md py-2.5 flex items-center justify-center font-semibold text-sm hover:bg-purple-50 transition-colors"
            >
              + Add Items to Purchase Bill
            </button>
          </div>

          <div className="bg-[#f8f9fc] flex items-center justify-end px-6 py-2.5 text-sm text-gray-700 font-medium border-b border-gray-200 rounded-b-lg">
            <div className="flex gap-12 mr-[80px]">
              <span className="text-gray-900 font-bold">Subtotal ({lines.length} items)</span>
              <span className="text-right">
                Tax: ₹ {totals.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-right text-gray-900 font-bold">
                Total: ₹ {totals.subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Totals & Payment Recording */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7"></div>
          <div className="col-span-5 bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center text-sm font-bold text-gray-700">
              <span>Grand Total:</span>
              <span className="text-xl font-bold text-[#5c429e]">
                ₹ {totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
              <div className="flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Amount Paid to Supplier</span>
                <span>₹ {amountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <input
                type="number"
                value={amountPaid || ""}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none bg-white font-medium focus:border-[#5c429e]"
              />
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFullyPaid}
                  onChange={(e) => setIsFullyPaid(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                Mark as fully paid
              </label>
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-red-500 pt-2 border-t border-gray-100">
              <span>Balance Payable:</span>
              <span>
                ₹ {Math.max(0, totals.grandTotal - amountPaid).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        onSuccess={(party) => {
          setPartyId(party.id)
          setPartyName(party.name)
        }}
      />

      <CreateItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        taxRates={taxRates as any}
        onSuccess={(newItem) => {
          handleAddItemsFromModal([newItem])
        }}
      />

      <AddItemsModal
        isOpen={isAddItemsModalOpen}
        onClose={() => setIsAddItemsModalOpen(false)}
        onSearch={async (query) => {
          const results = await searchItems(query)
          return results.map((i) => ({
            id: i.id,
            name: i.name,
            code: i.sku || undefined,
            stock: 0,
            salesPrice: Number(i.salesPrice),
            purchasePrice: Number(i.purchasePrice),
            taxRate: i.taxRate ? { rate: Number(i.taxRate.rate) } : undefined,
          }))
        }}
        onCreateNew={() => {
          setIsAddItemsModalOpen(false)
          setIsItemModalOpen(true)
        }}
        onAddItems={handleAddItemsFromModal}
      />
    </div>
  )
}
