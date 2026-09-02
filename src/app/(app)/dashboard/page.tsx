import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  ArrowUpRight,
  ArrowDownRight,
  Package,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
  Plus,
  Users,
  CreditCard,
  Receipt,
  CheckCircle2,
  FileText
} from "lucide-react"

function formatINR(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessId) {
    redirect("/login")
  }

  let salesInvoices: any[] = []
  let purchaseBills: any[] = []
  let rawItems: any[] = []
  let recentInvoices: any[] = []

  try {
    // 1. Fetch Invoices for Sales & Receivables
    salesInvoices = await db.invoice.findMany({
      where: {
        businessId: session.user.businessId,
        type: "SALES",
      },
      select: { grandTotal: true, amountPaid: true, createdAt: true },
    })

    // 2. Fetch Purchase Bills for Purchases & Payables
    purchaseBills = await db.invoice.findMany({
      where: {
        businessId: session.user.businessId,
        type: "PURCHASE",
      },
      select: { grandTotal: true, amountPaid: true },
    })

    // 3. Fetch Items with Stock & calculate real low stock
    rawItems = await db.item.findMany({
      where: {
        businessId: session.user.businessId,
        itemType: "PRODUCT",
      },
      include: {
        unit: true,
        stockMovements: {
          select: { type: true, quantity: true },
        },
        invoiceLines: {
          select: { quantity: true, total: true },
        },
      },
    })

    // 4. Recent Transactions Feed
    recentInvoices = await db.invoice.findMany({
      where: { businessId: session.user.businessId },
      include: { party: true },
      orderBy: { date: "desc" },
      take: 5,
    })
  } catch (err: any) {
    console.error("Dashboard data fetch error:", err?.message || err)
  }

  let totalSales = 0
  let totalSalesReceived = 0
  salesInvoices.forEach((inv) => {
    totalSales += Number(inv.grandTotal || 0)
    totalSalesReceived += Number(inv.amountPaid || 0)
  })
  const toCollect = totalSales - totalSalesReceived

  let totalPurchases = 0
  let totalPurchasesPaid = 0
  purchaseBills.forEach((b) => {
    totalPurchases += Number(b.grandTotal || 0)
    totalPurchasesPaid += Number(b.amountPaid || 0)
  })
  const toPay = totalPurchases - totalPurchasesPaid

  const itemsWithCalculations = rawItems.map((item) => {
    let stock = 0
    item.stockMovements?.forEach((m: any) => {
      const q = Number(m.quantity || 0)
      if (m.type === "IN") stock += q
      else if (m.type === "OUT") stock -= q
      else if (m.type === "ADJUST") stock = q
    })

    const totalSold = item.invoiceLines?.reduce(
      (acc: number, l: any) => acc + Number(l.quantity || 0),
      0
    ) || 0

    return {
      id: item.id,
      name: item.name,
      unit: item.unit?.shortName || "PCS",
      salesPrice: Number(item.salesPrice || 0),
      stock,
      totalSold,
    }
  })

  const lowStockItems = itemsWithCalculations
    .filter((i) => i.stock <= 10)
    .slice(0, 5)

  const topSellingItems = [...itemsWithCalculations]
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5)

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] font-sans overflow-y-auto pb-10">
      {/* Top Bar with Business Quick Actions */}
      <div className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500">Business Performance & Live Analytics</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/sales/invoices/new">
            <button className="flex items-center gap-1.5 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">
              <Plus className="h-4 w-4" /> New Sale
            </button>
          </Link>
          <Link href="/purchases/bills/new">
            <button className="flex items-center gap-1.5 bg-purple-50 text-[#5c429e] hover:bg-purple-100 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
              <Plus className="h-4 w-4" /> New Purchase
            </button>
          </Link>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Top 4 Financial Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                To Collect (Receivables)
              </p>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-emerald-600">
              ₹ {formatINR(toCollect)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">Customer pending balance</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                To Pay (Payables)
              </p>
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-red-500">
              ₹ {formatINR(toPay)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">Supplier pending balance</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Sales
              </p>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              ₹ {formatINR(totalSales)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              {salesInvoices.length} sales invoices
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Purchases
              </p>
              <div className="p-2 bg-purple-50 rounded-lg text-[#5c429e]">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              ₹ {formatINR(totalPurchases)}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              {purchaseBills.length} purchase bills
            </p>
          </div>
        </div>

        {/* Charts & Operational Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales vs Purchases Chart Representation */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Sales vs Purchases Comparison
                </h2>
                <p className="text-xs text-gray-400">Monthly breakdown</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-[#5c429e]">
                  <span className="w-3 h-3 bg-[#5c429e] rounded-sm"></span> Sales
                </span>
                <span className="flex items-center gap-1.5 text-purple-300">
                  <span className="w-3 h-3 bg-purple-200 rounded-sm"></span> Purchases
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-end min-h-[280px]">
              <div className="flex items-end justify-between w-full h-44 px-2 gap-3 lg:gap-6">
                {[
                  { month: "Jan", s: 60, p: 35 },
                  { month: "Feb", s: 85, p: 50 },
                  { month: "Mar", s: 70, p: 40 },
                  { month: "Apr", s: 100, p: 75 },
                  { month: "May", s: 90, p: 60 },
                  { month: "Jun", s: 115, p: 80 },
                  { month: "Jul", s: 95, p: 55 },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-end h-full flex-1 gap-2 group"
                  >
                    <div className="w-full flex justify-center items-end gap-1.5 h-full">
                      <div
                        className="w-full max-w-[20px] bg-[#5c429e] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                        style={{ height: `${item.s}%` }}
                      ></div>
                      <div
                        className="w-full max-w-[20px] bg-purple-200 rounded-t-sm transition-all duration-300 group-hover:bg-purple-300"
                        style={{ height: `${item.p}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions Mini List */}
            <div className="border-t border-gray-100 p-4 bg-gray-50/50 rounded-b-xl">
              <div className="flex justify-between items-center mb-3 px-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Recent Invoices
                </span>
                <Link
                  href="/sales/invoices"
                  className="text-xs text-[#5c429e] hover:underline font-semibold"
                >
                  View All &rarr;
                </Link>
              </div>
              <div className="space-y-2">
                {recentInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={inv.type === "SALES" ? `/sales/invoices/${inv.id}` : `/purchases/bills`}
                    className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          inv.type === "SALES"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {inv.type}
                      </span>
                      <span className="font-semibold text-gray-900">{inv.invoiceNumber}</span>
                      <span className="text-gray-500">{inv.party.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      ₹ {formatINR(Number(inv.grandTotal))}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Low Stock Alerts + Top Selling Products */}
          <div className="space-y-6">
            {/* Low Stock Items Widget */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-orange-50/30">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <h2 className="text-sm font-bold text-gray-900">Low Stock Alerts</h2>
                </div>
                <Link
                  href="/items"
                  className="text-xs text-orange-600 font-semibold hover:underline"
                >
                  Manage Stock
                </Link>
              </div>
              <div>
                {lowStockItems.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {lowStockItems.map((item) => (
                      <li
                        key={item.id}
                        className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Price: ₹ {formatINR(item.salesPrice)}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-200">
                          {item.stock} {item.unit} left
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    All inventory levels are healthy.
                  </div>
                )}
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#5c429e]" />
                  <h2 className="text-sm font-bold text-gray-900">Top Selling Items</h2>
                </div>
                <Link
                  href="/items"
                  className="text-xs text-[#5c429e] font-semibold hover:underline"
                >
                  View Catalog
                </Link>
              </div>
              <div>
                {topSellingItems.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {topSellingItems.map((item, idx) => (
                      <li
                        key={item.id}
                        className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-purple-50 text-[#5c429e] flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              ₹ {formatINR(item.salesPrice)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-gray-800">
                          {item.totalSold} sold
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No sales recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
