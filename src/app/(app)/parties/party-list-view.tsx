"use client"

import * as React from "react"
import Link from "next/link"
import {
  Users,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Filter,
  Download,
  Upload,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
  Mail,
  MapPin,
  Building2,
  FileSpreadsheet,
  CheckCircle,
  FileText
} from "lucide-react"
import { CreatePartyModal } from "@/components/party/create-party-modal"
import { exportToCSV } from "@/lib/export-utils"

interface PartyItem {
  id: string
  name: string
  partyType: "CUSTOMER" | "SUPPLIER"
  mobileNumber: string
  email: string
  billingAddress: string
  shippingAddress: string
  gstin: string
  balance: number
  createdAt: string
}

interface PartyListViewProps {
  initialParties: PartyItem[]
  totalReceivable: number
  totalPayable: number
}

function formatINR(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function PartyListView({
  initialParties,
  totalReceivable,
  totalPayable,
}: PartyListViewProps) {
  const [parties, setParties] = React.useState<PartyItem[]>(initialParties)
  const [tab, setTab] = React.useState<"ALL" | "CUSTOMER" | "SUPPLIER">("ALL")
  const [balanceFilter, setBalanceFilter] = React.useState<"ALL" | "RECEIVABLE" | "PAYABLE" | "ZERO">("ALL")
  const [search, setSearch] = React.useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
  const [importText, setImportText] = React.useState("")
  const [importing, setImporting] = React.useState(false)
  const [importMsg, setImportMsg] = React.useState("")

  // Filter parties based on search, tab & balance condition
  const filteredParties = React.useMemo(() => {
    return parties.filter((p) => {
      const matchTab = tab === "ALL" || p.partyType === tab
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.mobileNumber.includes(search) ||
        p.gstin.toLowerCase().includes(search.toLowerCase())

      let matchBalance = true
      if (balanceFilter === "RECEIVABLE") matchBalance = p.balance > 0
      else if (balanceFilter === "PAYABLE") matchBalance = p.balance < 0
      else if (balanceFilter === "ZERO") matchBalance = p.balance === 0

      return matchTab && matchSearch && matchBalance
    })
  }, [parties, tab, search, balanceFilter])

  const handlePartyCreated = (newParty: any) => {
    setParties((prev) => [
      {
        id: newParty.id,
        name: newParty.name,
        partyType: newParty.partyType,
        mobileNumber: newParty.mobileNumber || "-",
        email: newParty.email || "-",
        billingAddress: newParty.billingAddress || "-",
        shippingAddress: newParty.shippingAddress || "-",
        gstin: newParty.gstin || "-",
        balance: 0,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
    setIsCreateModalOpen(false)
  }

  const handleExportCSV = () => {
    const headers = ["Party Name", "Type", "Mobile Number", "Email", "GSTIN", "Billing Address", "Balance Due"]
    const rows = filteredParties.map((p) => [
      p.name,
      p.partyType,
      p.mobileNumber,
      p.email,
      p.gstin,
      p.billingAddress,
      p.balance,
    ])
    exportToCSV("Parties_List", rows, headers)
  }

  const handleImportCSV = async () => {
    if (!importText.trim()) return
    setImporting(true)
    setImportMsg("")
    try {
      const lines = importText.split("\n").filter((l) => l.trim().length > 0)
      const parsedParties = lines.map((line) => {
        const parts = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""))
        return {
          name: parts[0] || "New Party",
          partyType: parts[1]?.toUpperCase() === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER",
          mobileNumber: parts[2] || undefined,
          email: parts[3] || undefined,
          gstin: parts[4] || undefined,
          billingAddress: parts[5] || undefined,
        }
      })

      const res = await fetch("/api/parties/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parties: parsedParties }),
      })
      const data = await res.json()
      if (data.success) {
        setImportMsg(`Successfully imported ${data.count} parties!`)
        setTimeout(() => {
          setIsImportModalOpen(false)
          window.location.reload()
        }, 1500)
      } else {
        alert("Import error: " + data.error)
      }
    } catch (e) {
      alert("Failed to import parties")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#f4f5f8] overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-800">Parties</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your customer and supplier accounts, ledger statements & balances
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
            <Upload className="h-4 w-4 text-gray-500" /> Import Parties
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create Party
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Receivables (To Collect)
            </p>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ₹ {formatINR(totalReceivable)}
          </h3>
          <p className="text-xs text-gray-500 mt-2">
            Pending amount from {parties.filter((p) => p.balance > 0).length} customers
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Payables (To Pay)
            </p>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ₹ {formatINR(totalPayable)}
          </h3>
          <p className="text-xs text-gray-500 mt-2">
            Pending amount to {parties.filter((p) => p.balance < 0).length} suppliers
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Active Parties
            </p>
            <div className="p-2 bg-purple-50 rounded-lg text-[#5c429e]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{parties.length}</h3>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
            <span>
              Customers:{" "}
              <b className="text-gray-700">
                {parties.filter((p) => p.partyType === "CUSTOMER").length}
              </b>
            </span>
            <span>
              Suppliers:{" "}
              <b className="text-gray-700">
                {parties.filter((p) => p.partyType === "SUPPLIER").length}
              </b>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        {/* Tab Switcher & Search Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          {/* Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setTab("ALL")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === "ALL"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Parties ({parties.length})
            </button>
            <button
              onClick={() => setTab("CUSTOMER")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === "CUSTOMER"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Customers (
              {parties.filter((p) => p.partyType === "CUSTOMER").length})
            </button>
            <button
              onClick={() => setTab("SUPPLIER")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === "SUPPLIER"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Suppliers (
              {parties.filter((p) => p.partyType === "SUPPLIER").length})
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone or GSTIN..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:border-[#5c429e] transition-colors"
              />
            </div>

            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#5c429e]"
            >
              <option value="ALL">All Balances</option>
              <option value="RECEIVABLE">To Receive (Receivables)</option>
              <option value="PAYABLE">To Pay (Payables)</option>
              <option value="ZERO">Zero Balance</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-600 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Party Name</th>
                <th className="px-5 py-3.5 font-semibold">Type</th>
                <th className="px-5 py-3.5 font-semibold">Contact Details</th>
                <th className="px-5 py-3.5 font-semibold">GSTIN</th>
                <th className="px-5 py-3.5 font-semibold text-right">Balance Due</th>
                <th className="px-5 py-3.5 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    <div className="max-w-xs mx-auto text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">No parties found</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {search ? "No parties matching your search criteria." : "Create your first customer or supplier to get started."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredParties.map((party, idx) => (
                  <tr
                    key={party.id}
                    className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${
                      idx % 2 === 1 ? "bg-[#fcfdff]" : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/parties/${party.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-[#5c429e] flex items-center justify-center font-bold text-xs">
                          {party.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-[#5c429e] transition-colors">
                            {party.name}
                          </p>
                          {party.billingAddress !== "-" && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">
                              {party.billingAddress}
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          party.partyType === "CUSTOMER"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {party.partyType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{party.mobileNumber}</span>
                        </div>
                        {party.email !== "-" && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span>{party.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 font-mono">
                      {party.gstin}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {party.balance > 0 ? (
                        <div className="text-sm font-bold text-emerald-600">
                          ₹ {formatINR(party.balance)}
                          <span className="block text-[10px] font-normal text-gray-400">
                            You'll Receive
                          </span>
                        </div>
                      ) : party.balance < 0 ? (
                        <div className="text-sm font-bold text-red-500">
                          ₹ {formatINR(Math.abs(party.balance))}
                          <span className="block text-[10px] font-normal text-gray-400">
                            You'll Pay
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-400">
                          ₹ 0.00
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link href={`/parties/${party.id}`}>
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
              <Upload className="h-5 w-5 text-purple-600" /> Import Parties via CSV / Text
            </h3>
            <p className="text-xs text-gray-500">
              Format: <code>Name, Type (CUSTOMER/SUPPLIER), Phone, Email, GSTIN, Address</code> (1 per line)
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
              placeholder="Ramesh Stores, CUSTOMER, 9876543210, ramesh@gmail.com, 29ABCDE1234F1Z5, Bangalore&#10;Alpha Traders, SUPPLIER, 9123456780, alpha@supply.com, 29XYZDE1234F1Z9, Mumbai"
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
                {importing ? "Importing..." : "Import Parties"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <CreatePartyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePartyCreated}
      />
    </div>
  )
}
