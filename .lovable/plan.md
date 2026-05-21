# Codebase Reorganization — Comprehensive Audit & Completion Plan

## What "done" will look like

When this is finished, opening `src/` will show one obvious mental model:

```text
src/
├── domains/                ← the entire app, grouped by business area
│   ├── jobs/    learning/   talent/   profile/   companies/
│   ├── gigs/    feed/       messaging/   agents/   workforce/
│   ├── institutions/   ir/   marketing/   finance/   abroad/   ugc/
│   └── <each domain>/
│       ├── repo/<name>Repo.ts   ← ONLY file in the domain that calls supabase.from
│       ├── api/                 ← edge-function client wrappers
│       ├── hooks/               ← React Query hooks calling repo or api
│       ├── components/          ← talent/, admin/, public/ subfolders
│       └── index.ts             ← the public surface of the domain
├── pages/                  ← only thin route components that compose domain pieces
├── components/ui/          ← shadcn primitives only (no business logic)
├── lib/                    ← truly generic utilities (no DB calls)
├── integrations/supabase/  ← auto-generated client + types (never edited)
└── gro10x/                 ← Gro10x-branded shell, consumes the same domains
```

- **Zero raw `supabase.from(...)` calls outside `domains/*/repo/`.** An ESLint rule (`NO_RAW_FROM`) enforces it.
- **No `src/hooks/use*Repo` shims, no `src/components/<domain>/*` re-export files.** Every component imports from `@/domains/<area>/...` directly.
- **No orphaned/duplicate page files** (e.g. the Feed.tsx-vs-AppTrackDetail.tsx duplicate we just hit).
- **57 → ~30 top-level files in `src/pages/`**, mostly route shells; data-heavy pages move into their domain.

## Where we are right now

### Completed (6 of ~12 domains have a repo + clean callers)

| Domain | Repo | Shims deleted | Status |
|---|---|---|---|
| learning | ✅ | ✅ | Clean |
| talent | ✅ | ✅ | Clean |
| profile | ✅ | ✅ | Clean |
| companies | ✅ | ✅ | Clean |
| jobs | ✅ partial | — | **14 files still call `supabase.from` directly** |
| gigs | ✅ partial | — | 2 files still call `supabase.from` |

### Not started

| Area | Raw call sites | Type of work |
|---|---|---|
| `pages/app/*` (23 files) + 22 top-level `pages/*` | ~45 | Need domain repos or migration into domain folders |
| `domains/agents` | 10 | Needs `agentsRepo.ts` |
| `domains/marketing` | 9 | Needs `marketingRepo.ts` |
| `domains/ir` | 8 | Needs `irRepo.ts` |
| `domains/workforce` (4), `institutions` (4), `feed` (4) | 12 | One repo each |
| `domains/messaging` (3), `finance` (2), `abroad` (2), `ugc` (1), `analytics` (1) | 9 | One repo each |
| `src/hooks/*` (9 files) | 9 | Move into the right domain |
| `src/components/*` (9 files) | 9 | Move into the right domain |
| `src/lib/*` (4 files) | 4 | Move DB calls into repos, keep utilities |
| `src/gro10x/*` (4 files) | 4 | Route through new repos |
| ESLint `NO_RAW_FROM` rule | — | Lock-in |

**Headline number:** ~437 raw `supabase.from(...)` call sites across 147 files. Six domains worth (~290 sites) are already gone. ~147 sites + ~9 dead shim packs are left to consolidate.

### Cleanup debt already visible

- **`src/components/feed/` — 28 one-line shim files** pointing at `@/domains/feed/...`. These get deleted as soon as the last importer is gone.
- **`src/components/learning/` — 24 one-line shim files** in the same shape.
- **`src/hooks/` — 9 hooks** still mixing raw queries; need to move + delete.
- **Orphan/duplicate pages** like `pages/app/Feed.tsx` vs `pages/app/AppTrackDetail.tsx` (the one we just unbroke) — every phase ends with a sweep for these.

## How files get removed (your direct question)

For every phase, the recipe is the same and you can audit it:

1. **Move** the implementation into `domains/<area>/...`.
2. **Codemod** every importer (`sed`) from old path → new domain path.
3. **Verify** with `rg` that the old path has zero importers and `tsc --noEmit` is clean.
4. **Delete** the old file (`rm`). No "leave it for safety" — if step 3 passes, it's dead code.
5. **Report** the deletions in the phase summary so you see exactly what disappeared.

