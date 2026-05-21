## Phase 10e — Profile Domain Repo Extraction

Phase 10d closed out the Talent admin surface. The Profile domain still has scattered raw `supabase.from(...)` calls and several legacy `src/hooks/useTalent*.ts` files that re-export from `domains/profile/hooks/`. This phase cleans both.

### Goals
1. Add `src/domains/profile/repo/profileRepo.ts` as the only `supabase.from(...)` caller in the domain.
2. Refactor all profile hooks + talent components to go through it.
3. Retire the stray `src/hooks/useTalent*.ts` re-export shims by repointing imports to the domain entry.

### Scope

**New repo — `src/domains/profile/repo/profileRepo.ts`** with typed helpers grouped by surface:
- **Profile settings** (`usePublicProfileSettings`) — `getPublicProfileSettings`, `upsertPublicProfileSettings`
- **Talent lists & relationships** (`useTalentLists`, `useTalentRelationships`) — `listTalentLists`, `createTalentList`, `addTalentToList`, `listTalentRelationships`, `upsertTalentRelationship`
- **Outbound pitches** (`useTalentPitches`) — `listAgentPitchLog` (keep the realtime channel in the hook)
- **Uploads & docs** (`IdentityDocsUpload`, `PayoutAccountsManager`, `ProfilePhotoUpload`, `CoverImageUpload`, `CVUploadSection`) — `listIdentityDocs`, `insertIdentityDoc`, `deleteIdentityDoc`, `listPayoutAccounts`, `upsertPayoutAccount`, `updateTalentMedia` (photo/cover/cv URL fields)

Storage `supabase.storage.from(...)` calls stay in the components — repo only owns table I/O.

**Hooks already in `domains/profile/hooks/`** — rewrite the 5 with raw `from()` to use the repo. The 2 already-clean hooks (`useTalentMirror`, `useTalentOutcomeSignal`, `useTalentSearch`) get a quick audit, no behavioural change.

**Legacy shims to remove** in `src/hooks/`:
- `useTalentLists.ts`, `useTalentMirror.ts`, `useTalentRelationships.ts`, `useTalentSearch.ts`, `useTalentOutcomeSignal.ts`, `useTalentPitches.ts`, `usePublicProfileSettings.ts`

`useTalent.ts` stays — it re-exports the `TalentContext`, not a data hook.

**Codemod**: sed-pass across `src/**` rewriting `@/hooks/useTalentLists` → `@/domains/profile/hooks/useTalentLists` (and the other 6). Same pattern used in 10c/10d.

### Out of scope
- `TalentContext.tsx` — context layer, separate cleanup phase.
- Storage bucket access patterns.
- ESLint `NO_RAW_FROM` rule — Phase 10j.

### Execution
1. Scaffold `src/domains/profile/repo/profileRepo.ts`.
2. Rewrite 5 hooks + 5 upload components to call repo helpers.
3. Codemod imports; delete 7 shim files in `src/hooks/`.
4. Update `src/domains/profile/index.ts` exports if needed.
5. Verify: `rg "supabase\.from" src/domains/profile/ src/hooks/useTalent* src/hooks/usePublicProfileSettings*` returns only `profileRepo.ts`; `tsc --noEmit` clean.
6. Smoke: Talent profile edit (photo, cover, CV, identity docs, payout), public profile settings, talent lists, pitch feed realtime.

### After 10e
- **10f** — Companies domain repo.
- **10g** — Gigs/Jobs final sweep (already partially done).
- **10j** — ESLint `NO_RAW_FROM` rule to lock cleaned domains.

Reply to approve and I'll start with the repo scaffold.

---

## Phase 10e Status — Done

Completed:
- `src/domains/profile/repo/profileRepo.ts` scaffolded with helpers for public-profile settings, talent lists/members, talent relationships, agent pitch log, identity documents, and payout accounts.
- Refactored 5 raw-`from()` call sites: `usePublicProfileSettings`, `useTalentLists`, `useTalentRelationships`, `useTalentPitches`, `IdentityDocsUpload`, `PayoutAccountsManager`.
- Codemod swept all `@/hooks/useTalent*` + `@/hooks/usePublicProfileSettings` imports to `@/domains/profile/hooks/*`.
- Deleted 7 legacy shim files in `src/hooks/` (kept `useTalent.ts` — context re-export).
- Verification: `rg "supabase\.from" src/domains/profile/` returns only `profileRepo.ts`; `tsc --noEmit` clean.

Next: **10f** Companies domain.
