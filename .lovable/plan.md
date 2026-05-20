## Phase 9 — Typed edge function API wrappers (pilot + rollout)

The refactor is otherwise complete (Phases 1–8). What remains: 128 raw `supabase.functions.invoke(...)` call sites scattered across 100 files, invoking 63 distinct edge functions. Each call site re-writes its own body shape, ad-hoc error handling, and untyped response casting. Phase 9 replaces these with thin, typed `<domain>Api.<fn>()` wrappers so every consumer goes through a single contract per edge function.

We'll do this in two passes: a **pilot** (one domain, fully migrated end-to-end) and then a **per-domain rollout**.

### Pre-flight: cleanup

- Delete the stray `src/pages/app/sedRFGX9Q` file (leftover from a sed misfire during Phase 8 — it's not imported anywhere).

### Phase 9a — Pilot: `talent` domain

Talent has 4 invoke call sites covering 3 functions (`batch-parse-cvs`, `ai-support-assistant`, `generate-outreach-message`) and already has skeleton contracts in `src/edge/contracts/talent.ts`. Ideal pilot — small, contained, contracts already exist.

1. **Flesh out `src/edge/contracts/talent.ts`** — fully type each function's request and response (inputs derived from current call sites; outputs from the edge function source under `supabase/functions/<name>/index.ts`).
2. **Build `src/domains/talent/api/talentApi.ts`** — one async function per edge function:
   ```ts
   export async function batchParseCvs(req: BatchParseCvsRequest): Promise<BatchParseCvsResponse> {
     const { data, error } = await supabase.functions.invoke("batch-parse-cvs", { body: req });
     if (error) throw new EdgeFunctionError("batch-parse-cvs", error);
     return data as BatchParseCvsResponse;
   }
   ```
3. **Add `src/edge/EdgeFunctionError.ts`** — shared error class so consumers get a consistent throwable (name + function id + cause).
4. **Migrate the 4 talent call sites** to `talentApi.*`.
5. **Update `src/domains/talent/api/manifest.ts`** to re-export `talentApi` and the contract types, plus surface them from `src/domains/talent/index.ts`.

Pilot deliverable doubles as the template for the rollout.

### Phase 9b — Rollout (subsequent phases, one per domain)

Each domain gets its own follow-up phase using the talent pattern. Ordered by call-site density to compound learnings:

| Phase | Domain | Sites | Fns | Notable |
|-------|--------|------:|----:|---------|
| 9c | agents | ~25 | `admin-support-assistant` (16), `agent-runtime`, `agent-blueprint`, `company-agent-tools` | Largest; AI Concierge backbone |
| 9d | jobs | ~20 | `notify-hiring-event`, `score-job-match`, `enhance-job-description`, `analyze-job-assessment` | Hiring loop |
| 9e | learning | ~15 | `learner-quiz-pool`, `learner-scenario-pool`, `learner-adaptive-sample`, `authoring-review-digest` | Item bank + adaptive |
| 9f | gigs | ~10 | `admin-gig-ops`, `ai-project-scoper`, etc. | Managed projects |
| 9g | marketing | ~10 | mock interview, salary, outreach analytics | Lead funnels |
| 9h | messaging | 5 | `unipile-connect` | Single function |
| 9i | remaining (ugc, finance, ir, abroad, workforce, companies, analytics, institutions, gtm, feed, profile) | ~30 | mixed | Mostly 1–4 sites each; can be combined into a single sweep |

Each rollout phase follows the same five steps as the pilot (contracts → api file → wire error class → migrate sites → re-export).

### Out of scope for Phase 9a (pilot)

- Anything beyond talent.
- Adding retries, rate-limit handling, or telemetry — wrappers are deliberately thin so behavior is byte-for-byte identical.
- Renaming edge functions or changing their request/response shapes server-side.
- React Query hooks. The wrappers are pure async functions; existing `useQuery`/`useMutation` callers swap their `invoke` for `talentApi.x` with no other change.

### Technical notes

- `EdgeFunctionError` lives in `src/edge/EdgeFunctionError.ts` and is reusable by every domain. Constructor takes `(fnName, cause)`; `.message` formats as `"edge function <fnName> failed: <cause.message>"`.
- Contracts in `src/edge/contracts/<domain>.ts` are the single source of truth for request/response shapes. The api file imports them.
- When a current call site sends fields the contract doesn't yet model, prefer making the contract field optional/`unknown` over dropping the field — preserve runtime behavior exactly.
- Where a single edge function is called from multiple domains (e.g. `score-job-match` from jobs and talent), it lives in the **owning domain's** contract/api; other domains import from there.

### Verification (per phase)

- `tsc` clean.
- `rg "supabase\.functions\.invoke" src/domains/<domain>` → 0 after that domain's phase.
- Smoke-test each migrated screen in the preview (call still fires, response renders).
- Global `rg "supabase\.functions\.invoke" src | wc -l` drops monotonically toward 0 across phases.

### Progress after Phase 9a

~98%. Remaining: the 9b–9i rollout, which we'll plan/execute one phase at a time so each stays small and reviewable.