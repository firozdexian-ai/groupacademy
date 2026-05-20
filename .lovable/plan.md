# Phase 10b — Gigs Domain: Hooks + Repo Consolidation ✅ COMPLETE

Continues the Phase 10 rollout. After 10a (jobs), this batch domainizes the **gigs** surface: route every `supabase.from("gig_*"|"reviewer_*"|"revision_*"|"talent_availability"|"talent_trust*")` call through a single `gigsRepo.ts`, delete the `src/hooks/` shims for gigs, and standardize imports on `@/domains/gigs`.

## Scope

In: gigs marketplace, bids, matches, projects/milestones/escrow, project messages, verifications, reviewer program, disputes, revision requests.
Out: new features, schema or RLS changes, edge-function changes, AIChatPanel SSE, anything outside the gigs domain.

## Inventory (verified)

Shims to delete:
- `src/hooks/useRankedGigs.ts` → re-export of `@/domains/gigs/hooks/useRankedGigs`
- `src/hooks/useGigsHubDashboard.ts` → re-export of `@/domains/gigs/hooks/useGigsHubDashboard`

Domain hooks already in place (RPC-only, no `from()`):
- `src/domains/gigs/hooks/useRankedGigs.ts` (RPC `get_ranked_gigs_for_talent`)
- `src/domains/gigs/hooks/useGigsHubDashboard.ts` (RPC `get_gigs_hub_dashboard`)

Raw `supabase.from(...)` call sites to migrate into `gigsRepo.ts`:

| File | Tables |
|---|---|
| `src/pages/app/ProjectRoom.tsx` | `gig_projects`, `gig_project_milestones`, `gig_escrow_accounts`, `gig_project_messages` (read + insert) |
| `src/pages/app/ReviewerCockpit.tsx` | `reviewer_profiles` |
| `src/domains/gigs/components/admin/hooks/useGigGraph.ts` | `gigs`, `gig_submissions`, `gig_verifications` |
| `src/domains/gigs/components/admin/ReviewerProgramTab.tsx` | `reviewer_profiles` (read + update), `gig_disputes`, `gig_review_assignments` |
| `src/domains/gigs/components/admin/GigMatchmakerTab.tsx` | `gig_matches`, `gig_match_digests` |

## Plan

1. **Create `src/domains/gigs/repo/gigsRepo.ts`** with named async functions, one per query. Examples:
   - `getProjectRoomBundle(projectId)` — parallel reads of the 4 ProjectRoom tables, returns typed shape
   - `insertProjectMessage(input)`
   - `getReviewerProfile(talentId)`
   - `listReviewerProfilesTop(limit=100)` / `updateReviewerStatus(id, status)`
   - `listGigDisputes(limit=100)` / `listReviewAssignmentSummary()`
   - `listGigGraphSlice()` — three parallel reads used by `useGigGraph`
   - `getGigMatchmakerStats()` — `gig_matches` aggregate + `gig_match_digests` count
   Each helper returns plain data and throws on error (matches `jobsRepo.ts` convention).

2. **Refactor call sites** to import from `@/domains/gigs/repo/gigsRepo`. No behavior changes; preserve existing realtime subscriptions inline (they're not queries).

3. **Re-export repo barrel** from `src/domains/gigs/index.ts` (only what shells need).

4. **Delete shims**:
   - `src/hooks/useRankedGigs.ts`
   - `src/hooks/useGigsHubDashboard.ts`
   Update the single remaining external importer (`src/pages/app/Gigs.tsx`) to `@/domains/gigs`.

5. **Verification**
   - `rg "@/hooks/useRankedGigs|@/hooks/useGigsHubDashboard"` → empty
   - `rg "supabase\\.from\\(\"(gigs|gig_[a-z_]+|reviewer_[a-z_]+|revision_requests)\"" src/` → only `gigsRepo.ts`
   - `tsc --noEmit` clean, `eslint` clean
   - Smoke routes: `/app/gigs`, `/app/projects/:id`, `/app/reviewer`, admin Matchmaker + Reviewer Program tabs

## Out of scope

- Adding `NO_RAW_FROM` ESLint rule (deferred until 10j, once all batches land)
- Splitting gigs admin components or changing their UI
- Touching edge-function contracts in `src/edge/contracts/gigs.ts`

## Next batch after this

10c — learning (largest batch, ~20+ hooks under `src/hooks/use*` covering courses/modules/enrollments/cohorts/certificates/instructor workspace).
