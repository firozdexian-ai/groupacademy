# Plan

## Phase 9c — Agents domain migration (✅ shipped)

Applied the Phase 9b hardened pattern to the agents domain.

**New / rewritten:**
- `src/edge/contracts/agents.ts` — zod contracts for 7 fns (`agent-runtime`, `ai-general-chat`, `admin-support-assistant`, `ai-support-assistant`, `agent-blueprint`, `ingest-agent-knowledge`, `agent-event-dispatcher`).
- `src/domains/agents/api/agentsApi.ts` — 7 named async wrappers, no `agentsApi` const.
- `src/domains/agents/api/manifest.ts` — re-export barrel only.
- `src/domains/agents/index.ts` — drops `agentsApi`, re-exports named fns.
- `src/shells/{talent,gro10x,admin}/agents.ts` — drop dead `agentsApi` re-export.

**Migrated call sites:**
- `AgentChatDialog` → `adminSupportAssistant` (with try/catch fire-and-forget)
- `AgentBrainPanel` → `agentBlueprint`
- `AgentStudioTab` → `ingestAgentKnowledge`
- `AgentTriggers` → `agentEventDispatcher`
- `SupportAITab` (talent admin) → now imports `aiSupportAssistant` from agents per ownership rule
- `ProfileVerify`, `ProfileEdit`, `ProfileBuilder` → `console.warn` no-op (Option A resolution)

**Talent domain cleanup:**
- Dropped `aiSupportAssistant` from `talentApi.ts` + `contracts/talent.ts` (moved to agents).

**Docs:**
- `src/edge/README.md` — ownership table added.
- `.lovable/known-edge-contract-drift.md` — ProfileX entry marked resolved; new entries logged for `admin-support-assistant` (fn not on disk, ~13 dormant callers in talent pages) and `ingest-agent-knowledge` (key-name drift).

**Verification:**
- `rg "supabase.functions.invoke" src/domains/agents` → only in `agentsApi.ts` ✅
- `rg "agentsApi\b"` → only in agents domain barrel/wrapper, no consumers ✅
- `rg "aiSupportAssistant"` outside agents domain → only `SupportAITab` (legit, agents-domain import) ✅

## Phase 9d — Next

Talent-domain page migration: convert the ~13 `src/pages/app/*` fire-and-forget `admin-support-assistant` invokes to use `adminSupportAssistant` from agents domain (or strip them entirely once telemetry sink is decided). Then move on to `jobs` domain (~30 page-level invokes).
