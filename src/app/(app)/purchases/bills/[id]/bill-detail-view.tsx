"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Building2,
  Phone,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface BillDetailData {
  id: string
  number: string
  date: string
  status: string
  subTotal: number
  totalTax: number
  grandTotal: number
  amountPaid: number
  balanceDue: number
  party: {
    id: string
    name: string
    mobileNumber: string
    billingAddress: string
    gstin: string
  }
  lines: {
    id: string
    itemName: string
    quantity: number
    rate: number
    taxPercentage: number
    total: number
  }[]
}

interface BillDetailViewProps {
  bill: BillDetailData
}

function formatINR(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function BillDetailView({ bill }: BillDetailViewProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] font-sans overflow-y-auto pb-10">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/purchases/bills"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Purchase Bills
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Purchase Bill {bill.number}</h1>
          <span
            className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
              bill.status === "PAID"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : bill.status === "PARTIAL"
                ? "bg-orange-50 text-orange-700 border border-orange-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {bill.status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#f8f9fa] text-gray-700 border border-gray-200 px-3.5 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4 text-gray-500" /> Print Bill
          </button>
          <Link href="/purchases/payment-out/new">
            <button className="flex items-center gap-1.5 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm">
              <CreditCard className="h-4 w-4" /> Record Payment Out
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
          {/* Supplier Info */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-6">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Supplier (Bill From):
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{bill.party.name}</h2>
              <div className="text-xs text-gray-500 space-y-1 mt-2">
                <p>Phone: {bill.party.mobileNumber}</p>
                <p>GSTIN: {bill.party.gstin}</p>
                <p>Address: {bill.party.billingAddress}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Purchase Bill Details:
              </span>
              <p className="text-lg font-bold text-[#5c429e] mt-1">{bill.number}</p>
              <div className="text-xs text-gray-500 space-y-1 mt-2">
                <p>
                  Date:{" "}
                  {new Date(bill.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Purchased Item</th>
                <th className="px-4 py-3 text-center w-24">Qty</th>
                <th className="px-4 py-3 text-right w-32">Purchase Rate (₹)</th>
                <th className="px-4 py-3 text-right w-24">Tax</th>
                <th className="px-4 py-3 text-right w-32">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bill.lines.map((l, i) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{l.itemName}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-800">{l.quantity}</td>
                  <td className="px-4 py-3 text-right">₹ {formatINR(l.rate)}</td>
                  <td className="px-4 py-3 text-right">{l.taxPercentage}%</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    ₹ {formatINR(l.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & Paid Status */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>₹ {formatINR(bill.subTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Tax (GST):</span>
                <span>₹ {formatINR(bill.totalTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t">
                <span>Grand Total:</span>
                <span>₹ {formatINR(bill.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Amount Paid:</span>
                <span>₹ {formatINR(bill.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-red-600 pt-1 border-t">
                <span>Balance Payable:</span>
                <span>₹ {formatINR(bill.balanceDue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
