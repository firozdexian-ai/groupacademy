# Phase 3.1 — Browse tab: AI matches + connected sections

First segment of the jobs board overhaul: the **Browse tab on `/app/jobs`** and every surface it links into. Companies, Locations, Tools tabs and the job detail / application flow are out of scope — separate plans will follow.

---

## What's on the Browse tab today

```text
Tabs: [Browse] Companies | Locations | Tools     <- sticky tab bar (kept)
─────────────────────────────────────────────
Section 1: AI job matches
   • "5 FREE LEFT" / "10 CREDITS" badge   <- REMOVING
   • "Get / Refresh AI matches" CTA
   • Result list = ai_job_recommendations (uses suggest-jobs-for-talent)
Section 2: Trending now (jobs.is_featured)
Section 3: Browse by type (JOB_COLLECTIONS grid)
```

---

## Diagnosed problems

1. **AI matches are a black box.** No "why this matched", no way to steer results. `JobPreferencesSheet` exists but is orphaned.
2. **Pricing is confusing.** The "5 free / then 10 credits" badge is redundant — every talent already gets 250 welcome credits. We just charge 10 credits per run, full stop.
3. **Recommendations go stale.** `generated_at` is stored but never shown, never auto-refreshed, and inactive/expired jobs still appear.
4. **Trending = `is_featured` only.** Hand-curated and noisy. We have `saved_items` + `job_applications` to derive real signal.
5. **No personalization beyond AI matches.** Browse-by-type grid is identical for everyone.
6. **Cold start is bad.** Empty profiles can fire the AI button and get weak matches that hurt trust.

---

## Sub-phase 3.1 deliverables

### A. AI job matches — clean pricing, transparency, control

- **Remove the freemium counter entirely.** Drop the "5 FREE LEFT" badge, the `aiMatchUsageCount` query, the `freemium_usage` zero-row insert, and the `FREE_AI_MATCHES_LIMIT` constant. Replace with a single static badge: `Coins · 10 credits`.
- **Standard credit gate.** `handleGetAIRecommendations` always calls `deductCredits("SUGGESTED_JOBS")`; if balance < 10, surface the existing top-up sheet via `CreditGateModal`. No free-tier branching.
- **Inline "Tune matches" pill** next to the section header → opens `JobPreferencesSheet`. After saving, recommendations refetch automatically.
- **Why-it-matched chip on each match card.** Pull top 1 line from `ai_job_recommendations.match_reason` and render dimmed under the title in `JobCard` compact variant.
- **"Updated Xh ago" stamp** + manual refresh icon on the section.
- **Filter stale matches at read time.** Skip recs whose `job.is_active=false` OR `job.deadline < now()`.
- **Profile-completeness gate.** If `talent.profile_completeness < 40`, swap the CTA for a "Complete your profile to unlock AI matching" card with a deep link.

### B. Trending now — real signal

- Replace `is_featured`-only with a ranked list: `score = 3*applies_7d + 1*saves_7d + 0.5*views_7d`, fall back to `is_featured` if window is empty.
- Add `job_views` table (job_id, talent_id, viewed_at), bumped from `/app/jobs/:id` open. RLS: insert by self only; aggregation via SECURITY DEFINER RPC `get_trending_jobs(limit_n)` so views aren't exposed.
- Section label: "Trending this week" with 🔥 + `+X applies` chip.

### C. Personalized "For You" rail

- New section between AI matches and Trending: **"Open in your field"** — `jobs.profession_category_id == talent.profession_category_id`, active + future deadline, max 5. No AI cost, no credit charge.
- Fallback: **"Open in {country}"** if profession not set.
- Hide the section entirely if neither is known.

### D. Smart Browse-by-type grid

- Re-order categories by count of currently-open jobs in the user's country, descending. Hide categories with 0 open roles.
- Show live count badge on each tile.

### E. Cold-start polish

- New-user empty state at top of Browse: profile-completion checklist card (title, 2 missing fields, CTA). Auto-hides at `profile_completeness >= 70`.
- Skeletons match new section ordering.

### F. Connection points (don't break)

- `Show more` → `/app/jobs/all?type=…` — kept.
- `JobCard.matchInfo` prop — kept.
- Trending and "For You" pass `matchInfo` only when a real score exists.
- Tools tab "AI job matches" tile keeps calling the same handler — kept (will now charge 10 credits cleanly).
- `useSavedItems`, `useCredits`, `useTalent` — kept.

---

## Acceptance criteria

- No "FREE" wording anywhere on the Browse tab. The AI matches section shows a single `10 credits` chip.
- Tapping "Get AI job matches" with < 10 credits opens the credit top-up sheet; with ≥ 10 it deducts and runs.
- A talent with empty profile sees the profile-completion card instead of the AI button.
- A talent with a profession set sees an "Open in your field" rail.
- "Trending this week" reflects real applies + saves + views from last 7 days.
- AI matches show "Updated Xh ago" + a why-chip per card; "Tune" pill opens the prefs sheet and a save triggers a fresh fetch.
- Inactive / expired jobs never appear in the recommendations list.
- Browse-by-type tiles show live counts in user's country and hide empty categories.

---

## Technical details

### Removed
- `FREE_AI_MATCHES_LIMIT` const, `aiMatchUsageCount` query, the `isFreeRun` branch and the `freemium_usage` insert in `JobsHub.tsx`.
- (Optional cleanup, can defer) the `freemium_usage` enum value in `credit_transactions.transaction_type` — leave for now since old rows exist.

### New tables / RPCs

```text
job_views:
  id, job_id, talent_id, viewed_at
  index (job_id, viewed_at)
  RLS: insert own only; no select for talents

get_trending_jobs(limit_n int)        SECURITY DEFINER, search_path=public
get_jobs_in_field(_talent_id uuid, _limit int)
count_jobs_by_type(_country text)
```

### Edge function tweaks

- `suggest-jobs-for-talent`: delete-then-insert `ai_job_recommendations` for the talent (no stale accumulation); skip jobs with `is_active=false OR deadline < now()` at write time.

### Frontend files touched

- `src/pages/app/JobsHub.tsx` — restructure Browse tab, drop freemium logic, add Tune pill, Updated stamp, profile gate, "For You" rail, smart category grid.
- `src/components/jobs/JobCard.tsx` — add slim `whyChip?: string` slot under title (compact variant).
- `src/components/jobs/ProfileCompletenessGate.tsx` *(new)* — checklist card.
- `src/components/jobs/JobPreferencesSheet.tsx` — add `onSaved` callback to refetch recs.
- `src/hooks/useTrendingJobs.ts` *(new)*
- `src/hooks/useJobsInField.ts` *(new)*
- `src/pages/app/AppJobDetail.tsx` — fire-and-forget insert into `job_views` on mount (gated by auth).

### Out of scope for 3.1

- Companies, Locations, Tools tabs.
- Job detail page layout, related jobs, score-me.
- Apply flow (internal vs email vs link, CV picker, AI cover letter).
- Employer-side anything.

---

## Sequencing

Single approval cycle, merge order:
1. Migrations (`job_views`, RPCs).
2. Edge function update (`suggest-jobs-for-talent`).
3. Frontend hooks.
4. `JobsHub.tsx` Browse tab restructure + freemium removal + new components.
5. `AppJobDetail.tsx` view-tracking insert.

After this ships and we measure (target: AI-match CTR up, Browse-tab → detail-page conversion improves), we move to the **Companies tab plan**.