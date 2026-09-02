# Design System & UI Primitives

This document extracts the design tokens and component requirements from the reference screenshots. We are building **Custom Tailwind Components**, strictly adhering to this visual language, without relying on external UI libraries like shadcn/ui.

## 1. Design Tokens

### Colors
- **Brand Primary:** Purple/Indigo (`#5c52c6` approximately). Used for primary buttons, active states, and highlights.
- **Success:** Green (`#22c55e` approximately). Used for "Paid" badges, positive stock, positive balances.
- **Danger:** Red/Orange (`#ef4444` approximately). Used for "Unpaid" badges, negative balances, delete actions.
- **Backgrounds:**
  - App Background: Light grey (`#f9fafb` or similar).
  - Sidebar: Dark Slate/Blue (`#1e293b` approximately).
  - Cards/Modals: White (`#ffffff`).
- **Text:**
  - Primary: Dark Grey (`#1f2937`).
  - Secondary/Muted: Medium Grey (`#6b7280`).
  - Table Headers: Slate (`#64748b`).

### Typography
- **Font Family:** Inter or system sans-serif.
- **Sizes:**
  - Page Titles (H1): 24px, Bold.
  - Card Metrics: 28px - 32px, Medium.
  - Standard Body: 14px.
  - Small Text / Badges: 12px.

### Spacing & Layout
- **Density:** Compact. Forms and tables use tight padding to maximize data visibility without feeling cluttered.
- **Border Radius:**
  - Buttons/Inputs: 6px to 8px (md).
  - Cards/Modals: 8px to 12px (lg).
- **Shadows:**
  - Modals: Heavy drop shadow (xl).
  - Cards: Very subtle, soft shadow (sm) or simple 1px border.
  - Sidebar: Minimal shadow, distinct color contrast.

## 2. Core UI Primitives (To Be Built)

We will construct these custom components in `/components/ui`:

1. **Button:**
   - Variants: `primary` (Solid Purple), `outline` (Grey border, transparent), `ghost` (No border, grey hover), `destructive` (Solid Red).
   - Sizes: `sm`, `md` (default), `lg`, `icon`.

2. **Input / Select:**
   - 40px height. Light grey border, subtle focus ring (brand color).
   - Support for floating labels or top labels.
   - Dashed variants for placeholders (e.g., `+ Add Item`).

3. **Combobox (Search & Select):**
   - Critical for Party and Item selection.
   - Must support rendering rich options (e.g., Party Name + Balance on the right).
   - Must include a fixed "Create New" option at the bottom.

4. **Table:**
   - Clean, borderless rows.
   - Alternating row background (very subtle zebra striping).
   - Sticky headers.

5. **Modal / Dialog:**
   - Centered overlay with a dark, semi-transparent backdrop.
   - Distinct header with title and close (X) button.
   - Footer for primary/secondary actions.

6. **Badge:**
   - Small rounded pill. Soft background (e.g., light green) with strong text color (dark green).

## 3. Form & Contextual UI Philosophy
- **No Page Refreshes:** Use modals for creation flows (Create Party, Create Item) so the user does not lose their current invoice context.
- **Visual Separation:** Use horizontal lines or distinct background colors to separate sections within complex forms (like the Sales Invoice form).
