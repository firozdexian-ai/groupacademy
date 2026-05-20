# Known edge-function contract drift

Surfaced during Phase 9a/9b/9c/9d (typed wrapper migration). These are
**pre-existing** runtime bugs where a call site passes a body shape the
edge function rejects. Phase 9 does not fix them — wrappers preserve
exact runtime behavior. Fix in a dedicated follow-up.

---

## 1. `generate-outreach-message`

- **Call site:** `src/domains/talent/components/admin/TalentOutreachConsoleTab.tsx` (`generateOutreach`)
- **Sends:** `{ talent_id, product_context }`
- **Edge fn expects:** `{ parsedCV, product }` — returns 400 otherwise.
- **User-visible effect:** "Generation failed" toast on every click of
  the Generate button in the Talent Outreach Console.
- **Fix sketch:** either (a) load the talent's parsed CV client-side and
  forward as `parsedCV`, or (b) refactor the edge function to accept
  `talent_id` and resolve the CV server-side. (b) is the cleaner path.

## 2. `ai-support-assistant` — ProfileX pages (RESOLVED Phase 9c)

- **Call sites:** `src/pages/app/{ProfileVerify,ProfileEdit,ProfileBuilder}.tsx`
- **Was:** fire-and-forget anomaly reports with `{ type, error/event, context }`.
- **Resolution:** invokes replaced with `console.warn` no-ops. These were
  never reaching the edge function (`image` required, never passed). When
  a real client-error telemetry sink is wired up, route these through it.

## 3. `admin-support-assistant` — broad fire-and-forget telemetry

- **Call sites (~13):** `src/pages/app/{Withdrawals,Unsubscribe,Transactions,TalentPublicProfile,TalentMirror,StudyAbroadDetail,TalentHome,StudyAbroad,ServicesHub,StudyAbroadRoadmap,StudyAbroadRoadmapResults,SavedItems,TalentDirectory,SchoolDetail}.tsx`, plus `AgentChatDialog` (now via typed wrapper).
- **Sends:** `{ type, severity, error/event, context }`.
- **Edge fn:** `admin-support-assistant` does not exist on disk under
  `supabase/functions/`. All calls fail silently. The typed wrapper
  `adminSupportAssistant` is provided in the agents domain so future
  migration is a one-line swap when the function is implemented (or
  rerouted to a real telemetry sink).
- **Phase 9c scope:** wrapper exists, but cross-domain pages have not
  been migrated to use it yet — that happens with each domain's phase
  (talent → 9d, abroad → 9e, etc.).

## 4. `ingest-agent-knowledge`

- **Call site:** `src/domains/agents/components/dashboard/AgentStudioTab.tsx` (`handleIngest`)
- **Sends:** `{ agent_id, source_type, title, content?, url? }`
- **Edge fn expects:** `{ agent_id, source_kind, title, content?, source_ref? }`.
- **User-visible effect:** ingestion always fails with a "source_kind"
  validation error. The `ingestAgentKnowledge` wrapper models the
  call-site shape verbatim to preserve runtime behavior.
- **Fix sketch:** rename `source_type → source_kind` and `url → source_ref`
  in the call site (and update the wrapper request type to match).

## 5. `score-job-match` — request shape

- **Call sites:** all in-domain jobs callers send camelCase
  `{ jobId, talentId }`. Edge function and DB also accept `job_id`,
  `talent_id`. The `ScoreJobMatchRequest` type accepts both spellings
  with an index signature; consumers should standardize on camelCase.
- **No user-visible effect** — both forms work.

## 6. `notify-hiring-event` — cross-domain raw callers

- **Call sites:** `src/hooks/useOffers.ts`, `src/hooks/useInterviews.ts`
  still call `supabase.functions.invoke("notify-hiring-event", ...)`
  directly instead of using `notifyHiringEvent` from the jobs domain.
- **No bug** — bodies match the contract. Convention violation only.
- **Fix:** swap to `import { notifyHiringEvent } from "@/domains/jobs/api/jobsApi"`
  when next touching those hooks, or fold into a "shared hooks" pass.

## 7. `parse-cv` — cross-domain raw callers

- **Call sites:** `src/pages/app/ProfileEdit.tsx`,
  `src/components/job-application/InlineCVUpload.tsx`,
  `src/components/onboarding/CVUploadStep.tsx`,
  `src/gro10x/hooks/useGro10xAuthChat.ts` still call
  `supabase.functions.invoke("parse-cv", ...)` directly.
- **No bug** — bodies vary (`fileUrl` / `cvText` / etc.) but all are
  accepted by the edge function. Convention violation only.
- **Fix:** swap to `import { parseCv } from "@/domains/jobs/api/jobsApi"`
  during the respective talent-profile, onboarding, and gro10x passes.

## 8. `agent-runtime`, `agent-blueprint`, `ai-general-chat` — cross-domain raw callers

- **Call sites:** `src/components/onboarding/OnboardingWizard.tsx`
  (`agent-runtime`), `src/components/agents/CreatorOnboardingDialog.tsx`
  (`agent-blueprint`), and one additional `ai-general-chat` consumer
  outside the agents domain.
- **No bug** — convention violation only.
- **Fix:** swap to named imports from `@/domains/agents/api/agentsApi`
  when the onboarding / creator-onboarding flows are next refactored.

---

When fixing, also remove the entry here.
