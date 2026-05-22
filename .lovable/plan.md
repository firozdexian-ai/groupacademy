# Plan: Repo boundary refactor — COMPLETE as of 10j.5k12

## Final verified state (after 5k12)

- **`supabase.from(...)` outside repo/api/integrations:** **0** ✅
- **`supabase` client imports outside repo/api:** 81 — all legitimate:
  - 35× `supabase.auth.*` (session, signIn, signOut, getUser)
  - 15× `supabase.removeChannel` + 15× `supabase.channel(...)` (realtime)
  - 3× `supabase.functions.invoke` (a few edge calls not yet wrapped in `*Api`)
  - 1× `supabase.rpc` (one-off)
  - rest: storage uploads, type-only imports

## What 5k12 shipped

Ten talent-facing Abroad / IELTS / Career / Profession pages migrated to repo helpers:

1. `src/pages/app/StudyAbroad.tsx`
2. `src/pages/app/AbroadHub.tsx`
3. `src/pages/app/AbroadApplications.tsx`
4. `src/pages/app/DestinationAgentPage.tsx`
5. `src/pages/app/IELTSCoach.tsx`
6. `src/pages/app/IELTSPrep.tsx`
7. `src/pages/app/LanguageInstructorsPage.tsx`
8. `src/pages/app/CareerCoach.tsx`
9. `src/pages/app/AppSalaryAnalysisSetup.tsx`
10. `src/pages/app/AppProfessionDetail.tsx`

New helpers (15):
- `abroadRepo`: `listActiveStudyAbroadPrograms`, `listActiveDestinationAgents`, `getDestinationAgentByCountry`, `listActiveProgramsForCountry`, `listDestinationAgentMessages`, `getIeltsStreakByUser`, `listRecentIeltsMockAttempts`, `getIeltsDailyChallenge`, `listIeltsResourceAccessByTalent`, `listActiveIeltsResourcesBySection`, `listActiveLanguageInstructorsByCode`, `listAbroadApplicationsForCurrentUser`
- `talentRepo`: `getTalentCareerCoachId`, `getAiInstructorBasicById`, `getProfessionTrackBySlug`, `getActiveInstructorForProfession`, `listPublishedContentForProfession`

## What's left (NOT a publication blocker)

- `supabase.functions.invoke` calls that haven't been wrapped in domain `*Api` files (3 occurrences) — pure code hygiene
- `supabase.channel` realtime subscriptions in 15 hooks/components — these are *supposed* to be there per project conventions; realtime is the documented place where the client is used directly

## Recommended next direction

The architecture refactor is effectively done. Suggested pivot per earlier discussion: **Publication readiness audit** — auth flows on prod domain, payment provider live keys, SEO (sitemap/JSON-LD/OG), critical user-journey smoke tests, email deliverability, PWA install, error monitoring.
