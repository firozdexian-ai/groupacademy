## Phase 10j.5k7 — Repository Boundary Hardening (Batch 7)

Continue migrating direct `supabase` client imports in non-repo files to domain repository helpers. Target ~10 files in the IR, Messaging, Learning, and Profile domains.

### Target files (hooks + components only — repos stay as-is)

1. `src/domains/profile/hooks/useTalentPitches.ts`
2. `src/domains/ir/components/admin/EmailComposer.tsx`
3. `src/domains/ir/components/admin/hooks/useIRPipeline.ts`
4. `src/domains/ir/components/admin/InvestorDetailSheet.tsx`
5. `src/domains/ir/components/admin/economics/CohortRetentionCard.tsx`
6. `src/domains/messaging/hooks/useMessageThreads.ts`
7. `src/domains/messaging/hooks/useDirectMessages.ts`
8. `src/domains/messaging/components/admin/MessagingChannelsTab.tsx`
9. `src/domains/learning/hooks/useResourceProgress.ts`
10. `src/domains/learning/hooks/useProgress.ts`
11. `src/domains/learning/hooks/useOrgLearning.ts`
12. `src/domains/profile/components/talent/ProfileEditDialog.tsx`

### Approach
- Add new helper functions to: `irRepo.ts`, `messagingRepo.ts`, `learningRepo.ts`, `profileRepo.ts`
- Replace `supabase.from(...)` calls in the above files with repo helper calls
- Keep behavior, error handling, and types identical
- No schema or RLS changes

### Outcome
- ~12 files removed from the direct-client import list (168 → ~156)
- Repo layer expanded across 4 domains
- No UI or business-logic changes

Say **approve** to switch to build mode, or request adjustments to the file list.