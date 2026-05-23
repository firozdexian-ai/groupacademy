# Phase A8 — Career Abroad Polish

Same humanization bar as A5–A7, scoped to the Study Abroad / Career Abroad surfaces. Copy + empty-state work only — no schema, RPC, edge, or scoring changes.

## Scope

**In:**
- `src/pages/app/CareerAbroad.tsx` — strip "Phase Z1 Redirect Insulation", fix the broken `h-4 w-4定位` className typo, humanize the loader text.
- `src/domains/abroad/components/talent/*` — Roadmap intake form, timeline, builder sheet, any abroad-specific cards/dialogs.
- `src/components/abroad/RoadmapBuilderSheet.tsx` and re-export shims.
- Learning Hub `?tab=events&kind=abroad` entry point: confirm copy on the abroad tab/filter labels reads naturally.
- Toasts, button CTAs, empty states, section headers across these files.

**Out:**
- Admin abroad shells (`src/shells/admin/routes/abroad.ts` and `src/domains/abroad/components/admin/*`) — separate sweep.
- Edge functions, RPCs, RLS, repo/api layers.
- Visual redesign beyond copy + empty/loading states.
- Gro10x abroad surfaces (none currently in scope).

## Approach

1. **Audit** — parallel `rg` for jargon markers (`Vector`, `Ingress`, `Synchroniz`, `Ledger`, `Ecosystem`, `Handshake`, `Pipeline`, `Trajectory`, `Matrix`, `Protocol`, `Nexus`, `Phase Z`) inside `src/domains/abroad/components/talent` + `src/components/abroad` + `src/pages/app/CareerAbroad.tsx`.
2. **Read** all flagged files in parallel.
3. **Rewrite** in parallel batches:
   - Headers → plain English ("Study Abroad Roadmap", "Your timeline", "Build your plan")
   - CTAs → verb-first ("Start your roadmap", "Save plan", "Edit step")
   - Toasts → short success/error ("Roadmap saved", "Couldn't save — try again")
   - Empty states → one sentence + primary CTA
4. **Fix `CareerAbroad.tsx` typo** (`h-4 w-4定位` → `h-4 w-4`) and rewrite the loader caption.
5. **Verify** — re-run jargon `rg` over the touched files; confirm preview routes (`/app/abroad`, `/app/learning?tab=events&kind=abroad`) render without console errors.
6. **Document** — mark A8 DONE in `.lovable/plan.md` + `.lovable/launch-audit.md`; flag admin abroad shells as the next remaining sweep.

## Estimated impact
~8–14 files, copy-only.

## Open question
Want me to also include the **admin abroad shells** in this pass, or keep A8 talent-only and tackle admin abroad alongside the broader admin shell sweep?
