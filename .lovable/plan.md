
# Architectural Audit — Folder Structure & Coupling

## 1. Scope measured

- `src/pages/` = 57 top-level + 94 under `/app` + 8 IR + 1 public
- `src/components/dashboard/` = **2.3 MB**, 19 admin groups (the heaviest: `jobs/` 297K, `learning/` 272K, `agents/` 263K, `marketing/` 229K, `ir/` 214K, `talent/` 184K)
- `src/components/` (talent shell) = ~2 MB across 40+ feature folders (heaviest: `learning/` 367K, `ui/` 254K, `profile/` 231K, `feed/` 217K)
- `src/gro10x/` = parallel B2B shell with its own `components/ hooks/ lib/ pages/`
- `src/hooks/` = 94 flat hooks, shared by all three shells (62 imported from `/app`, 31 from `dashboard`, 31 from `gro10x`)
- `supabase/functions/` = 194 edge functions, dominated by `admin-*` (36), `ai-*` (31), `cron-*` (21), `notify-*` (17)

## 2. Findings (coupling & bottlenecks)

| # | Area | Symptom | Evidence | Impact |
|---|------|---------|----------|--------|
| F1 | Three shells, one bundle | Talent `/app`, Admin `/dashboard`, B2B `/gro10x` all sit under one Vite entry. Talent pages import from `@/gro10x/*` (e.g. `TalentPitches`, `TalentHome`, `Feed`, `AppTrackDetail`). | grep on `from "@/gro10x"` in `src/pages/app` | Talent users download admin + B2B code; B2B users download talent code. No code-split boundary. |
| F2 | Flat `src/hooks/` is a god-folder | 94 hooks consumed by every shell (62/31/31). No ownership signal — admin hooks live next to talent hooks. | `ls src/hooks` | Any change risks cross-shell regressions; tree-shaking is per-symbol only. |
| F3 | Dashboard groups bloated & edge-coupled | Top 6 admin groups account for ~60% of `dashboard/`. 18 files under `dashboard/` call `supabase.functions.invoke` directly; another 38 in talent components do the same. | `rg supabase.functions.invoke` | Edge-function contracts leak into UI; adding/renaming an agent or function requires hunting through component trees. |
| F4 | Admin "groups" mirror business domains but live as UI-only folders | `dashboard/jobs/`, `dashboard/learning/`, `dashboard/agents/` each pair with hooks in `src/hooks/` and 5-20 edge functions in `supabase/functions/`, but the three pieces have no shared parent. | Folder-by-folder review | New agents require touching `src/components/dashboard/agents/`, `src/hooks/`, `supabase/functions/`, plus route wiring — high cognitive load for new contributors. |
| F5 | `components/` mixes leaf UI with feature modules | `components/ui/` (design system) lives next to feature folders like `components/learning/` (367K) and `components/jobs/` (158K) that contain page-level logic, hooks calls, and edge invocations. | `du -sh src/components/*` | Hard to enforce "ui is dumb / features are smart"; design-system changes are scary because feature folders may import internals. |
| F6 | Routing fragmentation | `pages/` has `app/`, `ir/`, `public/`, and ~50 loose admin pages at the root; `gro10x/` has its own `pages/`. No single map of shells → routes → bundles. | `ls src/pages` | Lazy-import boundaries are ad-hoc; route splits don't match shell splits. |
| F7 | Edge-function naming is the only domain grouping | 194 functions in one flat dir, grouped only by prefix (`admin-`, `ai-`, `cron-`, `notify-`). | `ls supabase/functions` | No clear domain that owns a function; pairing with UI is left to memory. |

## 3. Proposed restructuring — Feature-first, shell-bounded

Principle: **shell at the top, domain inside, layer inside that.** Each domain owns its UI + hooks + API client + edge-function contracts in one place. No files are deleted — only moved (and re-exported from old paths during a transition window if needed).

### 3.1 Proposed tree

