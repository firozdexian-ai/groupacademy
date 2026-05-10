# Create `useAbroadGraph.ts` — central data hook for Career Abroad

## What I'll do
Create **`src/hooks/useAbroadGraph.ts`** with a master React Query that fans out to all 6 Abroad tables in parallel, plus generic upsert/delete mutation factories that invalidate the master key on success — mirroring the `useJobsGraph` / `useLearningGraph` pattern.

## Schema-alignment fixes (required)
The provided spec assumes columns that don't exist in our DB. I'll keep the **public interface and exported names identical** to the spec, but map each `select(...)` to the real columns and alias them so the returned objects still expose `status / title / name / score / etc.` Same approach we used for Learning.

| Spec field | Actual column | Mapping |
|---|---|---|
| `abroad_applications.status` | `stage` | `select("id, talent_user_id, program_id, stage, created_at")` then map `status: row.stage` |
| `study_abroad_programs.title` | `program_name` | alias to `title` |
| `study_abroad_programs.institution_id` | `university_name` (no FK) | expose as `institution_id` (string) |
| `study_abroad_programs.status` | `is_active` (boolean) | `status: is_active ? 'active' : 'inactive'` |
| `destination_agents.name` | `display_name` | alias |
| `destination_agents.country` | `country_code` | alias |
| `destination_agents.status` | `is_active` | derive |
| `ielts_mock_attempts.score` | `ai_band_score` | alias |
| `ielts_mock_attempts.status` | derived from `ai_band_score is not null` | `'scored'` / `'pending'` |
| `ielts_resources.resource_type` | `content_type` | alias |
| `ielts_resources.status` | `is_active` | derive |
| `study_abroad_roadmaps.destination` | `target_country` (likely; will confirm at write-time) | alias |

The mutation factories will write back to the **real** column names (so `upsertApplication({ stage })`), but external consumers can keep reading `application.status` etc.

## Files touched
- **Create**: `src/hooks/useAbroadGraph.ts`

No UI components, no DB migrations, no other files modified. Final step: run `bunx tsc --noEmit` to confirm zero errors.

## Note
Following the same precedent set for Learning (where I aligned `Cohort.title → name`, `start_date → starts_on`, etc.), this keeps the hook's TypeScript interface stable for downstream tabs while matching what Postgres actually has.
