# Phase A11 — Admin Button & Input Normalization

A10 calmed the typography; admin still ships oversized "mega buttons" (`h-14 px-12 rounded-2xl shadow-2xl`) that feel like a different product from the talent app. This phase normalizes admin controls to the same scale used elsewhere.

## Why this next
Highest remaining visual offender. Buttons are the most-touched element in admin — shrinking them ties the whole shell together without redesigning any feature.

## Scope (in)
1. **Primary action buttons** in admin domain files
   - `h-14 px-12 rounded-2xl` → `h-10 px-4 rounded-xl`
   - `h-14 px-10 rounded-2xl` → `h-10 px-4 rounded-xl`
   - `shadow-2xl shadow-primary/30` → `shadow-sm`
   - `text-[11px]` button labels → default size (drop)
2. **Dialog/sheet footers** — same shrink for confirm/cancel buttons.
3. **Toast prefix spot-check** — `rg` for `Protocol Fault:`, `Handshake Failed:`, `Registry`, `Synchroniz` in admin toasts; rewrite the stragglers A9 missed.
4. **Input/select heights** — only the obvious `h-14` form inputs in admin; leave shadcn defaults alone.

## Scope (out)
- No logic, routes, RPCs, schema, or icons.
- No talent or gro10x shells (already normalized).
- No table/card redesign — only control sizing.
- Hero CTAs inside `IRDashboard`, `JobsHub`, `TalentUploadTab` may keep one larger primary if it anchors the page (case-by-case).

## Approach
1. **Audit**: `rg "h-14.*rounded-2xl" src/domains/*/components/admin src/shells/admin` + `rg "shadow-2xl.*primary" src/domains/*/components/admin`.
2. **Automated sweep** (one script, regex-only, no AST):
   - Replace the three class combos above inside `className="..."` strings.
   - Collapse double spaces.
3. **Hand-review** the ~5–10 hero hubs after the sweep to restore a single anchor CTA where the page reads flat.
4. **Toast sweep**: small `sed`-style pass for remaining jargon prefixes.

## Estimated surface
~40–60 admin files, mostly 1–3 class edits each.

## Open question
Keep one hero-sized primary per hub (e.g. "Upload jobs", "Add company"), or shrink uniformly? Default: shrink uniformly — the hub header + page title already anchor the page, an oversized button just adds visual weight.

Approve and I'll run the sweep + hand-tune the hub anchors.
