# Database Architecture

This document describes the foundational database architecture, ensuring comprehensive support for multi-tenancy, financial integrity, and inventory invariants.

## Core Principles
1. **PostgreSQL as Source of Truth:** Relational integrity, constraints, and cascading rules are managed at the database level.
2. **Multi-Tenancy via `businessId`:** Every tenant-specific table requires a non-nullable `businessId` foreign key.
3. **Audit Trails:** Essential financial and inventory models include `createdAt`, `updatedAt`, and `createdById`.

## Entities & Relationships

### 1. Tenancy & Access Control
- `User`: Global users of the SaaS.
- `Business`: The core tenant. Has a 1:M relationship with Users via `BusinessUserRole`.
- `Role`: (e.g., Admin, Cashier, Manager).
- `BusinessUserRole`: Join table mapping Users to Businesses with specific Roles.

### 2. Core Entities
- `Party`: Customers or Suppliers. Fields include `partyType` (CUSTOMER/SUPPLIER), `gstin`, `billingAddress`, `shippingAddress`, `creditLimit`.
- `Item`: Products or Services. Fields include `itemType` (PRODUCT/SERVICE), `hsnSac`, `salesPrice`, `purchasePrice`, `taxRateId`.
- `Category` & `Unit`: Standard dimension tables linked to Items.
- `TaxRate`: Centralized tax configurations (e.g., "GST 18%").

### 3. Transactions (Sales & Purchases)
- `Invoice`: The core billing document. Fields: `invoiceNumber`, `date`, `dueDate`, `type` (SALES, PURCHASE, SALES_RETURN, PURCHASE_RETURN), `subTotal`, `totalDiscount`, `totalTax`, `grandTotal`, `status` (PAID, PARTIAL, UNPAID).
- `InvoiceLineItem`: Represents rows in an invoice. Links to `Invoice` and `Item`. Captures the *snapshot* of pricing at the time of sale (`quantity`, `rate`, `discount`, `taxAmount`, `total`).
- `Payment`: Tracks incoming or outgoing funds. Links to `Invoice` and `Party`. Fields: `amount`, `paymentMode` (CASH, BANK, UPI), `referenceNumber`.

### 4. Financial Ledger (Double-Entry System)
- `LedgerEntry`: The ultimate source of truth for all outstanding balances and accounting.
  - `accountId`: (System accounts like "Accounts Receivable", "Sales Revenue", "Cash").
  - `partyId`: Used for sub-ledgers.
  - `debit`: Decimal.
  - `credit`: Decimal.
  - `referenceType`: (e.g., "INVOICE", "PAYMENT").
  - `referenceId`: The ID of the triggering document.

### 5. Inventory Management
- `Godown`: Warehouses or locations.
- `StockMovement`: Append-only event history.
  - `itemId`: The product.
  - `godownId`: Location.
  - `type`: IN, OUT, ADJUST.
  - `quantity`: Positive decimal.
  - `referenceType`: (e.g., "INVOICE", "MANUAL").
  - `referenceId`: Link to the trigger.
  - *Current Stock is derived by: SUM(IN) - SUM(OUT) for a given item/godown.*

## Future Proofing
The schema will include stubs or enums designed to eventually support:
- `Batch` and `SerialNumber` tracking on `StockMovement`.
- `StockTransfer` documents.
- Detailed `Expense` categories.
