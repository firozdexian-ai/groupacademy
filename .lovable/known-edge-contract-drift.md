# Known edge-function contract drift

Surfaced during Phase 9a/9b/9c (typed wrapper migration). These are
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

---

When fixing, also remove the entry here.
