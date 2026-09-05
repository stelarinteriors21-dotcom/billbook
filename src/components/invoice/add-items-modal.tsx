"use client"

import * as React from "react"
import { Search, X, Plus, Edit, Trash2 } from "lucide-react"

interface Item {
  id: string
  name: string
  code?: string
  stock: number
  unit?: string
  salesPrice: number
  purchasePrice: number
  taxRate?: { rate: number }
}

interface AddItemsModalProps {
  isOpen: boolean
  onClose: () => void
  onAddItems: (items: Item[]) => void
  onSearch: (query: string) => Promise<Item[]>
  onCreateNew: () => void
  onEditItem?: (id: string) => void
}

export function AddItemsModal({ isOpen, onClose, onAddItems, onSearch, onCreateNew, onEditItem }: AddItemsModalProps) {
  const [query, setQuery] = React.useState("")
  const [items, setItems] = React.useState<Item[]>([])
  const [selectedItems, setSelectedItems] = React.useState<Item[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedItems([])
      setQuery("")
      return
    }

    const fetchItems = async () => {
      setLoading(true)
      try {
        const res = await onSearch(query)
        setItems(res)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    const timeoutId = setTimeout(fetchItems, 300)
    return () => clearTimeout(timeoutId)
  }, [query, isOpen, onSearch])

  const handleAddClick = (item: Item) => {
    setSelectedItems(prev => [...prev, item])
  }

  const handleAddToBill = () => {
    onAddItems(selectedItems)
    onClose()
  }

  const handleDelete = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setItems(prev => prev.filter(i => i.id !== itemId))
        // Also remove from selectedItems if they selected it before deleting
        setSelectedItems(prev => prev.filter(i => i.id !== itemId))
      } else {
        alert(data.error || "Failed to delete item.")
      }
    } catch (e) {
      alert("Network error. Could not delete.")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add Items to Bill</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded border border-gray-200">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 flex items-center gap-4 bg-white border-b border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              autoFocus
              type="text"
              placeholder="Search by Item/ Serial no./ HSN code/ SKU/ Custom Field / Category"
              className="w-full pl-9 pr-4 py-2 text-sm border border-purple-200 rounded-md focus:outline-none focus:border-purple-400"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <select className="border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-600 bg-white w-48 focus:outline-none">
            <option>Select Category</option>
          </select>
          <button 
            onClick={onCreateNew}
            className="bg-[#4a3bb5] hover:bg-[#3d2f9a] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
          >
            Create New Item
          </button>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-semibold text-gray-700 bg-gray-100 sticky top-0 z-10 shadow-sm border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Item Code</th>
                <th className="px-6 py-3 text-right">Stock</th>
                <th className="px-6 py-3 text-right">Sales Price</th>
                <th className="px-6 py-3 text-right">Purchase Price</th>
                <th className="px-6 py-3 text-center">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading items...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No items found</td>
                </tr>
              ) : (
                items.map((item, i) => {
                  const addedCount = selectedItems.filter(s => s.id === item.id).length
                  
                  return (
                    <tr key={item.id} className="bg-white border-b border-gray-100 hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-700 max-w-[300px] truncate">{item.name}</td>
                      <td className="px-6 py-4 text-gray-500">{item.code || "-"}</td>
                      <td className="px-6 py-4 text-right text-gray-600">{item.stock} {item.unit || "PCS"}</td>
                      <td className="px-6 py-4 text-right font-medium">₹ {item.salesPrice.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-right text-gray-600">₹ {item.purchasePrice.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center gap-2">
                          {onEditItem && (
                            <button
                              onClick={() => onEditItem(item.id)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded border border-transparent hover:border-purple-200 transition-colors"
                              title="Edit Item"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAddClick(item)}
                            className="flex-1 bg-[#f0f6ff] hover:bg-blue-100 text-blue-600 border border-blue-200 font-medium py-1.5 rounded text-sm flex items-center justify-center gap-1 transition-colors"
                          >
                            <Plus className="h-4 w-4" /> Add
                            {addedCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-200 rounded text-xs">{addedCount}</span>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Area */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-[#f8fafe] text-sm">
            <button className="text-blue-500 hover:underline font-medium">
              Show {selectedItems.length} Item(s) Selected
            </button>
            <div className="flex gap-16 text-gray-800 font-medium pr-12">
              <span>₹ {selectedItems.reduce((acc, i) => acc + i.salesPrice, 0).toLocaleString('en-IN')}</span>
              <span>{selectedItems.length}</span>
            </div>
          </div>
          
          <div className="p-4 flex items-center justify-between bg-white">
            <div className="text-xs text-gray-500 flex gap-4">
              <span>Keyboard Shortcuts :</span>
              <span className="flex items-center gap-1">Change Quantity <kbd className="border border-gray-300 rounded px-1.5 bg-gray-50">Enter</kbd></span>
              <span className="flex items-center gap-1">Move between items <kbd className="border border-gray-300 rounded px-1.5 bg-gray-50">↑</kbd> <kbd className="border border-gray-300 rounded px-1.5 bg-gray-50">↓</kbd></span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cancel [ESC]
              </button>
              <button 
                onClick={handleAddToBill}
                disabled={selectedItems.length === 0}
                className="bg-[#f0edff] hover:bg-[#e0dbff] text-[#5c429e] disabled:opacity-50 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
              >
                Add to Bill [F7]
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
