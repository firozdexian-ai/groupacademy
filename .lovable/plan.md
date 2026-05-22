# Plan: Finish repo boundary refactor (Phases 10j.5k11 → 5k18)

## Verified starting state

- **73 files** outside `repo/`, `api/`, `integrations/` still call `supabase.from(...)` directly
- **101 files** still import `@/integrations/supabase/client` (some legitimately for `.channel()` realtime / `.auth` / `.storage` — those stay)
- Bulk of remaining work lives in **`src/pages/`** (was out of scope for 5k1–5k10, which targeted `src/domains/`)

## Goal

Drive direct `.from(` calls outside the repo/api layer to **0**, leaving only legitimate `supabase` client usage (realtime channels, auth, storage uploads).

## Batch breakdown (~10 files each)

### 5k11 — Public + auth-adjacent pages (10 files)
PublicBlog, PublicBlogPost, VerifyCertificate, VerifySkillCredential, PortfolioStatus, Index, ReportCard, SalaryAnalysisResults, app/Blog, app/BlogPost
→ helpers in `marketingRepo`, `learningRepo`, `profileRepo`

### 5k12 — Abroad + Career pages (10 files)
app/AbroadHub, app/AbroadApplications, app/StudyAbroad, app/CareerCoach, app/IELTSPrep, app/IELTSCoach, app/IELTSResults, app/AppMockInterviewSetup, app/ProfileBuilder, app/AppSalaryAnalysisSetup
→ `abroadRepo`, new `careerRepo` helpers

### 5k13 — Jobs + Applications pages (~10 files)
app/AppJobDetail, app/JobAssessment, app/JobAssessmentResults, app/AppApplicationDetail, app/AppOfferDecision, app/Marketplace, app/MyGigs, app/Gigs, app/AppProfessionDetail, app/AppSessionJoin
→ `jobsRepo`, `gigsRepo`

### 5k14 — Agents + Course + Misc pages (~10 files)
app/AIAgents, app/AgentMarketplace, app/AgentChat, app/AppCourseDetail, app/PostDetail, app/LanguageInstructorsPage, AdminLiveInbox, AdminMessagingInbox, admin/WorkforceFleet, layouts/TalentAppShell
→ `agentsRepo`, `learningRepo`, `messagingRepo`, `workforceRepo`

### 5k15 — Sweep remaining pages + components (~10 files)
Whatever's left in `src/pages/` + stray `src/components/` files

### 5k16 — Hooks audit (~10 files)
`src/hooks/*` files still doing direct `.from(` (useCredits, useTalent, useInterviews, useOffers, useSavedItems, etc.)

### 5k17 — Gro10x shell (~10 files)
`src/gro10x/pages/*` and `src/gro10x/hooks/*`

### 5k18 — Final sweep + verification
- Run full repo scan → expect **0** `.from(` outside repo/api
- Keep documented exceptions (realtime, auth, storage) in `.lovable/plan.md`
- Update CI-ready grep guard pattern

## Per-batch protocol (unchanged)

1. Identify ~10 files with direct `.from(`
2. Add typed helpers to the appropriate domain repo
3. Replace inline queries with helper calls
4. Remove `supabase` client import where no longer needed (keep if `.channel/.auth/.storage` remain)
5. Update `.lovable/plan.md` with: files migrated, helpers added, before→after count
6. Report **verified count** (multi-line `rg -U 'supabase\s*\n?\s*\.from\('`)

## Honest expectations

- ~8 batches × ~2 min each = **finishes refactor**, no user-visible change
- Then we pivot to publication readiness (auth, payments live mode, SEO, smoke tests, monitoring)
- I will report accurate counts each turn (no domain-only undercount)

Reply **continue 10j.5k11** to start.
