## Phase 10i — Secondary-Domain Repo Sweep

**Goal:** Bring every `src/domains/*` folder that still uses raw `supabase.from(...)` into the repository pattern that Jobs / Learning / Talent / Profile / Companies / Gigs now follow. After 10i, the only place outside `src/domains/*/repo/` that should touch `.from()` is `src/pages/**` and a handful of leaf utilities — those go into Phase 10j.

**Scope (11 domains, ~159 raw call sites, 0 repo files today):**

| Domain | Files | Sites | Notes |
|---|---|---|---|
| agents | 10 | 29 | biggest; has `useAgentChat` + dashboard tabs |
| marketing | 9 | 23 | many lead/code generators + `useMarketingGraph` |
| ir | 8 | 24 | investor CRM + `useDataRoom` |
| workforce | 4 | 22 | `useHrGraph` + HR tabs (graph-style) |
| institutions | 4 | 11 | `useInstitutionGraph` + registries |
| ugc | 1 | 12 | `useUgcGraph` only |
| analytics | 1 | 11 | `LifetimeOverviewTab` only |
| abroad | 2 | 10 | `useAbroadGraph` + intake form |
| finance | 2 | 9 | `useFinOpsGraph` + `TalentCreditsTab` |
| feed | 4 | 5 | reactions + compose + recs + hype card |
| messaging | 3 | 3 | thin |

### Pattern (same as 10g/10h)

For each domain we will:
1. Create `src/domains/<domain>/repo/<domain>Repo.ts` (named-export functions, throw on error, no React).
2. Add helpers for every distinct query/mutation found in the domain.
3. Replace raw `supabase.from(...)` call sites in components / hooks with repo calls.
4. Keep `supabase.auth.*`, `supabase.rpc(...)`, `supabase.functions.invoke(...)` and `supabase.channel(...)` as-is — only `.from()` is moved.
5. For the `*Graph` hooks (workforce, institutions, ugc, abroad, finance, ir, marketing), move the master `Promise.all` into a single `get<Domain>GraphMaster()` repo function and turn the mutation generators into thin wrappers over `upsertGraphRow` / `deleteGraphRow` factories (matches the `useJobsGraph` refactor we just shipped).

### Sub-phases (executed in order, one at a time)

**10i.1 — Small/clean domains (12 files, 32 sites)**  
`messaging` (3), `feed` (5), `finance` (9), `analytics` (11) — quickest wins, lets us validate the pattern + repo layout before tackling the big ones.

**10i.2 — Graph hooks (4 files, 55 sites)**  
`workforce/useHrGraph` (22), `ugc/useUgcGraph` (12), `institutions/useInstitutionGraph` + 3 registry tabs (11), `abroad/useAbroadGraph` + intake form (10). All follow the `useJobsGraph` mechanical port.

**10i.3 — Marketing (9 files, 23 sites)**  
Lead/code generators (5 files, mostly trivial `insert(...)` calls — mirrors 10h.1), `BannersTab`, `ContentOutreachTab`, `LeadHunterManager`, and `useMarketingGraph`.

**10i.4 — IR + Agents (18 files, 53 sites — the heavyweights)**  
- **IR (8 files, 24 sites):** `useDataRoom` graph hook, `InvestorsManager`, `VCFirmsManager`, `MRRTargetManager`, `EmailComposer`, `InteractionLogger`, `KeyInfluencersTab`, `IRDashboard`.  
- **Agents (10 files, 29 sites):** `useAgentChat`, `useAgentRuntimeThread`, plus 8 dashboard tabs (Registry, Studio, Overview, Triggers, Payouts, Marketplace, Insights, BrainPanel).

### Acceptance gates (per sub-phase)

- `rg -n "supabase\.from" src/domains/<domain>/` returns **0** matches outside `repo/`.
- `tsc --noEmit` clean (the harness will run it).
- Global file count drops monotonically; final after 10i.4 should be **~132 → ~88** (we'll measure exactly).
- No behavior changes — pure code motion. Component state, query keys, toasts, and error messages stay byte-identical.

### What comes after 10i

**Phase 10j — App pages sweep:** 23 raw-call files under `src/pages/app/` and 20+ under `src/pages/`. Many already have a matching domain repo; the rest will get small additions. This is the last big batch before the ESLint guard (`no raw supabase.from outside repo/`) can be enforced project-wide.

### Recommended execution order today

Start with **10i.1** (smallest, fastest, validates pattern). After it lands cleanly I'll continue straight into 10i.2 unless you want to inspect first.
