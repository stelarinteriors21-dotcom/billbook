"use client"

import * as React from "react"
import { numberToWordsIndian } from "@/lib/number-to-words"

interface PrintableInvoiceTemplateProps {
  invoice: any
}

function formatINR(n: number) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return ""
  const date = new Date(d)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function PrintableInvoiceTemplate({ invoice }: PrintableInvoiceTemplateProps) {
  const business = invoice.business || {}
  const party = invoice.party || {}
  const lines = invoice.lines || []

  const totalQty = lines.reduce((acc: number, l: any) => acc + Number(l.quantity || 0), 0)
  const taxableAmount = Number(invoice.subTotal || 0)
  const totalTax = Number(invoice.totalTax || 0)
  const halfTax = totalTax / 2
  const roundOff = Number(invoice.roundOff || 0)
  const grandTotal = Number(invoice.grandTotal || 0)
  const amountPaid = Number(invoice.amountPaid || 0)
  const balance = Math.max(0, grandTotal - amountPaid)

  // Default company details matching the user's template
  const companyName = business.name || "STELAR INTERIORS PVT LTD"
  const companyAddress = business.address || "Vattavila, kunathukal PO, Trivandrum , Kerala, 695504"
  const companyGstin = business.gstin || "32ABGCS4458L1Z0"
  const companyPhone = business.phone || "0773613733"
  const companyEmail = business.email || "info@stelar.in"
  const companyPan = companyGstin ? companyGstin.substring(2, 12) : "ABGCS4458L"

  return (
    <div className="w-full bg-white text-gray-900 font-sans p-6 sm:p-8 text-[12px] leading-relaxed max-w-[850px] mx-auto border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0">
      {/* 1. Header Section: Company Logo & Details (Left) vs TAX INVOICE & Meta (Right) */}
      <div className="flex justify-between items-start pb-4 border-b border-gray-300">
        {/* Company Info with Logo */}
        <div className="flex items-start gap-4 max-w-[55%]">
          {/* Stelar Interiors Brand Logo */}
          <div className="w-14 h-14 flex-shrink-0 mt-0.5">
            <img
              src="/stelar-logo.png"
              alt="Stelar Interiors Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <h1 className="text-sm font-extrabold tracking-wide uppercase text-gray-900">
              {companyName}
            </h1>
            <p className="text-[11px] text-gray-700 mt-0.5 leading-snug">{companyAddress}</p>
            <div className="text-[11px] text-gray-800 font-medium mt-1 space-y-0.5">
              <p>
                <span className="font-bold">GSTIN :</span> {companyGstin}
              </p>
              <p>
                <span className="font-bold">Mobile :</span> {companyPhone}
              </p>
              <p>
                <span className="font-bold">Email :</span> {companyEmail}
              </p>
              <p>
                <span className="font-bold">stelar.in:</span> www.stelar.in
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Metadata (Right) */}
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">
              TAX INVOICE
            </h2>
            <span className="border border-gray-400 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              ORIGINAL FOR RECIPIENT
            </span>
          </div>

          <table className="text-[11px] text-left">
            <tbody>
              <tr>
                <td className="font-semibold text-gray-700 pr-2 py-0.5">Invoice No.</td>
                <td className="font-bold text-gray-900 pr-1">:</td>
                <td className="font-bold text-gray-900 pl-2 text-right">
                  {invoice.invoiceNumber || ""}
                </td>
              </tr>
              <tr>
                <td className="font-semibold text-gray-700 pr-2 py-0.5">Invoice Date</td>
                <td className="font-bold text-gray-900 pr-1">:</td>
                <td className="font-medium text-gray-900 pl-2 text-right">
                  {formatDate(invoice.date)}
                </td>
              </tr>
              {invoice.reference && (
                <tr>
                  <td className="font-semibold text-gray-700 pr-2 py-0.5">WO/RA</td>
                  <td className="font-bold text-gray-900 pr-1">:</td>
                  <td className="font-medium text-gray-900 pl-2 text-right">
                    {invoice.reference}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Party Cards: BILL TO vs SHIP TO */}
      <div className={`grid ${invoice.shippingAddress ? "grid-cols-2" : "grid-cols-1"} gap-8 py-4 border-b border-gray-300 text-[11px]`}>
        {/* BILL TO */}
        <div>
          <div className="inline-block bg-[#eef0f3] text-gray-800 text-[10px] font-bold px-2.5 py-0.5 rounded mb-1.5 uppercase tracking-wider">
            BILL TO
          </div>
          <h3 className="font-extrabold text-[12px] text-gray-900 uppercase">{party.name}</h3>
          <p className="text-gray-700 mt-0.5 leading-snug whitespace-pre-wrap">
            {invoice.billingAddress || party.billingAddress || ""}
          </p>
          <div className="mt-1.5 space-y-0.5 text-gray-800">
            {party.mobileNumber && (
              <p>
                <span className="font-bold">Mobile :</span> {party.mobileNumber}
              </p>
            )}
            {party.gstin && (
              <p>
                <span className="font-bold">GSTIN :</span> {party.gstin}
              </p>
            )}
            <p>
              <span className="font-bold">Place of Supply :</span> Kerala
            </p>
          </div>
        </div>

        {/* SHIP TO — only shown if shipping address is set */}
        {invoice.shippingAddress && (
          <div>
            <div className="inline-block bg-[#eef0f3] text-gray-800 text-[10px] font-bold px-2.5 py-0.5 rounded mb-1.5 uppercase tracking-wider">
              SHIP TO
            </div>
            <h3 className="font-extrabold text-[12px] text-gray-900 uppercase">
              {invoice.shippingName || party.name}
            </h3>
            <p className="text-gray-700 mt-0.5 leading-snug whitespace-pre-wrap">
              {invoice.shippingAddress}
            </p>
          </div>
        )}
      </div>

      {/* 3. Items Table */}
      <div className="py-2">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="bg-[#eef0f3] text-gray-800 font-bold uppercase text-[10px] border-b border-gray-300">
              <th className="py-2 px-2 w-12 text-center">S.NO.</th>
              <th className="py-2 px-3">ITEMS</th>
              <th className="py-2 px-3 w-20 text-center">HSN</th>
              <th className="py-2 px-3 w-20 text-center">QTY.</th>
              <th className="py-2 px-3 w-24 text-right">RATE</th>
              <th className="py-2 px-3 w-28 text-right">TAX</th>
              <th className="py-2 px-3 w-28 text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line: any, idx: number) => {
              const taxPct = Number(line.taxPercentage || 18)
              return (
                <tr key={line.id || idx} className="border-b border-gray-200">
                  <td className="py-2.5 px-2 text-center text-gray-700">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900 uppercase">
                    {line.item?.name || line.itemName || "Item"}
                  </td>
                  <td className="py-2.5 px-3 text-center text-gray-700">
                    {line.item?.hsnSac || line.hsnSac || "9954"}
                  </td>
                  <td className="py-2.5 px-3 text-center text-gray-800 font-semibold">
                    {Number(line.quantity)} {line.item?.unit?.shortName || "PCS"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-800 font-medium">
                    {formatINR(Number(line.rate))}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-800">
                    <div>{formatINR(Number(line.taxAmount || 0))}</div>
                    <div className="text-[9px] text-gray-500">({taxPct}%)</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                    {formatINR(Number(line.total))}
                  </td>
                </tr>
              )
            })}

            {/* Subtotal Row */}
            <tr className="bg-[#eef0f3] font-bold text-[11px] text-gray-900 border-b border-gray-300">
              <td colSpan={3} className="py-2 px-3 font-extrabold uppercase">
                SUBTOTAL
              </td>
              <td className="py-2 px-3 text-center">{totalQty}</td>
              <td></td>
              <td className="py-2 px-3 text-right">₹ {formatINR(totalTax)}</td>
              <td className="py-2 px-3 text-right">₹ {formatINR(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Lower Section: Terms & Bank Details (Left) vs Financial Summary & Signature (Right) */}
      <div className="grid grid-cols-12 gap-6 pt-4 text-[11px]">
        {/* Left Side (Col 7): Terms & Conditions + Bank Details */}
        <div className="col-span-7 space-y-4">
          <div>
            <h4 className="font-bold text-[11px] uppercase tracking-wide text-gray-900 mb-1">
              TERMS AND CONDITIONS
            </h4>
            <ol className="list-none space-y-0.5 text-gray-700 text-[10px] leading-relaxed">
              <li>1. Goods or services, once sold, will not be taken back or exchanged.</li>
              <li>2. All disputes are subject to Trivandrum jurisdiction only.</li>
              <li>3. All the prices mentioned above are inclusive of Tax's (GST).</li>
            </ol>
          </div>

          <div>
            <h4 className="font-bold text-[11px] uppercase tracking-wide text-gray-900 mb-1">
              BANK DETAILS
            </h4>
            <table className="text-[10px] text-gray-800">
              <tbody>
                <tr>
                  <td className="font-semibold pr-3 py-0.5 text-gray-700">Name:</td>
                  <td className="font-medium text-gray-900">{companyName}</td>
                </tr>
                <tr>
                  <td className="font-semibold pr-3 py-0.5 text-gray-700">IFSC Code:</td>
                  <td className="font-bold text-gray-900">ICIC0000389</td>
                </tr>
                <tr>
                  <td className="font-semibold pr-3 py-0.5 text-gray-700">Account No:</td>
                  <td className="font-bold text-gray-900">075305002837</td>
                </tr>
                <tr>
                  <td className="font-semibold pr-3 py-0.5 text-gray-700">Bank:</td>
                  <td className="font-medium text-gray-900">ICICI Bank ,TRIVANDRUM KOWDIAR</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side (Col 5): Tax Breakdown + Total + Signature */}
        <div className="col-span-5 flex flex-col justify-between">
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-gray-700">
              <span>Taxable Amount</span>
              <span className="font-medium">₹ {formatINR(taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>CGST @9%</span>
              <span className="font-medium">₹ {formatINR(halfTax)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>SGST @9%</span>
              <span className="font-medium">₹ {formatINR(halfTax)}</span>
            </div>
            {roundOff !== 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Round Off</span>
                <span className="font-medium">
                  {roundOff < 0 ? `- ₹ ${formatINR(Math.abs(roundOff))}` : `₹ ${formatINR(roundOff)}`}
                </span>
              </div>
            )}

            <div className="border-t border-b border-gray-400 py-1.5 my-1 flex justify-between font-extrabold text-[12px] text-gray-900">
              <span>Total Amount</span>
              <span>₹ {Math.round(grandTotal).toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>Received Amount</span>
              <span className="font-semibold text-gray-900">₹ {Math.round(amountPaid).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-gray-700 font-semibold">
              <span>Balance</span>
              <span>₹ {Math.round(balance).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Amount In Words */}
          <div className="mt-4 text-right">
            <p className="text-[10px] font-bold text-gray-600">Total Amount (in words)</p>
            <p className="text-[10px] font-semibold text-gray-900 leading-snug italic">
              {numberToWordsIndian(grandTotal)}
            </p>
          </div>

          {/* Authorized Signature Box */}
          <div className="mt-5 text-right flex flex-col items-end">
            <div className="w-36 h-14 border border-gray-400 rounded-md mb-1 bg-gray-50/30"></div>
            <p className="text-[10px] text-gray-600">Authorised Signature for</p>
            <p className="text-[10px] font-extrabold text-gray-900 uppercase">{companyName}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
