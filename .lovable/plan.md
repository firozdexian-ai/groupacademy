# Next Phase Plan — finish the Supabase boundary seam

We just landed **10j.5h9**. Every `supabase.rpc(...)` call outside `src/domains/*/repo/` and `src/edge/contracts/` is now gone. Time to close out the remaining two boundary phases and lock the rule with a lint check.

## Where we stand

| Surface | Outside-allowed callsites | Status |
|---|---|---|
| `supabase.rpc(...)` | 0 in pages/hooks/components | ✅ Done (10j.5h1–h9) |
| `supabase.storage.*` | ~24 callsites across 19 files | ⏳ Next (10j.5i) |
| `supabase.auth.*` | ~70 callsites across ~30 files | ⏳ After (10j.5j) |
| Direct `@/integrations/supabase/client` imports | 280 files | Will collapse as 5i + 5j land |

There is one small loose end before storage: 3 legacy `api/manifest.ts` + `learningApi.ts` files still contain raw `rpc()` plumbing. Those should be either moved to the matching repo or deleted if the manifest export is unused.

## Phase 10j.5h-final — clean up the manifest stragglers (1 small batch)

Audit the 3 remaining files:

- `src/domains/learning/api/learningApi.ts` (1 rpc)
- `src/domains/learning/api/manifest.ts` (1 rpc)
- `src/domains/feed/api/manifest.ts` (3 rpcs)

For each: if the export is referenced, move the wrapper into the domain repo and update imports. If unreferenced, delete. Goal: zero `supabase.rpc(` outside `repo/` and `edge/contracts/`.

## Phase 10j.5i — Storage consolidation (1 batch, ~24 callsites)

Add bucket-scoped helpers to the owning domain repo. One helper per operation, named `<verb><Bucket>` so the bucket is obvious at the call site.

```text
profile/      uploadProfilePhoto, uploadCoverImage, uploadIdentityDoc,
              getProfilePhotoPublicUrl, createIdentityDocSignedUrl
talent/       uploadTalentCv (signed-only), createTalentCvSignedUrl,
              uploadBatchTalents
jobs/         uploadJobLogo, uploadJobAttachment, getJobAssetPublicUrl
gigs/         uploadGigSubmission, uploadGigCv, uploadGigJobPosting
finance/      uploadPaymentProof, createPaymentProofSignedUrl
ugc/          uploadPortfolioFile, getPortfolioPublicUrl
learning/     uploadModuleResource (used by src/lib/moduleResourceUpload.ts)
ir/           uploadIrDoc, createIrDocSignedUrl
```

Rules enforced by the helpers (not by every caller):

- `talent-cvs` returns **only** signed URLs (matches security memory).
- Each upload helper returns `{ path, publicUrl }` or `{ path, signedUrl, expiresAt }`, never the raw supabase response.
- Public buckets get a single `getXPublicUrl(path)` wrapper so we never re-derive URLs by hand.

Touched callsites: `ProfilePhotoUpload`, `CoverImageUpload`, `IdentityDocsUpload`, `MultiFileUpload`, `InlineCVUpload`, `CVUploadStep`, `BatchTalentUpload`, `JobFormDialog`, `AddExternalApplicationDialog`, `JobsManagerLegacyTab`, `GigUploader`, `CVUploadGigForm`, `JobPostingGigForm`, `InvoicesTab`, `ImageUpload`, `SalaryAnalysisSetup`, `ProfileEdit`, `Gigs.tsx`, `moduleResourceUpload.ts`, `useGro10xAuthChat.ts`.

Estimate: one focused batch (`10j.5i1`).

## Phase 10j.5j — Auth boundary (2 small batches)

`useAuth` already wraps `signIn`, `signUp`, `signOut`, `onAuthStateChange`. The leakage is mostly `getUser()` / `getSession()` sprinkled into components and helpers.

**5j1 — Components & pages (~50 callsites).** Replace inline `supabase.auth.getUser()` with `user` / `session` from `useAuth()`. Targets include `ProtectedRoute`, `AuthGate`, `Navbar`, `TalentAppShell`, `ResetPassword`, `Gro10xSignIn`, `WebinarLanding`, `ProjectRoom`, `CourseDetail`, `OnboardingWizard`, `AdminSidebar`, etc.

**5j2 — Non-React helpers (~20 callsites).** Create `src/lib/auth.ts` with:

```ts
export async function getCurrentUser(): Promise<User | null>
export async function getCurrentSession(): Promise<Session | null>
export async function getAccessToken(): Promise<string | null>
```

Migrate `useToolRuns`, `useFollowedCompanies`, `useApplicationMessages`, `useTalentLists`, `useAgentRuntimeThread`, `BatchTalentUpload`, repo files that still call `supabase.auth.*` (`ugcRepo`, `irRepo`), and any edge-wrapper plumbing.

