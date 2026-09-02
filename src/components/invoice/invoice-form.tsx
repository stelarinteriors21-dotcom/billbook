"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Settings,
  Edit,
  Eye,
  Plus,
  ScanBarcode,
  Trash2,
  X,
  Upload,
  Printer,
  CheckCircle,
  Percent,
  DollarSign,
  FileText
} from "lucide-react"
import { searchParties } from "@/app/actions/party"
import { searchItems } from "@/app/actions/item"
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/billing-engine"

// Subcomponents
import { PartyCombobox } from "./party-combobox"
import { CreatePartyModal } from "../party/create-party-modal"
import { EditPartyModal } from "../party/edit-party-modal"
import { CreateItemModal } from "../item/create-item-modal"
import { AddItemsModal } from "./add-items-modal"
import { QuickSettingsModal } from "./quick-settings-modal"
import { PrintableInvoiceTemplate } from "./printable-invoice-template"

import type { TaxRate, Godown } from "@prisma/client"

interface InvoiceFormProps {
  taxRates: TaxRate[]
  godowns: Godown[]
  documentType?: "INVOICE" | "ESTIMATE" | "PROFORMA"
  initialData?: any
  isEdit?: boolean
  invoiceId?: string
}

interface LineItemState {
  id: string
  itemId: string
  itemName: string
  quantity: number
  rate: number
  discountAmount: number
  taxRateId: string
  taxRatePercent: number
  godownId: string
  amount: number
  taxAmount: number
  total: number
}

