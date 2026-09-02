import test from "node:test"
import assert from "node:assert/strict"
import { calculateLineTotal, calculateInvoiceTotals } from "./billing-engine"

test("calculateLineTotal correctly calculates amount and tax", () => {
  const result = calculateLineTotal({
    quantity: 2,
    rate: 1000,
    discountAmount: 100, // 2000 - 100 = 1900
    taxRatePercent: 18 // 1900 * 0.18 = 342
  })

  assert.strictEqual(result.amount, 1900)
  assert.strictEqual(result.taxAmount, 342)
  assert.strictEqual(result.total, 2242)
})

test("calculateInvoiceTotals calculates grand total", () => {
  const result = calculateInvoiceTotals({
    lines: [
      {
        quantity: 1,
        rate: 1000,
        taxRatePercent: 18
      },
      {
        quantity: 2,
        rate: 500,
        taxRatePercent: 5
      }
    ],
    discountAmount: 50,
    roundOff: 0.5
  })

  // Line 1: amt 1000, tax 180
  // Line 2: amt 1000, tax 50
  // subTotal = 2000
  // totalTax = 230
  // grandTotal = 2000 + 230 - 50 + 0.5 = 2180.5

  assert.strictEqual(result.subTotal, 2000)
  assert.strictEqual(result.totalTax, 230)
  assert.strictEqual(result.grandTotal, 2180.5)
})
