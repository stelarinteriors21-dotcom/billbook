"use client"

import * as React from "react"
import { X, Box, Users, TableProperties, Trash2, Plus } from "lucide-react"

interface QuickSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "invoice" | "party" | "item"
}

export function QuickSettingsModal({ isOpen, onClose, initialTab = "invoice" }: QuickSettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState<"invoice" | "party" | "item">(initialTab)
  const [prefixEnabled, setPrefixEnabled] = React.useState(true)

  // Party custom fields — fully interactive
  const [partyFields, setPartyFields] = React.useState<string[]>([])
  const [newFieldValue, setNewFieldValue] = React.useState("")

  const handleAddField = () => {
    const trimmed = newFieldValue.trim()
    if (!trimmed) return
    setPartyFields(prev => [...prev, trimmed])
    setNewFieldValue("")
  }

  const handleDeleteField = (idx: number) => {
    setPartyFields(prev => prev.filter((_, i) => i !== idx))
  }

  const handleFieldChange = (idx: number, val: string) => {
    setPartyFields(prev => prev.map((f, i) => (i === idx ? val : f)))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#f8f9fc] rounded-lg shadow-xl w-[90vw] max-w-[800px] h-[600px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Quick Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded border border-gray-200">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden bg-white">

          {/* Sidebar */}
          <div className="w-[200px] border-r border-gray-200 p-4 space-y-1">
            <button
              onClick={() => setActiveTab("invoice")}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "invoice" ? "bg-[#f4f2ff] text-[#5c429e]" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Box className="h-4 w-4" /> Invoice Details
            </button>

            <button
              onClick={() => setActiveTab("party")}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "party" ? "bg-[#f4f2ff] text-[#5c429e]" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="h-4 w-4" /> Party Details
            </button>

            <button
              onClick={() => setActiveTab("item")}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "item" ? "bg-[#f4f2ff] text-[#5c429e]" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <TableProperties className="h-4 w-4" /> Item Table Details
            </button>
          </div>

          {/* Main Panel */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">

            {activeTab === "invoice" && (
              <div className="space-y-6 max-w-2xl">
                <div className="border border-gray-200 rounded-md">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800 text-sm">Invoice Prefix &amp; Sequence Number</h3>
                    <div
                      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${prefixEnabled ? "bg-[#5c429e]" : "bg-gray-300"}`}
                      onClick={() => setPrefixEnabled(!prefixEnabled)}
                    >
                      <div className={`absolute top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${prefixEnabled ? "translate-x-[22px]" : "left-0.5"}`} />
                    </div>
                  </div>
                  <div className="p-4 flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Prefix</label>
                      <input type="text" defaultValue="INV/STR-00" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Sequence Number</label>
                      <input type="text" defaultValue="20" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "party" && (
              <div className="space-y-6 max-w-2xl">
                <div className="border border-gray-200 rounded-md">
                  <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800 text-sm">Add party custom fields</h3>
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-medium text-gray-400 mb-3">Your Custom Fields</div>

                    {/* Existing fields list */}
                    <div className="space-y-2 mb-4">
                      {partyFields.length === 0 && (
                        <p className="text-xs text-gray-400 italic">No custom fields added yet.</p>
                      )}
                      {partyFields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={field}
                            onChange={(e) => handleFieldChange(idx, e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteField(idx)}
                            className="p-2 border border-red-200 rounded text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new field */}
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="New field name..."
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddField() }}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddField}
                        disabled={!newFieldValue.trim()}
                        className="px-3 py-2 bg-[#5c429e] text-white text-sm font-semibold rounded hover:bg-[#4d3ab3] disabled:opacity-40 transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setNewFieldValue(""); document.querySelector<HTMLInputElement>("[placeholder='New field name...']")?.focus() }}
                      className="w-full py-3 border border-dashed border-blue-300 bg-blue-50/50 text-blue-500 font-medium text-sm rounded flex items-center justify-center gap-2 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4" /> Add New Field
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "item" && (
              <div className="text-center py-12 text-gray-500">
                Item Table Details configuration coming soon.
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-[#f4f2ff] text-[#5c429e] rounded text-sm font-semibold hover:bg-[#e8e4ff] transition-colors">
            Save
          </button>
        </div>

      </div>
    </div>
  )
}
