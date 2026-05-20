# Phase 9h — Cross-domain edge function migration + ESLint guard

## Status: 🟡 IN PROGRESS — infrastructure complete, call-site migration pending

### ✅ Done this turn (additive, no behavior change)

**Contracts** (Zod schemas + Request interfaces, all `.passthrough()`):
- `src/edge/contracts/agents.ts` — added `companyAgentTools`, `triggerAgentPitch`
- `src/edge/contracts/jobs.ts` — added `sendJobApplication`, `generateInterviewQuestions`, `analyzeMockInterview`, `analyzeJobAssessment`, `generateJobAssessment`, `generateApplicationAnswers`, `enhanceCoverLetter`
- `src/edge/contracts/gigs.ts` — added `adminGigOps`, `aiReviewerBrief`, `aiProjectScoper`, `aiGigVerifier`, `aiGigScoper`, `aiGigPublicSummary`, `ogImageRender`
- `src/edge/contracts/talent.ts` — added `unlockTalentContact`, `analyzeSalary`, `analyzeCareerAssessment`
- `src/edge/contracts/messaging.ts` — added `messagingSend`, `messagingGroupManager`, `sendTransactionalEmail`, `telegramDiagnostic`, `handleEmailUnsubscribe`
- `src/edge/contracts/finance.ts` — added `requestInstructorPayout`
- `src/edge/contracts/companies.ts` — new: `signupCompany`, `checkCompanyAccount`
- `src/edge/contracts/ugc.ts` — new: `adminContentAi`

**Wrappers** (canonical pattern: invoke → throw `EdgeFunctionError` → `parseEdgeResponse`):
- `src/domains/agents/api/agentsApi.ts` — `+companyAgentTools`, `+triggerAgentPitch`
- `src/domains/jobs/api/jobsApi.ts` — `+sendJobApplication`, `+generateInterviewQuestions`, `+analyzeMockInterview`, `+analyzeJobAssessment`, `+generateJobAssessment`, `+generateApplicationAnswers` (accepts `{accessToken}` option for ApplicationHelper), `+enhanceCoverLetter`
- `src/domains/gigs/api/gigsApi.ts` — `+adminGigOps`, `+aiReviewerBrief`, `+aiProjectScoper`, `+aiGigVerifier`, `+aiGigScoper`, `+aiGigPublicSummary`, `+ogImageRender`
- `src/domains/talent/api/talentApi.ts` — `+unlockTalentContact`, `+analyzeSalary`, `+analyzeCareerAssessment`
- `src/domains/messaging/api/messagingApi.ts` — `+messagingSend`, `+messagingGroupManager`, `+sendTransactionalEmail`, `+telegramDiagnostic`, `+handleEmailUnsubscribe`
- `src/domains/finance/api/financeApi.ts` — `+requestInstructorPayout`
- `src/domains/companies/api/companiesApi.ts` — new file: `signupCompany`, `checkCompanyAccount`
- `src/domains/ugc/api/ugcApi.ts` — new file: `adminContentAi`

**Barrels**:
- `src/domains/companies/api/manifest.ts` + `index.ts` — converted from `companiesApi` const to named re-exports
- `src/domains/ugc/api/manifest.ts` + `index.ts` — converted from `ugcApi` const to named re-exports

`tsc` is clean.

### ⏳ Remaining (next turn)

**Call-site migration** — ~57 raw invokes across ~50 files. All wrappers ready, mechanical replace by owner-domain batch:

- **Batch A — agents (15):** `AdminMessagingInbox`, `useGro10xAuthChat`, `Gro10xSourcing`, `Gro10xShortlist`, `Gro10xFeed` (×4), `Gro10xJobsList`, `OnboardingWizard`, `CreatorOnboardingDialog`, `Withdrawals`, `Unsubscribe`, `Transactions`, `TalentPublicProfile`, `TalentMirror`, `TalentHome`, `TalentDirectory`, `ServicesHub`, `SavedItems`
- **Batch B — jobs (18):** `useOffers` (×3), `useInterviews` (×2), `CVUploadStep`, `InlineCVUpload`, `ProfileEdit`, `useGro10xAuthChat` (parse-cv), `MockInterviewSetup`, `MockInterviewQuestions`, `MockInterviewCapture`, `AppMockInterviewSetup`, `AppJobApplication` (×3: enhance-cover-letter, send-job-application, generate-job-assessment), `JobAssessment`, `JobAssessmentResults`, `ApplicationHelper`, `Profile` (enhance-cover-letter), `AppJobDetail` (score-job-match)
- **Batch C — gigs (8):** `NewGigWizard`, `ProjectRoom`, `ReviewerCockpit` (×2), `Gro10xProjects`, `ProjectPublicToggle` (×2 — og-image-render + ai-gig-public-summary), `gigAutoReview.ts`
- **Batch D — talent (4):** `useTalentUnlocks`, `SalaryAnalysisProcessing`, `AssessmentResults`, `AppCareerAssessment`
- **Batch E — messaging (6):** `AdminMessagingInbox` (messaging-send), `CompanyWhatsAppGroupCard`, `emailNotifications.ts`, `WorkforceCommandCenter` (telegram-diagnostic), `Unsubscribe` (×2 handle-email-unsubscribe)
- **Batch F — companies + ugc (3):** `Gro10xSignIn` (check-company-account), `useGro10xAuthChat` (×2: check-company-account + signup-company), `contentAI.ts`
- **Batch G — finance (1):** `InstructorEarnings` (request-instructor-payout)

**ESLint guard** — `no-restricted-syntax` banning `supabase.functions.invoke` outside `src/domains/*/api/*Api.ts` (and one documented SSE exception `AIChatPanel.tsx`).

**Docs**:
- `src/edge/README.md` — add Phase 9h ownership rows
- `.lovable/known-edge-contract-drift.md` — note any wire-shape adaptations from `{data,error}` → throw

**Verification**:
- `tsc` clean
- `bunx eslint src` clean
- `rg "supabase\.functions\.invoke" src` returns only domain wrapper files + `AIChatPanel.tsx`

### Notes for next turn

- Two functions surfaced during inspection that weren't in the original plan: `generate-job-assessment` (jobs) and `check-company-account` (companies). Contracts + wrappers shipped this turn.
- `request-instructor-payout` placed in **finance** (not learning) to keep payouts/withdrawals colocated.
- All wrappers throw on failure. Migration must wrap legacy `{data,error}` destructuring patterns in `try/catch` where the caller previously branched on `error`.
