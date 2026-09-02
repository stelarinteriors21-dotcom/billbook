"use client"

import * as React from "react"
import Link from "next/link"
import {
  Search,
  Calendar,
  ChevronDown,
  MoreVertical,
  Plus,
  BarChart2,
  Settings,
  LayoutGrid,
  TrendingUp,
  FileText,
  Package,
  CalendarDays,
} from "lucide-react"

export interface SalesDocument {
  id: string
  number: string
  partyName: string
  date: string
  grandTotal: number
  amountPaid?: number
  status: string
  detailHref: string
}

interface SummaryCard {
  label: string
  value: number
  color: string
}

interface SalesDocumentListProps {
  title: string
  createHref: string
  createLabel: string
  documents: SalesDocument[]
  summaryCards: SummaryCard[]
  statusColors: Record<string, string>
  emptyMessage?: string
}

function formatINR(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

export function SalesDocumentList({
  title,
  createHref,
  createLabel,
  documents,
  summaryCards,
  statusColors,
  emptyMessage = "No records found. Create one to get started.",
}: SalesDocumentListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [datePreset, setDatePreset] = React.useState<DateRangePreset>("LAST_365")
  const [dateLabel, setDateLabel] = React.useState("Last 365 Days")
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false)
  const [customStartDate, setCustomStartDate] = React.useState("")
  const [customEndDate, setCustomEndDate] = React.useState("")

  const [isReportsOpen, setIsReportsOpen] = React.useState(false)
  const [isCompactView, setIsCompactView] = React.useState(false)

  const datePickerRef = React.useRef<HTMLDivElement>(null)
  const reportsRef = React.useRef<HTMLDivElement>(null)

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

  // Filter documents
  const filteredDocuments = React.useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return documents.filter((doc) => {
      // 1. Date filter
      const docDate = new Date(doc.date)
      const docDateOnly = new Date(docDate.getFullYear(), docDate.getMonth(), docDate.getDate())

      let matchesDate = true

      if (datePreset === "TODAY") {
        matchesDate = docDateOnly.getTime() === today.getTime()
      } else if (datePreset === "YESTERDAY") {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        matchesDate = docDateOnly.getTime() === yesterday.getTime()
      } else if (datePreset === "THIS_WEEK") {
        const dayOfWeek = today.getDay()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - dayOfWeek)
        matchesDate = docDateOnly >= startOfWeek && docDateOnly <= today
      } else if (datePreset === "THIS_MONTH") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        matchesDate = docDateOnly >= startOfMonth && docDateOnly <= today
      } else if (datePreset === "THIS_QUARTER") {
        const currentQuarterMonth = Math.floor(today.getMonth() / 3) * 3
        const startOfQuarter = new Date(today.getFullYear(), currentQuarterMonth, 1)
        matchesDate = docDateOnly >= startOfQuarter && docDateOnly <= today
      } else if (datePreset === "THIS_FY") {
        const fyYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
        const startOfFY = new Date(fyYear, 3, 1)
        matchesDate = docDateOnly >= startOfFY && docDateOnly <= today
      } else if (datePreset === "LAST_365") {
        const past365 = new Date(today)
        past365.setDate(today.getDate() - 365)
        matchesDate = docDateOnly >= past365 && docDateOnly <= today
      } else if (datePreset === "CUSTOM") {
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate)
          const end = new Date(customEndDate)
          end.setHours(23, 59, 59, 999)
          matchesDate = docDate >= start && docDate <= end
        }
      }

      if (!matchesDate) return false

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const partyName = doc.partyName.toLowerCase()
        const num = doc.number.toLowerCase()
        const amt = doc.grandTotal.toString()
        return partyName.includes(q) || num.includes(q) || amt.includes(q)
      }

      return true
    })
  }, [documents, datePreset, customStartDate, customEndDate, searchQuery])

  // Recalculate summary cards dynamically
  const recalculatedCards = React.useMemo(() => {
    if (documents.length === 0) return summaryCards

    const totalGrand = filteredDocuments.reduce((a, d) => a + Number(d.grandTotal || 0), 0)
    const totalPaid = filteredDocuments.reduce((a, d) => a + Number(d.amountPaid || 0), 0)
    const totalUnpaid = Math.max(0, totalGrand - totalPaid)

    return summaryCards.map((c) => {
      const lower = c.label.toLowerCase()
      if (lower.includes("total")) return { ...c, value: totalGrand }
      if (lower.includes("paid") || lower.includes("received")) return { ...c, value: totalPaid }
      if (lower.includes("unpaid") || lower.includes("balance") || lower.includes("open")) return { ...c, value: totalUnpaid }
      return c
    })
  }, [filteredDocuments, summaryCards, documents.length])

  const handleSelectDatePreset = (preset: DateRangePreset, label: string) => {
    setDatePreset(preset)
    setDateLabel(label)
    if (preset !== "CUSTOM") {
      setIsDatePickerOpen(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#f4f5f8] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-gray-800">{title}</h1>
        
        <div className="flex items-center gap-3">
          {/* Reports Menu */}
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
                  Reports
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
                  <Package className="h-4 w-4 text-blue-600" /> Stock & Item Summary
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

          {/* Settings */}
          <Link
            href="/settings"
            className="p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-600 transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>

          {/* Layout Grid */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {recalculatedCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col shadow-sm">
            <div className={`flex items-center gap-2 text-sm font-medium mb-1 ${card.color}`}>
              {card.label}
            </div>
            <div className="text-2xl font-semibold text-gray-900">₹ {formatINR(card.value)}</div>
            <span className="text-[11px] text-gray-400 mt-1">{dateLabel}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm w-72 focus:outline-none focus:border-[#5c429e] bg-white shadow-sm"
              placeholder="Search..."
            />
          </div>

          {/* Date Picker Preset Dropdown */}
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

        <Link href={createHref}>
          <button className="flex items-center gap-2 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> {createLabel}
          </button>
        </Link>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-600 bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                <th className="px-4 py-3 font-semibold w-32 cursor-pointer hover:bg-gray-200">Date <span className="text-[10px]">↕</span></th>
                <th className="px-4 py-3 font-semibold w-40">Number</th>
                <th className="px-4 py-3 font-semibold">Party Name</th>
                <th className="px-4 py-3 font-semibold w-40 cursor-pointer hover:bg-gray-200">Amount <span className="text-[10px]">↕</span></th>
                <th className="px-4 py-3 font-semibold w-24">Status</th>
                <th className="px-4 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">{emptyMessage}</td>
                </tr>
              ) : (
                filteredDocuments.map((doc, i) => (
                  <tr key={doc.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 1 ? 'bg-[#f8f9fc]' : 'bg-white'} ${isCompactView ? 'py-1.5' : 'py-3'}`}>
                    <td className="px-4 py-3 text-center"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{doc.date}</td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">{doc.number}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{doc.partyName}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800 font-semibold">₹ {formatINR(doc.grandTotal)}</div>
                      {doc.amountPaid !== undefined && doc.amountPaid < doc.grandTotal && (
                        <div className="text-xs text-red-500 font-medium">(₹ {formatINR(doc.grandTotal - doc.amountPaid)} unpaid)</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${statusColors[doc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      <Link href={doc.detailHref}>
                        <button className="p-1 hover:bg-gray-200 rounded"><MoreVertical className="h-4 w-4" /></button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
