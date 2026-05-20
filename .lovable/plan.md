## Progress Snapshot

**Completed (~22% of the migration):**

| Domain | Hooks | Components | API manifest | Status |
|---|---|---|---|---|
| `agents/` | 3 moved | 22 moved (chat + dashboard) | yes | Pilot done |
| `jobs/` | 11 moved | 18 moved (talent UI + views) | yes | Talent slice done; admin (297K) + gro10x untouched |
| `learning/` | 23 moved | 0 moved | yes | Hooks only — talent UI (367K) + admin (272K) pending |

Scaffolding in place: `src/shells/{talent,admin,gro10x,public}/`, `src/domains/`, `src/platform/`, `src/edge/` (still mostly READMEs).

**Not yet touched:**
- 13 remaining domains: `talent-profile, gigs, feed, messaging, ir, abroad, marketing, finance, companies, institutions, workforce, ugc, agents-admin-tabs`
- All admin (`dashboard/*`) UI for already-migrated domains
- Gro10x B2B UI (`src/gro10x/pages/work/*`) into `domains/jobs/gro10x` and `domains/learning/gro10x`
- Platform extraction (`platform/ui`, `platform/auth`, `platform/design-system`)
- Typed `edge/contracts/` generation
- Shell route splits (`shells/*/routes.tsx`) + `React.lazy` bundle boundaries
- Retiring barrel re-exports

Rough completion: **~22%** by surface area (3 of ~16 domains partially migrated, 0 of 4 shells wired, 0 of platform layers extracted).

---

## Next Phase — Phase 4: Finish `learning/` end-to-end

Rationale: `learning/` is the second-largest domain (367K talent + 272K admin) and already has hooks + API migrated. Completing it end-to-end proves the full vertical-slice pattern (talent UI + admin UI + gro10x UI + typed edge calls) before we replicate it across the remaining 13 domains.

### Step 4.1 — Move talent learning UI
- `src/components/learning/**` → `src/domains/learning/components/talent/**`
- Rewrite intra-folder imports to relative paths
- Leave barrel re-exports at `src/components/learning/*` so pages keep compiling
- Update `src/domains/learning/index.ts` to surface key talent components

### Step 4.2 — Move admin learning UI
- `src/components/dashboard/learning/**` → `src/domains/learning/components/admin/**`
- Same barrel-re-export pattern at `src/components/dashboard/learning/*`
- Detect direct `supabase.functions.invoke` calls and route them through `learningApi`

### Step 4.3 — Move gro10x learning UI
- `src/gro10x/components/learn/*` + `src/gro10x/pages/Gro10xLearn*.tsx` learn-specific pieces → `src/domains/learning/components/gro10x/**`
- Barrel re-exports at old paths so `Gro10xRoutes.tsx` keeps working

### Step 4.4 — Typed edge contracts for learning
- Generate `src/edge/contracts/learning.ts` with request/response types for every function in `learningApi`
- Wire `learningApi` to use those types (no behavior change)

### Step 4.5 — Convert remaining direct invokes
- Sweep `src/components/learning`, `src/components/dashboard/learning`, `src/gro10x/**` for `supabase.functions.invoke('<learning-fn>')` calls and route through `learningApi`
- This is the F3 fix from the audit, applied to one domain

### Step 4.6 — Verification
- Type-check passes
- Spot-check: `/app/learning`, `/app/instructor`, `/dashboard/learning`, `/gro10x/learn` still load
- Confirm no `@/components/learning` or `@/components/dashboard/learning` import was missed

### Out of scope for Phase 4
- Shell route splitting / `React.lazy` boundaries (Phase 7 — once 3+ domains are fully vertical)
- Platform extraction (Phase 6)
- Other domains (Phase 5 onwards in priority order: `agents-admin-tabs` → `feed` → `gigs` → `profile` → `companies` → `marketing` → `ir` → `finance` → `abroad` → `messaging` → `institutions` → `workforce` → `ugc`)

### Risks & mitigations
- **367K of talent learning UI** = many files. Mitigation: move in 2 batches (player/modules first, then dashboards/review queue), barrel re-exports prevent breakage between batches.
- **Hidden cross-imports** between `components/learning` and `components/player`, `components/assessment`, `components/modules`. Mitigation: keep those folders in place for Phase 4; only move things rooted in `learning/`. Cross-domain modules (`player`, `assessment`) get their own future phase.

---

## Roadmap after Phase 4

- **Phase 5 (×13):** Repeat vertical-slice migration for each remaining domain, biggest pain first (`feed` 217K, `gigs` 189K, `profile` 231K, then dashboard groups by size).
- **Phase 6:** Extract `platform/` — move `components/ui` → `platform/ui`, `contexts/TalentContext` + `useAuth` → `platform/auth`, `lib/uiTokens` + tokens → `platform/design-system`.
- **Phase 7:** Shell wiring — author `shells/{talent,admin,gro10x,public}/routes.tsx` with `React.lazy` per domain; flip `App.tsx` to consume them. This is where the **bundle-size win** (F1) actually lands.
- **Phase 8:** Retire all barrel re-exports under `src/hooks/`, `src/components/jobs`, `src/components/learning`, `src/components/dashboard/*`, `src/components/ai-agents`, `src/components/dashboard/agents`. Update every import to point at `@/domains/<x>` or `@/platform/<x>`.
- **Phase 9:** Generate `edge/contracts/` for all domains; remove every remaining direct `supabase.functions.invoke` from UI.

Approve and I'll start Phase 4.1 (talent learning UI move).
