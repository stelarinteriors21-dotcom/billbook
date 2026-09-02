"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { searchParties } from "@/app/actions/party"
import { PartyCombobox } from "@/components/invoice/party-combobox"
import { CreatePartyModal } from "@/components/party/create-party-modal"

export default function RecordPaymentPage() {
  const router = useRouter()
  const [partyId, setPartyId] = React.useState("")
  const [partyName, setPartyName] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
  const [mode, setMode] = React.useState("CASH")
  const [reference, setReference] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [isPartyModalOpen, setIsPartyModalOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async () => {
    setError("")
    if (!partyId) {
      setError("Please select a customer / party.")
      return
    }
    if (!amount || Number(amount) <= 0 || !date || !mode) {
      setError("Valid amount, date and mode are required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/sales/payment-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId,
          amount: Number(amount),
          date,
          mode,
          referenceNumber: reference,
          notes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push("/sales/payment-in")
      } else {
        setError(data.error || "Failed to record payment")
      }
    } catch (e) {
      setError("Network error recording payment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] font-sans overflow-y-auto pb-10">
      <div className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Exit
          </button>
          <h1 className="text-lg font-bold text-gray-900">Record Payment In</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-6 py-1.5 rounded-md text-sm font-bold disabled:opacity-50 shadow-sm"
        >
          {submitting ? "Saving..." : "Save Payment"}
        </button>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-bold text-gray-900">Payment Details</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Customer / Party Name
            </label>
            <PartyCombobox
              value={partyName}
              onChange={(id, name) => {
                setPartyId(id)
                setPartyName(name)
              }}
              onSearch={async (q) => {
                const res = await searchParties(q)
                return res.map((p) => ({
                  id: p.id,
                  name: p.name,
                  balance: 0,
                }))
              }}
              onCreateNew={() => setIsPartyModalOpen(true)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Amount Received
              </label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:border-[#5c429e]">
                <span className="bg-gray-50 border-r border-gray-300 px-3 py-2 text-sm text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm outline-none font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Receipt Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Payment Mode
            </label>
            <div className="flex gap-3">
              {["CASH", "BANK", "UPI", "CHEQUE"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    mode === m
                      ? "bg-[#5c429e] text-white border-[#5c429e]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Reference / Cheque Number
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Cheque no., UTR, Transaction ID..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Notes & Remarks
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional payment notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c429e] resize-none"
            />
          </div>
        </div>
      </div>

      <CreatePartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        onSuccess={(party) => {
          setPartyId(party.id)
          setPartyName(party.name)
        }}
      />
    </div>
  )
}
