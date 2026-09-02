"use client"

import * as React from "react"
import { Search, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface Party {
  id: string
  name: string
  balance?: number
}

interface PartyComboboxProps {
  value: string
  onChange: (partyId: string, partyName: string) => void
  onSearch: (query: string) => Promise<Party[]>
  onCreateNew: () => void
}

export function PartyCombobox({ value, onChange, onSearch, onCreateNew }: PartyComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [options, setOptions] = React.useState<Party[]>([])
  const [loading, setLoading] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (!isOpen) return
    const fetchOptions = async () => {
      setLoading(true)
      try {
        const results = await onSearch(query)
        setOptions(results)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    const timeoutId = setTimeout(fetchOptions, 300)
    return () => clearTimeout(timeoutId)
  }, [query, isOpen, onSearch])

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {!value ? (
        <button 
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full border-2 border-dashed border-blue-300 bg-[#f4f8ff] text-blue-500 rounded-md py-6 flex items-center justify-center font-medium hover:bg-blue-50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Party
        </button>
      ) : (
        <div 
          onClick={() => setIsOpen(true)}
          className="w-full border border-gray-300 rounded-md p-3 cursor-pointer hover:border-gray-400"
        >
          <div className="font-medium text-gray-900">{value}</div>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full md:w-[600px] z-50 bg-white rounded-md shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                autoFocus
                type="text"
                className="w-full pl-9 pr-4 py-2 border border-purple-200 rounded text-sm focus:outline-none focus:border-purple-400"
                placeholder="Search party by name or number"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            <div className="flex justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
              <span>Party Name</span>
              <span>Balance</span>
            </div>
            
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : options.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No parties found</div>
            ) : (
              options.map((party) => (
                <div
                  key={party.id}
                  className="flex justify-between items-center px-4 py-3 border-b border-gray-100 hover:bg-purple-50 cursor-pointer transition-colors"
                  onClick={() => {
                    onChange(party.id, party.name)
                    setIsOpen(false)
                  }}
                >
                  <span className="text-sm font-medium text-gray-800">{party.name}</span>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <span className="text-gray-700">₹ {(party.balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    {(party.balance || 0) > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onCreateNew()
              }}
              className="w-full border border-dashed border-blue-300 bg-blue-50 text-blue-500 rounded py-2 text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Create Party
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
