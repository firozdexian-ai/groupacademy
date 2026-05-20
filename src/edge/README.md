# Edge function client layer

## Layout

- **Contracts** — `src/edge/contracts/<owner-domain>.ts`. Request types
  (plain interfaces) + response zod schemas with inferred types.
- **Wrappers** — `src/domains/<owner>/api/<owner>Api.ts`. One async
  function per edge function.
- **Barrel** — `src/domains/<owner>/api/manifest.ts` re-exports the
  wrappers and contract types for cross-domain consumers.

## Ownership

Each edge function has exactly one **owner domain**. Owner is the domain
whose admin surface conceptually owns the function; tie-breaker is the
domain with the most call sites. Cross-domain callers import from the
owner's `api/<owner>Api.ts` — never re-wrap the same function elsewhere.

| Edge function | Owner domain |
|---|---|
| `batch-parse-cvs`, `generate-outreach-message` | talent |
| `agent-runtime`, `ai-general-chat`, `agent-blueprint`, `ingest-agent-knowledge`, `agent-event-dispatcher`, `admin-support-assistant`, `ai-support-assistant` | agents |
| `score-job-match`, `suggest-jobs-for-talent`, `cron-rebuild-job-recs`, `analyze-job-market`, `enhance-job-description`, `parse-cv`, `parse-job-post`, `generate-job-share-caption`, `notify-application-status`, `notify-hiring-event` | jobs |
| `ai-destination-agent`, `generate-study-roadmap`, `book-language-session`, `ai-language-partner`, `ai-ielts-evaluate` | abroad |
| `ai-instructor-chat`, `ai-item-apply`, `ai-item-rewrite`, `ai-item-translate`, `ai-item-translate-apply`, `authoring-review-digest`, `create-instructor-job-from-brief`, `instructor-item-analytics`, `issue-skill-credentials`, `learner-adaptive-sample`, `learner-mastery-summary`, `learner-next-actions`, `learner-quiz-pool`, `learner-review-queue`, `learner-scenario-evaluate`, `learner-scenario-pool`, `learner-talent-mirror` | learning |

## Convention

- Import wrappers by name: `import { batchParseCvs } from "@/domains/talent/api/talentApi"`.
- No `<domain>Api` const. No `<DOMAIN>_EDGE_FUNCTIONS` array.
- Wrappers are thin: validate input via the typed param, invoke,
  throw `EdgeFunctionError` on transport failure, parse the body with
  `parseEdgeResponse` against the schema.
- One wrapper per edge function. If real-world bodies are genuinely
  polymorphic, model the request as a discriminated union — don't fork
  the wrapper.

## Failure modes

- Transport / non-2xx → `EdgeFunctionError(fnName, supabaseError)`.
- Wire-shape drift → `EdgeFunctionError(fnName, zodError)` via
  `parseEdgeResponse`.

Consumers may `instanceof EdgeFunctionError` for richer handling or
just let toast/error boundaries catch it.
