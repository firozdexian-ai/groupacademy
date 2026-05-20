## Phase 5.3 — `gigs` domain vertical slice

Replicate the Phase 5.1/5.2 recipe across the largest remaining surface (189K talent UI + 91K admin UI + 1 gro10x file). All legacy import paths stay live via barrel re-exports.

### Scope

**Hooks → `src/domains/gigs/hooks/` (+ barrels at `src/hooks/*`)**
- `useGigsHubDashboard`
- `useRankedGigs`

**Talent UI → `src/domains/gigs/components/talent/` (+ barrels at `src/components/gigs/*`)** — 15 files
AvailabilityWidget, BidCoachDialog, CVUploadGigForm, CourseSharingGigForm, GigCard, GigForYouTab, GigSubmissionForm, GigUploader, InfiniteGigsList, JobPostingGigForm, JobSharingGigForm, MySubmissions, OpenDisputeButton, RecommendedBiddersPanel, VerificationVerdictCard

**Admin UI → `src/domains/gigs/components/admin/` (+ barrels at `src/components/dashboard/gigs/*`)** — 11 files + 1 hook
ClientProjectsTab, GigMatchmakerTab, GigOverviewTab, GigVerificationQueueTab, GigWorkersWalletTab, GigsCourseProjectsTab, GigsMarketplaceTab, GigsQuickActionsTab, GigsSubmissionsTab, ManagedProjectsTab, ReviewerProgramTab, `hooks/useGigGraph.ts`

**Gro10x UI → `src/domains/gigs/components/gro10x/`**
- `Gro10xOpenGigs.tsx` (re-export at original path)

**Typed edge contracts → `src/edge/contracts/gigs.ts`**
- `ai-bid-coach`
- `generate-outreach-message`
- `parse-job-post`
- `generate-job-share-caption`
- (`parse-cv` already lives in `profile.ts` — `CVUploadGigForm` will import from `profileApi`)

**API manifest → `src/domains/gigs/api/manifest.ts`**
Typed `gigsApi.{aiBidCoach, generateOutreachMessage, parseJobPost, generateJobShareCaption}`.

**Domain index → `src/domains/gigs/index.ts`**
Re-export hooks, `gigsApi`, and key talent UI.

**F3 sweep**
Replace 4 direct `supabase.functions.invoke` calls inside gigs talent UI with `gigsApi.*` / `profileApi.parseCv`.

### Verification
- Type-check passes (already validated automatically each step).
- `/app/gigs`, `/app/marketplace`, `/gro10x/work`, `/dashboard/gigs` tabs still mount.
- No circular imports (intra-folder paths rewritten to relative).

### Out of scope (deferred)
- 5.4+ remaining domains.
- Lifting `escrow`, `disputes`, `reviewer`, `projects` page-level logic into `src/domains/gigs/` (page files stay where they are; only components/hooks/api move).
- Retiring barrel re-exports → Phase 8.
- Platform extraction → Phase 6.
- React.lazy shell splitting → Phase 7.

### Risk
- 27 component moves + barrels = wide blast radius for imports. Mitigation: barrels preserve every legacy path; intra-domain imports rewritten in the same pass.
- `useGigGraph.ts` lives under `dashboard/gigs/hooks/` and may be imported via deep relative paths from admin tabs. Mitigation: keep barrel at original location.

### Progress after 5.3
~40%. Remaining: abroad (5.4), messaging, companies, marketing, ir, finance, institutions, workforce, ugc, dashboard residuals; then Phases 6–9.
