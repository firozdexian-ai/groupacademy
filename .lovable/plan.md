# Fix Pack — Modules, Company Portal Access, Credit Purchase

## Problem Recap

1. **Module management not reachable from Dashboard** — `ModuleManagement` works as a standalone route (`/content/:id/edit` → "Manage Modules"), but selecting "Modules" in the dashboard sidebar opens it without a `contentId`, so it shows an empty/blocked state. There is no course-picker inside the dashboard tab.
2. **Company portal access unclear** — `/company` exists but only loads if the logged-in user is a row in `company_members`. `grow10xnow@gmail.com` has no membership, so the portal shows "No company access". There is also no link to it from the admin dashboard or talent shell.
3. **No "Buy Credits" entry in the seeker app** — `CreditPurchaseSheet` exists but is only mounted inside `ServicesHub`. The wallet/transactions page and the navbar credit chip are not wired to open it.

## Plan

### 1. Modules tab inside Dashboard

- Replace the current "modules" tab loader so that when no `?id=` is in the URL, it shows a **course picker** (search + list of courses pulled from `content` where `content_type` in recorded_course/live_webinar). Clicking a course updates `?tab=modules&id=<contentId>` and renders the existing `ModuleManagement` component inline.
- Add a back button inside the picker → returns to "courses" tab.
- Add a "Manage Modules" shortcut directly on each row of `ContentList` (admin courses table) that links to `/dashboard?tab=modules&id=<id>` so admins can jump in one click.

### 2. Company Portal access

- **Grant test access** to `grow10xnow@gmail.com`:
  - Pick one existing company (e.g. `Growth Catalyst Group of Companies`) and insert a `company_members` row for that user with `role='owner'`, `status='active'`.
  - This requires a SQL migration (lookup of `auth.users.id` by email inside a `DO $$ ... $$` block since `auth.users` is privileged).
- **Add navigation entry**:
  - In `AdminSidebar`, add a "Company Portal" link under the Operations / Agents group that opens `/company` in a new tab.
  - In the talent shell (`TalentAppShell`) profile menu, surface "Switch to Company Portal" only when the logged-in user has at least one active `company_members` row (cheap query, cached via `useQuery`).
- **Improve the empty state** of `CompanyPortal` to include a "Request company onboarding" CTA (mailto to support) instead of a dead-end.

### 3. Buy Credits entry point in the seeker app

- Promote `CreditPurchaseSheet` into a globally available drawer driven by a `useCreditPurchase()` hook (simple Zustand or context store with `open()`).
- Wire entry points:
  - Navbar credit chip (`CreditBalance` default variant) → `onClick` opens the sheet.
  - **Transactions page**: add a primary "Buy Credits" button next to `<CreditBalance variant="full" />`.
  - **Profile / Wallet card**: add the same CTA.
  - **CreditGateModal**: ensure its "Top up" button uses the same global opener (currently inconsistent).
- Mount the sheet once inside `TalentAppShell` so it's available app-wide.

### 4. Status & remaining work (post this fix pack)

Agent OS phases 1–10 are functionally complete. Remaining hardening items, in priority order:

1. Seed 4–6 starter agents in `ai_agents` for the marketplace.
2. Stripe top-up flow for company-side credit purchases (B2B billing).
3. Email notifications: payout status, marketplace approval/rejection.
4. Mobile polish for `MyAgents` and `AgentMarketplace`.
5. Creator documentation (prompt + pricing guidelines).
6. End-to-end QA pass across talent app, dashboard, and company portal.

Estimated overall completeness after this fix pack: **~92%**. The 8% gap is the six items above.

## Technical Notes

- Files to create/edit:
  - `src/pages/Dashboard.tsx` — handle `modules` tab without `id` by rendering a new `<ModulePickerPanel/>`.
  - `src/components/dashboard/ModulePickerPanel.tsx` *(new)* — search + list of courses, navigates to `?tab=modules&id=...`.
  - `src/components/dashboard/ContentList.tsx` — add per-row "Manage Modules" action.
  - `src/components/dashboard/AdminSidebar.tsx` — add "Company Portal" external link.
  - `src/layouts/TalentAppShell.tsx` — conditional "Company Portal" menu item; mount global `CreditPurchaseSheet`.
  - `src/hooks/useCreditPurchase.ts` *(new)* — global open/close store.
  - `src/components/credits/CreditBalance.tsx` — default variant `onClick` triggers global opener.
  - `src/pages/app/Transactions.tsx`, `src/pages/app/Profile.tsx` — add "Buy Credits" CTAs.
  - `src/pages/company/CompanyPortal.tsx` — improved empty state.
  - **New migration**: insert `company_members` row for `grow10xnow@gmail.com` against `Growth Catalyst Group of Companies`.

- No schema changes required; only one data-only migration for the test membership.
- All new RLS reads (`company_members` membership lookup in talent shell) already permitted by existing policy.

Approve to proceed.