"use client"

import * as React from "react"
import { X, Building2, Phone, Mail, MapPin } from "lucide-react"

interface EditPartyModalProps {
  isOpen: boolean
  onClose: () => void
  party: {
    id: string
    name: string
    partyType?: string
    mobileNumber?: string | null
    email?: string | null
    billingAddress?: string | null
    shippingAddress?: string | null
    gstin?: string | null
    panNumber?: string | null
  } | null
  onSuccess: (updatedParty: any) => void
}

export function EditPartyModal({
  isOpen,
  onClose,
  party,
  onSuccess,
}: EditPartyModalProps) {
  const [name, setName] = React.useState("")
  const [partyType, setPartyType] = React.useState<"CUSTOMER" | "SUPPLIER">("CUSTOMER")
  const [mobileNumber, setMobileNumber] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [billingAddress, setBillingAddress] = React.useState("")
  const [shippingAddress, setShippingAddress] = React.useState("")
  const [gstin, setGstin] = React.useState("")
  const [panNumber, setPanNumber] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")

  React.useEffect(() => {
    if (party) {
      setName(party.name || "")
      setPartyType((party.partyType as any) || "CUSTOMER")
      setMobileNumber(party.mobileNumber || "")
      setEmail(party.email || "")
      setBillingAddress(party.billingAddress || "")
      setShippingAddress(party.shippingAddress || "")
      setGstin(party.gstin || "")
      setPanNumber(party.panNumber || "")
    }
  }, [party])

  if (!isOpen || !party) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (!name.trim()) {
      setErrorMsg("Party name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/parties/${party.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          partyType,
          mobileNumber: mobileNumber.trim() || "",
          email: email.trim() || "",
          billingAddress: billingAddress.trim() || "",
          shippingAddress: shippingAddress.trim() || "",
          gstin: gstin.trim() || "",
          panNumber: panNumber.trim() || "",
        }),
      })

      const data = await res.json()
      if (res.ok && data.success && data.party) {
        onSuccess(data.party)
        onClose()
      } else {
        setErrorMsg(data.error || "Failed to update party")
      }
    } catch (error: any) {
      setErrorMsg("Network error updating party")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Party Details</h2>
            <p className="text-xs text-gray-500">Update billing & shipping contact details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Party / Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                placeholder="10-digit mobile"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                GSTIN
              </label>
              <input
                type="text"
                placeholder="29ABCDE1234F1Z5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#5c429e]"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                PAN Number
              </label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#5c429e]"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Billing Address
              </label>
              <textarea
                rows={2}
                placeholder="Street, City, State, PIN..."
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#5c429e] resize-none bg-white"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Shipping Address (Consignee)
              </label>
              <textarea
                rows={2}
                placeholder="Delivery address..."
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#5c429e] resize-none bg-white"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2 bg-[#4d3ab3] hover:bg-[#3d2a93] text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
