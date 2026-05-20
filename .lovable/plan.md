# Phase 9h — Finish the edge-wrapper migration

Infrastructure for Phase 9h (contracts + typed wrappers) is already in place. This phase executes the call-site migrations, locks the convention with an ESLint guard, and closes out documentation.

## Goal

Reach **zero raw `supabase.functions.invoke` calls** outside `src/domains/*/api/*Api.ts` (with one explicit exception: `src/components/ai-instructor/AIChatPanel.tsx`, which uses SSE streaming and cannot go through the standard wrapper).

## Scope

~57 call sites across ~50 files, grouped by owner-domain into 7 batches. Each batch is one focused pass: swap `supabase.functions.invoke("fn", { body })` for the named wrapper import, convert `{ data, error }` checks to `try/catch`, and remove now-unused supabase imports where applicable.

### Batches

| Batch | Owner | Functions | ~Sites |
|---|---|---|---|
| A | agents | `admin-support-assistant`, `agent-runtime`, `trigger-agent-pitch`, `company-agent-tools` | 15 |
| B | jobs | `notify-hiring-event`, `parse-cv`, `send-job-application`, `generate-interview-questions`, `analyze-mock-interview`, `analyze-job-assessment`, `generate-job-assessment`, `generate-application-answers`, `enhance-cover-letter` | 18 |
| C | gigs | `admin-gig-ops`, `ai-reviewer-brief`, `ai-project-scoper`, `ai-gig-verifier`, `ai-gig-scoper`, `ai-gig-public-summary`, `og-image-render` | 8 |
| D | talent | `unlock-talent-contact`, `analyze-salary`, `analyze-career-assessment` | 3 |
| E | messaging | `messaging-send`, `messaging-group-manager`, `send-transactional-email`, `telegram-diagnostic`, `handle-email-unsubscribe` | 6 |
| F | finance | `request-instructor-payout` | 2 |
| G | companies + ugc | `signup-company`, `check-company-account`, `admin-content-ai` | 5 |

### Per-site migration recipe

```text
- import { supabase } from "@/integrations/supabase/client"
+ import { notifyHiringEvent } from "@/domains/jobs/api/jobsApi"

- const { data, error } = await supabase.functions.invoke("notify-hiring-event", { body });
- if (error) throw error;
+ const data = await notifyHiringEvent(body);   // throws EdgeFunctionError on failure
```

When a file uses `supabase` only for the invoke, drop the import. When it still uses `supabase.from(...)`, keep it.

## ESLint guard

Extend `eslint.config.js` with `no-restricted-syntax` banning `CallExpression[callee.object.property.name='functions'][callee.property.name='invoke']`, then add a scoped override that re-permits it in:

- `src/domains/*/api/*Api.ts`
- `src/components/ai-instructor/AIChatPanel.tsx`

This makes regressions impossible without an explicit override.

## Documentation

- `src/edge/README.md` — refresh the ownership table with any functions added in 9h infrastructure (already mostly done; verify).
- `.lovable/known-edge-contract-drift.md` — append the Phase 9h entry listing batches and the SSE exception.
- `.lovable/plan.md` — mark Phase 9h ✅ COMPLETE.

## Verification

1. `bunx tsc --noEmit` clean.
2. `bunx eslint src` clean (the guard will catch any missed site).
3. `rg "supabase\.functions\.invoke" src` returns only:
   - `src/domains/*/api/*Api.ts`
   - `src/components/ai-instructor/AIChatPanel.tsx`
4. Spot-check three migrated flows in preview: (a) admin support assistant chat, (b) job application submission, (c) gig bid coach.

## Out of scope

- Behavior changes beyond the `{ data, error }` → throw adaptation.
- New edge functions, schema changes, or SSE wrapper refactor.
- Touching the `AIChatPanel` streaming logic.

## Execution order

Suggest landing batches A → B → C → D → E → F → G sequentially in a single turn (they are independent files), then ESLint guard, then docs, then verification. If any batch surfaces an unexpected polymorphic body, stop and extend the contract before continuing.
