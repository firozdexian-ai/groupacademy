

# Services Hub Page Improvements

## Overview

The Services Hub is already in decent shape with a 2-column grid on mobile and a credit system. The improvements focus on tightening spacing, improving the credit card's mobile footprint, and cleaning up the history section -- consistent with the standards applied to Feed, Jobs, Learning, and AI Agents tabs.

---

## Improvements

### 1. Tighten Page Layout

**Current issues:**
- `py-6 space-y-8` creates excessive vertical gap on mobile
- The header area uses `gap-4` between the title and the credits card, pushing services below the fold

**Fixes:**
- Reduce `py-6` to `py-4` and `space-y-8` to `space-y-5`
- Reduce header gap from `gap-4` to `gap-3`

### 2. Credits Card - More Compact on Mobile

**Current issue:** The credits card uses `p-4` and large typography (`text-2xl` balance), taking significant vertical space. On mobile it stretches full width with generous internal spacing.

**Fixes:**
- Reduce padding from `p-4` to `p-3` on mobile
- Reduce balance font from `text-2xl` to `text-xl` on mobile
- Reduce icon container from `p-2.5` to `p-2` and icon from `h-6 w-6` to `h-5 w-5`

### 3. Service Cards - Remove Redundant Usage Badge

**Current issue:** Each card shows both a credit cost badge (left) AND a `ServiceUsageBadge` (right) in the footer. The `ServiceUsageBadge` just repeats the same cost with "credits" text, providing no additional information.

**Fix:** Remove the `ServiceUsageBadge` component from the card footer since the cost is already displayed. Replace with a small "Go" arrow icon to indicate the card is tappable.

### 4. Service History Card - Remove Redundant Header

**Current issue:** The `ServiceHistoryCard` component has its own `CardHeader` with a `Calendar` icon and "Your Recent Activity" title. But the page already renders a `SectionHeader` with "Recent Activity" right above it, creating a double header.

**Fix:** Remove the `CardHeader` from `ServiceHistoryCard` since the parent page's `SectionHeader` already provides the title. This saves ~40px of vertical space.

### 5. Credit Purchase Sheet - Tighter Mobile Layout

**Current issues:**
- `mb-6` after header is generous
- `space-y-6` between sections creates large gaps
- The benefits list at the bottom takes significant space and repeats information already visible on the services page

**Fixes:**
- Reduce `mb-6` to `mb-4` and `space-y-6` to `space-y-4`
- Collapse the benefits list into a single line summary on mobile (e.g., "Use for assessments, interviews, salary analysis, and more")

### 6. Credit Gate Modal - Consolidate Rows

**Current issue:** The modal shows 3-4 separate rows (Service, Cost, Balance, Balance After) each with `p-3` padding, making the modal tall on mobile.

**Fix:** Combine "Cost" and "Current Balance" into a single compact row, reducing the modal height by ~50px.

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/app/ServicesHub.tsx` | Reduce spacing to `space-y-5`, `py-4`, compact credits card, remove ServiceUsageBadge, add arrow icon |
| `src/components/credits/ServiceHistoryCard.tsx` | Remove CardHeader since parent provides SectionHeader |
| `src/components/credits/CreditPurchaseSheet.tsx` | Tighter spacing (`space-y-4`, `mb-4`), collapse benefits list |
| `src/components/credits/CreditGateModal.tsx` | Consolidate cost/balance rows for compact mobile display |

---

## What stays the same

- All existing functionality (credit gate, purchase flow, service navigation)
- Color palette and theme
- No database changes
- Credit pricing and WhatsApp purchase flow unchanged

