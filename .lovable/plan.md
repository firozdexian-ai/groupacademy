## Phase 10j.5k8 — Repository Boundary Hardening (Batch 8) ✅

Migrated 8 files in Finance, Gigs, and Talent domains from direct `supabase.from()` chains to repo helpers. Note: earlier batches (5k5–5k7) used a single-line grep that missed multi-line `.from()` chains, so the real remaining count was higher than reported. Accurate counter is now in place.

### Added repo helpers
- `financeRepo.getTalentCreditBalance(talentId)`
- `financeRepo.listTalentCreditTransactions(talentId, limit)`
- `financeRepo.listMyCreditInvoices(talentId, limit)`
- `financeRepo.getTalentServiceHistorySnapshot(talentId)` (parallel: assessments + interviews + salary analyses)
- `financeRepo.listAdminWithdrawalRequests()`
- `financeRepo.updatePlatformSettingByKey(key, value)`
- `gigsRepo.listRecommendedGigBidders(gigId, gigKind, limit)`
- `talentRepo.insertBatchUpload(payload)`

### Refactored files
- `domains/finance/hooks/useCredits.ts` — wallet balance + tx history via repo
- `domains/finance/components/talent/ServiceHistoryCard.tsx` — single repo call replaces 3 parallel `.from()`s
- `domains/finance/components/talent/MyInvoicesList.tsx`
- `domains/finance/components/admin/WithdrawalsTab.tsx`
- `domains/finance/components/admin/PaymentSettingsTab.tsx` — settings read + per-key update
- `domains/gigs/components/talent/RecommendedBiddersPanel.tsx`
- `domains/gigs/components/talent/JobPostingGigForm.tsx` — uses existing `insertGigSubmission`
- `domains/talent/components/admin/BatchTalentUpload.tsx` — both insert paths via `talentRepo.insertBatchUpload`

### Boundary metric
- Files with direct `.from()` outside repos/api: **101 → 93** (–8)
- All 8 files now have zero `supabase` client imports.

Say **continue 10j.5k9** to run the next batch (~10 files, recommend admin-side gigs/learning/jobs UI clusters).

## Phase 10j.5k9 — Repository Boundary Hardening (Batch 9) ✅

Migrated 10 files in Agents, Jobs, Marketing, Gigs, Learning, and Feed domains from direct `supabase.from()` chains to repo helpers.

### Added repo helpers
- `agentsRepo.listAdminAgentBasics()`
- `agentsRepo.listAgentsByMarketplaceStatus(status, opts)`
- `agentsRepo.listAllAgentsOrdered()`
- `agentsRepo.listAgentChatSessionKeys(limit)`
- `agentsRepo.listRecentAgentOutreachAdmin(limit)`
- `agentsRepo.countAgentOutreachDedupeSince(sinceIso)`
- `agentsRepo.countPlatformEventsSince(sinceIso)`
- `jobsRepo.listPendingJobSubmissions()`
- `jobsRepo.listRelatedJobsByCompany/ByLocation/Featured`
- `marketingRepo.listSalaryAnalysisLeads()`
- `learningRepo.listActiveTalentEnrollmentsWithModules`
- `learningRepo.countCompletedEnrollments`
- `learningRepo.listRecentLearningActivity`
- `feedRepo.insertPollVote`

### Refactored files
- `domains/agents/hooks/admin/useAdminAgents.ts`
- `domains/agents/components/dashboard/AgentMarketplaceTab.tsx`
- `domains/agents/components/dashboard/AgentsRegistryTab.tsx`
- `domains/agents/components/dashboard/AgentOutreachTab.tsx`
- `domains/jobs/components/admin/hub/PendingJobSubmissions.tsx`
- `domains/marketing/components/admin/leads/SalaryAnalysisLeadsManager.tsx`
- `domains/gigs/components/talent/CVUploadGigForm.tsx` — reuses `insertGigSubmission`
- `domains/jobs/components/RelatedJobs.tsx`
- `domains/learning/hooks/useLearningStats.ts`
- `domains/feed/hooks/usePollVoting.ts`

### Boundary metric
- Files with direct `.from()` outside repos/api: **93 → 83** (–10)
- All 10 refactored files now have zero `supabase` client imports.

Say **continue 10j.5k10** to run the next batch.

## Phase 10j.5k10 — Repo migration batch (10 files)

- Added helpers: `feedRepo.listTopHypedPostsWeek`, `listPostComments`, `insertPostComment`;
  `gigsRepo.getTalentAvailability`, `upsertTalentAvailability`, `listMyOpenMarketplaceGigs`, `listShareableActiveContent`;
  `financeRepo.listAdminCreditInvoices`;
  `learningRepo.getCertificateMinimalByEnrollment`, `insertCertificate`, `getCertificateFullByEnrollment`, `listCohortsByContent`, `getCohortDetail`, `listCohortSessions`, `listCourseModulesByContent`, `listStudentResourceProgressFull`, `listModuleResourceIdsByStage`, `upsertStudentResourceProgress`, `markEnrollmentCompleted`;
  `agentsRepo.listTalentAgentChatSessionKeys`, `listTopActiveAgentsForQuickActions`.
- Refactored: TopHypedWidget, QuickActionsGrid, CommentList (kept realtime channel), AvailabilityWidget, Gro10xOpenGigs, CourseSharingGigForm, InvoicesTab, useCertificate, useCohorts, useCourseProgress.
- Boundary: 83 → 72 files with direct `.from(` (10 files migrated; 1 retains supabase only for realtime).