Leave `useAuth.ts`, the sign-in pages, and `AuthCallback` untouched — they are the legitimate auth surface.

## Phase 10j.5k — Lint the boundary

Once 5h-final + 5i + 5j are done, add a `no-restricted-imports` ESLint rule:

```js
"no-restricted-imports": ["error", {
  patterns: [{
    group: ["@/integrations/supabase/client"],
    message: "Import from the domain repo or src/lib/auth instead.",
  }],
}]
```

With per-file overrides for:

- `src/domains/*/repo/**`
- `src/hooks/useAuth.ts`
- `src/lib/auth.ts`
- `src/integrations/supabase/**`
- `src/edge/**` (edge contract wrappers)

A single `bun run lint` then guarantees the seam stays clean as the codebase evolves.

## Suggested execution order

```text
1. 10j.5h-final    manifest cleanup            (1 micro-batch)
2. 10j.5i1         storage helpers             (1 batch, ~24 sites)
3. 10j.5j1         component auth migration    (1 batch, ~50 sites)
4. 10j.5j2         lib/auth.ts + helper sites  (1 batch, ~20 sites)
5. 10j.5k          eslint boundary rule        (1 small change)
```

Total ≈ 5 sub-batches to fully close the architecture refactor. After 10j.5k, the rule "only repos + auth talk to Supabase" is enforced mechanically, and we have a clean seam to later swap in server actions or edge-only data access without touching feature code.

## Acceptance criteria (unchanged from earlier plan)

- Outside `src/domains/*/repo/`, `src/hooks/useAuth.ts`, `src/lib/auth.ts`, `src/edge/**`, and `src/integrations/supabase/**`, **no file imports the supabase client**.
- `rg -l "@/integrations/supabase/client" src | rg -v <allowed>` returns zero.
- `bun run lint` passes the new boundary rule.
- No behavior changes — pure structural refactor.

Reply **"start 10j.5h-final"** (or jump to **"start 10j.5i1"** if you'd rather skip the manifest cleanup for now) and I'll proceed batch by batch.

## Phase 10j.5h-final + 10j.5i (partial) — done this turn

✅ **10j.5h-final**: feed manifest stragglers migrated into `feedRepo` (`getFeedEngagement`, `hypeContent`, `tipComment`); deleted `src/domains/feed/api/manifest.ts` and its barrel re-export. Updated `useFeedEngagement`, `useHype`, `CommentList`. Zero `supabase.rpc(` outside repos.

✅ **10j.5i — storage helpers added** to:
- `profileRepo`: `uploadPortfolioFile`, `getPortfolioPublicUrl`, `uploadToBucketPublic`, `getBucketPublicUrl`, `uploadIdentityDoc`, `createIdentityDocSignedUrl`, `removeFromBucket`
- `jobsRepo`: `uploadJobAsset`, `getJobAssetPublicUrl`, `uploadTalentCv`, `createTalentCvSignedUrl`
- `gigsRepo`: `uploadGigSubmission`, `getGigSubmissionPublicUrl`, `removeGigSubmissions`
- `financeRepo`: `uploadPaymentProof`, `createPaymentProofSignedUrl`
- `learningRepo`: `uploadModuleResource`
- `talentRepo`: `uploadLegacyCv`

✅ **Callsites migrated (10/19)**:
- `ProfilePhotoUpload`, `CoverImageUpload`, `IdentityDocsUpload`
- `MultiFileUpload`, `ImageUpload`, `InlineCVUpload`, `CVUploadStep`
- `ProfileEdit`, `SalaryAnalysisSetup`
- `GigUploader`, `CVUploadGigForm`, `JobPostingGigForm`
- `JobsManagerLegacyTab`, `JobFormDialog`

⏳ **Remaining 10j.5i1 callsites (5)**:
- `src/domains/jobs/components/admin/hub/AddExternalApplicationDialog.tsx` — `talent-cvs` → use `uploadTalentCv` + `createTalentCvSignedUrl`
- `src/pages/app/Gigs.tsx` — `gig-submissions` getPublicUrl → use `getGigSubmissionPublicUrl`
- `src/domains/finance/components/admin/InvoicesTab.tsx` — `payment-proofs` upload → use `uploadPaymentProof`
- `src/lib/moduleResourceUpload.ts` — convert to call `uploadModuleResource`
- `src/gro10x/hooks/useGro10xAuthChat.ts` — `cvs` bucket → use `uploadLegacyCv`

Then move to **10j.5j1** (component auth migration) and **10j.5j2** (lib/auth helpers), then **10j.5k** lint rule.

Say **"continue 10j.5i1"** to finish the storage migration.
