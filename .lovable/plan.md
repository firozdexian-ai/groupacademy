# Phase 6 — Platform extraction (shared admin chrome + common primitives)

With every domain folder migrated (5.13a/b), the only source code still living under `src/components/dashboard/` is **shared infrastructure** used by many domains. Phase 6 moves it into a dedicated `src/platform/admin/` layer so domains depend on platform — not on a sibling `components/dashboard/` folder — and so the admin shell has a clean home.

## Inventory of remaining real source

| File | LOC | Role |
|---|---|---|
| `dashboard/AdminSidebar.tsx` | 563 | Admin nav tree |
| `dashboard/DashboardSkeleton.tsx` | 118 | Page-level shell wrapper (13 consumers) |
| `dashboard/ImpersonationBanner.tsx` | 27 | Cross-cutting auth banner |
| `dashboard/StatsCard.tsx` | 101 | Generic KPI tile (2 consumers) |
| `dashboard/common/ChatAgentShortcut.tsx` | 35 | Shared chat launcher |
| `dashboard/common/ConfirmPurge.tsx` | 42 | Destructive-action dialog |
| `dashboard/common/DraggableList.tsx` | 130 | DnD list primitive |
| `dashboard/common/SimpleAdminRegistry.tsx` | 149 | Generic admin CRUD table (9 consumers) |

Everything else under `dashboard/` is already a 1–3-line barrel (`hr`, `ir`, `finance`, `companies`, `institutions`, `jobs`, `marketing`, `learning`, `agents`, `chat`, `gigs`, `ugc`, `gtm`, `messaging`, `overview`, `performance`, `abroad`, `talent`).

## Target layout

```text
src/platform/admin/
  chrome/
    AdminSidebar.tsx
    DashboardSkeleton.tsx
    ImpersonationBanner.tsx
  ui/
    StatsCard.tsx
    ChatAgentShortcut.tsx
    ConfirmPurge.tsx
    DraggableList.tsx
    SimpleAdminRegistry.tsx
  index.ts        // barrel: re-export the 8 public symbols
```

## Scope

1. **Copy** each of the 8 files to its new `src/platform/admin/{chrome,ui}/` home; rewrite any internal sibling imports to `@/platform/admin/...`.
2. **Replace** each original file under `src/components/dashboard/` (and `dashboard/common/`) with a one-line barrel: `export { default } from "@/platform/admin/..."` (plus named re-exports where needed).
3. **Create** `src/platform/admin/index.ts` exposing the 8 symbols so future call sites can use `from "@/platform/admin"`.
4. **Leave existing consumers untouched** — barrels preserve every current import path (`@/components/dashboard/DashboardSkeleton`, `@/components/dashboard/common/SimpleAdminRegistry`, etc.). Migrating consumers to the new path is Phase 8.
5. **No behavior changes**. No edge-call refactors. No type changes.

## Out of scope

- Migrating any of the 13 `DashboardSkeleton` consumers / 9 `SimpleAdminRegistry` consumers to the new `@/platform/admin` path (Phase 8 — barrel retirement).
- Splitting `AdminSidebar` (563 LOC) into per-group config — separate refactor.
- Creating route shells / `React.lazy` code-splitting (Phase 7).
- Typed `*Api` wrappers around remaining `functions.invoke` (Phase 9).

## Verification

- `tsc` clean.
- `/dashboard` mounts; sidebar renders all groups; impersonation banner shows when active.
- Pages using `SimpleAdminRegistry` (Module Manager, UGC tabs, Finance Payment Infra, Marketing Simple Tabs, Learning Simple Tabs) render rows.
- `rg "^(export|import)" src/components/dashboard/AdminSidebar.tsx src/components/dashboard/DashboardSkeleton.tsx` → only barrel lines.
- `find src/components/dashboard -maxdepth 2 -name '*.tsx' -size +3 | xargs wc -l | awk '$1>10'` → empty (every remaining `dashboard/*` file is a thin barrel).

## Risk

Low. Pure file relocation behind preserved barrel paths; zero call-site changes. The biggest file (`AdminSidebar.tsx`, 563 LOC) has only 1 consumer (`pages/Dashboard.tsx`) which keeps its current import string.

## Progress after Phase 6

**~92%.** Remaining:
```text
Phase 7  shells/admin/routes.tsx + React.lazy code-splitting for each domain group
Phase 8  retire src/components/dashboard/* barrels — consumers import from @/domains/* and @/platform/admin
Phase 9  typed jobsApi / talentApi / etc. wrappers around the ~remaining functions.invoke call sites
```
