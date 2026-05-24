# Phase A15: Talent App Chrome Audit & Normalization

A11–A14 unified the admin shell. The talent-facing app (`/app/*`) — what real users see, including the route the user is on right now (`/app/profile`) — has never had the same sweep applied. Likely has the same "Zero X detected" jargon, mega-button styling, and heavy card chrome as admin did before A11.

## Scope (in)

Files: `src/domains/*/components/talent/**`, `src/shells/talent/**`, `src/pages/app/**`.

Run the same regex audits A11–A14 used and apply the same normalizations, scoped to the talent surface:

**Buttons & inputs (A11 rules):**
- `h-14 px-{8,10,12} rounded-2xl` → `h-10 px-4 rounded-xl`
- `h-14 rounded-2xl` → `h-10 rounded-xl`
- `shadow-2xl shadow-{primary,destructive}/{10,20,30}` → `shadow-sm`
- `text-[10px] font-bold uppercase` / `text-[11px] font-black` → `text-sm font-medium`

**Cards & tables (A12 rules):**
- `rounded-[40px]` / `rounded-[32px]` / `rounded-[28px]` → `rounded-2xl`, `rounded-[24px]` → `rounded-xl`
- `border-2 border-border/*` → `border border-border/60`
- `shadow-2xl` (cards) → `shadow-sm`, `backdrop-blur-{xl,md}` on cards → drop
- `bg-card/{30,50}` → `bg-card`, `border-b-2` / `border-t-2` → `border-b` / `border-t`
- `tracking-[0.2em]` → `tracking-tight`

**Modals (A13 rules):**
- `rounded-3xl` → `rounded-2xl`, `shadow-xl` on modal content → `shadow-lg`
- `backdrop-blur-{2xl,xl}` on modal panels → removed
- Header text `text-[10px] font-bold italic` → `text-sm text-muted-foreground`

**Empty-state copy (A14 rules):**
- "Zero X detected/found/deployed" → "No X yet"
- "Inbox Zero Achieved" → "All caught up"
- "Registry/Artifact/Telemetry/Ingest" jargon → plain English nouns

## Scope (out)

- No layout, navigation, routing, or feature changes.
- No changes to mobile-specific spacing (`py-2`, `space-y-2`, 3:1 banner ratio, safe-bottom) — those are pinned by core memory.
- No changes to brand colors (Tech Blue / Cyan / Success Green stay).
- No touch to `src/components/ui/**` shadcn primitives.
- No changes to public marketing pages (`/`, `/jobs/:id`, `/c/:slug/*`, `/t/:handle`, `/projects/*`) — those have their own design language.
- No changes to gro10x employer shell (separate brand surface).

## Approach

1. **Baseline audit** — single `rg` per rule across talent scope to count hits before/after.
2. **One sed sweep per rule family** (buttons, cards, modals, copy) — same patterns proven in A11–A14.
3. **Spot-check** at `/app/profile` (active route), `/app/jobs`, `/app/learn`, `/app/gigs`, `/app/feed`, `/app/saved`.
4. **Verify no regressions** — check console for missing-class errors, verify build.

## Acceptance

- 0 hits across talent scope for the same regex set that A11–A14 zeroed out in admin.
- `/app/profile` (and the other top talent routes) render with consistent chrome matching admin.
- Mobile constraints from core memory preserved (no horizontal scroll, py-2 rhythm, safe-bottom).

## Why this phase

A14 completed the admin polish initiative. A15 ports those exact rules to the talent-facing surface, which is the surface users actually live in. This is the highest user-visible impact of the polish track and a natural mirror of the admin sweep.

---

## A15 — Executed

Swept 97 files across `src/domains/*/components/talent/**`, `src/shells/talent/**`, `src/pages/app/**`.

- **Before**: 3 button hits, 278 card/table hits, 48 modal hits, 154 jargon copy hits.
- **After**: 0 across every regex family.
- Final pass also caught `shadow-xl` on a few non-modal cards/tab strips.
- Visible jargon strings fixed: "Registry Vacuum"→"Nothing here yet", "Signal Registry"→"Saved items", "Registry Empty"→"Nothing saved yet", "Syncing Global Registry Manifest"→"Loading agents", "Synchronizing Classroom Registry"→"Loading sessions", "Registry Key Error"→"Error", "Telemetry from your…"→"Results from your…", "Creative Telemetry Diagnostics"→"Creative analytics", "Artifact Document Track Attached"→"CV attached", "Pending Manual Core Synthesis"→"Pending".
- Variable-name "Registry/Telemetry/Artifact" identifiers left alone (out of scope; zero user impact).

Admin (A11–A14) and talent (A15) surfaces now share one chrome vocabulary and one voice.
