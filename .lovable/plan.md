

# Contacts Manager — Audit Report

## Current State
632 lines. Server-side paginated with search and company filter. CRUD dialog, WhatsApp outreach with logging, LinkedIn links. Simpler than Companies but has the same class of issues.

## Bugs

### 1. Table with 5 columns causes horizontal scroll on mobile
Lines 351-464: Contact, Company, Contact Info, Source, Actions columns with 4 action buttons. At 391px this overflows.

### 2. Dialog form uses `grid-cols-2` without responsive breakpoint
Lines 523, 544, 566: Three `grid grid-cols-2 gap-4` blocks — fields get ~170px each on mobile.

### 3. Delete uses browser `confirm()` instead of AlertDialog
Line 232: `if (!confirm("Delete this contact?")) return;`

### 4. Pagination text buttons overflow on mobile
Lines 469-489: "Previous" and "Next" text buttons.

### 5. No KPI summary cards
No at-a-glance metrics.

### 6. Header buttons not compact on mobile
Lines 302-311: "Refresh" and "Add Contact" with full text on mobile.

## Fix Plan

| # | Category | Fix |
|---|----------|-----|
| 1 | Mobile | Table → card list on `< sm` (name + designation, company badge, contact icons, action row) |
| 2 | Mobile | Dialog form: `grid-cols-1 sm:grid-cols-2` for all field pairs |
| 3 | UX | Replace `confirm()` with `AlertDialog` |
| 4 | Mobile | Pagination: icon-only on mobile |
| 5 | Feature | KPI cards: Total Contacts, Primary Contacts, Never Contacted |
| 6 | Mobile | Header buttons: icon-only Refresh on mobile |

### Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/ContactsManager.tsx` | All 6 fixes |

No database changes needed.

