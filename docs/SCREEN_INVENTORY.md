# Screen Inventory

This document maps all identified reference screenshots to their corresponding functional screens, routes, and modules.

## Inventory Matrix

| ID | Name | Proposed Route | Module | Parent Navigation | Description | Source File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SCREEN-001** | Sales Invoices List | `/sales/invoices` | Sales | Sales | Main list view of all sales invoices showing totals (Total Sales, Paid, Unpaid), filters, and data table. | `WhatsApp Image 2026-08-14 at 2.20.11 PM.jpeg` |
| **SCREEN-002** | Create Sales Invoice (Top) | `/sales/invoices/new` | Sales | Sales Invoices | Upper section of the invoice creation form including Party selection, Invoice Details, and Item entry header. | `WhatsApp Image 2026-08-14 at 2.20.12 PM.jpeg` |
| **SCREEN-003** | Create Sales Invoice (Bottom) | `/sales/invoices/new` | Sales | Sales Invoices | Lower section containing Notes, Terms & Conditions, Bank Details, Subtotal, Discounts, Round off, Total, and Payment received fields. | `WhatsApp Image 2026-08-14 at 2.20.12 PM (1).jpeg` |
| **SCREEN-004** | Create New Party Modal | Modal | Parties | Any | Modal dialog to quickly create a new party (customer/supplier) with Name, Mobile, Address, and GSTIN. | `WhatsApp Image 2026-08-14 at 2.20.13 PM (1).jpeg` |
| **SCREEN-005** | Party Search Dropdown | Dropdown | Parties | Create Sales Invoice | Searchable dropdown listing parties along with their current outstanding balance (payable/receivable). | `WhatsApp Image 2026-08-14 at 2.20.13 PM.jpeg` |
| **SCREEN-006** | Create New Item Modal | Modal | Inventory | Any | Modal to define a new Product/Service with Basic Details, Pricing, Tax Rate, and Opening Stock. | `WhatsApp Image 2026-08-14 at 2.20.14 PM (1).jpeg` |
| **SCREEN-007** | Invoice Details Popover | Popover | Sales | Create Sales Invoice | Expanded view to edit Invoice Prefix, Number, Date, Payment Terms, Due Date, and WO/RA fields. | `WhatsApp Image 2026-08-14 at 2.20.14 PM (2).jpeg` |
| **SCREEN-008** | Add Items to Bill Modal | Modal | Inventory | Create Sales Invoice | Search interface with table view to quickly select and add multiple items from inventory to the bill. | `WhatsApp Image 2026-08-14 at 2.20.14 PM.jpeg` |
| **SCREEN-009** | Quick Settings - Party | Modal | Settings | Create Sales Invoice | Quick settings modal targeting "Party Details" to manage custom fields (e.g., Ship TO). | `WhatsApp Image 2026-08-14 at 2.20.15 PM (1).jpeg` |
| **SCREEN-010** | Quick Settings - Invoice | Modal | Settings | Create Sales Invoice | Quick settings modal targeting "Invoice Details" to toggle prefix/sequence and custom fields. | `WhatsApp Image 2026-08-14 at 2.20.15 PM.jpeg` |

## Summary
* **Total Screenshots Analyzed:** 10
* **Modules Covered:** Sales, Parties, Inventory (Items), Settings
* **Missing Workflows:** Purchases, Accounting, GST, Reports, POS, Godowns (These will need UI generation based on the design language established by these 10 screens).
