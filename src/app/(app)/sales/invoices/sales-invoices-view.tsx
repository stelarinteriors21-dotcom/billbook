"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BarChart2,
  Settings,
  LayoutGrid,
  Search,
  Calendar,
  ChevronDown,
  Plus,
  Eye,
  Edit,
  Trash2,
  Check,
  FileText,
  TrendingUp,
  DollarSign,
  Package,
  CalendarDays,
} from "lucide-react"

interface SalesInvoice {
  id: string
  invoiceNumber: string
  date: string | Date
  dueDate?: string | Date | null
  party: any
  subTotal: any
  totalTax: any
  grandTotal: any
  amountPaid: any
  status: any
}

interface SalesInvoicesViewProps {
  initialInvoices: any[]
}

type DateRangePreset =
  | "ALL"
  | "TODAY"
  | "YESTERDAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "THIS_QUARTER"
  | "THIS_FY"
  | "LAST_365"
  | "CUSTOM"

export function SalesInvoicesView({ initialInvoices }: SalesInvoicesViewProps) {
  const router = useRouter()
  const [invoices, setInvoices] = React.useState<SalesInvoice[]>(initialInvoices)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [datePreset, setDatePreset] = React.useState<DateRangePreset>("LAST_365")
  const [dateLabel, setDateLabel] = React.useState("Last 365 Days")
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)
  const [customStartDate, setCustomStartDate] = React.useState("")
  const [customEndDate, setCustomEndDate] = React.useState("")

  const [isReportsOpen, setIsReportsOpen] = React.useState(false)
  const [isCompactView, setIsCompactView] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const datePickerRef = React.useRef<HTMLDivElement>(null)
  const reportsRef = React.useRef<HTMLDivElement>(null)

  // Sync when initialInvoices prop changes
  React.useEffect(() => {
    setInvoices(initialInvoices)
  }, [initialInvoices])

  // Close dropdowns on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false)
      }
      if (reportsRef.current && !reportsRef.current.contains(e.target as Node)) {
        setIsReportsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Filter invoices based on date range and search query
  const filteredInvoices = React.useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return invoices.filter((inv) => {
      // 1. Date filter
      const invDate = new Date(inv.date)
      const invDateOnly = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate())

      let matchesDate = true

      if (datePreset === "TODAY") {
        matchesDate = invDateOnly.getTime() === today.getTime()
      } else if (datePreset === "YESTERDAY") {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        matchesDate = invDateOnly.getTime() === yesterday.getTime()
      } else if (datePreset === "THIS_WEEK") {
        const dayOfWeek = today.getDay()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - dayOfWeek)
        matchesDate = invDateOnly >= startOfWeek && invDateOnly <= today
      } else if (datePreset === "THIS_MONTH") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        matchesDate = invDateOnly >= startOfMonth && invDateOnly <= today
      } else if (datePreset === "THIS_QUARTER") {
        const currentQuarterMonth = Math.floor(today.getMonth() / 3) * 3
        const startOfQuarter = new Date(today.getFullYear(), currentQuarterMonth, 1)
        matchesDate = invDateOnly >= startOfQuarter && invDateOnly <= today
      } else if (datePreset === "THIS_FY") {
        const fyYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
        const startOfFY = new Date(fyYear, 3, 1) // April 1st
        matchesDate = invDateOnly >= startOfFY && invDateOnly <= today
      } else if (datePreset === "LAST_365") {
        const past365 = new Date(today)
        past365.setDate(today.getDate() - 365)
        matchesDate = invDateOnly >= past365 && invDateOnly <= today
      } else if (datePreset === "CUSTOM") {
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate)
          const end = new Date(customEndDate)
          end.setHours(23, 59, 59, 999)
          matchesDate = invDate >= start && invDate <= end
        }
      }

      if (!matchesDate) return false

      // 2. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const partyName = inv.party?.name?.toLowerCase() || ""
        const invNum = inv.invoiceNumber?.toLowerCase() || ""
        const amt = inv.grandTotal?.toString() || ""
        return partyName.includes(q) || invNum.includes(q) || amt.includes(q)
      }

      return true
    })
  }, [invoices, datePreset, customStartDate, customEndDate, searchQuery])

  // Recalculate summary metrics dynamically
  const metrics = React.useMemo(() => {
    const totalSales = filteredInvoices.reduce((acc, inv) => acc + Number(inv.grandTotal || 0), 0)
    const totalPaid = filteredInvoices.reduce((acc, inv) => acc + Number(inv.amountPaid || 0), 0)
    const totalUnpaid = totalSales - totalPaid
    const cancelledCount = filteredInvoices.filter((inv) => inv.status === "CANCELLED").length
    return { totalSales, totalPaid, totalUnpaid, cancelledCount }
  }, [filteredInvoices])

  const handleSelectDatePreset = (preset: DateRangePreset, label: string) => {
    setDatePreset(preset)
    setDateLabel(label)
    if (preset !== "CUSTOM") {
      setIsDatePickerOpen(false)
    }
  }

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

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#f4f5f8] overflow-y-auto">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-gray-800">Sales Invoices</h1>
        
        <div className="flex items-center gap-3">
          {/* Reports Dropdown */}
          <div className="relative" ref={reportsRef}>
            <button
              type="button"
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className="flex items-center gap-2 border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm"
            >
              <BarChart2 className="h-4 w-4" /> Reports <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {isReportsOpen && (
              <div className="absolute right-0 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 animate-in fade-in">
                <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Sales Reports
                </div>
                <Link
                  href="/reports"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#5c429e]"
                  onClick={() => setIsReportsOpen(false)}
                >
                  <TrendingUp className="h-4 w-4 text-purple-600" /> Sales Summary Report
                </Link>
                <Link
                  href="/reports"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#5c429e]"
                  onClick={() => setIsReportsOpen(false)}
                >
                  <FileText className="h-4 w-4 text-emerald-600" /> GSTR-1 (Tax Report)
                </Link>
                <Link
                  href="/reports"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#5c429e]"
                  onClick={() => setIsReportsOpen(false)}
                >
                  <Package className="h-4 w-4 text-blue-600" /> Stock & Item Sales
                </Link>
                <Link
                  href="/reports"
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#5c429e]"
                  onClick={() => setIsReportsOpen(false)}
                >
                  <CalendarDays className="h-4 w-4 text-orange-600" /> Day Book & Cashflow
                </Link>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <Link
            href="/settings"
            className="p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-600 transition-colors"
            title="Business & Invoice Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>

          {/* Density Toggle */}
          <button
            type="button"
            onClick={() => setIsCompactView(!isCompactView)}
            className={`p-2 border rounded-md transition-colors ${
              isCompactView ? "bg-purple-50 border-purple-300 text-[#5c429e]" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            title="Toggle compact table view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Total Sales Card */}
        <div className="bg-[#f3f0ff] border border-[#d6c7ff] rounded-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 text-sm font-medium text-[#5c429e] mb-1">
            <DollarSign className="h-4 w-4" /> Total Sales
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            ₹ {metrics.totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-gray-500 mt-1">{filteredInvoices.length} invoices ({dateLabel})</span>
        </div>

        {/* Paid Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 mb-1">
            <Check className="h-4 w-4" /> Paid
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            ₹ {metrics.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-gray-500 mt-1">Collected amount</span>
        </div>

        {/* Unpaid Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-red-500 mb-1">
            <FileText className="h-4 w-4" /> Unpaid
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            ₹ {metrics.totalUnpaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-gray-500 mt-1">Outstanding receivables</span>
        </div>

        {/* Cancelled Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
            <Trash2 className="h-4 w-4" /> Cancelled
          </div>
          <div className="text-2xl font-semibold text-gray-900">{metrics.cancelledCount || "-"}</div>
          <span className="text-[11px] text-gray-500 mt-1">Voided invoices</span>
        </div>
      </div>

      {/* 3. Toolbar: Search + Date Filter + Create Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Live Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm w-72 focus:outline-none focus:border-[#5c429e] bg-white shadow-sm"
              placeholder="Search by customer, invoice # or amount..."
            />
          </div>

          {/* Interactive Date Range Filter */}
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-3.5 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Calendar className="h-4 w-4 text-purple-600" /> {dateLabel} <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>

            {isDatePickerOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50 animate-in fade-in space-y-1">
                <div className="px-2 py-1 text-[11px] font-bold text-gray-400 uppercase">Select Date Range</div>
                
                <button
                  type="button"
                  onClick={() => handleSelectDatePreset("LAST_365", "Last 365 Days")}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded ${
                    datePreset === "LAST_365" ? "bg-[#f0edff] text-[#5c429e]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Last 365 Days
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDatePreset("THIS_MONTH", "This Month")}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded ${
                    datePreset === "THIS_MONTH" ? "bg-[#f0edff] text-[#5c429e]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  This Month
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDatePreset("THIS_QUARTER", "This Quarter")}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded ${
                    datePreset === "THIS_QUARTER" ? "bg-[#f0edff] text-[#5c429e]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  This Quarter
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDatePreset("THIS_FY", "This Financial Year")}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded ${
                    datePreset === "THIS_FY" ? "bg-[#f0edff] text-[#5c429e]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  This Financial Year
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDatePreset("TODAY", "Today")}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded ${
                    datePreset === "TODAY" ? "bg-[#f0edff] text-[#5c429e]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDatePreset("YESTERDAY", "Yesterday")}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded ${
                    datePreset === "YESTERDAY" ? "bg-[#f0edff] text-[#5c429e]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Yesterday
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDatePreset("THIS_WEEK", "This Week")}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded ${
                    datePreset === "THIS_WEEK" ? "bg-[#f0edff] text-[#5c429e]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  This Week
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDatePreset("ALL", "All Time")}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded ${
                    datePreset === "ALL" ? "bg-[#f0edff] text-[#5c429e]" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  All Time
                </button>

                {/* Custom Range */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <span className="text-[11px] font-bold text-gray-500 block px-1">Custom Range:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value)
                        setDatePreset("CUSTOM")
                        setDateLabel("Custom Range")
                      }}
                      className="border border-gray-300 rounded px-1.5 py-1 text-[11px]"
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value)
                        setDatePreset("CUSTOM")
                        setDateLabel("Custom Range")
                      }}
                      className="border border-gray-300 rounded px-1.5 py-1 text-[11px]"
                    />
                  </div>
                  {datePreset === "CUSTOM" && customStartDate && customEndDate && (
                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(false)}
                      className="w-full bg-[#4d3ab3] text-white py-1 rounded text-xs font-bold"
                    >
                      Apply Range
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Sales Invoice CTA */}
        <Link href="/sales/invoices/new">
          <button className="flex items-center gap-1.5 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Create Sales Invoice
          </button>
        </Link>
      </div>

      {/* 4. Table */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto flex-1">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-base font-semibold text-gray-700">No invoices match your filter.</p>
              <p className="text-xs text-gray-400 mt-1">Try resetting the date range or search terms.</p>
            </div>
          ) : (
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
                {filteredInvoices.map((invoice, i) => {
                  const amtPaid = Number(invoice.amountPaid || 0)
                  const total = Number(invoice.grandTotal || 0)
                  const unpaid = Math.max(0, total - amtPaid)
                  const isDeleting = deletingId === invoice.id

                  return (
                    <tr
                      key={invoice.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        i % 2 === 1 ? "bg-[#f8f9fc]" : "bg-white"
                      } ${isCompactView ? "py-1.5" : "py-3"} ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
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
                        {invoice.status === "CANCELLED" && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded border border-gray-200">
                            Cancelled
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
          )}
        </div>
      </div>
    </div>
  )
}
