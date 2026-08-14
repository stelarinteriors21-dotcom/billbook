# Architecture Proposal

## 1. Technology Stack
* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui or Radix (for unstyled accessible primitives).
* **State Management:** React Context + Zustand (for complex local state like billing engine), React Query (for server state).
* **Backend:** Next.js Route Handlers (API layer).
* **Database:** PostgreSQL (relational integrity required for financial logic).
* **ORM:** Prisma.

## 2. Database Schema Foundation (High Level)
* **Tenant/Business:** `Business` (Core tenant), `User`, `BusinessUserRole`.
* **Entities:** `Party` (Customers/Suppliers), `Item` (Products/Services), `Category`.
* **Transactions:** `Invoice`, `InvoiceLineItem`, `Payment`.
* **Ledger (Accounting Invariants):** `LedgerEntry` (Double-entry system tracking Receivables, Payables, Sales, Cash, Bank).
* **Inventory (Inventory Invariants):** `StockMovement` (Tracks every IN/OUT adjustment. Current stock is a derived or synchronized cached value).

## 3. API & Service Boundaries
* **UI Components** will only dispatch actions to custom hooks.
* **API Routes** will validate requests using Zod.
* **Service Layer** will handle core business logic.
* **Database Transactions:** The service layer will ensure that creating an invoice, moving stock, and creating ledger entries happen within a single ACID transaction.

## 4. Multi-Tenancy Strategy
* Every database table containing business data will have a `businessId` column.
* The API layer will enforce authorization, extracting the `businessId` from the active session and appending it to every Prisma query automatically.
