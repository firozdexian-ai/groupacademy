# First Production Hit Plan

## Goal
Make the platform safe to invite real testers into by exposing only working journeys, fixing critical blockers, and turning unreliable/non-essential areas into polished “Coming soon” screens instead of broken experiences.

## What I found from the current signal
- `/dashboard/chat?agent=business-analyst` is protected by admin-role verification, then loads DB-backed agent threads.
- Your current account does have valid admin roles from the network snapshot: `admin`, `content_lead`, `super_admin`.
- `agent_threads` reads are returning `200`, so the visible blocker is likely a session/render/loading loop or chat runtime/thread initialization issue, not simply “missing admin role.”
- The app already has a reusable `ComingSoonGate`, so we can use the existing launch pattern rather than inventing a new system.

## Production rule for this pass
Every exposed route must be one of these:
1. **Works now** — keep visible and test the full journey.
2. **Critical but broken** — fix before exposing.
3. **Non-critical or risky** — hide from navigation and route to “Coming soon.”
4. **Admin-only operational tool** — keep behind correct role gate and degrade gracefully.

---

# Phase 0 — Unstick the immediate admin chat blocker

## Fix or gate `/dashboard/chat`
- Trace the route from `ProtectedRoute` → `DashboardChat` → `useAdminAgentThreads` → `ChatThread` → `useAgentRuntimeThread`.
- Add a hard failure/empty-state path so it never loops forever on:
  - auth/session verification,
  - admin role loading,
  - agent config loading,
  - thread history sync,
  - agent runtime send failure.
- If the backend runtime is not reliable enough for launch, replace the admin sidebar “AI co-pilot” entry and all agent shortcut redirects with a `ComingSoonGate` / disabled operational notice.
- Keep admin access protected by server-backed roles; do not weaken RBAC just to make the page open.

## Acceptance check
- Admin can open `/dashboard/chat` without being stuck on “Verifying Core Clearance Tokens…” or “Syncing thread history…”.
- If chat runtime fails, the page shows a clear unavailable state, not a spinner.
- Non-admins still cannot access admin chat.

---

# Phase 1 — Talent shell production cut first

This is the public tester surface. We make it boringly reliable before exposing wide feature breadth.

## 1. Define Talent Launch Mode
Create a small launch-readiness map for `/app/*` routes:

```text
Ship now: stable, useful, testable
Gate now: impressive but risky, incomplete, or backend-dependent
Fix now: critical journey blocker
```

## 2. Keep visible for first testers
Prioritize these Talent shell journeys:
- Sign in / sign up / callback / reset password.
- Required onboarding/profile builder.
- Profile view/edit and mandatory phone capture.
- Jobs hub, job details, saved jobs, basic application flow.
- Learning hub, courses, my courses, events/webinars where data exists.
- Credits/transactions visibility if balances load reliably.
- Core messages/notifications only if thread loading is stable.

## 3. Gate or hide risky Talent areas
Use `ComingSoonGate` and remove/hide nav links for routes that are not essential to the first production test, likely including:
- AI agent marketplace and individual agent chat if runtime reliability is uncertain.
- Gigs/projects/reviewer/disputes/appeals if flows are not end-to-end verified.
- Advanced study abroad subflows, IELTS mocks/results, language practice, competitions, instructor workspace, and complex tools unless verified.
- Any route that depends on unfinished payments, payouts, external integrations, or fragile edge functions.

## 4. Stop endless loaders across Talent shell
For high-traffic Talent pages:
- Add bounded loading states and user-friendly failure states.
- Ensure unauthenticated users redirect cleanly.
- Ensure onboarding does not trap completed users.
- Ensure missing profile/talent rows show recovery guidance instead of blank screens.

## 5. Talent navigation cleanup
- Hide gated routes from desktop/mobile nav.
- Keep first-tester navigation compact: Home, Jobs, Learning, Profile, Messages/Support if stable.
- Keep no horizontal scroll and existing mobile safe-area rules.

## Acceptance check
- A new tester can sign up, complete onboarding, browse jobs, view learning, and edit profile without hitting broken pages.
- Every visible Talent nav item opens a working page.
- Every unavailable feature has a polished “Coming soon” state.

---

# Phase 2 — Roten X / Gro10x shell production cut

## 1. Define B2B launch journey
Keep only the core employer/company workflow visible:
- Landing/auth/welcome.
- Company profile/page.
- Work/jobs area if creating/managing jobs works.
- Applicants/applications pipeline if data and permissions are reliable.
- Learn operations only if assignments and track views are stable.

## 2. Gate risky B2B areas
Likely gate until verified:
- Agent marketplace/chat.
- Billing/payments if not fully configured.
- CRM/sourcing/lists if partial.
- Managed projects/gig bids if not end-to-end ready.
- Advanced command palette actions that deep-link to gated routes.

## 3. Role/company membership safety
- Ensure Gro10x shell routes check company membership before loading company data.
- Show onboarding/empty states for users without a company.
- Avoid exposing admin-like data to regular company users.

## Acceptance check
- A company tester can enter Gro10x, see only working nav, and complete the chosen B2B journey.
- Unready B2B tools are hidden or coming soon.

---

# Phase 3 — Admin shell production cut

## 1. Make admin operational, not flashy
Keep admin areas needed to support first testers:
- Talent management.
- Jobs management/applications.
- Learning/course/event management.
- Companies/Gro10x support basics.
- Marketing/content only if needed for launch ops.

## 2. Fix or gate admin AI surfaces
- Fix `/dashboard/chat` if contained and reliable.
- Otherwise, mark AI co-pilot/admin agent shortcuts as “Coming soon.”
- Keep admin dashboard usable even if AI runtime is disabled.

## 3. RBAC and sidebar cleanup
- Ensure `admin`, `super_admin`, `talent_exec`, and `content_lead` see only valid sections.
- Remove links to tabs/routes that are not registered or not launch-ready.
- Replace unregistered-tab console errors with a user-safe fallback.

## Acceptance check
- Admin can support Talent and Gro10x testers without broken sidebar links.
- Admin-only data remains role-gated.
- AI/admin experimental tools cannot block operational admin work.

---

# Phase 4 — QA and release checklist

## Smoke-test matrix
Test these accounts/roles:
- Anonymous visitor.
- New Talent.
- Existing Talent.
- Company/Gro10x user.
- Admin/super admin.
- Restricted admin role such as `talent_exec` or `content_lead`.

## Route checks
For each shell:
- All visible nav items load.
- Auth redirects work.
- No endless spinners.
- No blank screens.
- Mobile layout has no horizontal scroll.
- Gated pages have clear “Coming soon” messaging.

## Technical checks
- Console: no critical runtime errors on launch routes.
- Network: no repeated failing requests on launch routes.
- Edge/backend calls: unavailable AI/payment/integration flows are gated.
- Route fallback: unknown routes land on safe pages.

---

# Implementation order

1. **Admin chat blocker**: fix/gate `/dashboard/chat` so admin ops stop being blocked.
2. **Talent shell Launch Mode**: route map, nav cleanup, coming-soon gates, loader/error hardening.
3. **Talent QA pass**: sign-up/onboarding/jobs/learning/profile on mobile and desktop.
4. **Gro10x Launch Mode**: expose only core company workflow, gate the rest.
5. **Admin Launch Mode**: keep operational tabs, gate risky AI/experimental admin tools.
6. **Final production smoke test**: all shells, all roles, all visible nav.

## Out of scope for this production pass
- New feature development.
- New database tables unless a blocker requires a small permission/RLS fix.
- Expanding AI agents, payments, marketplace, gigs, or advanced automations before the core tester journey is stable.