# Phase 3 — Admin Shell Hardening (incl. Dashboard Chat fix)

Goal: make `/dashboard` and `/dashboard/chat` production-grade for super-admins. No silent failures, no blank tabs, no "Syncing thread history…" dead-ends. Mirrors the Talent (Phase 1) and Gro10x (Phase 2) cuts.

The trace sub-agent confirmed three concrete bugs behind the user's "I cannot access admin chat" report. We start with those, then walk the rest of the admin shell.

---

## A. Fix `/dashboard/chat` (highest priority)

Three compounding root causes identified by the trace:

1. **Critical — silent `send()` no-op.** `src/domains/agents/components/admin/chat/hooks/useAgentRuntimeThread.ts:175` looks up the agent by `a.agent_key`, but `useAdminAgents` returns objects whose property is `key`. Lookup is always `undefined`, so every send returns early with no toast and no network call. → 1-line fix: `a.key === agentKey`.
2. **Missing DB rows.** `ai_agents` has zero rows for the 10 admin agents (`business-analyst`, `nia-analyst`, `talent-ops`, etc.). `useAdminAgents` falls back to `ADMIN_AGENTS` for display, but `agent_threads` insert / agent-runtime resolution rely on a real `ai_agents.agent_key`. → Seed the 10 admin agent rows from `src/lib/adminAgents.ts` via migration, keyed by the same `key` strings the UI already uses.
3. **Auth gate stalls.** `ProtectedRoute` shows "Verifying Core Clearance Tokens…" while it races `getSession()` against a 4–5s timeout, then redirects non-admins to `/app/learning` with a toast. → Add a clearer fault state ("You need an admin role to use the agentic dashboard") and a single retry CTA. No change to the role rules.

Verification: open `/dashboard/chat?agent=business-analyst` as a super-admin, send "ping", confirm a thread row is created, the message round-trips through `agent-runtime`, and `useAdminAgentThreads.reload()` refreshes the rail.

## B. Triage every admin tab

`src/shells/admin/routes/index.ts` aggregates 16 group route files (`overview`, `talent`, `companies`, `jobs`, …, `misc`). For each `TAB_COMPONENTS` entry, classify as **Live**, **Gate**, or **Hide-from-nav**:

- **Live (expected):** overview, talent, companies, jobs, marketing, learning, finance, gigs, abroad, agents, institutions, ugc, gtm — these have seeded data and shipped UIs.
- **Likely gate:** ir (no investor seed), hr (workforce ops still early), misc tabs whose components were stubbed.
- Anything that renders a naked spinner, throws on empty `supabase.from(...)`, or shows a blank card gets a `DashboardErrorState` / empty-state card or a `ComingSoonGate` keyed `admin-<tab>`.

## C. Admin chrome resilience

- Wrap `<Outlet />` in `Dashboard.tsx` (or `AdminSidebar` shell) with the same `RouteErrorBoundary` used in Talent + Gro10x so a thrown lazy import never blanks the whole admin app.
- Confirm `useAdminScope` failure mode renders a branded "You don't have admin access" card on `/dashboard/*`, not a redirect loop.
- Audit `DashboardCardSkeleton` / `DashboardErrorState` usage across the 16 group tabs; replace bare `Loading…` / `null` with the shared primitives (same pattern we just applied in Gro10x Part C).
- Hide-from-nav: drop `AdminSidebar` entries for any tab gated in B; deep links still resolve to the gate card.

## D. Verification walk

1. Super-admin desktop (1440px): walk every group in `AdminSidebar`, open `/dashboard/chat`, send a message to each of the 10 admin agents, switch threads from the rail.
2. Internal admin (no super_admin): confirm restricted tabs render the gate, chat still works for permitted agents.
3. Non-admin: confirm redirect to `/app/learning` with toast (no white screen).
4. Mobile (390px): `/dashboard/chat` rail collapses, thread view is reachable, back button works.

## Technical notes

- A-1 is a 1-line change in `useAgentRuntimeThread.ts`. Worth a quick grep for the same `a.agent_key` mistake elsewhere (`ChatThread.tsx` already uses `a.key`).
- A-2 is a single migration inserting the 10 rows from `ADMIN_AGENTS` (`key`, `name`, `description`, `scope='admin'` via whatever column exists — current schema doesn't have `scope`, so just keep `agent_key` + `name` and any required NOT NULLs). Idempotent `ON CONFLICT (agent_key) DO NOTHING`.
- B/C are presentation-only; no schema work.
- No changes to `ProtectedRoute` role rules — just the fault-screen copy and a CTA back to `/app`.

## Out of scope

- Phase 4 (B2B Learning Ops, Offerings UI) stays gated.
- Re-theming `/dashboard` or migrating off the 16-group tab matrix.
- Admin Business Analyst's tool-calling repertoire (separate workstream).

Approve and I'll execute A → B → C in that order, then run the D walk and hand off to Phase 4.
