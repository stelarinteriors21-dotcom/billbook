"use client"

import * as React from "react"
import { X, Box, Search } from "lucide-react"
import type { TaxRate } from "@prisma/client"

interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (item: any) => void
  taxRates: TaxRate[]
  itemId: string
}

export function EditItemModal({ isOpen, onClose, onSuccess, taxRates, itemId }: EditItemModalProps) {
  const [name, setName] = React.useState("")
  const [salesPrice, setSalesPrice] = React.useState("")
  const [purchasePrice, setPurchasePrice] = React.useState("")
  const [taxRateId, setTaxRateId] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [hsnSac, setHsnSac] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")
  const [itemType, setItemType] = React.useState<"Product" | "Service">("Product")

  React.useEffect(() => {
    if (isOpen && itemId) {
      setIsLoading(true)
      fetch(`/api/items/${itemId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.item) {
            const item = data.item
            setName(item.name || "")
            setSalesPrice(item.salesPrice ? String(item.salesPrice) : "0")
            setPurchasePrice(item.purchasePrice ? String(item.purchasePrice) : "0")
            setTaxRateId(item.taxRateId || "")
            setSku(item.sku === "-" ? "" : item.sku || "")
            setHsnSac(item.hsnSac === "-" ? "" : item.hsnSac || "")
            setItemType(item.itemType === "SERVICE" ? "Service" : "Product")
          } else {
            setErrorMsg(data.error || "Failed to load item")
          }
        })
        .catch(() => setErrorMsg("Network error loading item"))
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, itemId])

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
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          itemType: itemType === "Product" ? "PRODUCT" : "SERVICE",
          salesPrice: parseFloat(salesPrice) || 0,
          purchasePrice: parseFloat(purchasePrice) || 0,
          taxRateId: taxRateId || undefined,
          sku: sku.trim() || undefined,
          hsnSac: hsnSac.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success && data.item) {
        onSuccess(data.item)
        onClose()
      } else {
        setErrorMsg(data.error || "Failed to update item")
      }
    } catch (error) {
      setErrorMsg("Network error updating item")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Edit Item</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-200 rounded-md transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500 font-medium animate-pulse">Loading item details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
                {errorMsg}
              </div>
            )}

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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  SKU / Item Code
                </label>
                <input
                  type="text"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#5c429e]"
                  value={hsnSac}
                  onChange={(e) => setHsnSac(e.target.value)}
                />
              </div>
            </div>

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
                {isSubmitting ? "Updating..." : "Update Item"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
