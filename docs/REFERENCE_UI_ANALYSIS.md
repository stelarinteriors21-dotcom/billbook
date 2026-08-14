# Reference UI Analysis

## 1. Global Layout & Structure
* **Sidebar Layout:** Left vertical sidebar for primary navigation. 
  * Dark blue/slate background. 
  * Company profile at the top with logo, name, and phone number. 
  * "Create Sales Invoice" floating button prominently displayed near the top of the sidebar.
  * Hierarchical accordion menu items (e.g., Sales -> Sales Invoices).
  * Settings and certification badges at the very bottom.
* **Main Content Area:** 
  * Light grey/white background.
  * Distinct Page Header displaying the title (e.g., "Sales Invoices" or "Create Sales Invoice").
  * Action buttons placed top right (e.g., Reports, Settings, Create/Save).
* **Responsive Behavior:** 
  * The main content area fluidly expands.
  * The sidebar is likely collapsible on smaller screens (hamburger menu).
  * Drawers/Modals used for creating entities (Parties, Items) without leaving the current context.

## 2. Component System
* **Cards & Containers:** 
  * Summary cards used for key metrics (e.g., Total Sales, Paid, Unpaid). 
  * Light background with subtle borders and shadows.
  * Distinct color-coded text/icons for metrics (Purple for Total, Green for Paid, Red for Unpaid).
* **Buttons:**
  * Primary Actions: Solid purple buttons (`#5c52c6` approximately).
  * Secondary Actions: Outline or light grey buttons.
  * Icon Buttons: Used for settings (gear icon) and contextual menus (three dots).
* **Tables:**
  * Clean, borderless rows with alternating very subtle zebra striping.
  * Sticky headers.
  * Columns separated by sufficient whitespace rather than vertical lines.
  * Status badges (e.g., "Paid" in green, "Unpaid" in red/orange).
  * Row-level action menus (vertical ellipsis).
* **Forms & Inputs:**
  * Floating labels or standard top labels.
  * Dashed border placeholders for adding new rows/items (`+ Add Item`).
  * Dropdowns with search capabilities.
  * Distinct sections separated by horizontal lines or light grey backgrounds.
  * Modal overlays for complex creations (Quick Settings, Create Party).

## 3. Typography & Visual Hierarchy
* **Font Family:** Sans-serif, likely Inter, Roboto, or similar modern system font.
* **Hierarchy:**
  * **H1/Page Titles:** Large, bold, dark grey (e.g., "Sales Invoices").
  * **H2/Card Values:** Very large, medium weight (e.g., `₹ 70,64,484.92`).
  * **Table Headers:** Small, bold, uppercase or capitalized, grey text.
  * **Body Text:** Standard size, dark grey for readability.
* **Color Palette:**
  * Primary Brand: Indigo/Purple
  * Success: Green (Paid status, positive balances)
  * Danger/Warning: Red (Unpaid status, negative balances)
  * Backgrounds: White and off-white/light-grey.
  * Text: Dark Slate/Grey.

## 4. Interaction Patterns
* **Contextual Creation:** Modals are heavily used to create missing entities (Parties, Items) directly from the invoice creation flow. This prevents users from losing their current context.
* **Keyboard Shortcuts:** Explicitly indicated in the UI (e.g., `Shift + M` for adding items, `[ESC]` to cancel, `[F7]` to add to bill). Highly optimized for fast keyboard-centric data entry.
* **Search & Select:** Comboboxes used for party and item selection showing rich data (balance, stock).
