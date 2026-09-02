"use client"

import * as React from "react"
import { Search } from "lucide-react"

export interface ComboboxOption {
  id: string
  label: string
  data?: any
}

interface ComboboxProps {
  placeholder?: string
  value?: string
  onChange: (option: ComboboxOption | null) => void
  onSearch: (query: string) => Promise<ComboboxOption[]>
}

export function Combobox({ placeholder = "Search...", value, onChange, onSearch }: ComboboxProps) {
  const [query, setQuery] = React.useState("")
  const [options, setOptions] = React.useState<ComboboxOption[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
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
    const timer = setTimeout(async () => {
      if (!isOpen) return
      setLoading(true)
      try {
        const results = await onSearch(query)
        setOptions(results)
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, isOpen, onSearch])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5c52c6] focus:border-transparent"
          placeholder={placeholder}
          value={isOpen ? query : (value || "")}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            setIsOpen(true)
            setQuery("")
          }}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : options.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No results found.</div>
          ) : (
            <ul className="py-1">
              {options.map((option) => (
                <li
                  key={option.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-900"
                  onClick={() => {
                    onChange(option)
                    setIsOpen(false)
                    setQuery("")
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