export function InvoiceForm({
  taxRates,
  godowns,
  documentType = "INVOICE",
  initialData,
  isEdit = false,
  invoiceId,
}: InvoiceFormProps) {
  const router = useRouter()
  const docLabels: Record<string, { title: string; returnPath: string; apiEndpoint: string }> = {
    INVOICE: {
      title: isEdit ? "Edit Sales Invoice" : "Create Sales Invoice",
      returnPath: isEdit && invoiceId ? `/sales/invoices/${invoiceId}` : "/sales/invoices",
      apiEndpoint: isEdit && invoiceId ? `/api/sales/invoices/${invoiceId}` : "/api/sales/invoices",
    },
    ESTIMATE: { title: "Create Quotation / Estimate", returnPath: "/sales/estimates", apiEndpoint: "/api/sales/estimates" },
    PROFORMA: { title: "Create Proforma Invoice", returnPath: "/sales/proforma", apiEndpoint: "/api/sales/invoices" },
  }
  const { title: docTitle, returnPath, apiEndpoint } = docLabels[documentType]

  // View Mode: Edit vs Live Preview
  const [viewMode, setViewMode] = React.useState<"EDIT" | "PREVIEW">("EDIT")

  // State
  const [partyId, setPartyId] = React.useState(initialData?.partyId || initialData?.party?.id || "")
  const [partyName, setPartyName] = React.useState(initialData?.party?.name || "")
  const [partyBillingAddress, setPartyBillingAddress] = React.useState(initialData?.party?.billingAddress || "")
  const [partyShippingAddress, setPartyShippingAddress] = React.useState(initialData?.party?.shippingAddress || "")
  const [partyGstin, setPartyGstin] = React.useState(initialData?.party?.gstin || "")
  const [showShippingAddress, setShowShippingAddress] = React.useState(!!initialData?.party?.shippingAddress)

  const [invoicePrefix, setInvoicePrefix] = React.useState(initialData?.invoicePrefix || "INV/STR-00")
  const [invoiceNumber, setInvoiceNumber] = React.useState(initialData?.invoiceNumber || "20")
  const [invoiceDate, setInvoiceDate] = React.useState(
    initialData?.date ? initialData.date.split("T")[0] : new Date().toISOString().split("T")[0]
  )
  const [dueDate, setDueDate] = React.useState(
    initialData?.dueDate ? initialData.dueDate.split("T")[0] : ""
  )
  const [showDueDate, setShowDueDate] = React.useState(!!initialData?.dueDate)
  const [reference, setReference] = React.useState(initialData?.reference || "")
  const [terms, setTerms] = React.useState(
    initialData?.paymentTerms || "1. Goods or services, once sold, will not be taken back or exchanged.\n2. All disputes are subject to jurisdiction."
  )
  const [notes, setNotes] = React.useState(initialData?.notes || "")
  const [bankDetails, setBankDetails] = React.useState(initialData?.bankDetails || "")

  const [lines, setLines] = React.useState<LineItemState[]>(
    initialData?.lines
      ? initialData.lines.map((l: any) => ({
          id: l.id || Math.random().toString(36).substring(7),
          itemId: l.itemId || l.item?.id,
          itemName: l.item?.name || l.itemName || "Item",
          quantity: Number(l.quantity),
          rate: Number(l.rate),
          discountAmount: Number(l.discountAmount || 0),
          taxRateId: l.taxRateId || "",
          taxRatePercent: Number(l.taxPercentage || 0),
          godownId: l.godownId || godowns[0]?.id || "",
          amount: Number(l.quantity) * Number(l.rate) - Number(l.discountAmount || 0),
          taxAmount: Number(l.taxAmount || 0),
          total: Number(l.total),
        }))
      : []
  )
  const [discountAmount, setDiscountAmount] = React.useState(Number(initialData?.totalDiscount || 0))
  const [additionalCharges, setAdditionalCharges] = React.useState(0)
  const [autoRoundOff, setAutoRoundOff] = React.useState(true)
  const [amountPaid, setAmountPaid] = React.useState(Number(initialData?.amountPaid || 0))
  const [isFullyPaid, setIsFullyPaid] = React.useState(
    Number(initialData?.amountPaid || 0) >= Number(initialData?.grandTotal || 0) && Number(initialData?.grandTotal || 0) > 0
  )

  // Modals
  const [isPartyModalOpen, setIsPartyModalOpen] = React.useState(false)
  const [isEditPartyModalOpen, setIsEditPartyModalOpen] = React.useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = React.useState(false)
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = React.useState(false)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = React.useState(false)
  const [barcodeQuery, setBarcodeQuery] = React.useState("")
  const [isDiscountModalOpen, setIsDiscountModalOpen] = React.useState(false)
  const [discountInput, setDiscountInput] = React.useState("")
  const [discountType, setDiscountType] = React.useState<"FLAT" | "PERCENT">("FLAT")
  const [isChargesModalOpen, setIsChargesModalOpen] = React.useState(false)
  const [chargeInput, setChargeInput] = React.useState("")
  const [chargeName, setChargeName] = React.useState("Delivery / Shipping")
  const [quickSettingsTab, setQuickSettingsTab] = React.useState<"invoice" | "party" | "item" | null>(null)
  
  const [pastShippingAddresses, setPastShippingAddresses] = React.useState<string[]>([])

  React.useEffect(() => {
    if (partyId) {
      fetch(`/api/parties/${partyId}/addresses`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPastShippingAddresses(data.addresses)
          }
        })
    } else {
      setPastShippingAddresses([])
    }
  }, [partyId])

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = React.useState("")

  // Sync state whenever initialData changes
  React.useEffect(() => {
    if (!initialData) return
    setPartyId(initialData.partyId || initialData.party?.id || "")
    setPartyName(initialData.party?.name || "")
    setPartyBillingAddress(initialData.party?.billingAddress || "")
    setPartyShippingAddress(initialData.party?.shippingAddress || "")
    setPartyGstin(initialData.party?.gstin || "")
    setShowShippingAddress(!!initialData.party?.shippingAddress)
    setInvoicePrefix(initialData.invoicePrefix || "INV/STR-00")
    setInvoiceNumber(initialData.invoiceNumber || "20")
    setInvoiceDate(initialData.date ? initialData.date.split("T")[0] : new Date().toISOString().split("T")[0])
    setDueDate(initialData.dueDate ? initialData.dueDate.split("T")[0] : "")
    setShowDueDate(!!initialData.dueDate)
    setReference(initialData.reference || "")
    setNotes(initialData.notes || "")
    setDiscountAmount(Number(initialData.totalDiscount || 0))
    setAmountPaid(Number(initialData.amountPaid || 0))
    setIsFullyPaid(
      Number(initialData.amountPaid || 0) >= Number(initialData.grandTotal || 0) && Number(initialData.grandTotal || 0) > 0
    )
    if (initialData.lines && initialData.lines.length > 0) {
      setLines(
        initialData.lines.map((l: any) => ({
          id: l.id || Math.random().toString(36).substring(7),
          itemId: l.itemId || l.item?.id,
          itemName: l.item?.name || l.itemName || "Item",
          quantity: Number(l.quantity),
          rate: Number(l.rate),
          discountAmount: Number(l.discountAmount || 0),
          taxRateId: l.taxRateId || "",
          taxRatePercent: Number(l.taxPercentage || 0),
          godownId: l.godownId || godowns[0]?.id || "",
          amount: Number(l.quantity) * Number(l.rate) - Number(l.discountAmount || 0),
          taxAmount: Number(l.taxAmount || 0),
          total: Number(l.total),
        }))
      )
    }
  }, [initialData, godowns])

  // Totals calculation
  const totals = React.useMemo(() => {
    const rawTotals = calculateInvoiceTotals({
      lines: lines.map((l) => ({
        quantity: l.quantity,
        rate: l.rate,
        discountAmount: l.discountAmount,
        taxRatePercent: l.taxRatePercent,
      })),
      discountAmount,
      roundOff: 0,
    })

    const totalWithCharges = rawTotals.grandTotal + additionalCharges
    const computedRoundOff = autoRoundOff ? Math.round(totalWithCharges) - totalWithCharges : 0
    const finalGrandTotal = totalWithCharges + computedRoundOff

    return {
      ...rawTotals,
      subTotal: rawTotals.subTotal + additionalCharges,
      roundOff: computedRoundOff,
      grandTotal: finalGrandTotal,
    }
  }, [lines, discountAmount, additionalCharges, autoRoundOff])

  React.useEffect(() => {
    if (isFullyPaid) {
      setAmountPaid(totals.grandTotal)
    }
  }, [isFullyPaid, totals.grandTotal])

  // Handlers
  const handleAddItemsFromModal = (items: any[]) => {
    const newLines = items.map((item) => {
      const taxRatePercent = item.taxRate ? Number(item.taxRate.rate) : 0
      const computed = calculateLineTotal({
        quantity: 1,
        rate: item.salesPrice,
        discountAmount: 0,
        taxRatePercent,
      })
      return {
        id: Math.random().toString(36).substring(7),
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        rate: item.salesPrice,
        discountAmount: 0,
        taxRateId: item.taxRateId || taxRates[0]?.id || "",
        taxRatePercent,
        godownId: godowns[0]?.id || "",
        amount: computed.amount,
        taxAmount: computed.taxAmount,
        total: computed.total,
      }
    })
    setLines((prev) => [...prev, ...newLines])
  }

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  const updateLineQty = (id: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const computed = calculateLineTotal({
          quantity: qty,
          rate: l.rate,
          discountAmount: l.discountAmount,
          taxRatePercent: l.taxRatePercent,
        })
        return {
          ...l,
          quantity: qty,
          amount: computed.amount,
          taxAmount: computed.taxAmount,
          total: computed.total,
        }
      })
    )
  }

  const updateLineRate = (id: string, rate: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const computed = calculateLineTotal({
          quantity: l.quantity,
          rate: rate,
          discountAmount: l.discountAmount,
          taxRatePercent: l.taxRatePercent,
        })
        return {
          ...l,
          rate: rate,
          amount: computed.amount,
          taxAmount: computed.taxAmount,
          total: computed.total,
        }
      })
    )
  }

  const updateLineTotal = (id: string, total: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const taxMultiplier = 1 + (l.taxRatePercent || 0) / 100
        const taxableAmount = total / taxMultiplier
        const taxAmount = total - taxableAmount
        const qty = l.quantity || 1
        const rate = (taxableAmount + (l.discountAmount || 0)) / qty
        return {
          ...l,
          rate: Math.round(rate * 100) / 100,
          amount: taxableAmount,
          taxAmount: taxAmount,
          total: total,
        }
      })
    )
  }

  const updateLineDiscount = (id: string, discount: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const computed = calculateLineTotal({
          quantity: l.quantity,
          rate: l.rate,
          discountAmount: discount,
          taxRatePercent: l.taxRatePercent,
        })
        return {
          ...l,
          discountAmount: discount,
          amount: computed.amount,
          taxAmount: computed.taxAmount,
          total: computed.total,
        }
      })
    )
  }

  const updateLineTax = (id: string, taxRateId: string, taxRatePercent: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const computed = calculateLineTotal({
          quantity: l.quantity,
          rate: l.rate,
          discountAmount: l.discountAmount,
          taxRatePercent,
        })
        return {
          ...l,
          taxRateId,
          taxRatePercent,
          amount: computed.amount,
          taxAmount: computed.taxAmount,
          total: computed.total,
        }
      })
    )
  }

  const handleBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeQuery.trim()) return
    const res = await searchItems(barcodeQuery.trim())
    if (res && res.length > 0) {
      const item = res[0]
      const taxRatePercent = item.taxRate ? Number(item.taxRate.rate) : 0
      const computed = calculateLineTotal({
        quantity: 1,
        rate: Number(item.salesPrice),
        discountAmount: 0,
        taxRatePercent,
      })
      setLines((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          itemId: item.id,
          itemName: item.name,
          quantity: 1,
          rate: Number(item.salesPrice),
          discountAmount: 0,
          taxRateId: item.taxRateId || taxRates[0]?.id || "",
          taxRatePercent,
          godownId: godowns[0]?.id || "",
          amount: computed.amount,
          taxAmount: computed.taxAmount,
          total: computed.total,
        },
      ])
      setBarcodeQuery("")
      setIsBarcodeModalOpen(false)
    } else {
      alert("No item matching barcode / SKU: " + barcodeQuery)
    }
  }

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput) || 0
    if (discountType === "PERCENT") {
      setDiscountAmount((totals.subTotal * val) / 100)
    } else {
      setDiscountAmount(val)
    }
    setIsDiscountModalOpen(false)
  }

  const handleApplyCharges = () => {
    setAdditionalCharges(parseFloat(chargeInput) || 0)
    setIsChargesModalOpen(false)
  }

  const resetForm = () => {
    setPartyId("")
    setPartyName("")
    setLines([])
    setDiscountAmount(0)
    setAdditionalCharges(0)
    setAmountPaid(0)
    setIsFullyPaid(false)
    setNotes("")
    setReference("")
    setInvoiceNumber((prev: string) => String(parseInt(prev, 10) + 1 || 21))
  }

  const handleSubmit = async (saveAndNew = false) => {
    if (!partyId) return alert("Please select a party")
    if (lines.length === 0) return alert("Please add at least one item")

    setIsSubmitting(true)
    try {
      const payload: any = {
        partyId,
        date: new Date(invoiceDate).toISOString(),
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        reference,
        notes,
        paymentTerms: terms,
        bankDetails,
        invoicePrefix,
        invoiceNumber,
        billingAddress: partyBillingAddress,
        shippingAddress: partyShippingAddress,
        discountAmount,
        roundOff: totals.roundOff,
        amountPaid,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          rate: l.rate,
          discountAmount: l.discountAmount,
          taxRateId: l.taxRateId,
          taxRatePercent: l.taxRatePercent,
          godownId: l.godownId,
        })),
      }

      const response = await fetch(apiEndpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (data.success) {
        if (saveAndNew && !isEdit) {
          setSaveSuccessMsg("Invoice created successfully! Ready for next invoice.")
          setTimeout(() => setSaveSuccessMsg(""), 4000)
          resetForm()
        } else {
          router.push(returnPath)
          router.refresh()
        }
      } else {
        alert("Error: " + data.error)
      }
    } catch (error) {
      alert("Failed to save invoice")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f5f8] font-sans overflow-y-auto overflow-x-hidden relative pb-10">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Exit
          </button>
          <h1 className="text-lg font-bold text-gray-900">{docTitle}</h1>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-md">
          <button
            onClick={() => setViewMode("EDIT")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === "EDIT" ? "bg-white shadow-sm text-gray-900 font-bold" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Edit className="h-3.5 w-3.5 text-purple-600" /> Edit Mode
          </button>
          <button
            onClick={() => setViewMode("PREVIEW")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === "PREVIEW" ? "bg-white shadow-sm text-gray-900 font-bold" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Eye className="h-4 w-4 text-purple-600" /> Preview Mode
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuickSettingsTab("invoice")}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
          {!isEdit && (
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="bg-[#f8f9fa] text-gray-700 border border-gray-200 px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Save & New
            </button>
          )}
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-[#4d3ab3] hover:bg-[#3d2a93] text-white px-6 py-1.5 rounded-md text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update Invoice" : "Save"}
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> {saveSuccessMsg}
        </div>
      )}

      {/* CONDITIONAL RENDER: PREVIEW MODE */}
      {viewMode === "PREVIEW" ? (
        <div className="p-6 max-w-5xl mx-auto w-full">
          <PrintableInvoiceTemplate
            invoice={{
              invoiceNumber: `${invoicePrefix}/${invoiceNumber}`,
              date: invoiceDate,
              dueDate,
              reference: "",
              billingAddress: partyBillingAddress,
              shippingAddress: partyShippingAddress,
              party: {
                name: partyName || "Customer Name",
                mobileNumber: "",
                billingAddress: partyBillingAddress || "",
                shippingAddress: partyShippingAddress || partyBillingAddress || "",
                gstin: partyGstin || "",
              },
              lines: lines.map((l) => ({
                id: l.id,
                item: { name: l.itemName, hsnSac: "9954", unit: { shortName: "PCS" } },
                quantity: l.quantity,
                rate: l.rate,
                taxPercentage: l.taxRatePercent,
                taxAmount: l.taxAmount,
                total: l.total,
              })),
              subTotal: totals.subTotal,
              totalTax: totals.totalTax,
              totalDiscount: discountAmount,
              roundOff: 0,
              grandTotal: totals.grandTotal,
              amountPaid: 0,
            }}
          />
        </div>
      ) : (
        /* EDIT MODE */
        <div className="p-4 mx-auto w-full max-w-7xl">
          {/* Top Info Cards */}
          <div className="grid grid-cols-12 gap-4 mb-4">
            {/* Bill To & Ship To */}
            <div className="col-span-5 bg-white rounded-lg border border-gray-200 shadow-sm relative p-4 flex flex-col justify-between">
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => setQuickSettingsTab("party")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 tracking-wide uppercase block">
                  Bill To
                </label>
                <PartyCombobox
                  value={partyName}
                  onChange={(id, name) => {
                    setPartyId(id)
                    setPartyName(name)
                  }}
                  onSearch={async (q) => {
                    const res = await searchParties(q)
                    return res.map((p: any) => ({
                      id: p.id,
                      name: p.name,
                      balance: 0,
                      billingAddress: p.billingAddress,
                      shippingAddress: p.shippingAddress,
                      gstin: p.gstin,
                    }))
                  }}
                  onCreateNew={() => setIsPartyModalOpen(true)}
                />

                {/* Edit Billed To Party Trigger */}
                {partyId && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-600 font-medium truncate max-w-[200px]">
                      {partyBillingAddress || "No billing address set"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditPartyModalOpen(true)}
                      className="flex items-center gap-1 text-xs text-[#5c429e] hover:text-[#4d3ab3] font-bold"
                    >
                      <Edit className="w-3 h-3" /> Edit Party
                    </button>
                  </div>
                )}

                {/* Shipped To Details Section */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Shipped To (Delivery Address)
                    </span>
                    {!showShippingAddress && (
                      <button
                        type="button"
                        onClick={() => setShowShippingAddress(true)}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        + Edit Shipping Address
                      </button>
                    )}
                  </div>

                  {showShippingAddress ? (
                    <div className="mt-2 space-y-2">
                        <select
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#5c429e] bg-white"
                          value={pastShippingAddresses.includes(partyShippingAddress) ? partyShippingAddress : "custom"}
                          onChange={(e) => {
                            if (e.target.value !== "custom") {
                              setPartyShippingAddress(e.target.value)
                            }
                          }}
                        >
                          <option value="custom" disabled>--- Select a past address ---</option>
                          {pastShippingAddresses.length === 0 && <option disabled>No past addresses found</option>}
                          {pastShippingAddresses.map((addr, i) => (
                            <option key={i} value={addr}>{addr.length > 60 ? addr.substring(0, 60) + '...' : addr}</option>
                          ))}
                        </select>
                      <textarea
                        rows={2}
                        placeholder="Enter consignee / shipping destination address..."
                        value={partyShippingAddress}
                        onChange={(e) => setPartyShippingAddress(e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#5c429e] resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowShippingAddress(false)}
                        className="text-[11px] text-gray-400 hover:text-gray-600"
                      >
                        Hide details
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {partyShippingAddress || partyBillingAddress || "Same as Billing Address"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="col-span-7 bg-white rounded-lg border border-gray-200 shadow-sm relative">
              <div className="p-4">
                <label className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-4 block">
                  Invoice Details
                </label>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Sales Invoice Date
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                </div>

                {showDueDate ? (
                  <div className="grid grid-cols-3 gap-4 mb-4 border border-gray-200 border-dashed rounded p-3 relative bg-gray-50/30">
                    <button
                      onClick={() => setShowDueDate(false)}
                      className="absolute -top-2 -right-2 bg-white rounded-full border border-gray-200 p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none bg-white"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDueDate(true)}
                    className="w-full border-2 border-dashed border-blue-200 bg-[#f8fafe] text-blue-500 rounded py-2 text-sm font-medium hover:bg-blue-50 transition-colors mb-4"
                  >
                    + Add Due Date
                  </button>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">WO/RA Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-8921"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Table Container */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 flex flex-col">
            <div className="overflow-x-auto rounded-t-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-[#f8f9fc] border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-12">NO</th>
                    <th className="px-4 py-3">ITEMS</th>
                    <th className="px-4 py-3 w-28 text-center">QTY</th>
                    <th className="px-4 py-3 w-32 text-right">PRICE/ITEM (₹)</th>
                    <th className="px-4 py-3 w-28 text-right">DISC (₹)</th>
                    <th className="px-4 py-3 w-28 text-center">TAX</th>
                    <th className="px-4 py-3 w-32 text-right">AMOUNT (₹)</th>
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
                          onChange={(e) => updateLineQty(line.id, parseFloat(e.target.value) || 1)}
                          className="w-16 border border-gray-300 rounded px-1.5 py-1 text-center font-bold focus:border-[#5c429e] outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end border border-gray-300 focus-within:border-[#5c429e] rounded px-2 py-1 bg-white ml-auto w-28">
                          <span className="text-gray-400 text-xs mr-1">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.rate}
                            onChange={(e) => updateLineRate(line.id, parseFloat(e.target.value) || 0)}
                            className="w-full text-right outline-none font-semibold text-gray-800 text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end border border-gray-300 focus-within:border-[#5c429e] rounded px-2 py-1 bg-white ml-auto w-24">
                          <span className="text-gray-400 text-xs mr-1">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.discountAmount || 0}
                            onChange={(e) => updateLineDiscount(line.id, parseFloat(e.target.value) || 0)}
                            className="w-full text-right outline-none font-semibold text-gray-800 text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={line.taxRateId || ""}
                          onChange={(e) => {
                            const selectedTax = taxRates.find((t) => t.id === e.target.value)
                            updateLineTax(line.id, e.target.value, selectedTax ? Number(selectedTax.rate) : 0)
                          }}
                          className="border border-gray-300 focus:border-[#5c429e] rounded px-2 py-1 text-xs font-semibold text-gray-700 bg-white outline-none cursor-pointer w-24"
                        >
                          <option value="">0% Tax</option>
                          {taxRates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({Number(t.rate)}%)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end border border-gray-300 focus-within:border-[#5c429e] rounded px-2 py-1 bg-white ml-auto w-32">
                          <span className="text-gray-400 text-xs mr-1">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.total}
                            onChange={(e) => updateLineTotal(line.id, parseFloat(e.target.value) || 0)}
                            className="w-full text-right outline-none font-bold text-gray-900 text-sm"
                          />
                        </div>
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

            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white gap-4">
              <button
                onClick={() => setIsAddItemsModalOpen(true)}
                className="flex-1 border-2 border-dashed border-blue-300 bg-[#f4f8ff] text-blue-600 rounded-md py-2.5 flex items-center justify-center font-semibold text-sm hover:bg-blue-50 transition-colors"
              >
                + Add Item
              </button>
              <button
                onClick={() => setIsBarcodeModalOpen(true)}
                className="flex items-center gap-2 border border-gray-200 px-4 py-2.5 rounded-md text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 whitespace-nowrap"
              >
                <ScanBarcode className="h-4 w-4 text-purple-600" /> Scan Barcode / SKU
              </button>
            </div>

            <div className="bg-[#f8f9fc] flex items-center justify-end px-6 py-2 text-sm text-gray-700 font-medium border-b border-gray-200 rounded-b-lg">
              <div className="flex gap-12 mr-[80px]">
                <span className="text-gray-900 font-bold">Subtotal ({lines.length} items)</span>
                <span className="text-right">
                  Tax: ₹ {totals.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-right text-gray-900 font-bold">
                  Total: ₹ {totals.subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-12 gap-4">
            {/* Left Column - Notes, Terms */}
            <div className="col-span-7 space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <label className="text-xs font-semibold text-gray-500 mb-2 block">
                  Terms & Conditions
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400 min-h-[70px]"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <label className="text-xs font-semibold text-gray-500 mb-2 block">
                  Bank Details
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400 min-h-[60px]"
                  placeholder="Optional bank account details..."
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <label className="text-xs font-semibold text-gray-500 mb-2 block">
                  Invoice Notes & Remarks
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-400 min-h-[60px]"
                  placeholder="Optional customer notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Right Column - Totals */}
            <div className="col-span-5 bg-white rounded-lg border border-gray-200 shadow-sm h-fit">
              <div className="p-4 border-b border-gray-200 space-y-4">
                <button
                  onClick={() => setIsChargesModalOpen(true)}
                  className="flex items-center gap-2 text-blue-500 text-sm font-semibold hover:underline w-full"
                >
                  <Plus className="h-4 w-4 p-0.5 rounded-full border border-blue-500" />
                  {additionalCharges > 0 ? `Charges: ₹ ${additionalCharges}` : "Add Additional Charges"}
                </button>

                <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                  <span>Taxable Amount</span>
                  <span>
                    ₹ {totals.subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={() => setIsDiscountModalOpen(true)}
                  className="flex items-center gap-2 text-blue-500 text-sm font-semibold hover:underline w-full"
                >
                  <span className="w-4 h-4 rounded-full border border-blue-500 flex items-center justify-center text-[10px]">
                    %
                  </span>
                  {discountAmount > 0 ? `Discount: ₹ ${discountAmount}` : "Add Invoice Discount"}
                </button>

                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRoundOff}
                    onChange={(e) => setAutoRoundOff(e.target.checked)}
                    className="w-4 h-4 text-[#5c429e] rounded border-gray-300"
                  />
                  Auto Round Off ({totals.roundOff >= 0 ? `+₹ ${totals.roundOff.toFixed(2)}` : `-₹ ${Math.abs(totals.roundOff).toFixed(2)}`})
                </label>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                  <div className="flex border border-gray-300 rounded w-48 overflow-hidden">
                    <span className="bg-gray-50 border-r border-gray-300 px-3 py-2 text-sm text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      readOnly
                      value={totals.grandTotal.toFixed(2)}
                      className="w-full px-3 py-2 text-sm outline-none bg-gray-50 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
                <div className="flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <span>Total Amount Received</span>
                  <span>
                    ₹ {amountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex border border-gray-300 rounded bg-white overflow-hidden">
                  <span className="bg-gray-50 border-r border-gray-300 px-3 py-2 text-sm text-gray-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amountPaid || ""}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm outline-none text-gray-900 font-medium"
                  />
                  <select className="bg-gray-50 border-l border-gray-300 px-2 py-2 text-sm outline-none text-gray-600">
                    <option>Cash</option>
                    <option>Bank</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300"
                    checked={isFullyPaid}
                    onChange={(e) => setIsFullyPaid(e.target.checked)}
                  />
                  Mark as fully paid
                </label>
              </div>

              <div className="p-4 flex justify-between items-center text-sm font-bold text-[#1aa053] bg-emerald-50/30 rounded-b-lg">
                <span>Balance Amount</span>
                <span>
                  ₹{" "}
                  {Math.max(0, totals.grandTotal - amountPaid).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Search Modal */}
      {isBarcodeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleBarcodeSearch} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ScanBarcode className="h-5 w-5 text-purple-600" /> Scan or Enter Barcode / SKU
            </h3>
            <input
              type="text"
              autoFocus
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              placeholder="Scan barcode or type SKU..."
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:border-[#5c429e] outline-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#4d3ab3] text-white rounded-lg text-sm font-bold"
              >
                Lookup & Add Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Apply Invoice Discount</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setDiscountType("FLAT")}
                className={`flex-1 py-2 rounded-lg border text-sm font-bold ${
                  discountType === "FLAT" ? "bg-[#5c429e] text-white border-[#5c429e]" : "bg-white text-gray-700"
                }`}
              >
                Flat Amount (₹)
              </button>
              <button
                onClick={() => setDiscountType("PERCENT")}
                className={`flex-1 py-2 rounded-lg border text-sm font-bold ${
                  discountType === "PERCENT" ? "bg-[#5c429e] text-white border-[#5c429e]" : "bg-white text-gray-700"
                }`}
              >
                Percentage (%)
              </button>
            </div>
            <input
              type="number"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder={discountType === "FLAT" ? "Discount in Rupees (₹)" : "Discount percentage (%)"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDiscount}
                className="px-4 py-2 bg-[#4d3ab3] text-white rounded-lg text-sm font-bold"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Charges Modal */}
      {isChargesModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Add Additional Charges</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Charge Type</label>
              <input
                type="text"
                value={chargeName}
                onChange={(e) => setChargeName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={chargeInput}
                onChange={(e) => setChargeInput(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#5c429e] outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsChargesModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCharges}
                className="px-4 py-2 bg-[#4d3ab3] text-white rounded-lg text-sm font-bold"
              >
                Add Charge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        onSuccess={(party) => {
          setPartyId(party.id)
          setPartyName(party.name)
          setPartyBillingAddress(party.billingAddress || "")
          setPartyShippingAddress(party.shippingAddress || "")
          setPartyGstin(party.gstin || "")
        }}
      />

      <EditPartyModal
        isOpen={isEditPartyModalOpen}
        onClose={() => setIsEditPartyModalOpen(false)}
        party={{
          id: partyId,
          name: partyName,
          billingAddress: partyBillingAddress,
          shippingAddress: partyShippingAddress,
          gstin: partyGstin,
        }}
        onSuccess={(updated) => {
          setPartyName(updated.name)
          setPartyBillingAddress(updated.billingAddress || "")
          setPartyShippingAddress(updated.shippingAddress || "")
          setPartyGstin(updated.gstin || "")
        }}
      />

      <CreateItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        taxRates={taxRates as any}
        onSuccess={(newItem) => {
          handleAddItemsFromModal([newItem])
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
            taxRate: i.taxRate ? { rate: Number(i.taxRate.rate) } : undefined,
          }))
        }}
        onCreateNew={() => {
          setIsAddItemsModalOpen(false)
          setIsItemModalOpen(true)
        }}
        onAddItems={handleAddItemsFromModal}
      />

      <QuickSettingsModal
        isOpen={quickSettingsTab !== null}
        onClose={() => setQuickSettingsTab(null)}
        initialTab={quickSettingsTab || "invoice"}
      />
    </div>
  )
}
