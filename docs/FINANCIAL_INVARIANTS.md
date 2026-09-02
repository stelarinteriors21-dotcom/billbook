# Financial Invariants & Billing Engine

This document outlines the strict rules governing financial integrity. Frontend calculations are strictly for UX; the backend is the ultimate authority.

## The Billing Engine Service
A centralized pure-logic service (e.g., `calculateInvoiceTotals(lines, globalDiscount, ...)`).

### Pipeline
1. **Line Level:**
   - `Line Subtotal = Quantity * Rate`
   - `Line Discount Amount = Calculate(Line Subtotal, Line Discount Percentage/Flat)`
   - `Line Taxable Amount = Line Subtotal - Line Discount Amount`
   - `Line Tax (CGST/SGST/IGST) = Calculate(Line Taxable Amount, Tax Rate)`
   - `Line Total = Line Taxable Amount + Line Tax`
2. **Invoice Level:**
   - `Invoice Subtotal = SUM(Line Subtotals)`
   - `Invoice Item Discount = SUM(Line Discount Amounts)`
   - `Invoice Additional Discount = Flat/Percentage applied globally`
   - `Invoice Taxable Amount = SUM(Line Taxable Amounts) - Invoice Additional Discount`
   - `Invoice Total Tax = SUM(Line Taxes)`
   - `Invoice Grand Total = Round(Invoice Taxable Amount + Invoice Total Tax + Additional Charges)`

## Transactional Save Flow (The Invariant)
When a Sales Invoice is saved, a single database transaction MUST encapsulate all the following operations. If one fails, the entire transaction rolls back.

1. **Persist Invoice & Lines:** Save the calculated snapshot to `Invoice` and `InvoiceLineItem`.
2. **Persist Payment (If Applicable):** If upfront payment is provided, create a `Payment` record.
3. **Persist Ledger Impact (Double Entry):**
   - *Example: ₹100 Sale + ₹18 Tax (Unpaid)*
     - Debit `Accounts Receivable` (Party Sub-ledger): ₹118
     - Credit `Sales Revenue`: ₹100
     - Credit `Output CGST/SGST`: ₹18
   - *If ₹118 Payment is received immediately:*
     - Debit `Cash/Bank`: ₹118
     - Credit `Accounts Receivable`: ₹118
4. **Persist Inventory Impact:**
   - For every physical product in the invoice lines, insert a `StockMovement` (Type: OUT, Qty: X, Ref: Invoice ID).

## Deriving Outstanding Balances
Outstanding balances are **NOT** stored as a raw mutable number on the `Party` table (e.g., `party.balance += invoice.total`).
Instead, they are derived dynamically or carefully cached by aggregating the `LedgerEntry` table for that `partyId`.
`Outstanding = SUM(Debit) - SUM(Credit)` for the Party's Receivable Account.
