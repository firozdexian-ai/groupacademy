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
