# Production-Grade Cut: Talent → Gro10x → Admin

Goal: ship a platform we can confidently hand to public testers. Every visible route either works end-to-end on mobile + desktop, or shows a clear "Coming soon" state. No infinite spinners, no blank screens, no dead buttons.

Phase 0 (Admin chat loop) was fixed last turn. This plan covers the three shells in priority order.

---

## Phase 1 — Talent Shell (highest priority, public-facing)

Entry: `/app/*` routes used by signed-in talents and the unauthenticated public landing.

### 1.1 Stabilize core journeys (must work)
- Auth: signup, signin, Google OAuth, phone capture, password reset
- Onboarding wizard end-to-end (profile, country, role, skills)
- `/app/dashboard` — quick actions grid, agentic hub cards load without spinner-locks
- `/app/jobs` — Jobs Hub: For You, Companies, Locations, Tools tabs; job detail; apply flow (internal + external + Apply with AI)
- `/app/learning` — course catalog, my courses, track detail, module runner (quiz + scenario), certificates page
- `/app/profile` and `/t/:handle` public profile
- `/app/credits` wallet + transactions
- `/app/notifications` and feed read path

### 1.2 Gate or hide (wrap with `ComingSoonGate` or remove nav entry)
- AI Agent marketplace / persona hub if data is empty or flows are stubbed
- Career Abroad sub-flows beyond the free salary estimator
- Gig economy talent surfaces not backed by live matchmaker data (bid coach, disputes, reviewer program) — keep visible only if seeded
- Live events surfaces with no upcoming `is_ready=true` rows → show empty state, not skeleton
- Messenger inbox if thread sync is unreliable on mobile
- Any "Tools" tile that 404s or returns mock data

### 1.3 Resilience pass
- Every page-level data hook: loading skeleton → error state → empty state (no naked spinners)
- Mobile safe-area + bottom nav verified on every primary route
- Remove `console.*` from talent components (already swept in refactor; verify)
- Replace broken images / missing OG with brand fallback

### 1.4 Smoke test matrix (talent)
Anonymous, fresh talent, onboarded talent — walk every nav item, confirm either a working screen or a Coming Soon card.

---

## Phase 2 — Gro10x / B2B Shell

Entry: `/gro10x/*` and company-scoped routes.

### 2.1 Keep live
- Company signup + verification
- Company profile + branded `/c/:slug` page
- Post a job (form + AI assist)
- Applicant pipeline kanban + messaging
- Talent search + lists + relationships CRM
- Company credits balance + top-up entry point
- Learning Ops B2B dashboard (only if seeded company has data)

### 2.2 Gate
- Managed projects + escrow if no funded projects exist for the org
- Reviewer program admin surfaces
- Learning tracks assignment UI when track catalog is empty
- Outreach / email sequences that depend on unconfigured connectors

### 2.3 Smoke test matrix (B2B)
Company owner, recruiter sub-role — post a job, receive an application, message the applicant, mark hired.

---

## Phase 3 — Admin Shell

Entry: `/dashboard/*` (16 groups). Admin chat loop fixed in Phase 0.

### 3.1 Keep live
- Dashboard chat (all 10 agents reachable; per-agent fallback if its edge function errors)
- Talent management, Companies management, Jobs management, Learning management, UGC, Workforce, Career Abroad leads, Finance basics
- Investors group read-only views

### 3.2 Gate
- Experimental AI shortcuts that call missing edge functions
- Any tab that currently throws on mount (catch + render "Module temporarily unavailable" card)
- Sub-tabs without backing tables seeded

### 3.3 Admin reliability
- Global error boundary per tab so one broken sub-tab cannot blank the shell
- Lazy-load each group (already in place) — verify no top-level imports leak

---

## Cross-cutting work

- `ComingSoonGate` component: confirm one canonical version, accept `title`, `eta`, `reason`; renders branded card with back link
- Nav config: drive Talent/Gro10x/Admin nav from a single config so hiding an item removes it from sidebars, command palette, and quick actions simultaneously
- Add lightweight `<RouteErrorBoundary>` around each top-level route to convert runtime errors into friendly fallback + "Report" link
- Add `data-testid` on primary nav items so the smoke matrix can be re-run quickly

---

## Deliverable per phase

Each phase ends with:
1. Updated nav config (what's live vs gated)
2. Screenshot-pass on mobile (390px) and desktop (1440px) of every primary route
3. Short README in `.lovable/` listing what's live, what's gated, and the manual test script for that shell

---

## Order of execution

1. Phase 1.1 stabilize → 1.2 gate → 1.3 resilience → 1.4 smoke
2. Phase 2 same order
3. Phase 3 same order
4. Final cross-shell smoke as a different signed-in user per role

Approve and I'll start with Phase 1.1 (Talent stabilize) — auditing the talent nav config and wrapping the unfinished tiles with `ComingSoonGate` first, since that unblocks public testing fastest.