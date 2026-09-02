import { Decimal } from "decimal.js"

export interface InvoiceLineInput {
  quantity: number
  rate: number
  discountAmount?: number
  taxRatePercent: number
}

export interface InvoiceLineOutput {
  amount: number
  taxAmount: number
  total: number
}

export interface InvoiceInput {
  lines: InvoiceLineInput[]
  discountAmount?: number
  roundOff?: number
}

export interface InvoiceTotals {
  subTotal: number
  totalTax: number
  grandTotal: number
}

/**
 * Calculates the totals for a single invoice line item.
 * All inputs and outputs are numbers, but calculations use Decimal.js to prevent floating point errors.
 */
export function calculateLineTotal(line: InvoiceLineInput): InvoiceLineOutput {
  const qty = new Decimal(line.quantity)
  const rate = new Decimal(line.rate)
  const discount = new Decimal(line.discountAmount || 0)
  const taxRate = new Decimal(line.taxRatePercent)

  const amount = qty.times(rate).minus(discount)
  const taxAmount = amount.times(taxRate).dividedBy(100)
  const total = amount.plus(taxAmount)

  return {
    amount: amount.toDecimalPlaces(2).toNumber(),
    taxAmount: taxAmount.toDecimalPlaces(2).toNumber(),
    total: total.toDecimalPlaces(2).toNumber()
  }
}

/**
 * Calculates the grand totals for an entire invoice based on its lines and global discounts.
 */
export function calculateInvoiceTotals(invoice: InvoiceInput): InvoiceTotals {
  let subTotal = new Decimal(0)
  let totalTax = new Decimal(0)

  // Calculate lines
  for (const line of invoice.lines) {
    const lineOutput = calculateLineTotal(line)
    subTotal = subTotal.plus(new Decimal(lineOutput.amount))
    totalTax = totalTax.plus(new Decimal(lineOutput.taxAmount))
  }

  const globalDiscount = new Decimal(invoice.discountAmount || 0)
  const roundOff = new Decimal(invoice.roundOff || 0)

  const grandTotal = subTotal.plus(totalTax).minus(globalDiscount).plus(roundOff)

  return {
    subTotal: subTotal.toDecimalPlaces(2).toNumber(),
    totalTax: totalTax.toDecimalPlaces(2).toNumber(),
    grandTotal: grandTotal.toDecimalPlaces(2).toNumber()
  }
}
