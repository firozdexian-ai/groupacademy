# Phase 2 — Surface-Batched Jargon Cleanup

Picking up from Phase 1 (33 user-blocking fixes across 7 shared files). Remaining: **91 T1 + 186 T2 = 277 hits** in talent surfaces.

Phase 2 batches the rest by **user surface** so each batch is independently reviewable, ships a coherent UX improvement, and can be cut from v0.5 if Nov 28 slips.

## Batching strategy

One surface = one batch. After each batch: re-run `scripts/jargon-sweep.ts`, update `.lovable/v0.5-jargon-hits.md`, report counts. Strictly follow `.lovable/v0.5-jargon-glossary.md` — no new replacement variants.

## Batches (in priority order)

**B1 — Auth + Onboarding + Boot** (highest reputational risk, every user hits it)
- `src/pages/AuthCallback.tsx`, `Start.tsx`, `BootGate.tsx`, `auth/*`, `onboarding/*`, `PWAInstallPrompt`, `PWAUpdatePrompt`, `offline.html`
- Target: 100% of T1 + T2 here. Boot/loading/error copy must be plain language.
- Est: ~25 hits, 1.5 hrs

**B2 — Profile + Profile Builder**
- `src/pages/app/profile*`, `src/domains/profile/components/talent/**`
- Session replay already flagged "Verifying Core Clearance Tokens" and "Protocol: Verified Mastery Sync v2.6.4" here.
- Est: ~40 hits (T1+T2), 2 hrs

**B3 — Learning Hub** (LearningHub.tsx, TalentMirror, MyHubView, TracksView, AcademyView, StudyAbroadView, ModuleQuizRunner, ModuleScenarioRunner, ReviewQueueRunner, NextActionsCard, SkillCredentialsPanel)
- Known offenders: "Logic Node Fault", "Telemetry sync error", "Academic Hub" header is fine but surrounding copy isn't
- Est: ~60 hits, 2.5 hrs

**B4 — Jobs + Gigs + Career Abroad**
- `src/pages/app/Jobs*`, `Gigs*`, `Abroad*`, `domains/jobs/components/talent/**`, `domains/gigs/components/talent/**`, `domains/abroad/components/**`
- Est: ~70 hits, 2.5 hrs

**B5 — AI Agents + Wallet + Misc talent pages**
- `domains/agents/components/talent/**`, `components/wallet/**`, `Connections`, `Notifications`, remaining `src/pages/app/*`
- Est: ~50 hits, 2 hrs

**B6 — Final sweep + verify**
- Re-run sweep; any residual T1 fixed inline; T2 leftovers explicitly deferred to v1.0.1 in `.lovable/plan.md`
- Visual spot-check via session replay / browser nav on each surface
- Est: 1 hr

## Out of scope (deferred to v1.0.1)
- Admin panel + Gro10x panel jargon
- Code identifiers, comments, telemetry event names, `[cite: N]` markers
- Footer version badges
- Awkward-but-grammatical copy not in banned list
- Cosmetic spacing / color polish

## Timeline
~11.5 hrs total, fits Days 1–3 of the v0.5 window. No Nov 28 impact. After B3 we have a defensible stop point if priorities shift.

## Deliverables per batch
1. Edited components (T1 strings replaced; T2 replaced where trivial)
2. Updated `.lovable/v0.5-jargon-hits.md` with new counts
3. One-line status note per batch in `.lovable/plan.md`

## Decisions needed
1. Approve the B1→B6 order, or reprioritize? (e.g. some teams want Learning first since it's most demoed)
2. T2 inside each batch: fix opportunistically, or strict T1-only and a separate T2 pass later?
3. Want me to start with B1 immediately on approval, or run the sweep refresh first to confirm current counts?
