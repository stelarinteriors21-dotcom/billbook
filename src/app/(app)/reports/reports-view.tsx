"use client"

import * as React from "react"
import {
  BarChart2,
  FileText,
  TrendingUp,
  Receipt,
  Download,
  Printer,
  Calendar,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  CheckCircle2,
  PieChart,
  Table,
  SlidersHorizontal,
  DollarSign
} from "lucide-react"
import { exportToCSV } from "@/lib/export-utils"

interface InvoiceSummary {
  id: string
  type: string
  number: string
  date: string
  partyName: string
  partyGstin: string
  taxableAmount: number
  totalTax: number
  grandTotal: number
  status: string
}

interface PaymentRecord {
  id: string
  date: string
  partyName: string
  mode: string
  amount: number
  reference: string
}

interface ItemStockRecord {
  id: string
  name: string
  category: string
  unit: string
  salesPrice: number
  purchasePrice: number
  currentStock: number
  stockValue: number
}

interface ReportsViewProps {
  totalSalesRevenue: number
  totalPurchaseCost: number
  grossProfit: number
  totalGstOutput: number
  totalGstInput: number
  netGstPayable: number
  invoices: InvoiceSummary[]
  payments: PaymentRecord[]
  items: ItemStockRecord[]
}

function formatINR(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ReportsView({
  totalSalesRevenue,
  totalPurchaseCost,
  grossProfit,
  totalGstOutput,
  totalGstInput,
  netGstPayable,
  invoices,
  payments,
  items,
}: ReportsViewProps) {
  const [reportType, setReportType] = React.useState<
    "PL" | "GSTR1" | "GSTR3B" | "DAYBOOK" | "STOCK"
  >("PL")

  const salesInvoices = invoices.filter((i) => i.type === "SALES")
  const purchaseInvoices = invoices.filter((i) => i.type === "PURCHASE")

  const handleExportCurrentReport = () => {
    if (reportType === "PL") {
      const headers = ["Account Head", "Amount (₹)"]
      const rows = [
        ["Total Revenue from Operations (Sales)", totalSalesRevenue],
        ["Cost of Goods Sold (Purchases)", totalPurchaseCost],
        ["Gross Profit", grossProfit],
        ["Net Margin", totalSalesRevenue > 0 ? `${((grossProfit / totalSalesRevenue) * 100).toFixed(1)}%` : "0%"],
      ]
      exportToCSV("Profit_And_Loss_Statement", rows, headers)
    } else if (reportType === "GSTR1") {
      const headers = ["Invoice #", "Date", "Customer Name", "Customer GSTIN", "Taxable Value (₹)", "Total GST (₹)", "Grand Total (₹)"]
      const rows = salesInvoices.map((inv) => [
        inv.number,
        inv.date.split("T")[0],
        inv.partyName,
        inv.partyGstin,
        inv.taxableAmount,
        inv.totalTax,
        inv.grandTotal,
      ])
      exportToCSV("GSTR1_Outward_Supplies", rows, headers)
    } else if (reportType === "GSTR3B") {
      const headers = ["Tax Head", "Output Tax (Sales)", "Input Tax Credit (Purchases)", "Net Tax Payable"]
      const rows = [
        ["GST Combined", totalGstOutput, totalGstInput, netGstPayable],
        ["CGST (50%)", totalGstOutput / 2, totalGstInput / 2, netGstPayable / 2],
        ["SGST (50%)", totalGstOutput / 2, totalGstInput / 2, netGstPayable / 2],
      ]
      exportToCSV("GSTR3B_Tax_Summary", rows, headers)
    } else if (reportType === "DAYBOOK") {
      const headers = ["Date", "Transaction Type", "Ref #", "Party Name", "Amount (₹)"]
      const rows = [
        ...invoices.map((inv) => [inv.date.split("T")[0], inv.type === "SALES" ? "Sales Invoice" : "Purchase Bill", inv.number, inv.partyName, inv.grandTotal]),
        ...payments.map((p) => [p.date.split("T")[0], `Payment (${p.mode})`, p.reference || "-", p.partyName, p.amount]),
      ]
      exportToCSV("Daybook_Register", rows, headers)
    } else if (reportType === "STOCK") {
      const headers = ["Item Name", "Category", "Current Stock", "Unit", "Purchase Price (₹)", "Sales Price (₹)", "Stock Value (₹)"]
      const rows = items.map((i) => [
        i.name,
        i.category,
        i.currentStock,
        i.unit,
        i.purchasePrice,
        i.salesPrice,
        i.stockValue,
      ])
      exportToCSV("Stock_Valuation_Summary", rows, headers)
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#f4f5f8] overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-800">
            Reports & GST Taxation
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Financial statements, profit & loss, tax returns & operational registers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4 text-gray-500" /> Print Report
          </button>
          <button
            onClick={handleExportCurrentReport}
            className="flex items-center gap-2 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" /> Export CSV / Excel
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Sales Revenue
          </span>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            ₹ {formatINR(totalSalesRevenue)}
          </h3>
          <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" /> Gross turnover
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Purchase Cost
          </span>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            ₹ {formatINR(totalPurchaseCost)}
          </h3>
          <p className="text-xs text-gray-500 mt-1 font-medium">Cost of goods bought</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Gross Business Profit
          </span>
          <h3
            className={`text-2xl font-bold mt-2 ${
              grossProfit >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            ₹ {formatINR(grossProfit)}
          </h3>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Margin:{" "}
            {totalSalesRevenue > 0
              ? `${((grossProfit / totalSalesRevenue) * 100).toFixed(1)}%`
              : "0%"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Net GST Liability
          </span>
          <h3 className="text-2xl font-bold text-[#5c429e] mt-2">
            ₹ {formatINR(netGstPayable)}
          </h3>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Output: ₹ {formatINR(totalGstOutput)} | Input: ₹ {formatINR(totalGstInput)}
          </p>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="flex items-center border-b border-gray-200 px-6 bg-gray-50 overflow-x-auto">
          <button
            onClick={() => setReportType("PL")}
            className={`py-3.5 px-4 font-semibold text-xs whitespace-nowrap transition-colors border-b-2 ${
              reportType === "PL"
                ? "border-[#5c429e] text-[#5c429e] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Profit & Loss (P&L)
          </button>
          <button
            onClick={() => setReportType("GSTR1")}
            className={`py-3.5 px-4 font-semibold text-xs whitespace-nowrap transition-colors border-b-2 ${
              reportType === "GSTR1"
                ? "border-[#5c429e] text-[#5c429e] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            GSTR-1 (Outward Supplies)
          </button>
          <button
            onClick={() => setReportType("GSTR3B")}
            className={`py-3.5 px-4 font-semibold text-xs whitespace-nowrap transition-colors border-b-2 ${
              reportType === "GSTR3B"
                ? "border-[#5c429e] text-[#5c429e] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            GSTR-3B Tax Summary
          </button>
          <button
            onClick={() => setReportType("DAYBOOK")}
            className={`py-3.5 px-4 font-semibold text-xs whitespace-nowrap transition-colors border-b-2 ${
              reportType === "DAYBOOK"
                ? "border-[#5c429e] text-[#5c429e] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Daily Daybook Register
          </button>
          <button
            onClick={() => setReportType("STOCK")}
            className={`py-3.5 px-4 font-semibold text-xs whitespace-nowrap transition-colors border-b-2 ${
              reportType === "STOCK"
                ? "border-[#5c429e] text-[#5c429e] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Stock Valuation Summary
          </button>
        </div>

        {/* Report Content Panels */}
        <div className="p-6 flex-1">
          {/* 1. PROFIT & LOSS */}
          {reportType === "PL" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b border-gray-200 font-bold text-sm text-gray-800">
                  Income Statement / Profit & Loss Statement
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <tr className="bg-emerald-50/40 font-semibold">
                      <td className="p-4 text-emerald-900">A. Revenue from Operations (Sales)</td>
                      <td className="p-4 text-right text-emerald-700">₹ {formatINR(totalSalesRevenue)}</td>
                    </tr>
                    <tr className="bg-red-50/30 font-semibold">
                      <td className="p-4 text-red-900">B. Cost of Purchases / Inward Supplies</td>
                      <td className="p-4 text-right text-red-600">₹ {formatINR(totalPurchaseCost)}</td>
                    </tr>
                    <tr className="bg-purple-50/40 font-bold text-base">
                      <td className="p-4 text-[#5c429e]">Gross Profit (A - B)</td>
                      <td className={`p-4 text-right ${grossProfit >= 0 ? "text-[#5c429e]" : "text-red-500"}`}>
                        ₹ {formatINR(grossProfit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. GSTR-1 */}
          {reportType === "GSTR1" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-600 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Invoice #</th>
                    <th className="px-4 py-3 font-semibold">Recipient Customer</th>
                    <th className="px-4 py-3 font-semibold">GSTIN</th>
                    <th className="px-4 py-3 font-semibold text-right">Taxable Value</th>
                    <th className="px-4 py-3 font-semibold text-right">GST Amount</th>
                    <th className="px-4 py-3 font-semibold text-right">Invoice Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salesInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        No outward supplies recorded for GST filing.
                      </td>
                    </tr>
                  ) : (
                    salesInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 text-gray-700">{inv.date.split("T")[0]}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{inv.number}</td>
                        <td className="px-4 py-3 text-gray-800">{inv.partyName}</td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-600">{inv.partyGstin}</td>
                        <td className="px-4 py-3 text-right">₹ {formatINR(inv.taxableAmount)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">₹ {formatINR(inv.totalTax)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">₹ {formatINR(inv.grandTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. GSTR-3B */}
          {reportType === "GSTR3B" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b border-gray-200 font-bold text-sm text-gray-800">
                  GSTR-3B Monthly Tax Summary
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="p-4 text-left font-semibold">Tax Category</th>
                      <th className="p-4 text-right font-semibold">Integrated (IGST)</th>
                      <th className="p-4 text-right font-semibold">Central (CGST)</th>
                      <th className="p-4 text-right font-semibold">State (SGST)</th>
                      <th className="p-4 text-right font-semibold">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="p-4 font-semibold text-gray-800">3.1 Outward Taxable Supplies (Output Tax)</td>
                      <td className="p-4 text-right">₹ 0.00</td>
                      <td className="p-4 text-right">₹ {formatINR(totalGstOutput / 2)}</td>
                      <td className="p-4 text-right">₹ {formatINR(totalGstOutput / 2)}</td>
                      <td className="p-4 text-right font-bold text-gray-900">₹ {formatINR(totalGstOutput)}</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-gray-800">4. Eligible ITC (Input Tax Credit)</td>
                      <td className="p-4 text-right">₹ 0.00</td>
                      <td className="p-4 text-right">₹ {formatINR(totalGstInput / 2)}</td>
                      <td className="p-4 text-right">₹ {formatINR(totalGstInput / 2)}</td>
                      <td className="p-4 text-right font-bold text-emerald-600">₹ {formatINR(totalGstInput)}</td>
                    </tr>
                    <tr className="bg-purple-50/50 font-bold text-base">
                      <td className="p-4 text-[#5c429e]">5. Net Tax Payable in Cash</td>
                      <td className="p-4 text-right">₹ 0.00</td>
                      <td className="p-4 text-right">₹ {formatINR(netGstPayable / 2)}</td>
                      <td className="p-4 text-right">₹ {formatINR(netGstPayable / 2)}</td>
                      <td className="p-4 text-right text-[#5c429e]">₹ {formatINR(netGstPayable)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. DAYBOOK */}
          {reportType === "DAYBOOK" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-600 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Transaction Type</th>
                    <th className="px-4 py-3 font-semibold">Ref #</th>
                    <th className="px-4 py-3 font-semibold">Party Name</th>
                    <th className="px-4 py-3 font-semibold text-right">Debit / In</th>
                    <th className="px-4 py-3 font-semibold text-right">Credit / Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 text-gray-700">{inv.date.split("T")[0]}</td>
                      <td className="px-4 py-3 font-medium">
                        <span className={`px-2 py-0.5 rounded text-xs ${inv.type === "SALES" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {inv.type === "SALES" ? "Sales Invoice" : "Purchase Bill"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{inv.number}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">{inv.partyName}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">₹ {formatINR(inv.grandTotal)}</td>
                      <td className="px-4 py-3 text-right text-gray-400">-</td>
                    </tr>
                  ))}
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 bg-emerald-50/20">
                      <td className="px-4 py-3 text-gray-700">{p.date.split("T")[0]}</td>
                      <td className="px-4 py-3 font-medium">
                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 font-semibold">
                          Payment ({p.mode})
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.reference || "-"}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">{p.partyName}</td>
                      <td className="px-4 py-3 text-right text-gray-400">-</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">₹ {formatINR(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. STOCK */}
          {reportType === "STOCK" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-600 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item Name</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold text-center">Stock In Hand</th>
                    <th className="px-4 py-3 font-semibold text-right">Purchase Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Sales Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Total Inventory Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((i) => (
                    <tr key={i.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-semibold text-gray-900">{i.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{i.category}</td>
                      <td className="px-4 py-3 text-center font-bold text-gray-800">
                        {i.currentStock} {i.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">₹ {formatINR(i.purchasePrice)}</td>
                      <td className="px-4 py-3 text-right text-gray-900">₹ {formatINR(i.salesPrice)}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#5c429e]">
                        ₹ {formatINR(i.stockValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