```text
src/
├─ app.tsx
├─ main.tsx
├─ shells/                       # one entry per shell — defines route + bundle split
│  ├─ talent/                    # was: src/pages/app + most of src/components/*
│  │  ├─ routes.tsx
│  │  └─ index.ts                # lazy-loads features
│  ├─ admin/                     # was: src/components/dashboard + admin pages
│  │  ├─ routes.tsx
│  │  └─ index.ts
│  ├─ gro10x/                    # was: src/gro10x
│  │  ├─ routes.tsx
│  │  └─ index.ts
│  └─ public/                    # was: src/pages/public + IR + landing
│     └─ routes.tsx
│
├─ domains/                      # the source of truth — one folder per business domain
│  ├─ jobs/
│  │  ├─ talent/                 # talent-facing UI (was components/jobs, pages/app/JobsHub…)
│  │  ├─ admin/                  # admin UI (was components/dashboard/jobs)
│  │  ├─ gro10x/                 # B2B UI (was gro10x/pages/work/*)
│  │  ├─ hooks/                  # was src/hooks/useJobs*, useRankedJobs, useEmployerPipeline…
│  │  ├─ api/                    # thin wrappers around supabase.functions.invoke('score-job-match' …)
│  │  └─ types.ts
│  ├─ learning/                  # courses, tracks, cohorts, review queue
│  ├─ agents/                    # AI agent registry — see §3.2
│  ├─ talent-profile/            # profile, portfolio, public profile, verify
│  ├─ gigs/                      # marketplace, projects, escrow, disputes
│  ├─ feed/                      # social feed, hype, comments, notifications
│  ├─ messaging/                 # threads, inbox, app messages
│  ├─ ir/                        # investor relations
│  ├─ abroad/                    # study abroad
│  ├─ marketing/                 # campaigns, outreach, B2B email
│  ├─ finance/                   # credits, payouts, transactions, wallet
│  ├─ companies/                 # CRM, employer onboarding
│  ├─ institutions/              # universities, partners
│  ├─ workforce/                 # ops, commissions
│  └─ ugc/                       # creator tools, contents
│
├─ platform/                     # cross-domain primitives — no business logic
│  ├─ ui/                        # was src/components/ui (shadcn)
│  ├─ design-system/             # tokens, uiTokens.ts, brand assets
│  ├─ auth/                      # was contexts/TalentContext + useAuth + AuthGate
│  ├─ supabase/                  # was integrations/supabase (untouched, just relocated re-export)
│  ├─ ai/                        # Lovable AI gateway wrappers
│  ├─ analytics/                 # error tracking, telemetry
│  ├─ pwa/                       # offline, install prompts
│  └─ utils/                     # lib/utils, lib/setHead, etc.
│
└─ edge/                         # one-to-one mirror of supabase/functions for typed clients
   ├─ contracts/                 # generated request/response types per function
   └─ clients/                   # one client per domain re-exported from domains/*/api
```

`supabase/functions/` (server side) stays where the platform requires it, but gains parallel domain grouping inside via a manifest (see §3.3) so each domain advertises which functions it owns.

### 3.2 Agent registry pattern (fixes F4)

`domains/agents/registry.ts` becomes a single declarative file:

```ts
export const agents = [
  { id: 'aisha',    label: 'Auth Coach',   ui: () => import('./aisha/AdminCard'),    edge: 'ai-agent-aisha' },
  { id: 'concierge',label: 'Concierge',    ui: () => import('./concierge/AdminCard'),edge: 'ai-general-chat' },
  …
];
```

Adding a new agent = one folder + one row. The admin "Agents" group iterates the registry; no edits needed to `dashboard/agents/`, the chat hub, or the sidebar. Bundles stay small because each `ui` is lazy.

### 3.3 Edge-function ownership manifest (fixes F3, F7)

Add `domains/<domain>/api/manifest.ts` listing the edge functions the domain owns and the typed client for each. Result:

- UI never calls `supabase.functions.invoke('admin-foo')` directly — it calls `jobsApi.scoreMatch(...)`.
- `edge/contracts/` is generated from the manifests, giving the same typed surface to talent, admin, and gro10x shells.
- Renaming/removing an edge function requires updating one manifest, and `tsc` flags every caller.

### 3.4 Bundle-size wins (fixes F1, F6)

- `shells/*/index.ts` each `React.lazy()` import only their own `domains/*/<shell>` subtree.
- Talent shell stops pulling `dashboard/*` (saves ~2.3 MB of source from the talent chunk).
- Admin shell stops pulling player/feed/gigs talent code (~700K saved).
- Shared chunk = `platform/*` + `domains/*/hooks` + `domains/*/api`, which is small and stable.

### 3.5 Migration approach (no deletions)

1. Land `domains/`, `shells/`, `platform/`, `edge/` as empty scaffolding.
2. For each domain in priority order (`jobs` → `learning` → `agents` → …), **move** files with `git mv` and leave a barrel re-export at the old path:
   ```ts
   // src/components/dashboard/jobs/index.ts
   export * from '@/domains/jobs/admin';
   ```
   Existing imports keep working; nothing is deleted.
3. Convert direct `supabase.functions.invoke` calls into typed client calls one domain at a time.
4. Once a shell is fully migrated, swap its route entry to `shells/<shell>/routes.tsx` and enable the lazy split.
5. After all callers are migrated, retire the re-export barrels in a follow-up pass (still moves, not deletions of behavior).

UI fields, action handlers, props, and component contracts stay byte-identical — only file paths and `supabase.functions.invoke` indirection change.

## 4. Recommended next step

If you approve this direction, I'll start with a single pilot domain (`agents/` — highest pain per F4) so we can validate the pattern end-to-end (shell split, domain folder, registry, manifest, typed edge client) before rolling it across the other 15 groups.
