"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Printer,
  Share2,
  FileCheck,
  CheckCircle,
  Clock,
  Building2,
  Phone,
  MapPin,
  RefreshCw
} from "lucide-react"

interface QuotationDetailData {
  id: string
  number: string
  date: string
  expiryDate: string | null
  status: string
  convertedToInvoiceId: string | null
  subTotal: number
  totalDiscount: number
  totalTax: number
  grandTotal: number
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

interface EstimateDetailViewProps {
  quotation: QuotationDetailData
}

function formatINR(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function EstimateDetailView({ quotation }: EstimateDetailViewProps) {
  const router = useRouter()
  const [converting, setConverting] = React.useState(false)

  const handleConvert = async () => {
    if (!confirm("Are you sure you want to convert this Quotation into a Sales Invoice?")) return

    setConverting(true)
    try {
      const res = await fetch(`/api/sales/estimates/${quotation.id}/convert`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        alert("Successfully converted to Sales Invoice #" + data.invoice.invoiceNumber)
        router.push(`/sales/invoices/${data.invoice.id}`)
      } else {
        alert("Error: " + data.error)
      }
    } catch (e) {
      alert("Failed to convert estimate")
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] font-sans overflow-y-auto pb-10">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/sales/estimates"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Estimates
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Quotation {quotation.number}</h1>
          <span
            className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
              quotation.status === "ACCEPTED"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : quotation.status === "REJECTED"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {quotation.status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#f8f9fa] text-gray-700 border border-gray-200 px-3.5 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4 text-gray-500" /> Print Estimate
          </button>

          {!quotation.convertedToInvoiceId ? (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="flex items-center gap-1.5 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${converting ? "animate-spin" : ""}`} />
              {converting ? "Converting..." : "Convert to Sales Invoice"}
            </button>
          ) : (
            <Link href={`/sales/invoices/${quotation.convertedToInvoiceId}`}>
              <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm">
                <FileCheck className="h-4 w-4" /> View Converted Invoice
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
          {/* Header Billed Details */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-6">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Quotation For:
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{quotation.party.name}</h2>
              <div className="text-xs text-gray-500 space-y-1 mt-2">
                <p>Phone: {quotation.party.mobileNumber}</p>
                <p>GSTIN: {quotation.party.gstin}</p>
                <p>Address: {quotation.party.billingAddress}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Quotation Details:
              </span>
              <p className="text-lg font-bold text-[#5c429e] mt-1">{quotation.number}</p>
              <div className="text-xs text-gray-500 space-y-1 mt-2">
                <p>
                  Date:{" "}
                  {new Date(quotation.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {quotation.expiryDate && (
                  <p>
                    Valid Until:{" "}
                    {new Date(quotation.expiryDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3 text-center w-24">Qty</th>
                <th className="px-4 py-3 text-right w-32">Rate (₹)</th>
                <th className="px-4 py-3 text-right w-24">Tax</th>
                <th className="px-4 py-3 text-right w-32">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotation.lines.map((l, i) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{l.itemName}</td>
                  <td className="px-4 py-3 text-center">{l.quantity}</td>
                  <td className="px-4 py-3 text-right">₹ {formatINR(l.rate)}</td>
                  <td className="px-4 py-3 text-right">{l.taxPercentage}%</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    ₹ {formatINR(l.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Totals */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>₹ {formatINR(quotation.subTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Tax (GST):</span>
                <span>₹ {formatINR(quotation.totalTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t">
                <span>Quotation Value:</span>
                <span className="text-[#5c429e]">₹ {formatINR(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
