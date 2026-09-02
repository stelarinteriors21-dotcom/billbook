"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Plus, Truck, MapPin } from "lucide-react"
import { searchParties } from "@/app/actions/party"
import { searchItems } from "@/app/actions/item"
import { PartyCombobox } from "@/components/invoice/party-combobox"
import { CreatePartyModal } from "@/components/party/create-party-modal"
import { AddItemsModal } from "@/components/invoice/add-items-modal"

export function DeliveryChallanForm() {
  const router = useRouter()
  const [partyId, setPartyId] = React.useState("")
  const [partyName, setPartyName] = React.useState("")
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
  const [vehicleNumber, setVehicleNumber] = React.useState("")
  const [deliveryAddress, setDeliveryAddress] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const [lines, setLines] = React.useState<any[]>([])
  const [isPartyModalOpen, setIsPartyModalOpen] = React.useState(false)
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleAddItems = (selectedItems: any[]) => {
    const newLines = selectedItems.map((item) => ({
      id: Math.random().toString(36).substring(7),
      itemId: item.id,
      itemName: item.name,
      quantity: 1,
      rate: Number(item.salesPrice || 0),
      total: Number(item.salesPrice || 0),
    }))
    setLines((prev) => [...prev, ...newLines])
  }

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  const updateQuantity = (id: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, quantity: qty, total: qty * l.rate } : l))
    )
  }

  const handleSubmit = async () => {
    if (!partyId) return alert("Please select a party")
    if (lines.length === 0) return alert("Please add at least one dispatch item")

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/sales/delivery-challans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId,
          date,
          vehicleNumber,
          deliveryAddress,
          notes,
          lines: lines.map((l) => ({
            itemId: l.itemId,
            quantity: l.quantity,
            rate: l.rate,
          })),
        }),
      })

      const data = await res.json()
      if (data.success) {
        router.push("/sales/delivery-challans")
      } else {
        alert("Error: " + data.error)
      }
    } catch (e) {
      alert("Failed to create delivery challan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] font-sans overflow-y-auto pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Exit
          </button>
          <h1 className="text-lg font-bold text-gray-900">Create Delivery Challan</h1>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-6 py-1.5 rounded-md text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? "Saving..." : "Save Delivery Challan"}
        </button>
      </div>

      {/* Main Form */}
      <div className="p-4 mx-auto w-full max-w-7xl space-y-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Party Details */}
          <div className="col-span-5 bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
            <label className="text-xs font-semibold text-gray-500 mb-2 tracking-wide uppercase">
              Dispatch To (Party)
            </label>
            <div className="flex-1 mt-2">
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
          </div>

          {/* Transport / Delivery Details */}
          <div className="col-span-7 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <label className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-3 block">
              Transport & Challan Meta
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Challan Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#5c429e]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Vehicle / Transport Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. KA-01-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#5c429e]"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Delivery Address / Destination
              </label>
              <input
                type="text"
                placeholder="Site / Warehouse delivery address..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#5c429e]"
              />
            </div>
          </div>
        </div>

        {/* Dispatch Items Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <div className="overflow-x-auto rounded-t-lg">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-[#f8f9fc] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">DISPATCH ITEM</th>
                  <th className="px-4 py-3 w-32 text-center">QUANTITY</th>
                  <th className="px-4 py-3 w-32 text-right">UNIT RATE (₹)</th>
                  <th className="px-4 py-3 w-32 text-right">TOTAL (₹)</th>
                  <th className="px-4 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{line.itemName}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateQuantity(line.id, parseFloat(e.target.value) || 1)}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-center font-bold"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">₹ {line.rate.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ₹ {line.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeLine(line.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-b border-gray-200 bg-white">
            <button
              onClick={() => setIsAddItemsModalOpen(true)}
              className="w-full border-2 border-dashed border-purple-300 bg-[#f8f6ff] text-[#5c429e] rounded-md py-2.5 flex items-center justify-center font-semibold text-sm hover:bg-purple-50 transition-colors"
            >
              + Add Items to Dispatch
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        onSuccess={(party) => {
          setPartyId(party.id)
          setPartyName(party.name)
        }}
      />

      <AddItemsModal
        isOpen={isAddItemsModalOpen}
        onClose={() => setIsAddItemsModalOpen(false)}
        onSearch={async (query) => {
          const results = await searchItems(query)
          return results.map((i) => ({
            id: i.id,
            name: i.name,
            code: i.sku || undefined,
            stock: 0,
            salesPrice: Number(i.salesPrice),
            purchasePrice: Number(i.purchasePrice),
          }))
        }}
        onCreateNew={() => {}}
        onAddItems={handleAddItems}
      />
    </div>
  )
}
