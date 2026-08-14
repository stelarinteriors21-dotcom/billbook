# Implementation Roadmap

This roadmap defines the execution phases to build the application as requested in the master build directive.

## PHASE 0: Discovery & Setup (Current)
* [x] Analyze reference screenshots.
* [x] Document screen inventory (`SCREEN_INVENTORY.md`).
* [x] Document reference UI analysis (`REFERENCE_UI_ANALYSIS.md`).
* [x] Document product workflow map (`PRODUCT_WORKFLOW_MAP.md`).
* [x] Create initial architecture proposal (`ARCHITECTURE.md`).
* [ ] Initialize Next.js project.

## PHASE 1: Architecture + Database Foundation
* Set up Next.js with Tailwind, TypeScript, and Prisma.
* Implement database schema (Business, User, Party, Item, Invoice, Ledger, Inventory).
* Configure multi-tenancy rules and authorization layer.

## PHASE 2: Authentication + Business Onboarding
* Implement NextAuth for login/logout and session management.
* Implement Business profile creation and selection.
* Role-based access control setup.

## PHASE 3: Application Shell + Navigation
* Implement the core UI layout (Sidebar, Header, Main Content).
* Implement the design system primitives (Buttons, Modals, Tables, Forms).

## PHASE 4: Customers + Suppliers (Parties)
* Implement Party CRUD operations.
* Build the `Create New Party` modal.
* Build the Party List and Ledger views.

## PHASE 5: Products + Catalogue (Items)
* Implement Item CRUD operations.
* Build the `Create New Item` modal.
* Build the Item List and Pricing views.

## PHASE 6: Inventory
* Implement Stock Movement tracking.
* Opening stock and stock adjustment flows.

## PHASE 7: Sales Billing
* Build the central calculation/billing engine.
* Implement `Create Sales Invoice` complete flow (Top/Bottom).
* Implement transactional save (Invoice + Stock + Ledger).
* Build `Sales Invoices` list view.

## PHASE 8 to 18: Extended Features
*(As outlined in the master directive, including Purchases, Payments, GST, POS, Godowns, Reports, Staff, Integrations, Settings, Security, and Final QA).*
