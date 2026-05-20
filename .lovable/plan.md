## Phase 9e — Abroad domain edge function hardening ✅ COMPLETE

Apply the pilot pattern (talent/agents/jobs) to the abroad domain.

### Scope

**Edge functions to harden (6 total):**
1. `ai-destination-agent` (already in contracts; expand types)
2. `generate-study-roadmap` (already in contracts; expand types)
3. `book-language-session` (new)
4. `ai-language-partner` (new)
5. `ai-ielts-evaluate` (new)
6. `admin-support-assistant` — already owned by agents domain; abroad pages will switch to `agentsApi.adminSupportAssistant` (5 page call sites)

### Steps

1. **Expand `src/edge/contracts/abroad.ts`** — replace the loose `Record<string, unknown>` types with proper Zod schemas + request/response interfaces for all 5 abroad-owned functions, matching the actual payloads each call site sends.

2. **Create `src/domains/abroad/api/abroadApi.ts`** — 5 named async wrappers following the hardened pattern: `supabase.functions.invoke` → `EdgeFunctionError` → `parseEdgeResponse`. One wrapper per function:
   - `aiDestinationAgent`
   - `generateStudyRoadmap`
   - `bookLanguageSession`
   - `aiLanguagePartner`
   - `aiIeltsEvaluate`

3. **Convert `src/domains/abroad/api/manifest.ts` and `index.ts` to barrels** — re-export from `abroadApi.ts`, delete the legacy `abroadApi` const object.

4. **Migrate call sites (9 files):**
   - `LanguageInstructorsPage.tsx` → `bookLanguageSession`
   - `LanguagePracticePage.tsx` → `aiLanguagePartner`
   - `DestinationAgentPage.tsx` → `aiDestinationAgent`
   - `IELTSMockRunner.tsx` → `aiIeltsEvaluate`
   - `SchoolDetail.tsx`, `StudyAbroad.tsx`, `StudyAbroadRoadmap.tsx`, `StudyAbroadRoadmapResults.tsx`, `StudyAbroadDetail.tsx` → `agentsApi.adminSupportAssistant` (fire-and-forget telemetry)
   - Existing in-domain components (`RoadmapBuilderSheet.tsx`, `RoadmapIntakeForm.tsx`) — re-point to named imports.

5. **Update `src/edge/README.md`** — add abroad ownership rows for the 5 functions.

6. **Update `.lovable/known-edge-contract-drift.md`** — clear/close the `admin-support-assistant` cross-domain entry (#1 portion covering abroad pages) and note any payload shape quirks found while migrating.

7. **Verify** — `tsc` clean; `rg "supabase.functions.invoke" src/domains/abroad src/pages/app/{StudyAbroad*,SchoolDetail,DestinationAgentPage,LanguagePractice*,LanguageInstructors*,IELTSMockRunner}.tsx` returns 0 hits; `rg "abroadApi\."` returns 0 hits (all named imports).

8. **Mark Phase 9e ✅ in `.lovable/plan.md`** and queue the next domain.

### Out of scope
- ESLint tooling guard (deferred).
- Other cross-domain leaks (parse-cv, notify-hiring-event, agent-runtime, etc.) tracked in drift doc for their own domain phases.
