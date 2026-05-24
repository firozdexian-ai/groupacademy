# Phase A14: Admin Empty-State Consolidation

With chrome unified across buttons (A11), cards/tables (A12), and modals (A13), the largest remaining inconsistency in the admin shell is **empty-state panels**. ~30 admin tabs each ship a hand-rolled 100–200 line "no data yet" block with custom illustrations, gradients, and copy tone. A shared component already exists at `src/components/common/EmptyState.tsx` but isn't used in admin.

## Scope (in)

- Audit all `src/domains/*/components/admin/**` tabs for inline empty-state JSX (patterns: `items.length === 0 ? (...)` returning a centered div with an icon + heading + description + optional CTA).
- Replace each with `<EmptyState icon={Icon} title="…" description="…" action={<Button …>} />`.
- Normalize copy: drop jargon ("Registry is empty", "No artifacts ingested", "Telemetry void") in favor of plain language ("No companies yet", "No applications to review", "Nothing here yet").
- Standardize CTA placement (single primary button, no double "Refresh + Add" pairs).
- Estimated ~25–35 files touched, net code reduction ~1500–2500 lines.

## Scope (out)

- No changes to `EmptyState.tsx` API itself unless a missing prop blocks a tab (e.g. add optional `secondaryAction` only if needed).
- No changes to loading skeletons or error states (those have their own components).
- No talent/gro10x/public empty states.
- No layout, table, or filter logic changes — only the "zero rows" branch.

## Approach

1. Read `src/components/common/EmptyState.tsx` to confirm current API.
2. `rg -n "length === 0|length == 0|!.*\.length" src/domains/*/components/admin --type tsx -l` to enumerate candidates, then spot-check each for the inline empty-state pattern.
3. For each file:
   - Identify the empty branch
   - Pick the closest matching icon from existing imports (or import from `lucide-react`)
   - Write plain-language title + description
   - Preserve the existing CTA action (e.g. "Add company", "Import LinkedIn")
   - Replace ~30–80 lines of JSX with a 5-line `<EmptyState …/>`
4. Spot-check at `/dashboard?tab=companies`, `/dashboard?tab=jobs-applications`, `/dashboard?tab=ir-investors`, `/dashboard?tab=abroad-leads` with an empty filter to render the state.

## Acceptance

- All admin tabs render empty state via the shared `EmptyState` component.
- Copy is plain English, no "Registry/Artifact/Telemetry/Void/Ingest" jargon.
- Net LOC reduction documented in plan log.
- No behavioral regressions; CTA actions still fire.

## Why this phase

A11–A13 normalized populated states; A14 finishes the visual language by unifying the "zero data" state. After A14, the admin shell has a single vocabulary across all four UI states (loading, empty, populated, error) — closing out the admin polish initiative and unblocking pure-cleanup work (JSDoc, identifier renames).
