# Inventory Invariants

This document defines the strict rules for inventory tracking. Stock quantities are not simple mutable integers. They represent the net result of real-world movements.

## Append-Only Movement Model
All stock changes are recorded as immutable `StockMovement` events.

### Movement Types
1. **IN:** Stock enters the system (Purchases, Sales Returns, Positive Adjustments).
2. **OUT:** Stock leaves the system (Sales, Purchase Returns, Negative Adjustments, Wastage).

### Movement Structure
- `id`: UUID
- `businessId`: Tenant
- `itemId`: The product
- `godownId`: The specific warehouse/location
- `movementType`: ENUM (IN, OUT)
- `quantity`: Decimal (Always stored as a positive value; the `type` dictates math).
- `referenceType`: ENUM (SALES_INVOICE, PURCHASE_INVOICE, ADJUSTMENT, TRANSFER)
- `referenceId`: UUID linking back to the origin document.
- `createdAt`: Timestamp.

## Stock Calculation (Derivation)
Current Stock for an Item is calculated as:
`Total Stock = SUM(quantity WHERE type = 'IN') - SUM(quantity WHERE type = 'OUT')`

*Optimization Note:* While the movement table is the source of truth, reading `SUM()` across millions of rows can be slow. A materialized view, a cached `currentStock` column on the `Item` or `ItemGodown` table, or Redis cache will be used for fast reads, but this cache MUST only be updated via the transactional hooks that insert `StockMovement` rows.

## Transactional Integrity
An invoice saving process MUST insert the `StockMovement` rows in the same ACID transaction as the invoice itself. If the invoice fails, the stock does not move.

## Future Proofing
The `StockMovement` table is designed to easily accommodate:
- `batchId`: For pharma/FMCG expiry tracking.
- `serialNumber`: For electronics tracking.
These will simply be nullable columns on the movement record.
