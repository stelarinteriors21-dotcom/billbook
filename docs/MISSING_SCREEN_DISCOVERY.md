# Missing Screen Discovery

This document identifies modules and workflows that are part of the master platform requirement but are **not** covered by the 10 reference screenshots. 

*Before implementing any of these modules, we must extract the design language from the available screens and document our assumptions here.*

## 1. Purchases Module
- **Expected Screens:** Purchase Invoices List, Create Purchase Invoice, Purchase Orders.
- **Dependencies:** Items, Parties (Suppliers), Tax Engine.
- **Design Assumption:** The `Create Purchase Invoice` screen will structurally mirror the `Create Sales Invoice` screen to maintain UX consistency, swapping "Customer" for "Supplier" terminology.

## 2. Point of Sale (POS)
- **Expected Screens:** Dedicated POS terminal interface (optimized for barcode scanners, touch, and extreme speed).
- **Dependencies:** Items, Billing Engine, Quick Payment methods.
- **Design Assumption:** This will likely require a radically different layout than the standard Sales Invoice—likely a full-screen, grid-based layout for quick tapping, with a fixed right-hand cart.

## 3. Inventory & Godowns
- **Expected Screens:** Stock Ledger, Stock Adjustment, Godown Transfer, Batch/Serial Management.
- **Dependencies:** `StockMovement` architecture.
- **Design Assumption:** Tabular views similar to `Sales Invoices`, with modal-based adjustment forms.

## 4. Accounting & Ledgers
- **Expected Screens:** Chart of Accounts, Party Ledger (Account Statement), Cash/Bank Book, Expense Entry, Journal Entries.
- **Dependencies:** `LedgerEntry` architecture.
- **Design Assumption:** Read-heavy tabular reports with running balances.

## 5. Reports & GST
- **Expected Screens:** Sales Summary, Tax Reports (GSTR-1, GSTR-2, GSTR-3B formats), Profit/Loss.
- **Dependencies:** Aggregation of Invoices and Ledger Entries.

## 6. Staff & User Management
- **Expected Screens:** Staff List, Role/Permission Configuration.
- **Dependencies:** NextAuth, Role-Based Access Control (RBAC).

## MVP Priority
For the **Phase 1 MVP**, we are strictly ignoring these missing modules. The focus is exclusively on delivering the working Sales Invoice vertical slice based on the explicit reference screenshots.
