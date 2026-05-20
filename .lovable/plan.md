# Phase 9c — Agents domain migration

Apply the Phase 9b hardened pattern (named wrappers + zod contracts + `parseEdgeResponse` + `EdgeFunctionError`) to the agents domain, and bring the pre-existing `manifest.ts` in line with the new convention.

## Scope

Every `supabase.functions.invoke` call inside `src/domains/agents/`:

| Edge function | Call site |
|---|---|
| `agent-runtime` | `api/manifest.ts` (existing wrapper) |
| `ai-general-chat` | `api/manifest.ts` (existing wrapper) |
| `admin-support-assistant` | `components/chat/AgentChatDialog.tsx` |
| `agent-blueprint` | `components/dashboard/AgentBrainPanel.tsx` |
| `ingest-agent-knowledge` | `components/dashboard/AgentStudioTab.tsx` |
| `agent-event-dispatcher` | `components/dashboard/AgentTriggers.tsx` |

**Out of scope:** the ~30 `src/pages/app/*` files that invoke agent-related edge functions. They belong to talent / jobs / learning / abroad domains and ship in Phase 9d+.

## Ownership

`admin-support-assistant` is owned by **agents**. The 3 talent-domain callers (`ProfileVerify`, `ProfileEdit`, `ProfileBuilder`) and the talent `aiSupportAssistant` wrapper get cleaned up in step 5.

## Steps

1. **Write zod contracts** — `src/edge/contracts/agents.ts` with request/response schemas + inferred types for all 6 functions. Mirror talent contract file layout.
2. **Build the wrapper** — create `src/domains/agents/api/agentsApi.ts` exporting 6 named async functions (`agentRuntime`, `aiGeneralChat`, `adminSupportAssistant`, `agentBlueprint`, `ingestAgentKnowledge`, `agentEventDispatcher`). Each: `supabase.functions.invoke` → throw `EdgeFunctionError` on transport → `parseEdgeResponse` on shape. No `agentsApi` const, no array export.
3. **Reduce `manifest.ts` to a re-export barrel** — re-export the 6 named functions + contract types only. Delete the `agentsApi` object. Mark for removal in Phase 9d once external refs are gone.
4. **Migrate 4 component call sites** — `AgentChatDialog`, `AgentBrainPanel`, `AgentStudioTab`, `AgentTriggers` swap raw invokes for named wrappers.
5. **Resolve cross-domain leak (option A)** —
   - Delete `aiSupportAssistant` from `src/domains/talent/api/talentApi.ts` and remove its contract from `src/edge/contracts/talent.ts`.
   - Point `src/pages/app/ProfileVerify.tsx`, `ProfileEdit.tsx`, `ProfileBuilder.tsx` at `adminSupportAssistant` from `@/domains/agents/api/agentsApi`.
   - Body shape: these 3 sites currently send the malformed fire-and-forget error payload (`{ type, error/event, context }`). The agents wrapper will accept the canonical `{ image, context }` shape only. **These 3 call sites are rewritten to either omit the call (if the error-sink role is no longer wanted) or pass the canonical body.** Default: omit and replace with a no-op + `console.warn` so the misuse stops silently failing on the server; flag in `known-edge-contract-drift.md` as resolved.
6. **Audit `agentsApi.*` consumers repo-wide** — `rg "agentsApi\."` and convert each to named imports. Pure rename.
7. **Update `src/edge/README.md`** — add agents row to the ownership table.
8. **Update `.lovable/known-edge-contract-drift.md`** — mark `admin-support-assistant` drift as resolved in Phase 9c; leave `generate-outreach-message` open.

## Verification

- `tsc` clean
- `rg "supabase\.functions\.invoke" src/domains/agents` → 0 hits outside `agentsApi.ts`
- `rg "agentsApi\."` → 0 hits
- `rg "aiSupportAssistant" src/domains/talent` → 0 hits
- Smoke: admin chat dialog opens, agent brain loads blueprint, agent studio uploads knowledge, triggers panel dispatches event, talent shell `ai-general-chat` still streams, the 3 profile pages render without console errors.

## Size

~8 files touched, ~200 LOC net change.

## After Phase 9c

Talent + agents are both on the hardened pattern. Phase 9d targets the next-densest domain (likely **jobs**, given `src/pages/app/AppJob*` + admin jobs hub call sites).
