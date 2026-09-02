"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Users,
  Package,
  Tag,
  ArrowDown,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Settings,
  FileText,
  CreditCard,
  RotateCcw,
  FileCheck,
  Truck,
  ClipboardList,
  ShoppingCart,
  TrendingUp,
  BarChart2,
  Activity,
} from "lucide-react"

const SALES_ITEMS = [
  { name: "Sales Invoices", href: "/sales/invoices" },
  { name: "Quotation / Estimate", href: "/sales/estimates" },
  { name: "Payment In", href: "/sales/payment-in" },
  { name: "Sales Return", href: "/sales/return" },
  { name: "Credit Note", href: "/sales/credit-notes" },
  { name: "Delivery Challan", href: "/sales/delivery-challans" },
  { name: "Proforma Invoice", href: "/sales/proforma" },
]

const PURCHASE_ITEMS = [
  { name: "Purchase Bills", href: "/purchases/bills" },
  { name: "Payment Out", href: "/purchases/payment-out" },
  { name: "Purchase Return", href: "/purchases/return" },
  { name: "Debit Note", href: "/purchases/debit-notes" },
]

interface SectionProps {
  title: string
  icon: React.ElementType
  items: { name: string; href: string }[]
  defaultOpen?: boolean
}

function NavSection({ title, icon: Icon, items, defaultOpen = false }: SectionProps) {
  const pathname = usePathname()
  const isAnyActive = items.some(i => pathname.startsWith(i.href))
  const [open, setOpen] = useState(defaultOpen || isAnyActive)

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isAnyActive ? "text-white bg-[#29325a]" : "text-gray-300 hover:bg-[#29325a] hover:text-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 opacity-70" />
          {title}
        </div>
        {open ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />}
      </button>

      {open && (
        <div className="mt-0.5 flex flex-col">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`pl-10 pr-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#2b3562] text-white"
                    : "text-gray-400 hover:bg-[#29325a] hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[240px] flex flex-col h-full flex-shrink-0 z-10" style={{ backgroundColor: "#1e233d" }}>
      {/* Business Logo / Header */}
      <div className="px-4 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-0.5 shadow-sm">
          <img src="/stelar-logo.png" alt="Stelar Interiors" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white truncate max-w-[150px]">Stelar Interiors</span>
          <span className="text-xs text-gray-400">0773613733</span>
        </div>
      </div>

      {/* Create Button */}
      <div className="px-4 mb-4">
        <Link
          href="/sales/invoices/new"
          className="w-full bg-white text-[#1e233d] font-medium text-sm py-2 rounded-full flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Create Sales Invoice <ChevronDown className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 scrollbar-hide space-y-0.5">
        <div className="text-[10px] font-bold text-gray-400 mb-2 px-3 tracking-wider">GENERAL</div>

        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard"
              ? "bg-[#29325a] text-white"
              : "text-gray-300 hover:bg-[#29325a] hover:text-white"
          }`}
        >
          <LayoutDashboard className="h-4 w-4 opacity-70" />
          Dashboard
        </Link>

        {/* Parties */}
        <Link
          href="/parties"
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith("/parties")
              ? "bg-[#29325a] text-white"
              : "text-gray-300 hover:bg-[#29325a] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 opacity-70" />
            Parties
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </Link>

        {/* Items */}
        <Link
          href="/items"
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith("/items")
              ? "bg-[#29325a] text-white"
              : "text-gray-300 hover:bg-[#29325a] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 opacity-70" />
            Items
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </Link>

        <div className="text-[10px] font-bold text-gray-400 mb-1 mt-4 px-3 tracking-wider">SALES</div>
        <NavSection title="Sales" icon={Tag} items={SALES_ITEMS} defaultOpen={true} />

        <div className="text-[10px] font-bold text-gray-400 mb-1 mt-4 px-3 tracking-wider">PURCHASES</div>
        <NavSection title="Purchases" icon={ShoppingCart} items={PURCHASE_ITEMS} defaultOpen={false} />

        <div className="text-[10px] font-bold text-gray-400 mb-1 mt-4 px-3 tracking-wider">REPORTS</div>
        <Link
          href="/reports"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/reports"
              ? "bg-[#29325a] text-white"
              : "text-gray-300 hover:bg-[#29325a] hover:text-white"
          }`}
        >
          <BarChart2 className="h-4 w-4 opacity-70" />
          Reports
        </Link>

        <div className="text-[10px] font-bold text-gray-400 mb-1 mt-4 px-3 tracking-wider">SETTINGS</div>
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-[#29325a] text-white"
              : "text-gray-300 hover:bg-[#29325a] hover:text-white"
          }`}
        >
          <Settings className="h-4 w-4 opacity-70" />
          Settings
        </Link>
        <Link
          href="/settings/activity"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/settings/activity"
              ? "bg-[#29325a] text-white"
              : "text-gray-300 hover:bg-[#29325a] hover:text-white"
          }`}
        >
          <Activity className="h-4 w-4 opacity-70" />
          Activity History
        </Link>
      </div>

      {/* Footer */}
      <div className="relative p-4 pt-6 bg-[#181d33] mt-auto">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <button className="bg-[#384370] text-gray-300 text-[10px] px-3 py-1 rounded-full flex items-center gap-1 shadow-lg border border-[#485380]">
            Scroll for more options <ArrowDown className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-medium px-1">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> 100% Secure</span>
          <span>ISO Certified</span>
        </div>
      </div>
    </aside>
  )
}
