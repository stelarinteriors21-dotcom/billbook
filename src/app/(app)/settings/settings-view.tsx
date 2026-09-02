"use client"

import * as React from "react"
import {
  Building2,
  Users,
  Warehouse,
  Percent,
  Ruler,
  CheckCircle,
  Save,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Plus,
  Trash2
} from "lucide-react"

interface BusinessSettingsData {
  id: string
  name: string
  gstin: string
  phone: string
  email: string
  address: string
  users: { id: string; name: string; email: string; role: string }[]
  godowns: { id: string; name: string; isDefault: boolean }[]
  taxRates: { id: string; name: string; rate: number }[]
  units: { id: string; name: string; shortName: string }[]
}

interface SettingsViewProps {
  business: BusinessSettingsData
}

export function SettingsView({ business }: SettingsViewProps) {
  const [tab, setTab] = React.useState<"PROFILE" | "USERS" | "GODOWNS" | "TAXES">("PROFILE")

  const [name, setName] = React.useState(business.name)
  const [gstin, setGstin] = React.useState(business.gstin)
  const [phone, setPhone] = React.useState(business.phone)
  const [email, setEmail] = React.useState(business.email)
  const [address, setAddress] = React.useState(business.address)

  const [users, setUsers] = React.useState(business.users)
  const [godowns, setGodowns] = React.useState(business.godowns)
  const [taxRates, setTaxRates] = React.useState(business.taxRates)
  const [units, setUnits] = React.useState(business.units)

  const [saving, setSaving] = React.useState(false)
  const [savedSuccess, setSavedSuccess] = React.useState(false)

  // Modals
  const [isGodownModalOpen, setIsGodownModalOpen] = React.useState(false)
  const [godownName, setGodownName] = React.useState("")
  const [godownAddress, setGodownAddress] = React.useState("")

  const [isTaxModalOpen, setIsTaxModalOpen] = React.useState(false)
  const [taxName, setTaxName] = React.useState("")
  const [taxRate, setTaxRate] = React.useState("")

  const [isUnitModalOpen, setIsUnitModalOpen] = React.useState(false)
  const [unitName, setUnitName] = React.useState("")
  const [unitShortName, setUnitShortName] = React.useState("")

  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false)
  const [userName, setUserName] = React.useState("")
  const [userEmail, setUserEmail] = React.useState("")
  const [userRole, setUserRole] = React.useState("STAFF")
  const [userPassword, setUserPassword] = React.useState("")

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)
    try {
      const res = await fetch("/api/business/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gstin, phone, email, address }),
      })
      const data = await res.json()
      if (data.success) {
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 3000)
      } else {
        alert("Error saving settings: " + data.error)
      }
    } catch (e) {
      alert("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateGodown = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!godownName.trim()) return
    try {
      const res = await fetch("/api/business/godowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: godownName, address: godownAddress }),
      })
      const data = await res.json()
      if (data.success) {
        setGodowns((prev) => [...prev, data.godown])
        setIsGodownModalOpen(false)
        setGodownName("")
        setGodownAddress("")
      } else {
        alert(data.error)
      }
    } catch (e) {
      alert("Failed to create warehouse location")
    }
  }

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taxName.trim() || !taxRate) return
    try {
      const res = await fetch("/api/business/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: taxName, rate: Number(taxRate) }),
      })
      const data = await res.json()
      if (data.success) {
        setTaxRates((prev) => [...prev, data.taxRate])
        setIsTaxModalOpen(false)
        setTaxName("")
        setTaxRate("")
      } else {
        alert(data.error)
      }
    } catch (e) {
      alert("Failed to create tax slab")
    }
  }

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitName.trim() || !unitShortName.trim()) return
    try {
      const res = await fetch("/api/business/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: unitName, shortName: unitShortName }),
      })
      const data = await res.json()
      if (data.success) {
        setUnits((prev) => [...prev, data.unit])
        setIsUnitModalOpen(false)
        setUnitName("")
        setUnitShortName("")
      } else {
        alert(data.error)
      }
    } catch (e) {
      alert("Failed to create unit")
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName.trim() || !userEmail.trim()) return
    try {
      const res = await fetch("/api/business/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          role: userRole,
          password: userPassword || "password123",
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUsers((prev) => [...prev, data.user])
        setIsUserModalOpen(false)
        setUserName("")
        setUserEmail("")
        setUserPassword("")
      } else {
        alert(data.error)
      }
    } catch (e) {
      alert("Failed to add user")
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#f4f5f8] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-800">Business Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure your company profile, GSTIN, staff permissions, and warehouses
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { id: "PROFILE", label: "Company Profile", icon: Building2 },
          { id: "USERS", label: "Staff & Permissions", icon: Users },
          { id: "GODOWNS", label: "Godowns / Stores", icon: Warehouse },
          { id: "TAXES", label: "GST Tax Rates & Units", icon: Percent },
        ].map((item) => {
          const Icon = item.icon
          const isActive = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as any)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? "bg-[#5c429e] text-white border-[#5c429e] shadow-md"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon className={`h-5 w-5 mb-2 ${isActive ? "text-white" : "text-[#5c429e]"}`} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex-1 max-w-4xl">
        {/* 1. COMPANY PROFILE */}
        {tab === "PROFILE" && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <h2 className="text-base font-bold text-gray-900 border-b pb-3">Company Details</h2>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Company profile updated successfully!
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Business / Company Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                required
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-[#5c429e] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        )}

        {/* 2. STAFF USERS */}
        {tab === "USERS" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-gray-900">Staff Members & Roles</h2>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#4d3ab3] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold"
              >
                <Plus className="h-4 w-4" /> Add Staff Member
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {users.map((u) => (
                <div key={u.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span className="bg-purple-50 text-[#5c429e] text-xs font-bold px-2.5 py-1 rounded">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. GODOWNS */}
        {tab === "GODOWNS" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-gray-900">Warehouses / Godowns</h2>
              <button
                onClick={() => setIsGodownModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#4d3ab3] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold"
              >
                <Plus className="h-4 w-4" /> Add Godown
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {godowns.map((g) => (
                <div key={g.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{g.name}</p>
                    {g.isDefault && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                        Primary Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. TAXES & UNITS */}
        {tab === "TAXES" && (
          <div className="space-y-8">
            {/* Tax Rates */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-sm font-bold text-gray-900 uppercase">GST Tax Slabs</h2>
                <button
                  onClick={() => setIsTaxModalOpen(true)}
                  className="flex items-center gap-1 bg-[#4d3ab3] text-white px-3 py-1 rounded text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Tax Slab
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {taxRates.map((t) => (
                  <div key={t.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-700">{t.name}</span>
                    <span className="text-xs font-bold text-[#5c429e]">{t.rate}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Units */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-sm font-bold text-gray-900 uppercase">Measuring Units</h2>
                <button
                  onClick={() => setIsUnitModalOpen(true)}
                  className="flex items-center gap-1 bg-[#4d3ab3] text-white px-3 py-1 rounded text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Unit
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {units.map((u) => (
                  <div key={u.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-700">{u.name}</span>
                    <span className="text-xs font-mono font-bold text-gray-500">{u.shortName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Godown Modal */}
      {isGodownModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateGodown} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Add Warehouse Location</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Godown Name</label>
              <input
                type="text"
                value={godownName}
                onChange={(e) => setGodownName(e.target.value)}
                placeholder="e.g. Warehouse B - South"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Address / Location</label>
              <input
                type="text"
                value={godownAddress}
                onChange={(e) => setGodownAddress(e.target.value)}
                placeholder="Plot no., area..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGodownModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-[#4d3ab3] text-white rounded-lg text-sm font-bold">
                Save Godown
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tax Rate Modal */}
      {isTaxModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTax} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Add GST Tax Slab</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tax Slab Name</label>
              <input
                type="text"
                value={taxName}
                onChange={(e) => setTaxName(e.target.value)}
                placeholder="e.g. GST @ 12%"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Percentage Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="12"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTaxModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-[#4d3ab3] text-white rounded-lg text-sm font-bold">
                Save Tax Slab
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unit Modal */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateUnit} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Add Measuring Unit</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Unit Full Name</label>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="e.g. Kilograms"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Short Code (Symbol)</label>
              <input
                type="text"
                value={unitShortName}
                onChange={(e) => setUnitShortName(e.target.value)}
                placeholder="e.g. KG"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none font-mono uppercase"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-[#4d3ab3] text-white rounded-lg text-sm font-bold">
                Save Unit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Add Staff Member</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="rajesh@supermart.com"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Initial Password</label>
              <input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="Default: password123"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Role / Permission</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:border-[#5c429e] outline-none"
              >
                <option value="STAFF">Billing Staff</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-[#4d3ab3] text-white rounded-lg text-sm font-bold">
                Add Staff Member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
