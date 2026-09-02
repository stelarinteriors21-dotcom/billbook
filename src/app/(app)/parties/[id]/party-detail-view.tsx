"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  Download,
  Plus,
  Edit,
  Trash2,
  FileText,
  CreditCard,
  Receipt,
  Printer,
  Share2,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Save
} from "lucide-react"

interface PartyData {
  id: string
  name: string
  partyType: "CUSTOMER" | "SUPPLIER"
  mobileNumber: string
  email: string
  billingAddress: string
  shippingAddress: string
  gstin: string
  creditLimit: number | null
  netBalance: number
  totalSales: number
  totalReceived: number
  createdAt: string
}

interface TransactionItem {
  id: string
  type: string
  documentType: string
  number: string
  date: string
  total: number
  amountPaid: number
  balance: number
  status: string
  mode?: string
  notes?: string
  url: string
}

interface PartyDetailViewProps {
  party: PartyData
  transactions: TransactionItem[]
}

function formatINR(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function PartyDetailView({
  party,
  transactions,
}: PartyDetailViewProps) {
  const router = useRouter()
  const [tab, setTab] = React.useState<"LEDGER" | "PROFILE">("LEDGER")

  // Profile Edit State
  const [name, setName] = React.useState(party.name)
  const [mobileNumber, setMobileNumber] = React.useState(party.mobileNumber === "-" ? "" : party.mobileNumber)
  const [email, setEmail] = React.useState(party.email === "-" ? "" : party.email)
  const [billingAddress, setBillingAddress] = React.useState(party.billingAddress === "-" ? "" : party.billingAddress)
  const [gstin, setGstin] = React.useState(party.gstin === "-" ? "" : party.gstin)
  const [creditLimit, setCreditLimit] = React.useState(party.creditLimit ? String(party.creditLimit) : "")
  const [saving, setSaving] = React.useState(false)
  const [savedSuccess, setSavedSuccess] = React.useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)
    try {
      const res = await fetch(`/api/parties/${party.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          partyType: party.partyType,
          mobileNumber,
          email,
          billingAddress,
          gstin,
          creditLimit: creditLimit ? Number(creditLimit) : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 3000)
        router.refresh()
      } else {
        alert("Error updating party: " + data.error)
      }
    } catch (e) {
      alert("Failed to update party profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#f4f5f8] overflow-y-auto">
      {/* Top Action Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/parties"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Parties
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{party.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                party.partyType === "CUSTOMER"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-purple-50 text-purple-700 border border-purple-200"
              }`}
            >
              {party.partyType}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4 text-gray-500" /> Print Statement
          </button>
          <Link href={`/sales/invoices/new`}>
            <button className="flex items-center gap-1.5 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus className="h-4 w-4" /> Create Invoice
            </button>
          </Link>
          <Link href={`/sales/payment-in/new`}>
            <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <CreditCard className="h-4 w-4" /> Record Payment
            </button>
          </Link>
        </div>
      </div>

      {/* Party Overview Card & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Contact Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Contact Details
            </h2>
            <button
              onClick={() => setTab("PROFILE")}
              className="text-xs text-[#5c429e] hover:underline font-semibold"
            >
              Edit
            </button>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{party.mobileNumber}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{party.email}</span>
            </div>
            <div className="flex items-start gap-3 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-600 leading-relaxed">
                {party.billingAddress}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 pt-1">
              <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-xs font-mono font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                GSTIN: {party.gstin}
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Net Balance Widget */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Current Net Balance
            </span>
            <div className="mt-2">
              {party.netBalance > 0 ? (
                <div>
                  <h3 className="text-3xl font-bold text-emerald-600">
                    ₹ {formatINR(party.netBalance)}
                  </h3>
                  <p className="text-xs text-emerald-700 mt-1 font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Party owes you
                  </p>
                </div>
              ) : party.netBalance < 0 ? (
                <div>
                  <h3 className="text-3xl font-bold text-red-500">
                    ₹ {formatINR(Math.abs(party.netBalance))}
                  </h3>
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    You owe this party
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">₹ 0.00</h3>
                  <p className="text-xs text-gray-500 mt-1">All dues cleared</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Credit Limit:</span>
            <span className="font-semibold text-gray-800">
              {party.creditLimit ? `₹ ${formatINR(party.creditLimit)}` : "No limit"}
            </span>
          </div>
        </div>

        {/* Right: Lifetime Financials */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-3">
            Lifetime Transactions
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Billed / Sales:</span>
              <span className="font-bold text-gray-900">
                ₹ {formatINR(party.totalSales)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Payments Received:</span>
              <span className="font-bold text-emerald-600">
                ₹ {formatINR(party.totalReceived)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Transactions:</span>
              <span className="font-semibold text-gray-800">
                {transactions.length} vouchers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Ledger History */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="flex items-center border-b border-gray-200 px-6 bg-gray-50">
          <button
            onClick={() => setTab("LEDGER")}
            className={`py-3.5 px-4 font-semibold text-xs transition-colors border-b-2 ${
              tab === "LEDGER"
                ? "border-[#5c429e] text-[#5c429e] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Transaction Statement & Ledger ({transactions.length})
          </button>
          <button
            onClick={() => setTab("PROFILE")}
            className={`py-3.5 px-4 font-semibold text-xs transition-colors border-b-2 ${
              tab === "PROFILE"
                ? "border-[#5c429e] text-[#5c429e] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Party Profile & Settings
          </button>
        </div>

        {tab === "LEDGER" ? (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-600 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Voucher / Ref #</th>
                  <th className="px-5 py-3 font-semibold text-right">Debit / Total</th>
                  <th className="px-5 py-3 font-semibold text-right">Credit / Paid</th>
                  <th className="px-5 py-3 font-semibold text-right">Balance Due</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      <div className="max-w-xs mx-auto text-center">
                        <Receipt className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="font-semibold text-gray-800">No transactions recorded</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Create an invoice or record a payment to view the ledger statement.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => (
                    <tr
                      key={tx.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        idx % 2 === 1 ? "bg-[#fcfdff]" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                            tx.type === "SALES"
                              ? "bg-blue-50 text-blue-700"
                              : tx.type === "PAYMENT"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {tx.documentType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        <Link
                          href={tx.url}
                          className="hover:text-[#5c429e] hover:underline"
                        >
                          {tx.number}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                        {tx.type !== "PAYMENT" ? `₹ ${formatINR(tx.total)}` : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-emerald-600">
                        ₹ {formatINR(tx.amountPaid)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-800">
                        {tx.balance > 0 ? (
                          <span className="text-red-500">
                            ₹ {formatINR(tx.balance)}
                          </span>
                        ) : (
                          <span className="text-emerald-600">₹ 0.00</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                            tx.status === "PAID" || tx.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-600"
                              : tx.status === "PARTIAL"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="p-6 max-w-2xl space-y-6">
            <h3 className="text-base font-bold text-gray-900">
              Edit Party Profile
            </h3>

            {savedSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200">
                <CheckCircle className="h-4 w-4" /> Party profile updated successfully!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Party Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Billing Address
                </label>
                <textarea
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
