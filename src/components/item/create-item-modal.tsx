"use client"

import * as React from "react"
import { X, Box, Search } from "lucide-react"
import type { TaxRate } from "@prisma/client"

interface CreateItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (item: any) => void
  taxRates: TaxRate[]
}

export function CreateItemModal({ isOpen, onClose, onSuccess, taxRates }: CreateItemModalProps) {
  const [name, setName] = React.useState("")
  const [salesPrice, setSalesPrice] = React.useState("")
  const [purchasePrice, setPurchasePrice] = React.useState("")
  const [taxRateId, setTaxRateId] = React.useState("")
  const [openingStock, setOpeningStock] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [hsnSac, setHsnSac] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")

  const [itemType, setItemType] = React.useState<"Product" | "Service">("Product")

  React.useEffect(() => {
    if (taxRates && taxRates.length > 0 && !taxRateId) {
      setTaxRateId(taxRates[0].id)
    }
  }, [taxRates, taxRateId])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (!name.trim()) {
      setErrorMsg("Item name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          itemType: itemType === "Product" ? "PRODUCT" : "SERVICE",
          salesPrice: parseFloat(salesPrice) || 0,
          purchasePrice: parseFloat(purchasePrice) || 0,
          taxRateId: taxRateId || undefined,
          openingStock: itemType === "Product" && openingStock ? parseFloat(openingStock) : undefined,
          sku: sku.trim() || undefined,
          hsnSac: hsnSac.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success && data.item) {
        onSuccess(data.item)
        setName("")
        setSalesPrice("")
        setPurchasePrice("")
        setOpeningStock("")
        setSku("")
        setHsnSac("")
        onClose()
      } else {
        setErrorMsg(data.error || "Failed to create item")
      }
    } catch (error) {
      setErrorMsg("Network error creating item")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Create New Item</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Content area */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Item Type */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="itemType"
                checked={itemType === "Product"}
                onChange={() => setItemType("Product")}
                className="text-[#5c429e] focus:ring-[#5c429e]"
              />
              Product (Inventory Goods)
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="itemType"
                checked={itemType === "Service"}
                onChange={() => setItemType("Service")}
                className="text-[#5c429e] focus:ring-[#5c429e]"
              />
              Service (Consulting / Labor)
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Basmati Rice 5kg, Graphic Design"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Sales Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
                value={salesPrice}
                onChange={(e) => setSalesPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {taxRates && taxRates.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Applicable GST Tax
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#5c429e]"
                  value={taxRateId}
                  onChange={(e) => setTaxRateId(e.target.value)}
                >
                  <option value="">No Tax / Exempt</option>
                  {taxRates.map((tax) => (
                    <option key={tax.id} value={tax.id}>
                      {tax.name} ({Number(tax.rate)}%)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {itemType === "Product" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Opening Stock Quantity
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
                  value={openingStock}
                  onChange={(e) => setOpeningStock(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                SKU / Item Code
              </label>
              <input
                type="text"
                placeholder="SKU-1001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#5c429e]"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                HSN / SAC Code
              </label>
              <input
                type="text"
                placeholder="1006.30"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#5c429e]"
                value={hsnSac}
                onChange={(e) => setHsnSac(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? "Saving..." : "Save Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
