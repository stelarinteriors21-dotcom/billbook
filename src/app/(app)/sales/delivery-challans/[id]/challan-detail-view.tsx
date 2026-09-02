"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Printer,
  Truck,
  FileCheck,
  MapPin,
  RefreshCw
} from "lucide-react"

interface ChallanDetailData {
  id: string
  number: string
  date: string
  vehicleNumber: string
  deliveryAddress: string
  notes: string
  status: string
  convertedToInvoiceId: string | null
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
    total: number
  }[]
}

interface ChallanDetailViewProps {
  challan: ChallanDetailData
}

function formatINR(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ChallanDetailView({ challan }: ChallanDetailViewProps) {
  const router = useRouter()
  const [converting, setConverting] = React.useState(false)

  const handleConvert = async () => {
    if (!confirm("Are you sure you want to convert this Delivery Challan into a Sales Invoice?")) return

    setConverting(true)
    try {
      const res = await fetch(`/api/sales/delivery-challans/${challan.id}/convert`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        alert("Successfully created Sales Invoice #" + data.invoice.invoiceNumber)
        router.push(`/sales/invoices/${data.invoice.id}`)
      } else {
        alert("Error: " + data.error)
      }
    } catch (e) {
      alert("Failed to convert challan")
    } finally {
      setConverting(false)
    }
  }

  const grandTotal = challan.lines.reduce((a, l) => a + l.total, 0)

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] font-sans overflow-y-auto pb-10">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/sales/delivery-challans"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Challans
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Delivery Challan {challan.number}</h1>
          <span
            className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
              challan.status === "CONVERTED"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-orange-50 text-orange-700 border border-orange-200"
            }`}
          >
            {challan.status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#f8f9fa] text-gray-700 border border-gray-200 px-3.5 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4 text-gray-500" /> Print Dispatch Slip
          </button>

          {!challan.convertedToInvoiceId ? (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="flex items-center gap-1.5 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${converting ? "animate-spin" : ""}`} />
              {converting ? "Converting..." : "Convert to Sales Invoice"}
            </button>
          ) : (
            <Link href={`/sales/invoices/${challan.convertedToInvoiceId}`}>
              <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm">
                <FileCheck className="h-4 w-4" /> View Converted Invoice
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Slip */}
      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
          {/* Top Details */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-6">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Consignee / Party:
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{challan.party.name}</h2>
              <div className="text-xs text-gray-500 space-y-1 mt-2">
                <p>Phone: {challan.party.mobileNumber}</p>
                <p>GSTIN: {challan.party.gstin}</p>
                <p>Address: {challan.party.billingAddress}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Dispatch Slip:
              </span>
              <p className="text-lg font-bold text-[#5c429e] mt-1">{challan.number}</p>
              <div className="text-xs text-gray-500 space-y-1 mt-2">
                <p>
                  Date:{" "}
                  {new Date(challan.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="font-semibold text-gray-700">
                  Vehicle No: {challan.vehicleNumber}
                </p>
                <p>Destination: {challan.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Lines Table */}
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Dispatched Item</th>
                <th className="px-4 py-3 text-center w-28">Quantity</th>
                <th className="px-4 py-3 text-right w-32">Rate (₹)</th>
                <th className="px-4 py-3 text-right w-32">Estimated Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {challan.lines.map((l, i) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{l.itemName}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-800">{l.quantity}</td>
                  <td className="px-4 py-3 text-right">₹ {formatINR(l.rate)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    ₹ {formatINR(l.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <div className="w-64 flex justify-between font-bold text-base text-gray-900">
              <span>Total Goods Valuation:</span>
              <span className="text-[#5c429e]">₹ {formatINR(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
