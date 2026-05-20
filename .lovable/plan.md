
# Phase 10 — Domain hook consolidation + DB query repositories

Phase 9 closed the **edge-function** surface (zero raw `supabase.functions.invoke` outside `*Api.ts`). Phase 10 does the equivalent for **direct database access**: pull cross-cutting hooks into their domains, and put `supabase.from(...)` behind typed domain repositories so call sites stop reaching into the DB.

## Why this next

Today `src/hooks/` holds ~90 hooks that mix domains (jobs, learning, finance, messaging, agents…) and ~74 files across `src/hooks/`, `src/pages/`, `src/components/`, and `src/gro10x/` still call `supabase.from(...)` directly. That makes:

- domain boundaries blurry (shells can reach into any table),
- RLS/shape changes risky (no single grep target per table),
- testing painful (hooks aren't colocated with their domain).

This phase makes domains self-contained the same way Phase 9 made edge calls typed.

## Goals

1. **Move hooks** from `src/hooks/` into `src/domains/<owner>/hooks/`, re-exported through each domain's `index.ts`.
2. **Introduce repositories** `src/domains/<owner>/repo/<owner>Repo.ts` wrapping all `supabase.from(...)` reads/writes that the domain owns. Call sites import named repo functions instead of building queries inline.
3. **Lock it down** with an ESLint guard banning `supabase.from(` outside `src/domains/*/repo/*Repo.ts`, `src/hooks/useSupabaseQuery.ts`, `src/hooks/useDataFetch.ts`, and (temporary allowlist) any file we deliberately defer.
4. **Keep behavior identical** — pure refactor. No schema, RLS, or UX changes.

## Scope (batched by owner-domain)

For each batch: classify the hook → move file → update imports → extract any `supabase.from` into the repo → wire through domain barrel.

| Batch | Owner | Representative hooks | Repo seed (tables) |
|---|---|---|---|
| 10a | jobs | useRankedJobs, useJobsHubDashboard, useJobInvitations, useJobMatchCached, useJobTypeCounts, useTrendingJobs, useJobsInField, useEmployerPipeline, useApplicationBuckets, useApplicationHistory, useApplicationMessages | jobs, job_applications, job_invitations, application_messages |
| 10b | gigs | useGigsHubDashboard, useRankedGigs | gigs, gig_bids, gig_matches |
| 10c | learning | useCohorts, useCourseProgress, useEnrollment, useLearningHubDashboard, useLearningStats, useLearningTracks, useStageProgress, useResourceProgress, useProgress, useModuleResources, useModuleReviewBadge, useReviewQueue, useItemAnalytics, useItemRewrite, useItemTranslate, useMasterySummary, useNextActions, useSkillCredentials, useTutorMasteryContext, useAuthoringTrends, useCertificate, useCourseBriefs, useInstructorWorkspace | courses, modules, enrollments, cohorts, certificates, … |
| 10d | talent | useTalent, useTalentLists, useTalentMirror, useTalentOutcomeSignal, useTalentPitches, useTalentRelationships, useTalentSearch, useCareerLevel, usePublicProfileSettings (profile) | talents, talent_lists, talent_relationships |
| 10e | finance | useCredits, useCreditPurchase, usePaymentConfig, useUnitEconomics | credit_ledger, transactions, payment_configs |
| 10f | messaging | useDirectMessages, useMessageThreads, useNotifications | message_threads, direct_messages, notifications |
| 10g | agents | useAgentChat, useAgentRuntime, useAIGeneralChat, useAuthChat | agent_sessions, agent_messages |
| 10h | feed | useFeedEngagement, useFeedRecommendations, useHype, useContentHype, usePollVoting, usePostReactions | feed_posts, post_comments, post_reactions |
| 10i | companies | useActiveCompany (gro10x), useCompaniesWithSignal, useCompanyDetail, useCompanyCredits (gro10x), useFollowedCompanies, useCompanyOfferings | companies, company_credits, company_follows |
| 10j | platform | useAuth, useAccountType, useAdminScope, useOnboarding, useMediaQuery, use-mobile, useToast, useQueryWithTimeout, useSupabaseQuery, useDataFetch, useProgressiveLoadingMessage, usePWADetect, usePlayerHotkeys | stays in `src/platform/` (no repo — these are cross-cutting) |

Anything ambiguous (e.g. `useSavedItems`, `useToolRuns`, `useServiceHistory`) gets classified during the batch — default to the domain that owns the underlying table.

## Per-hook migration recipe

```text
- src/hooks/useRankedJobs.ts                       (old location)
+ src/domains/jobs/hooks/useRankedJobs.ts          (new location, same name)

  Inside the hook:
- const { data } = await supabase.from("jobs").select(...).eq(...);
+ const data = await jobsRepo.listRankedJobs({ ... });

  In src/domains/jobs/index.ts:
+ export { useRankedJobs } from "./hooks/useRankedJobs";

  All call sites switch:
- import { useRankedJobs } from "@/hooks/useRankedJobs";
+ import { useRankedJobs } from "@/domains/jobs";
```

A shim file at the old path can re-export for one batch to keep diffs small, then be deleted at the end of the batch.

## Repository shape

```ts
// src/domains/jobs/repo/jobsRepo.ts
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

export async function listRankedJobs(params: {
  talentId: string; limit?: number; cursor?: string | null;
}): Promise<{ rows: JobRow[]; nextCursor: string | null }> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("rank_score", { ascending: false })
    .limit(params.limit ?? 20);
  if (error) throw error;
  return { rows: data ?? [], nextCursor: null };
}
```

Rules:
- One repo per domain (`<owner>Repo.ts`), named-export functions only.
- Repos throw on error; callers use `try/catch` like the edge wrappers.
- No React, no hooks inside repos — pure data access.
- Repos may compose other repos but must not import from `src/shells/*` or `src/pages/*`.

## ESLint guard

Add to `eslint.config.js` alongside the existing `NO_RAW_INVOKE` rule:

```js
const NO_RAW_FROM = {
  selector: "CallExpression[callee.property.name='from'][callee.object.name='supabase']",
  message: "Do not call supabase.from directly. Use a typed repository from src/domains/<owner>/repo/<owner>Repo.ts.",
};
```

Scoped overrides re-permit it in:
- `src/domains/*/repo/*Repo.ts`
- `src/hooks/useSupabaseQuery.ts`, `src/hooks/useDataFetch.ts` (generic helpers)
- a short, named allowlist for files we intentionally defer (tracked in `.lovable/plan.md`).

## Verification

1. `bunx tsc --noEmit` clean.
2. `bunx eslint src` clean (guard catches missed sites).
3. `rg "supabase\.from\(" src` returns only repo files + the allowlist.
4. `rg "from \"@/hooks/" src` returns only platform hooks; everything else imports from `@/domains/*`.
5. Spot-check in preview: jobs hub, gigs hub, learning dashboard, talent search, messaging inbox.

## Out of scope

- New features, schema migrations, RLS changes, edge-function changes.
- Splitting any domain or renaming tables.
- Touching `AIChatPanel` SSE logic.
- Repointing the SSE invoke exception added in Phase 9.

## Execution order

Land one batch per turn (10a → 10j). Each batch:
1. Move hooks into the domain folder, add barrel exports, update imports.
2. Extract `supabase.from` calls into `<owner>Repo.ts`.
3. Delete the old `src/hooks/*` files (no long-lived shims).
4. Run tsc + eslint; fix fallout before moving to the next batch.

After 10j, enable the `NO_RAW_FROM` ESLint rule globally and update `.lovable/plan.md` + `.lovable/known-edge-contract-drift.md` with the final allowlist.

## Deliverable when complete

- `src/hooks/` contains only platform/cross-cutting hooks (~15 files instead of ~90).
- Every domain owns its hooks + repo; shells and pages import from `@/domains/<owner>` only.
- Zero raw `supabase.from(...)` outside repos + named allowlist.
- ESLint guards Phase 9 (invoke) and Phase 10 (from) are both active.
