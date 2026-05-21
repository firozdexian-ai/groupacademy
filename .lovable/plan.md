# Course to a Stable, Publishable Platform

## Where we are

The Phase 10 work (domain repository extraction) is **~60% done by domain, but it's what's destabilizing the app right now**. Five domains are clean (Learning, Talent, Profile, Companies, Jobs, Gigs partial), but **147 files across 20+ areas still call `supabase.from()` directly**, and during the codemod sweeps some imports and prop contracts drifted — which is why you're seeing tabs render but not function.

No runtime errors are being captured at `/index`, so the breakage is route-specific (admin tabs, agents, IR, marketing, workforce, feed, messaging). We need to **stop refactoring and start verifying** before publishing.

## The course (3 phases, ~in order of urgency)

### Phase S1 — Freeze & Triage (stability gate)

**Goal:** stop introducing churn; produce a definitive list of what's broken.

1. **Pause Phase 10g/h/j** (Gigs sweep, Feed/Messaging, ESLint rule). Refactor work is the source of the instability you're seeing.
2. **Tab-by-tab smoke pass** on the admin shell and the talent app shell — I click through every tab in preview, capture console + network errors, and log each into a triage table (route → symptom → suspected cause → severity).
3. **Type/build gate** — confirm `tsc --noEmit` is clean across the whole project (the codemods may have left dangling imports the build tolerates but runtime doesn't).
4. **Deliverable:** a ranked broken-tabs list (blocker / major / minor) you can sign off on before any fixes land.

### Phase S2 — Fix to Publishable

**Goal:** every "blocker" and "major" tab works end-to-end. Minor cosmetic issues can ship.

Likely fix buckets (confirmed after S1, but based on the refactor history these are the usual suspects):

- **Import drift** from the `@/hooks/*` → `@/domains/*/hooks/*` codemods (components still importing old paths or named exports that were renamed).
- **Hook signature changes** where a repo helper returns a slightly different shape than the old inline query.
- **Missing RLS / auth context** on tabs that used to query directly and now go through a repo that assumes a session.
- **Edge-function vs repo confusion** in domains where some calls were moved to edge functions and others to repos.

I fix top-down by severity, re-smoke after each batch, and stop the moment the blocker+major list is empty. **This is the gate to publish.**

### Phase S3 — Lock-in (post-publish hardening)

Only after S2 ships:

1. **Resume Phase 10g** — Gigs sweep (3 files left).
2. **Phase 10h** — Feed (4 files) + Messaging (3 files).
3. **Phase 10i** — Sweep the long tail: `pages/app` (23), `domains/agents` (10), `marketing` (9), `ir` (8), `workforce`/`institutions`/`abroad`/`finance` (12 combined).
4. **Phase 10j** — Turn on the `NO_RAW_FROM` ESLint rule so this can never regress.

Each of S3's phases is small, isolated, and now safe because the smoke harness from S1 exists.

## Completion snapshot

| Track | Status |
|---|---|
| Domain repo extraction (Learning, Talent, Profile, Companies, Jobs) | Done |
| Gigs domain repo | ~80% (3 files remain) |
| Feed / Messaging repo | Not started (7 files) |
| Long-tail pages & secondary domains | Not started (~75 files) |
| ESLint lock (`NO_RAW_FROM`) | Not started |
| **Tab-by-tab stability verification** | **Not started — biggest gap to publish** |
| Publishable build | **Blocked on S1 + S2** |

So roughly: **architecture refactor ~65% done, but stability verification 0% done** — and stability, not refactor completeness, is what's standing between us and a publishable build.

## Recommendation

Approve **Phase S1 (Freeze & Triage)** first. I'll come back with the broken-tabs list and a concrete S2 fix plan sized against it — no more refactor churn until publish.

## Technical notes

- S1 uses `code--read_session_replay`, `read_console_logs`, `read_network_requests` per route plus a `tsc --noEmit` sweep; no source edits.
- S2 fixes stay in presentation/hook layer — repo files (`*Repo.ts`) and edge functions are not touched unless a smoke failure points there.
- S3 follows the exact pattern of 10c–10f (scaffold repo → migrate callers → codemod imports → delete shims → verify), so risk is bounded.
