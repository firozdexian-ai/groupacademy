# B4 — Jobs + Gigs + Career Abroad Jargon Cleanup (DONE)

Replaced ~60 user-visible jargon strings across Jobs, Gigs, Career Abroad, IELTS, Competitions, Connections, Career Coach, Career Assessment, Mock Interview, and Cohort Discussions. Anomaly/Telemetry/Pipeline/Ingress/Synthesis/Handshake/Ledger/Matrix/Vector/Node phrasing removed from talent surfaces in scope. Internal console.error logs normalized to `[jobs]` / `[gigs]` / `[abroad]` / `[career-coach]` / `[mock-interview]` / `[app]` prefixes.

Next: **B5** — Agents + Wallet + Player + shared components (~50 hits).

---

# B4 — Jobs + Gigs + Career Abroad Jargon Cleanup

Sweep the remaining talent-facing jargon out of the Jobs, Gigs, Competitions, Career services and Abroad surfaces, using the same plain-English voice locked in by B3/B3.1.

## Scope (talent surfaces only)

**Jobs (~14 hits)**
- `src/pages/app/AppJobApplication.tsx` (4)
- `src/domains/jobs/components/AIJobInsights.tsx` (6 — L209, L355, plus 4 T2)
- `src/domains/jobs/components/ExternalApplicationPrep.tsx` (2)
- `src/pages/app/AppOfferDecision.tsx` (1)
- `src/pages/app/AppProfessionDetail.tsx` (2)
- `src/pages/app/AppApplicationDetail.tsx` (1)

**Gigs (~17 hits)**
- `src/pages/app/Gigs.tsx` (6)
- `src/pages/app/NewGigWizard.tsx` (3)
- `src/pages/app/GigDisputes.tsx` (1)
- `src/domains/gigs/components/talent/JobPostingGigForm.tsx` (4)
- `src/domains/gigs/components/talent/VerificationVerdictCard.tsx` (1)
- `src/domains/gigs/components/talent/MySubmissions.tsx` (1)
- `src/domains/gigs/components/talent/JobSharingGigForm.tsx` (1)
- `src/domains/gigs/components/talent/CVUploadGigForm.tsx` (1)
- `src/domains/gigs/components/talent/GigSubmissionForm.tsx` (1)

**Career Abroad + IELTS (~10 hits)**
- `src/pages/app/StudyAbroad.tsx`, `StudyAbroadDetail.tsx`, `StudyAbroadRoadmap.tsx`, `StudyAbroadRoadmapResults.tsx`, `SchoolDetail.tsx`, `AbroadApplications.tsx` (1 each, mostly `Digital Workforce Anomaly` logger)
- `src/domains/abroad/components/talent/RoadmapBuilderSheet.tsx`, `RoadmapTimeline.tsx`, `RoadmapIntakeForm.tsx` (1 each)
- `src/pages/app/IELTSPrep.tsx` (1), `IELTSMockRunner.tsx` (2)

**Career services + misc talent pages (~17 hits)**
- `src/pages/app/CareerCoach.tsx` (3)
- `src/pages/app/AppCareerAssessment.tsx` (7 — progress messages)
- `src/pages/app/AppMockInterviewSetup.tsx` (2)
- `src/pages/app/Competitions.tsx` (2), `CompetitionDetail.tsx` (3)
- `src/pages/app/Connections.tsx` (3)
- `src/pages/app/TalentDirectory.tsx` (1), `SavedItems.tsx` (1), `ReviewerCockpit.tsx` (1)
- `src/pages/app/AppCohortDiscussions.tsx` (1)

Estimated **~58 user-visible strings across ~33 files**.

## Replacement voice

Same rules as B3:
- Drop "Digital Workforce", "Anomaly", "Telemetry", "Pipeline", "Ingress", "Synthesis", "Handshake", "Ledger", "Matrix", "Vector", "Node" from user-visible strings.
- Keep internal console.* prefixes short and neutral (e.g. `[jobs]`, `[gigs]`, `[abroad]`).
- Toast titles describe outcomes plainly: "Application sent", "Couldn't load categories", "Saved", "Refund failed".
- Buttons/CTAs use verbs ("Apply", "Submit", "Enroll for N credits", "Take screenshot upload").
- Placeholders are realistic examples, not sci-fi labels.

## Process

1. Edit files in 4 parallel batches by domain (Jobs → Gigs → Abroad → Career/misc).
2. After each batch, spot-read affected files for stray jargon nearby and clean if cheap.
3. Re-run the jargon sweep script that produced `.lovable/v0.5-jargon-hits.md`; expect Jobs/Gigs/Abroad sections to be empty or down to noise (acronym false positives).
4. Update `.lovable/plan.md`: mark B4 done, leave **B5** (Agents + Wallet + Player + shared components, ~50 hits) as next.

## Out of scope

- Admin / Gro10x / instructor staff routes
- Player components (`src/components/player/**`), Footer, retry cards, certificate/report/salary PDF templates, assessment lead form, portfolio builder — these ship in **B5** alongside Agents + Wallet.
- Any logic, styling, or schema changes.
