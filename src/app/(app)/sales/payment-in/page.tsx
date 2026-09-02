import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Search, Calendar, Plus, MoreVertical, BarChart2, Settings, LayoutGrid, ChevronDown } from "lucide-react"

function formatINR(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function PaymentInPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) redirect("/login")

  const payments = await db.payment.findMany({
    where: { businessId: session.user.businessId },
    include: { party: true, invoice: true },
    orderBy: { date: "desc" },
    take: 50,
  })

  const totalReceived = payments.reduce((a, p) => a + Number(p.amount), 0)
  const cash = payments.filter(p => p.mode === "CASH").reduce((a, p) => a + Number(p.amount), 0)
  const bank = payments.filter(p => p.mode === "BANK" || p.mode === "UPI").reduce((a, p) => a + Number(p.amount), 0)
  const cheque = payments.filter(p => p.mode === "CHEQUE").reduce((a, p) => a + Number(p.amount), 0)

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#f4f5f8]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-gray-800">Payment In</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 border border-blue-200 text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-md text-sm font-medium">
            <BarChart2 className="h-4 w-4" /> Reports <ChevronDown className="h-3 w-3" />
          </button>
          <button className="p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-500"><Settings className="h-4 w-4" /></button>
          <button className="p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-500"><LayoutGrid className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#f3f0ff] border border-[#d6c7ff] rounded-lg p-4">
          <div className="text-sm font-medium text-[#5c429e] mb-1">Total Received</div>
          <div className="text-2xl font-semibold text-gray-900">₹ {formatINR(totalReceived)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-emerald-600 mb-1">Cash</div>
          <div className="text-2xl font-semibold text-gray-900">₹ {formatINR(cash)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-600 mb-1">Bank / UPI</div>
          <div className="text-2xl font-semibold text-gray-900">₹ {formatINR(bank)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-500 mb-1">Cheque</div>
          <div className="text-2xl font-semibold text-gray-900">₹ {formatINR(cheque)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" className="pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm w-64 focus:outline-none" placeholder="Search..." />
          </div>
          <button className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 px-3 py-2 rounded-md text-sm font-medium">
            <Calendar className="h-4 w-4" /> Last 365 Days
          </button>
        </div>
        <Link href="/sales/payment-in/new">
          <button className="flex items-center gap-2 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-4 py-2 rounded-md text-sm font-medium">
            <Plus className="h-4 w-4" /> Record Payment
          </button>
        </Link>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-600 bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-12 text-center"><input type="checkbox" /></th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Party</th>
              <th className="px-4 py-3 font-semibold">Invoice</th>
              <th className="px-4 py-3 font-semibold">Mode</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No payments recorded yet.</td></tr>
            ) : (
              payments.map((p, i) => (
                <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 1 ? 'bg-[#f8f9fc]' : ''}`}>
                  <td className="px-4 py-3 text-center"><input type="checkbox" /></td>
                  <td className="px-4 py-3 text-gray-700">{p.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{p.party.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.invoice?.invoiceNumber ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-600">{p.mode}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">₹ {formatINR(Number(p.amount))}</td>
                  <td className="px-4 py-3"><button className="p-1 hover:bg-gray-200 rounded"><MoreVertical className="h-4 w-4 text-gray-400" /></button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
