# Road to v0.5 Publication — Consolidation Plan

Launch personas confirmed: **Talent** + **Public**. Admin/Gro10x stay functional but are not part of the "publicly announced" surface for v0.5. Deferred features get a **"Coming soon + join waitlist"** treatment, not removal.

Work is split into 4 sequential phases. Each phase produces a deliverable doc in `.lovable/v05/` so we can pick up across sessions without re-confusing state.

---

## Where we are today (snapshot)

**Done (A1 → A19):** route lazy-loading, bundle trim, a11y pass, loading skeletons, copy normalization, mobile safe areas, admin lazy-loading, dashboard RBAC, native email, escrow/projects, public discovery, learning tracks, gig matchmaker/verification/disputes, instructor monetization, creator economy, hype/connections, scenario skill credentials, mastery-based job match.

**Estimated launch-readiness for Talent+Public: ~75%.** The remaining 25% is not new features — it's **verification, regression hunting, and gating things that aren't ready**.

---

## Phase P1 — Feature Inventory & Regression Diff (1.5 days)

**Goal:** catch features that silently disappeared during A11–A19 polish/refactor before users do.

1. Generate `.lovable/v05/inventory.md` listing every:
   - Admin tab (from `src/shells/admin/routes/*.ts` — 16 groups)
   - Talent route (from `src/App.tsx`)
   - Public route
   - For each: declared purpose, components rendered, primary actions
2. Cross-check against existing memory files (`mem://admin/*`, `mem://product/*`) — any tab whose memory describes features not present in current code = **regression candidate**, flagged in the doc.
3. Spot-check 10 highest-risk areas in browser: admin Talent group, admin Companies, admin Jobs, admin Learning, admin Gigs, talent Profile, talent Jobs Hub, talent Learning Hub, talent Gigs, talent Career Abroad.
4. Deliverable: `inventory.md` with a **"Regression Suspects"** section listing each missing/changed feature, source memory, and suggested action (restore / accept / replace).

**You review** this list before P2.

---

## Phase P2 — Defer/Hide Decisions & "Coming Soon" Surface (1 day)

**Goal:** stop shipping empty states that embarrass.

1. Produce `.lovable/v05/defer-matrix.md` listing every Talent+Public surface that has **no real data** or **no live workflow**, with a recommendation: `keep` / `coming-soon` / `hide`.
   - Candidates I already see: Gig search (no projects), Marketplace browse, Company projects tab, Creator analytics on empty creators, Leaderboards with <10 entries, Reviewer cockpit for non-reviewers, parts of Career Abroad without programs in country.
2. Build a single reusable `<ComingSoonGate>` component with: hero copy, illustration, **"Join waitlist"** button → writes to one shared `feature_waitlist` table (`user_id`, `feature_key`, `created_at`, `email`).
3. One migration: `feature_waitlist` table + RLS (insert self, admin read).
4. Wrap each `coming-soon` surface with the gate. Hidden surfaces get nav entries removed + 404 redirect.
5. Admin gets a small "Waitlist signals" widget so we know what users want first.

**You approve** the defer-matrix before any wrapping happens.

---

## Phase P3 — Automated Smoke Test Suite (2–3 days)

**Goal:** 70% bug catch without manual clicking, per your request. Full persona journeys.

Use **Playwright** (already viable in Lovable; no new infra) writing tests under `tests/e2e/`. Tests run against the preview URL with seeded test accounts.

**Talent persona journeys** (one spec file each, ~12 specs):
- Signup (Aisha chat) → phone capture → profile builder
- Login → feed loads → click 3 card types (post, course, video)
- Jobs Hub → For You → open job → apply (each method: internal, external, mailto)
- Learning Hub → enroll in free course → complete a module → certificate
- Gigs → For You → place bid (or hit waitlist gate)
- Career Abroad → roadmap builder → submit
- Tools Hub → CV maker / Salary analysis / Mock interview
- Profile → public `/t/:handle` view works + JSON-LD present
- Credits → purchase sheet opens, gate works
- Saved items + Notifications + Messages thread
- Logout

**Public persona journeys** (~6 specs):
- `/` landing, `/jobs`, `/jobs/:id`, `/projects`, `/projects/:slug`, `/leaderboards/:kind`, `/c/:slug`, `/t/:handle`, `/verify/skill/:code`, `/verify/cert/:code`
- Assertion: 200 response, H1 present, meta description present, no console errors, no white-screen, mobile viewport renders without horizontal scroll

**Output:** `tests/e2e/REPORT.md` auto-generated per run with pass/fail per journey + screenshot of failures. Wire into Lovable's existing test runner.

**Acceptance gate for v0.5:** all Talent + Public journeys green.

---

## Phase P4 — Manual Punch List & Publish (1 day)

1. Generated from P3 failures + P1 regression confirmations.
2. Format: `.lovable/v05/punch-list.md` with severity (blocker / nice-to-have / post-v0.5), owner-action, est. time.
3. Work through blockers only. Nice-to-haves become Phase P5 (post-launch).
4. Final pre-publish checks: SEO findings cleared (`seo_chat--list_findings`), security linter clean (`supabase--linter`), bundle sizes recorded, custom domain confirmed.
5. **Publish.**

---

## Out of scope for v0.5

- Gro10x B2B polish (works but not headline)
- Admin UX polish (functional, not user-facing)
- New features of any kind
- Performance beyond what A19 shipped

---

## Total timeline estimate

| Phase | Effort | Gate |
|---|---|---|
| P1 Inventory + regression diff | 1.5 days | You review the suspects list |
| P2 Defer/hide + waitlist gate | 1 day | You approve defer-matrix |
| P3 Smoke test suite | 2–3 days | All Talent+Public journeys green |
| P4 Punch list + publish | 1 day | Blocker count = 0 |
| **Total** | **~5.5–6.5 days** | |

---

## Technical notes (for the implementer)

- **Inventory generation**: `rg` over `src/shells/admin/routes/*.ts` + `src/App.tsx` to enumerate; cross-ref with `mem://admin/*` memory files via filename grep.
- **Coming-soon gate**: single component in `src/components/common/ComingSoonGate.tsx`, accepts `featureKey`, `title`, `description`, `eta`. Waitlist insert uses `supabase.from('feature_waitlist').insert(...)` with RLS `with check (auth.uid() = user_id)`.
- **Playwright setup**: `playwright.config.ts` at repo root, single worker against preview URL, test accounts seeded via a one-time migration `tests/fixtures/seed.sql` (idempotent).
- **No DB writes** in P1 or P3 reports — they're just markdown.

---

## Starting point

If you approve, P1 begins immediately and produces the inventory + regression doc for your review before any code touches the app. Nothing gets hidden or deleted until you sign off on the defer-matrix in P2.
