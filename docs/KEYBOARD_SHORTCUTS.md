# Keyboard Shortcuts

This document tracks the keyboard-centric workflows required by the application. The system is highly optimized for fast, repetitive data entry, and shortcuts are a critical product requirement.

## Known Reference Shortcuts
Based on the visual analysis of the screenshots:

| Context | Shortcut | Action | Notes |
| :--- | :--- | :--- | :--- |
| Create Invoice | `Shift + M` | Focus "Add Item" | Jumps focus directly to the item search/entry field. |
| Add Items Modal | `[ESC]` | Cancel / Close | Closes the modal without saving. |
| Add Items Modal | `[F7]` | Add to Bill | Confirms item selection and adds them to the underlying invoice. |
| Add Items Modal | `[Enter]` | Change Quantity | Focuses the quantity input for the selected row. |
| Add Items Modal | `↑` / `↓` | Move between items | Up/Down arrows navigate the search results list. |

## Shortcut Implementation Strategy (MVP)
For the Phase 1 MVP, we will implement these specific shortcuts as they are the most critical for the billing workflow. 

### Technical Approach
- We will create a custom React hook (e.g., `useShortcut`) to bind keydown events globally or within specific component contexts.
- Shortcuts like `[ESC]` will be natively handled by our custom Modal primitives.
- `[F7]` and `Shift + M` require careful `preventDefault()` handling to avoid triggering native browser features (like caret browsing or default search).
