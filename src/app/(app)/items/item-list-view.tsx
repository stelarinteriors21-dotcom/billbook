"use client"

import * as React from "react"
import Link from "next/link"
import {
  Package,
  Search,
  Plus,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  Upload,
  Download,
  ChevronRight,
  SlidersHorizontal,
  Tag,
  Boxes,
  Barcode,
  Hash,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react"
import { CreateItemModal } from "@/components/item/create-item-modal"
import { exportToCSV } from "@/lib/export-utils"

interface ItemRecord {
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

interface ItemListViewProps {
  initialItems: ItemRecord[]
  totalStockValue: number
  lowStockCount: number
  taxRates: { id: string; name: string; rate: number }[]
  categories: { id: string; name: string }[]
  units: { id: string; name: string; shortName: string }[]
}

function formatINR(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ItemListView({
  initialItems,
  totalStockValue,
  lowStockCount,
  taxRates,
  categories,
  units,
}: ItemListViewProps) {
  const [items, setItems] = React.useState<ItemRecord[]>(initialItems)
  const [tab, setTab] = React.useState<"ALL" | "PRODUCT" | "SERVICE" | "LOW_STOCK">("ALL")
  const [search, setSearch] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL")
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)

  // CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
  const [importText, setImportText] = React.useState("")
  const [importing, setImporting] = React.useState(false)
  const [importMsg, setImportMsg] = React.useState("")

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      let matchTab = true
      if (tab === "PRODUCT") matchTab = item.itemType === "PRODUCT"
      else if (tab === "SERVICE") matchTab = item.itemType === "SERVICE"
      else if (tab === "LOW_STOCK") matchTab = item.itemType === "PRODUCT" && (item.currentStock || 0) <= 10

      const matchCategory = selectedCategory === "ALL" || item.categoryId === selectedCategory

      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.hsnSac.toLowerCase().includes(search.toLowerCase())

      return matchTab && matchCategory && matchSearch
    })
  }, [items, tab, selectedCategory, search])

  const handleItemCreated = (newItem: any) => {
    setItems((prev) => [
      {
        id: newItem.id,
        name: newItem.name,
        itemType: newItem.itemType,
        sku: newItem.sku || "-",
        barcode: newItem.barcode || "-",
        hsnSac: newItem.hsnSac || "-",
        salesPrice: Number(newItem.salesPrice),
        purchasePrice: Number(newItem.purchasePrice),
        category: newItem.category?.name || "General",
        categoryId: newItem.categoryId || "",
        unit: newItem.unit?.shortName || "PCS",
        unitId: newItem.unitId || "",
        taxRate: newItem.taxRate ? `${newItem.taxRate.rate}% GST` : "None",
        taxRateId: newItem.taxRateId || "",
        currentStock: newItem.itemType === "PRODUCT" ? (newItem.openingStock || 0) : null,
        stockValue:
          newItem.itemType === "PRODUCT"
            ? (newItem.openingStock || 0) * Number(newItem.purchasePrice)
            : null,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
    setIsCreateModalOpen(false)
  }

  const handleExportCSV = () => {
    const headers = [
      "Item Name",
      "Type",
      "Sales Price (₹)",
      "Purchase Price (₹)",
      "Current Stock",
      "Unit",
      "Category",
      "Tax Rate",
      "HSN/SAC",
      "SKU",
      "Inventory Value (₹)",
    ]
    const rows = filteredItems.map((i) => [
      i.name,
      i.itemType,
      i.salesPrice,
      i.purchasePrice,
      i.currentStock ?? "-",
      i.unit,
      i.category,
      i.taxRate,
      i.hsnSac,
      i.sku,
      i.stockValue ?? "-",
    ])
    exportToCSV("Items_Inventory_Catalog", rows, headers)
  }

  const handleImportCSV = async () => {
    if (!importText.trim()) return
    setImporting(true)
    setImportMsg("")
    try {
      const lines = importText.split("\n").filter((l) => l.trim().length > 0)
      const parsedItems = lines.map((line) => {
        const parts = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""))
        return {
          name: parts[0] || "New Item",
          itemType: parts[1]?.toUpperCase() === "SERVICE" ? "SERVICE" : "PRODUCT",
          salesPrice: parseFloat(parts[2]) || 0,
          purchasePrice: parseFloat(parts[3]) || 0,
          sku: parts[4] || undefined,
          hsnSac: parts[5] || undefined,
        }
      })

      const res = await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedItems }),
      })
      const data = await res.json()
      if (data.success) {
        setImportMsg(`Successfully imported ${data.count} items into catalog!`)
        setTimeout(() => {
          setIsImportModalOpen(false)
          window.location.reload()
        }, 1500)
      } else {
        alert("Import error: " + data.error)
      }
    } catch (e) {
      alert("Failed to import items")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#f4f5f8] overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-800">Items & Inventory</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your product catalog, prices, GST tax rates & multi-godown stock valuation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="h-4 w-4 text-gray-500" /> Export CSV
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4 text-gray-500" /> Import Items
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Stock Valuation
            </p>
            <div className="p-2 bg-purple-50 rounded-lg text-[#5c429e]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ₹ {formatINR(totalStockValue)}
          </h3>
          <p className="text-xs text-gray-500 mt-2">
            Asset value across all {items.filter((i) => i.itemType === "PRODUCT").length} products
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Low Stock Alert
            </p>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-red-600">{lowStockCount}</h3>
          <p className="text-xs text-gray-500 mt-2">
            Items running below critical threshold (≤ 10 units)
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Catalog Items
            </p>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{items.length}</h3>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
            <span>
              Products:{" "}
              <b className="text-gray-700">
                {items.filter((i) => i.itemType === "PRODUCT").length}
              </b>
            </span>
            <span>
              Services:{" "}
              <b className="text-gray-700">
                {items.filter((i) => i.itemType === "SERVICE").length}
              </b>
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        {/* Tabs & Filter Header */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setTab("ALL")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === "ALL"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setTab("PRODUCT")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === "PRODUCT"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Products ({items.filter((i) => i.itemType === "PRODUCT").length})
            </button>
            <button
              onClick={() => setTab("SERVICE")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === "SERVICE"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Services ({items.filter((i) => i.itemType === "SERVICE").length})
            </button>
            <button
              onClick={() => setTab("LOW_STOCK")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === "LOW_STOCK"
                  ? "bg-red-50 text-red-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, SKU or HSN..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-[#5c429e] transition-colors"
              />
            </div>

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#5c429e]"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-600 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Item Details</th>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold text-right">Sales Price</th>
                <th className="px-5 py-3.5 font-semibold text-right">Purchase Price</th>
                <th className="px-5 py-3.5 font-semibold text-center">Stock In Hand</th>
                <th className="px-5 py-3.5 font-semibold text-right">Stock Value</th>
                <th className="px-5 py-3.5 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    <div className="max-w-xs mx-auto text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <Package className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">No items found</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {search ? "No items match your filter criteria." : "Create your first product or service item."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${
                      idx % 2 === 1 ? "bg-[#fcfdff]" : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <Link href={`/items/${item.id}`} className="flex items-center gap-3 group">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                            item.itemType === "PRODUCT"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {item.itemType === "PRODUCT" ? <Boxes className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-[#5c429e] transition-colors">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 font-mono">
                            {item.sku !== "-" && <span>SKU: {item.sku}</span>}
                            {item.hsnSac !== "-" && <span>HSN: {item.hsnSac}</span>}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      ₹ {formatINR(item.salesPrice)}
                      <span className="block text-[10px] font-normal text-gray-400">
                        {item.taxRate}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-600">
                      ₹ {formatINR(item.purchasePrice)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {item.itemType === "PRODUCT" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              (item.currentStock || 0) <= 10 ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {item.currentStock}
                          </span>
                          <span className="text-xs text-gray-400">{item.unit}</span>
                          {(item.currentStock || 0) <= 10 && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Service</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                      {item.stockValue !== null ? `₹ ${formatINR(item.stockValue)}` : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link href={`/items/${item.id}`}>
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-600" /> Import Items via CSV / Text
            </h3>
            <p className="text-xs text-gray-500">
              Format: <code>Item Name, Type (PRODUCT/SERVICE), Sales Price, Purchase Price, SKU, HSN</code> (1 per line)
            </p>

            {importMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> {importMsg}
              </div>
            )}

            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Basmati Rice 5kg, PRODUCT, 450, 380, SKU-RICE-05, 1006&#10;Consulting Service, SERVICE, 2500, 0, SKU-CONSULT, 9983"
              className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono focus:border-[#5c429e] outline-none resize-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCSV}
                disabled={importing || !importText.trim()}
                className="px-4 py-2 bg-[#4d3ab3] text-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import Items"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        taxRates={taxRates as any}
        onSuccess={handleItemCreated}
      />
    </div>
  )
}