So yes — abandoned shims, duplicate components, orphan pages, and dead hooks all go away as part of the work. By the end you should be able to `rg "supabase\.from" src/` and only see `domains/*/repo/*Repo.ts` files in the output.

## Completion plan — phases 10g → 10k

Each phase is small (1–2 days of work), self-contained, and ends with a `tsc --noEmit` + smoke pass before moving on.

### Phase 10g — Gigs final sweep
Migrate `MySubmissions.tsx` + `JobSharingGigForm.tsx` to `gigsRepo`. Audit pass. Removes the last 2 raw calls in the Gigs domain.

### Phase 10h — Jobs final sweep
14 files in `domains/jobs/components/admin/*` still call `supabase.from` directly. Extend `jobsRepo` (jobs CRUD, applications, batch upload, access codes, channel promotion) and migrate. Codemod any remaining `@/hooks/useJobs*` → `@/domains/jobs/hooks/*`.

### Phase 10i — Secondary domains (one repo each)
**agents · marketing · ir · workforce · institutions · feed · messaging · finance · abroad · ugc · analytics.** Same pattern as 10c–10f, but smaller — most are 1–10 files each. Each ends with shim deletion.

### Phase 10j — Top-level pages migration
`src/pages/*` and `src/pages/app/*` — the largest single bucket left (~45 files).
- Pages that are essentially **one screen of one domain** (CourseDetail, QuizManagement, MockInterview*, InstructorEdit, etc.) move into `domains/learning/pages/`, `domains/jobs/pages/`, etc.
- `src/App.tsx` route imports update with a codemod.
- Anything truly cross-domain (e.g. `AuthClassic`, `Organization`) stays in `src/pages/` as a thin shell.
- This is where the **57 top-level pages drop to ~30**.

### Phase 10k — Hooks, components, lib, gro10x cleanup
- Move 9 remaining `src/hooks/*` into their domain.
- Move 9 remaining `src/components/*` (non-`ui/`) into their domain.
- Move 4 `src/lib/*` DB-touching files into their domain; keep pure utils.
- Migrate 4 `src/gro10x/*` raw callers to repos.
- **Delete** all `src/components/feed/*` (28 shims) and `src/components/learning/*` (24 shims) once the last importer is gone.

### Phase 10L — Lock-in
- Turn on ESLint rule `NO_RAW_FROM` (blocks `supabase.from(` anywhere except `domains/*/repo/`).
- Add a `bun run audit:domains` script that runs the same `rg` audit you saw above and fails CI on regressions.
- Update `src/domains/README.md` with the final contract.

## Your expected outcome (what you'll see)

After 10g → 10L:

- **One folder per business area** under `src/domains/`. Click a domain and you have everything: data access, hooks, components, pages, public surface.
- **`pages/` becomes a thin routing layer** — almost no business code.
- **`hooks/` and `components/` (outside `ui/`) shrink to near-empty** — only truly shared, cross-domain helpers remain.
- **Searching `supabase.from(` returns ~15 results, all in `*Repo.ts` files.** That single rule is what makes the codebase reasonable to maintain going forward.
- **Adding a feature** = add a helper to `domains/<area>/repo/<area>Repo.ts`, add a hook in `domains/<area>/hooks/`, drop a component in `domains/<area>/components/`. No more guessing where things live.
- **Adding a domain** = copy the template folder, you're done.

## Recommendation

Approve and I'll run **Phase 10g (Gigs sweep)** first as the smallest warm-up, then 10h, 10i, 10j, 10k, 10L in order. After every phase I'll report:
- files moved
- files deleted (the abandoned/duplicate cleanup you asked about)
- raw `supabase.from` count remaining (so you can watch it tick down from 437 → 0)
- tsc + smoke pass result

## Technical notes

- All migration uses `rg` + `sed` codemods + `tsc --noEmit` gates; no behavior changes.
- Each phase is a single approval-able unit; you can stop after any phase and the app stays publishable.
- Phase 10j (pages migration) is the riskiest because it touches `App.tsx` routes; I'll split it into 3 sub-batches by domain (learning pages, jobs/career pages, misc) with a smoke pass between each.
- Phase 10L's ESLint rule is opt-in per-directory at first so existing exceptions don't block the build.
