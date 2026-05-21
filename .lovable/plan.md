## Where we are

Phase **10j.5g is complete**: every `supabase.from()` table query now lives inside the 18 domain repos (`src/domains/*/repo/`). Pages, hooks, and components no longer build raw table queries.

What still leaks past the domain boundary outside repos/integrations:

| Surface | Count | Notes |
|---|---|---|
| `supabase.rpc(...)` | 84 callsites, 101 distinct functions | Heaviest leakage |
| `supabase.storage.*` | 27 callsites across 8 buckets | uploads, public URLs, signed URLs |
| `supabase.auth.*` | 70 callsites | mostly `getUser` / `getSession` |
| `supabase.functions.invoke` | 2 callsites | already mostly via typed edge wrappers |
| Direct client imports | 151 files | will shrink as the above migrate |

The goal of the next three sub-phases is the same architectural rule we just enforced for `from()`: **only repo files and the auth hook may import the supabase client.** Everything else goes through a typed helper.

## Phase 10j.5h — RPC consolidation

Move all `supabase.rpc(...)` calls into the matching domain repo as a thin typed wrapper. Group RPCs by domain based on naming + current callsite:

```text
companies/    get_companies_overview, get_industry_rollup, ensure_system_thread,
              unlock_talent_inbox, boost_profile, assign_career_coach
finance/      deduct_credits, add_credits, tip_comment
feed/         hype_content, get_feed_engagement, record_match_event
messaging/    upsert_direct_thread
analytics/    track_service_click, track_content_click, track_course_referral_click
learning/     talent_enroll_track, upcoming_sessions_for_user
ir/           toggle_project_public
talent/       talent_marketplace_summary
... (~101 functions total)
```

Each repo gets a clearly-named helper, e.g. `companiesRepo.unlockTalentInbox(talentId)` that wraps `supabase.rpc("unlock_talent_inbox", { p_talent_id })` with typed args + return.

Batch in groups of ~8–10 callsites per sub-batch (5h1, 5h2, …) so each step stays reviewable. Estimated: ~10 sub-batches.

## Phase 10j.5i — Storage consolidation

Create one storage helper per bucket inside the owning domain repo:

```text
talent/        talent-cvs (signed URLs only), talent-id-docs, cvs (legacy)
jobs/          job-assets (logos, attachments)
gigs/          gig-submissions
profile/       portfolio-uploads
finance/       payment-proofs
ir/            ir-data-room
```

Helpers exposed: `uploadX(file, path)`, `getXPublicUrl(path)`, `createXSignedUrl(path, ttl)`, `removeX(path)`. Enforces the security memory rule that `talent-cvs` is **signed URLs only**. ~27 callsites → ~1 sub-batch.

## Phase 10j.5j — Auth boundary

`useAuth` already wraps most of this. Migrate the remaining 70 callsites:

- Replace inline `supabase.auth.getUser()` / `getSession()` in components with the `user` / `session` already available from `useAuth`.
- For non-React code (helpers, edge wrappers), add a `getCurrentUser()` / `getCurrentSession()` helper in `src/lib/auth.ts` that wraps the supabase client.
- Leave `signIn*`, `signUp`, `signOut`, `onAuthStateChange` inside the auth hook / sign-in pages — those are legitimately auth-surface code.

## Acceptance

After 5h + 5i + 5j:

- Outside `src/domains/*/repo/`, `src/hooks/useAuth.ts`, `src/lib/auth.ts`, and `src/integrations/supabase/*`, **no file imports the supabase client at all**.
- A single grep (`grep -rln "@/integrations/supabase/client" src | grep -v <allowed>`) returns zero.
- This gives us a clean seam to later swap the data layer (server actions, edge-only access, caching) without touching feature code.

## Technical notes

- Wrapper signatures use named-object args (`{ talentId, companyId }`) to avoid positional drift — same pattern as the `from()` repo helpers.
- RPC wrappers throw on `error` and return `data` typed via `Database["public"]["Functions"][name]["Returns"]`.
- Storage helpers return `{ path, publicUrl }` or `{ path, signedUrl, expiresAt }` rather than the raw supabase response.
- No behavior changes — purely structural. Existing TanStack Query keys, RLS, and edge contracts remain identical.

## Suggested order

1. **10j.5h1–5h10** — RPC migration, domain by domain (start with `companies` + `finance` since they have the most callsites).
2. **10j.5i** — Storage helpers (single batch).
3. **10j.5j** — Auth cleanup + final import-boundary lint check.

Progress:
- ✅ **10j.5h1**: companies/talent/messaging — 7 RPCs, 11 callsites
- ✅ **10j.5h2**: finance/feed/gigs — 7 RPCs, 7 files
- ✅ **10j.5h3**: analytics/messaging/learning/ugc/agents — `track_service_click`, `track_content_click`, `track_course_referral_click`, `upsert_direct_thread`, `talent_enroll_track`, `upcoming_sessions_for_user`, `toggle_project_public`, `talent_marketplace_summary` (8 RPCs, 10 callsites)

Say **"continue 10j.5h4"** to proceed with the next batch (admin overview RPCs: `get_workforce_dashboard`, `analyst_metrics_bulk`, `get_global_crm_overview`, `get_creator_economy_leaderboard`, `sweep_expired_connections`, `get_contact_unlocks_summary`, `get_ugc_dashboard`, `broadcast_notifications`).
