# Phase 9 — Status

## Completed (signed off)

- **Phase 9a** — infra: `EdgeFunctionError`, `parseEdgeResponse`, contracts directory, README, drift log.
- **Phase 9b — talent** ✅ COMPLETE. 2 owned fns (`batch-parse-cvs`, `generate-outreach-message`). Zero in-domain raw invokes.
- **Phase 9c — agents** ✅ COMPLETE. 7 owned fns. Cross-domain ownership of `admin-support-assistant` / `ai-support-assistant` resolved via Option A. Zero in-domain raw invokes.
- **Phase 9d — jobs** ✅ COMPLETE. 10 owned fns. Zero in-domain raw invokes.

All three pass the Phase 9b convention checklist:
contracts present, named-async wrappers, barrel-only manifest, no
`*Api` const, every wrapper uses `EdgeFunctionError` + `parseEdgeResponse`,
README ownership table updated, drift entries logged.

## Outstanding (cross-domain leaks, deferred by design)

Tracked in `.lovable/known-edge-contract-drift.md` entries #3, #6, #7, #8.
These are pages/components in other domains that still call owned fns via
raw `supabase.functions.invoke`. They will be migrated when the consuming
domain comes up in its own phase (no functional bug — convention only).

## Next: Phase 9e — abroad domain

Same shape as 9d. ~12 page-level call sites under
`src/pages/app/{StudyAbroad*, SchoolDetail, DestinationAgentPage,
LanguagePracticePage, LanguageInstructorsPage, IELTSMockRunner}.tsx`.

This phase will incidentally clear several drift-#3 entries
(`admin-support-assistant` calls on StudyAbroad* / SchoolDetail).

## Optional follow-up (not blocking)

**Tooling guard** — add an ESLint rule that flags
`supabase.functions.invoke` outside `src/**/api/*Api.ts`. Would catch
regressions automatically and remove the manual `rg` audit each phase.
