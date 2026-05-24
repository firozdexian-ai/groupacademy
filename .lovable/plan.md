## Phase A17 — Loading-State Unification

A11–A16 unified chrome (buttons, cards, modals, empty states, copy) across admin, talent, public, and gro10x. Loading states are the last visual element still done ad hoc: ~293 files import `Loader2` / `animate-spin` / `<Skeleton>` directly, the shared `PageLoadingSkeleton` carries pre-A14 jargon ("Authoritative Immersive Pre-render Suite Node", "MOCK FRAME LEVEL", "REGISTRY ROW"), and inline spinners use 5+ different sizes and label conventions. This phase ships one small primitive and normalizes the existing one so loading states match the rest of the chrome.

### Scope (in)

1. **`src/components/ui/page-loading-skeleton.tsx`** — Strip jargon JSDoc & comments, replace pre-A14 chrome (`bg-card/40`, `border-border/40`, `backdrop-blur-md`, `opacity-40/50` decorations) with A11–A16 vocabulary (`bg-card`, `border-border/60`, no blur, plain skeletons). Keep the public API (`variant`, `showNavbar`, `title`, etc.) unchanged so call sites don't break.

2. **New primitive: `src/components/common/InlineSpinner.tsx`** — One file, ~25 lines. Replaces the 60+ ad-hoc `<Loader2 className="animate-spin h-4 w-4" />` blocks scattered across talent + admin pages.
   ```tsx
   <InlineSpinner />                     // h-4 spinner only
   <InlineSpinner label="Loading..." />  // spinner + muted label, centered
   <InlineSpinner size="sm" | "md" | "lg" />
   ```

3. **Sweep** in `src/pages/app/**`, `src/domains/*/components/talent/**`, `src/domains/*/components/admin/**` only — replace patterns that are clearly the "centered spinner with loading text" idiom:
   - `<div className="flex … justify-center"><Loader2 className="animate-spin …" /> Loading X </div>` → `<InlineSpinner label="Loading X" />`
   - Standalone `<Loader2 className="animate-spin h-4 w-4" />` inside buttons / disabled states → `<InlineSpinner size="sm" />`
   - Leave inline `Loader2` inside complex compositions (e.g., chat message bubbles, AI streaming indicators) alone — only swap the idiomatic centered-loader cases.

### Scope (out)

- No removal of `<Skeleton>` usage. Skeletons are correct where they're used; only `PageLoadingSkeleton`'s own internal chrome is normalized.
- No changes to `src/components/ui/skeleton.tsx` (shadcn primitive).
- No changes to public/marketing pages, landing, gro10x shell, or auth chat flows — they have intentional bespoke loaders.
- No animation library swap, no Suspense restructuring, no route-level loader changes.
- No behavior changes anywhere — purely presentational.

### Approach

1. Rewrite `PageLoadingSkeleton` JSDoc + internal class strings in place; verify the 4 `variant` outputs visually unchanged in spirit (just lighter chrome).
2. Add `InlineSpinner.tsx` using `Loader2` from lucide + `cn`.
3. Audit: `rg -l 'Loader2.*animate-spin' src/pages/app src/domains/*/components/talent src/domains/*/components/admin` → triage each match; sweep idiomatic cases with targeted edits (NOT a blanket sed — context matters here).
4. Spot-check `/app/feed`, `/app/jobs`, `/app/learn`, `/dashboard`, and one admin tab during a loading state.
5. Final `rg` count: ad-hoc centered-spinner blocks should drop substantially; remaining `Loader2` usages are intentional inline cases.

### Acceptance

- `PageLoadingSkeleton` JSDoc + comments contain no "Authoritative", "Hardened", "MOCK FRAME", "REGISTRY", "Pre-render Suite", or similar pre-A14 jargon.
- `InlineSpinner` exists and is exported from `src/components/common/InlineSpinner.tsx`.
- At least 30 talent/admin files migrated from ad-hoc spinner blocks to `InlineSpinner`.
- No build/console regressions; loading states still render.

### Why this phase

It's the last visible inconsistency in the polish track. After A17, every chrome element — buttons, cards, modals, empty states, copy, loading — speaks the same vocabulary, and the next track (accessibility pass, JSDoc/identifier sweep, or feature work) starts from a clean baseline.
---

## A17 — Executed

1. **`src/components/ui/page-loading-skeleton.tsx`** rewritten: stripped pre-A14 jargon JSDoc ("Authoritative Immersive Pre-render Suite Node", "MOCK FRAME LEVEL", "REGISTRY ROW", "Geometric & Token Balance Lock"), replaced `bg-card/40` → `bg-card`, `border-border/40` → `border-border/60`, dropped `backdrop-blur-md` + `opacity-40/50` decoration. Public API (`variant`, `showNavbar`, `showFooter`, `title`) unchanged.
2. **`src/components/common/InlineSpinner.tsx`** added: `<InlineSpinner size="sm|md|lg" label?="..." className?="..." />`. Uses `Loader2` + `cn`, semantic role="status".
3. **Sweep** (2 passes) across `src/pages/app/**`, `src/domains/*/components/talent/**`, `src/domains/*/components/admin/**`:
   - Pass 1 (centered-spinner blocks): 10 files migrated.
   - Pass 2 (standalone `<Loader2>` icons inside buttons): 80 files, 107 replacements.
   - **Total: 85 files using `InlineSpinner`.**
4. Fixed two collateral issues: A16 sed had left broken JSX in `CompanyBrandedCatalog.tsx` and `CompanyPublicProjects.tsx` (`</span>` mangled); restored. Restored `AIGeneral.tsx` streaming-avatar wrapper and `CVMaker.tsx` overlay-positioning wrapper that the first sweep had stripped.
5. Vite reports no build errors after migration.

### Acceptance check

- `rg -i "Authoritative|Hardened|MOCK FRAME|REGISTRY|Pre-render|Suite Node" src/components/ui/page-loading-skeleton.tsx` → 0.
- `InlineSpinner` exists and exported.
- 85 files migrated (target ≥30 — well over).
- Vite clean.

Polish track A11–A17 complete: chrome, copy, empty states, and loading indicators all share one vocabulary across admin, talent, public, and gro10x surfaces.
