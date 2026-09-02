"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Package,
  Boxes,
  Plus,
  Minus,
  Edit,
  TrendingUp,
  TrendingDown,
  Layers,
  History,
  ShoppingCart,
  Calendar,
  Warehouse,
  CheckCircle,
  Tag,
  Hash,
  Printer,
  Save
} from "lucide-react"

interface ItemDetailData {
  id: string
  name: string
  itemType: "PRODUCT" | "SERVICE"
  sku: string
  barcode: string
  hsnSac: string
  salesPrice: number
  purchasePrice: number
  category: string
  categoryId: string
  unit: string
  unitId: string
  taxRate: string
  taxRateId: string
  currentStock: number | null
  stockValue: number | null
  createdAt: string
}

interface StockMovementRecord {
  id: string
  type: "IN" | "OUT" | "ADJUST"
  quantity: number
  referenceType: string
  date: string
  godown: string
}

interface SalesRecord {
  id: string
  invoiceNumber: string
  partyName: string
  date: string
  quantity: number
  rate: number
  total: number
}

interface ItemDetailViewProps {
  item: ItemDetailData
  stockMovements: StockMovementRecord[]
  salesHistory: SalesRecord[]
}

function formatINR(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ItemDetailView({
  item,
  stockMovements,
  salesHistory,
}: ItemDetailViewProps) {
  const router = useRouter()
  const [tab, setTab] = React.useState<"STOCK_TIMELINE" | "SALES_HISTORY">("STOCK_TIMELINE")

  // Stock Adjustment
  const [isAdjustModalOpen, setIsAdjustModalOpen] = React.useState(false)
  const [adjustType, setAdjustType] = React.useState<"ADD" | "REDUCE">("ADD")
  const [adjustQty, setAdjustQty] = React.useState("")
  const [adjustReason, setAdjustReason] = React.useState("MANUAL_ADJUSTMENT")
  const [submitting, setSubmitting] = React.useState(false)

  // Edit Item Modal
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [name, setName] = React.useState(item.name)
  const [salesPrice, setSalesPrice] = React.useState(String(item.salesPrice))
  const [purchasePrice, setPurchasePrice] = React.useState(String(item.purchasePrice))
  const [hsnSac, setHsnSac] = React.useState(item.hsnSac === "-" ? "" : item.hsnSac)
  const [sku, setSku] = React.useState(item.sku === "-" ? "" : item.sku)
  const [savingEdit, setSavingEdit] = React.useState(false)

  const handleAdjustStock = async () => {
    if (!adjustQty || Number(adjustQty) <= 0) {
      alert("Please enter a valid quantity")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/items/adjust-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          adjustmentType: adjustType,
          quantity: Number(adjustQty),
          reason: adjustReason,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setIsAdjustModalOpen(false)
        router.refresh()
      } else {
        alert("Error: " + data.error)
      }
    } catch (e) {
      alert("Failed to adjust stock")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          salesPrice: Number(salesPrice),
          purchasePrice: Number(purchasePrice) || 0,
          hsnSac: hsnSac || null,
          sku: sku || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setIsEditModalOpen(false)
        router.refresh()
      } else {
        alert("Error updating item: " + data.error)
      }
    } catch (e) {
      alert("Failed to update item")
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#f4f5f8] overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/items"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Items
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{item.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                item.itemType === "PRODUCT"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {item.itemType}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4 text-gray-500" /> Print Summary
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Edit className="h-4 w-4 text-purple-600" /> Edit Item
          </button>

          {item.itemType === "PRODUCT" && (
            <>
              <button
                onClick={() => {
                  setAdjustType("REDUCE")
                  setIsAdjustModalOpen(true)
                }}
                className="flex items-center gap-1.5 border border-red-200 bg-white text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors shadow-sm"
              >
                <Minus className="h-4 w-4" /> Reduce Stock
              </button>
              <button
                onClick={() => {
                  setAdjustType("ADD")
                  setIsAdjustModalOpen(true)
                }}
                className="flex items-center gap-1.5 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Stock
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Basic & Pricing Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Pricing & Identifiers
            </h2>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs text-[#5c429e] font-semibold hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Sales Price:</span>
              <span className="font-bold text-gray-900">₹ {formatINR(item.salesPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Purchase Price:</span>
              <span className="font-semibold text-gray-700">₹ {formatINR(item.purchasePrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Applicable Tax:</span>
              <span className="font-medium text-gray-800">{item.taxRate}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
              <span className="text-gray-500">Category:</span>
              <span className="font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {item.category}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Measuring Unit:</span>
              <span className="font-semibold text-gray-800">{item.unit}</span>
            </div>
            {item.hsnSac !== "-" && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">HSN/SAC:</span>
                <span className="font-mono text-gray-700">{item.hsnSac}</span>
              </div>
            )}
            {item.sku !== "-" && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">SKU Code:</span>
                <span className="font-mono text-gray-700">{item.sku}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stock Widget */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Stock In Hand
            </span>
            <div className="mt-2">
              {item.itemType === "PRODUCT" ? (
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {item.currentStock} <span className="text-base font-normal text-gray-500">{item.unit}</span>
                  </h3>
                  {(item.currentStock || 0) <= 10 ? (
                    <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                      Low stock warning
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Sufficient inventory
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-bold text-gray-400">N/A</h3>
                  <p className="text-xs text-gray-500 mt-1">Service (Non-inventory item)</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Inventory Value:</span>
            <span className="font-bold text-gray-900">
              {item.stockValue !== null ? `₹ ${formatINR(item.stockValue)}` : "-"}
            </span>
          </div>
        </div>

        {/* Sales Statistics */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-3">
            Sales Performance
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Units Sold:</span>
              <span className="font-bold text-gray-900">
                {salesHistory.reduce((a, s) => a + s.quantity, 0)} {item.unit}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Sales Revenue:</span>
              <span className="font-bold text-emerald-600">
                ₹ {formatINR(salesHistory.reduce((a, s) => a + s.total, 0))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Orders:</span>
              <span className="font-semibold text-gray-800">{salesHistory.length} bills</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and History */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="flex items-center border-b border-gray-200 px-6 bg-gray-50">
          <button
            onClick={() => setTab("STOCK_TIMELINE")}
            className={`py-3.5 px-4 font-semibold text-xs transition-colors border-b-2 ${
              tab === "STOCK_TIMELINE"
                ? "border-[#5c429e] text-[#5c429e] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Stock Movement History ({stockMovements.length})
          </button>
          <button
            onClick={() => setTab("SALES_HISTORY")}
            className={`py-3.5 px-4 font-semibold text-xs transition-colors border-b-2 ${
              tab === "SALES_HISTORY"
                ? "border-[#5c429e] text-[#5c429e] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Sales Invoices ({salesHistory.length})
          </button>
        </div>

        {tab === "STOCK_TIMELINE" ? (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-600 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Godown / Store</th>
                  <th className="px-5 py-3 font-semibold text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((m, idx) => (
                    <tr
                      key={m.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        idx % 2 === 1 ? "bg-[#fcfdff]" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {new Date(m.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                            m.type === "IN"
                              ? "bg-emerald-50 text-emerald-700"
                              : m.type === "OUT"
                              ? "bg-red-50 text-red-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {m.type === "IN" ? "+ Stock In" : m.type === "OUT" ? "- Stock Out" : "Adjustment"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-800 font-medium">{m.referenceType}</td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">{m.godown}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                        {m.type === "IN" ? `+${m.quantity}` : m.type === "OUT" ? `-${m.quantity}` : `${m.quantity}`}{" "}
                        {item.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-600 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Invoice #</th>
                  <th className="px-5 py-3 font-semibold">Party Name</th>
                  <th className="px-5 py-3 font-semibold text-center">Quantity Sold</th>
                  <th className="px-5 py-3 font-semibold text-right">Unit Rate</th>
                  <th className="px-5 py-3 font-semibold text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                      No sales history recorded for this item yet.
                    </td>
                  </tr>
                ) : (
                  salesHistory.map((s, idx) => (
                    <tr
                      key={s.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        idx % 2 === 1 ? "bg-[#fcfdff]" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {new Date(s.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">{s.invoiceNumber}</td>
                      <td className="px-5 py-3.5 text-gray-700">{s.partyName}</td>
                      <td className="px-5 py-3.5 text-center font-semibold text-gray-900">
                        {s.quantity} {item.unit}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-600">₹ {formatINR(s.rate)}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-[#5c429e]">₹ {formatINR(s.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              {adjustType === "ADD" ? "Add Stock" : "Reduce Stock"} — {item.name}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Quantity ({item.unit})
              </label>
              <input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="Enter quantity..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Reason / Note
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#5c429e]"
              >
                <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                <option value="PURCHASE_RECEIPT">New Stock Received</option>
                <option value="DAMAGED_EXPIRED">Damaged / Expired</option>
                <option value="STOCK_AUDIT">Stock Audit Count</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                disabled={submitting}
                className="px-4 py-2 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Save Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Edit Item Details</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Sales Price (₹)
                </label>
                <input
                  type="number"
                  value={salesPrice}
                  onChange={(e) => setSalesPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Purchase Price (₹)
                </label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  HSN/SAC Code
                </label>
                <input
                  type="text"
                  value={hsnSac}
                  onChange={(e) => setHsnSac(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  SKU Code
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-4 py-2 bg-[#4d3ab3] text-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
