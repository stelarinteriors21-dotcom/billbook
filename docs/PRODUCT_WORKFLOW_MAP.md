# Product Workflow Map

Based on the reference UI, here are the core identified workflows.

## 1. Sales Workflow
**Goal:** Create and manage sales transactions.
* **List Invoices:** User navigates to `Sales > Sales Invoices` to view all past invoices.
* **Create Invoice:** User clicks "Create Sales Invoice".
* **Party Selection:**
  * User searches for an existing party.
  * *Branch:* If party doesn't exist, user clicks "+ Create Party", fills the modal, saves, and the new party is auto-selected.
* **Invoice Details:** User configures Prefix, Sequence Number, Date, Payment Terms.
* **Item Entry:**
  * User searches for items by Name/Barcode/HSN/SKU.
  * *Branch:* If item doesn't exist, user clicks "+ Create New Item", fills modal (Product/Service, Pricing, Tax, Opening Stock), saves, and item is added.
* **Charges & Discounts:** User adds additional charges or discounts.
* **Payment Allocation:** User enters the amount received upfront.
* **Save/Print:** User saves the invoice. System generates PDF and updates ledger/inventory.

## 2. Party Management Workflow
**Goal:** Manage customer and supplier relationships.
* **Quick Create:** Handled via modal during sales/purchase flows.
* **Detailed Management:** (Assumed based on sidebar) Navigate to `Parties` to view ledgers, outstanding balances, and contact details.

## 3. Inventory Management Workflow
**Goal:** Manage products, services, and stock.
* **Quick Create:** Handled via modal during billing.
* **Detailed Management:** (Assumed based on sidebar) Navigate to `Items` to view stock levels, set pricing, adjust stock, and view movement history.

## 4. Settings Workflow
**Goal:** Configure application behavior.
* **Quick Settings:** Contextual settings available during workflows (e.g., Invoice Prefix settings inside the Create Invoice screen).
* **Global Settings:** Accessible via the bottom sidebar or top-right header gear icon.
