## Sub-phase 3.4 — Mastery-driven Job Matching

Wire verified skill mastery + credentials from Phase 2/3 into the job matching pipeline so jobs surface and rank by what the talent has actually demonstrated, not just self-declared skills.

### Goal
Jobs Hub recommendations and per-job match scores reflect:
- Verified skill mastery (from `talent_skill_profile`)
- Issued `skill_credentials` (foundational/proficient/expert)
- Scenario evidence (Phase 3.1 signals)

…in addition to existing self-declared skills/CV.

---

### Scope

a. **Mastery-aware match scoring (RPC)**
   - New `score_talent_job_mastery(_talent_id, _job_id)` RPC returning:
     - `mastery_score` (0–100): weighted overlap between job's required topics and talent's mastery.
     - `verified_skills`: list of credentials matching job tags.
     - `gap_topics`: required topics where talent mastery < 0.7.
   - Uses simple keyword/tag mapping between `jobs.requirements + preferred_skills` and `topics.name` / credential `topic_code`.

b. **Upgrade `score-job-match` edge function**
   - Inject the RPC's mastery snapshot into the AI system prompt as authoritative "verified evidence."
   - Returned JSON gains `verified_match: { credentials: [...], mastery_topics: [...], gap_topics: [...] }`.
   - Persist `verified_match` alongside existing match payload.

c. **Upgrade `suggest-jobs-for-talent`**
   - Pre-rank candidate jobs by `mastery_score` before the existing keyword/location pass.
   - Boost: `final_score = base_score * (1 + 0.4 * mastery_score/100) + credential_bonus`.
   - Tag each suggestion with `match_reason` ∈ { `verified_skill`, `keyword`, `location_only` }.

d. **UI: Verified-match badges on job cards**
   - `JobCard.tsx`: when `verified_match.credentials.length > 0`, show a green "Verified skill match" chip with tooltip listing the credentials.
   - `AIJobInsights.tsx` / job detail panel: new "Why you match" section listing verified topics + gap topics with a "Practice this topic" link to Talent Mirror.

e. **Jobs Hub recommendation strip**
   - New "Matches your verified skills" rail at the top of Jobs Hub for talents who have ≥1 credential — pulls from `suggest-jobs-for-talent` filtered to `match_reason = verified_skill`.
   - Empty state: nudge to finish a course / take a scenario.

f. **Telemetry hook (lightweight)**
   - Log `verified_match_shown` and `verified_match_clicked` events into existing analytics table for 3.8 trend lines.

---

### Data flow

```text
talent_skill_profile ──┐
skill_credentials   ───┼─► score_talent_job_mastery(RPC)
job tags/skills     ───┘            │
                                    ▼
              suggest-jobs-for-talent ──► ranked feed (Jobs Hub rail)
                                    │
                                    ▼
              score-job-match ──► AI insight + verified_match payload ──► JobCard / AIJobInsights
```

---

### Out of scope (deferred)
- Embeddings/semantic skill mapping (keyword/tag mapping is sufficient for v1).
- Employer-side "verified candidates only" filter (Phase 4).
- Recruiter notifications when a credentialed talent matches a posted job (Phase 4).

---

### Files to create / edit

**New**
- `supabase/migrations/...` — `score_talent_job_mastery` RPC + index on credentials.
- `src/components/jobs/VerifiedMatchBadge.tsx`
- `src/components/jobs/WhyYouMatchPanel.tsx`
- `src/hooks/useVerifiedJobMatch.ts`
- `mem://product/mastery-driven-job-matching`

**Edit**
- `supabase/functions/score-job-match/index.ts` — call RPC, augment prompt + response.
- `supabase/functions/suggest-jobs-for-talent/index.ts` — mastery pre-rank + match_reason.
- `src/components/jobs/JobCard.tsx` — render badge.
- `src/components/jobs/AIJobInsights.tsx` — render WhyYouMatch section.
- `src/pages/app/JobsHub.tsx` — add verified rail.
- `src/integrations/supabase/types.ts` (auto)
- `.lovable/plan.md`, `mem://index.md`

---

### Approval options
- **continue with 3.4** — ship a–f together (recommended).
- **continue with 3.4.a+b+c** — backend + scoring only; UI rails/badges in a follow-up.
---

## 3.4 ship notes

- DB: `score_talent_job_mastery(_talent_id, _job_id)` SECURITY DEFINER returns mastery_score (coverage 70 + credential bonus 30, cap 100), mastery_topics, gap_topics, verified_credentials by tag-matching job requirements/preferred_skills against `talent_skill_profile` and `skill_credentials`.
- `ai_job_recommendations` extended with `match_reason` ('verified_skill' | 'keyword' | 'location_only') + `verified_match` jsonb snapshot.
- Edge `score-job-match` injects mastery snapshot into AI prompt as authoritative evidence; returns `verified_match` payload.
- Edge `suggest-jobs-for-talent` pre-ranks by mastery_score, boosts `final = base*(1+0.4*m/100)+5*credentials`, tags match_reason, persists top 12 to `ai_job_recommendations`.
- UI: `<VerifiedMatchBadge>` (compact + full) on JobCard, `<WhyYouMatchPanel>` in AIJobInsights, JobsHub recs render passes verified_match through matchInfo.
- Phase 3 progress: ~50% (4 of 8).

**Up next:** 3.6 Authoring Feedback Loop. Reply **continue with 3.6**.
