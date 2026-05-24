# GroUp Academy — Launch Audit
Target launch: **Dec 1, 2026**. Severity: **P0** = blocks launch · **P1** = fix before launch · **P2** = nice-to-have / post-launch.

Test account policy: real admin = `gro10xnow@gmail.com`. All synthetic test accounts use `*@gro10x.com`.

---

## A1 — Auth Surface · 2026-05-22

### Method
Static read of: `src/hooks/useAuth.ts`, `src/hooks/useAccountType.ts`, `src/lib/postAuthRoute.ts`, `src/pages/AuthClassic.tsx`, `src/pages/AuthChat.tsx`, `src/pages/AuthCallback.tsx`, `src/pages/ResetPassword.tsx`, `src/pages/Start.tsx`, `src/components/ProtectedRoute.tsx`, `src/components/auth/GoogleSignInButton.tsx`, `src/layouts/TalentAppShell.tsx`, `src/App.tsx` (routes).
Live: opened `/auth` while logged in as admin → correctly bounced to `/dashboard`. Confirmed session persistence + admin RBAC routing.
Backend: `auth.users` row, `user_roles`, `talents` row for admin.

### Findings

#### P0 — none.

#### P1 (fix before launch)

1. **ProtectedRoute.tsx:128-143** — `requireAnyAdminRole` only accepts `['admin','talent_exec']` but `useAccountType.ts:10` ADMIN_ROLES includes `super_admin`, `staff`, `content_lead`. A `super_admin` / `staff` / `content_lead` user is routed to admin shell by `useAccountType` then **kicked back to `/app/learning`** by ProtectedRoute. → unify the role list in one constant.
2. **ProtectedRoute.tsx:129,138** — User-facing toasts read `"Security Level Error: Administrative clearance verification tokens missing from user account."` Replace with `"You don't have access to this area."`. Same for fault labels `"NEURAL_IDENTITY_FAULT_REJECTED"` / `"CONNECTION_LATENCY_THRESHOLD_EXCEEDED"` shown at line 167-170 → friendly copy.
3. **useAuth.ts:204-208 vs TalentAppShell.tsx:184-187** — Two divergent logout paths: `useAuth.signOut` navigates to `/`, `TalentAppShell.handleSignOut` calls `supabase.auth.signOut()` directly and navigates to `/auth`. Shell logout skips the toast and the `scope:"local"` flag. → call `useAuth().signOut()` from the shell.
4. **ResetPassword.tsx:99** — After password update, hard-redirects to `/app/feed`. If the user is an admin or company, they land in the wrong shell. → use `resolvePostAuthRoute(accountType, ...)`.
5. **AuthChat.tsx (default `/auth`)** — does **not** read the `?tab=signup` query param the way AuthClassic.tsx:43,84 does. Marketing links like `/auth?tab=signup` open in login mode in the chat UI. → either honor `tab` or document that signup is via chat flow.
6. **useAuth.ts:55** — Error mapping for `"email not confirmed"` returns `"Your account is being activated — please try again in a moment."` but signup flow assumes auto-confirm. If auto-confirm is ever toggled off in Cloud, this message gives no actionable guidance. → say `"Please confirm your email — check your inbox for the link."`.
7. **GoogleSignInButton.tsx:24-41** — `focus` listener unconditionally resets `loading` after 1200ms, even mid-redirect. On slow networks the OAuth popup may still be open while the button re-enables, allowing a double-click. → guard with `document.visibilityState !== 'visible'` OR cancel only if no redirect has happened.

#### P2

8. **AuthClassic.tsx:412+ truncated** — verify "Try the chat experience" link target — points back to `/auth?…` which **is** AuthChat (the default). Fine, but confusing because the Classic page is reached via `/auth/classic`.
9. **Start.tsx:42** — `returnTo` is hard-coded to `/app/feed`. Company/admin signups via `/start` always get talent default. Not a real flow today (Start is talent-only) but worth a comment.
10. **talents row for admin (`f182e1…`)** — `country_code = "BD"` not `"+880"`. Inconsistent with new signup writes (`useAuth.ts:159`). Likely legacy migration. Decide on canonical value (`+880`) and backfill.
11. **PWA manifest 401 in preview** — `/manifest.json` returns 401 in the Lovable preview iframe (token-gated). Verify it serves 200 publicly on https://groupacademy.online and https://groupacademy.lovable.app before launch. File exists at `public/manifest.json`.
12. **auth.audit_log_entries empty for last 3d** — confirm Cloud is retaining auth audit logs; we'll need them for post-launch incident response.

#### OK (verified)
- Listener-before-getSession ordering in `useAuth.ts:74-108` ✓
- `SIGNED_OUT` / `TOKEN_REFRESHED` null-session wipe ✓
- `resolvePostAuthRoute` returns `null` while account type is `unknown`, preventing flicker ✓
- AuthCallback OAuth-new-user retry (600 ms) at `AuthCallback.tsx:27-31` ✓
- `/reset-password` checks `PASSWORD_RECOVERY` event AND `type=recovery` hash before allowing update; rejects bare sessions ✓
- `signUp` writes correct `user_metadata` (full_name, phone, country, country_code, account_type, referral_code) ✓
- `talents` row + `user_roles` (admin, super_admin, content_lead) exist for admin ✓
- Live session persisted across navigation to `/auth` → bounced to `/dashboard` correctly ✓
- `signUp` rejects passwords < 8 chars client-side at `AuthClassic.tsx:102-105` ✓
- Duplicate phone check at `AuthClassic.tsx:110-116` switches to login mode ✓

### Totals
0 P0 · 7 P1 · 5 P2 · 10 OK

### Recommended A1-FIX bundle (small, low-risk)
- Centralize `ADMIN_ROLES` constant (fix #1)
- Friendly RBAC + fault copy in ProtectedRoute (#2)
- Shell logout uses `useAuth().signOut()` (#3)
- ResetPassword uses `resolvePostAuthRoute` (#4)
- AuthChat honors `?tab=signup` OR add explicit chat-signup affordance (#5)
- Friendly "email not confirmed" copy (#6)
- GoogleSignInButton focus-reset guard (#7)

Time to fix: ~45 min. No DB migrations. Recommend rolling these into A-FIX after A2 finishes so we batch UI touches.

---

## A1-FIX shipped — 2026-05-22
- ✅ #1 Unified `ADMIN_ROLES` constant in `src/lib/adminRoles.ts`; imported in `useAccountType.ts` and `ProtectedRoute.tsx`
- ✅ #2 Friendly RBAC + fault copy in `ProtectedRoute.tsx`
- ✅ #3 `TalentAppShell` logout now calls `useAuth().signOut()`
- ✅ #4 `ResetPassword` routes via `resolvePostAuthRoute(accountType)`
- ✅ #5 `AuthChat` redirects `?tab=signup|login` to `/auth/classic` (which honors the tab)
- ✅ #6 Friendlier "email not confirmed" copy in `useAuth.ts`
- ✅ #7 `GoogleSignInButton` focus-reset guarded by `visibilityState` + `redirectPendingRef`

Carry-over P2s tracked: country_code backfill, manifest preview 401, auth audit retention.

---

## A3 Talent Profile — shipped 2026-05-22
- ✅ `ProfileEdit.tsx` rewritten: hydrates from `talent` on mount; renders all fields (about, basics, school, links, skills, experience, education, languages, achievements); CV upload + auto-parse; unsaved-changes confirm on Cancel; humanized copy; removed hardcoded `+880`/`BD`
- ✅ `Profile.tsx` rebuilt: full read view (about, experience, education, skills, languages, achievements) with empty-state CTAs, contact strip (country/email/phone/LinkedIn/portfolio), AI rewrite dialog wired, humanized copy
- ✅ `ProfileVerify.tsx` copy humanized (header, status labels, step CTAs)
- ✅ `ProfileBuilder.tsx` copy/error path humanized; renamed `reportAnomalyToAdmin` → `logChatError`
- ✅ `TalentPublicProfile.tsx` dropped broken `adminSupportAssistant` call (known edge contract drift); friendly error copy
- ✅ Replaced `reportAnomaly` no-ops in Profile + ProfileEdit with `trackError` from `src/lib/errorTracking.ts`

---

## A2 Onboarding — shipped 2026-05-22
- ✅ Dead code purge: deleted `WelcomeBonus`, `ServicesTour`, `GoalStep`, `CVUploadStep`, `ProfessionStep`, `useOnboarding` (~2k LOC)
- ✅ `OnboardingWizard.tsx` rewritten with plain-English step copy (no more "Initialize Trajectory Index" / "Determine Base Geographical Region")
- ✅ `PhoneCaptureStep.tsx` rewritten: no hardcoded `+880`/`BD` defaults; respects user country
- ✅ `PhoneCaptureModal.tsx` created — uncloseable dialog gate for talents with completed onboarding but no phone
- ✅ `App.tsx` `OnboardingGuard`: `needsPhone = !!talent && !!talent.onboardingCompletedAt && !talent.phone` → renders `<PhoneCaptureModal>` until phone captured
- ✅ `Start.tsx` returning users routed via `resolvePostAuthRoute(accountType, returnTo)` instead of hardcoded `/app/feed`

---

## A4 Talent Landing (Feed + Home + Shell) — shipped 2026-05-22
- ✅ `TalentHome.tsx` (`/app/me`) rewritten:
  - Dropped broken `adminSupportAssistant` calls; replaced with `trackError`
  - Humanized copy: "outreach nodes" → "messages from employers"; "mastery nodes synchronized" → "skills verified"; "You are LIVE on Gro10x" → "You're live on Gro10x"; "Hidden from employers" → "Not yet visible to employers"; "Profile Pinned for 24h." → "Your profile is pinned to the top for 24 hours."; "Boost operational fault." → "Couldn't boost your profile — please try again."
- ✅ Feed components copy pass (user-visible only):
  - `HypeBoostSheet`: "Ledger settlement delayed…" → friendly
  - `FloatingWhatsAppButton`: "Financing nodes are busy…" → friendly
  - `PostCard`: saved-items error, report toast, `aria-label="More operational options"` → "More options"
  - `PersonalizedPromptCard`: "Insufficient credit balance…", "Initializing transactional ledger settlement…", "Ledger connection timeout…" → friendly
  - `ComposePost`: `aria-label="Append tag node"` → "Add tag"; telemetry event `ComposePost:active_editor_session_initialized` → `feed_compose_opened`
  - `CommentList`: "Sign in required to transfer credit bundles" / "Transferred N credits successfully" → "Sign in to tip credits" / "Tipped N credits."
- ✅ `TalentAppShell.tsx`: scrubbed "Institutional Navigation Artifacts" / "Real-Time_Notification_Orchestration" / `fetchInstitutionalAlerts` → `fetchNotificationCount`
- Landing decision: keep `/app` → `/app/feed`; bottom-nav "Home" → `/app/feed` (unchanged). `/app/me` reachable via header avatar/profile menu. Considered adding a dedicated "Me" tab but bottom nav is already at 5 items (Home/Jobs/Learn/Gigs/AI Agents) — defer to A4.5 if needed.

Carry-over (P2, deferred): scrub internal jargon in feed code comments (`Phase Z0`, `Digital Workforce`, `Automated Efficiency`) — not user-facing, no functional impact. Track for a comment-only cleanup pass before launch.


---

## A4 Closeout — shipped 2026-05-22 (re-audit gaps)
Re-audit revealed 3 gaps that have now been closed:
- ✅ **G1 — `/app/me` wired into shell:** added "My Dashboard" item with `Home` icon to the profile dropdown in `TalentAppShell.tsx` (above "Settings & Privacy"). `TalentHome` is now reachable in 2 taps from any talent surface.
- ✅ **G2 — `QuickActionsGrid` mounted:** previously orphaned (zero imports). Now rendered on `TalentHome` between the readiness card and pitches block — matches `mem://ux/dynamic-personalized-quick-actions-grid` intent. Also scrubbed jargon JSDoc/comments in the component itself ("Phase Z0", "Automated Efficiency").
- ✅ **G3 — `FloatingWhatsAppButton` error string:** replaced `"Credit wallet ledger mutation failed to settle cleanly."` with `"Couldn't apply the welcome credit bonus. Please try again."`

A4 is now complete. Carry-over (P2, deferred to pre-launch sweep): ~30 feed files still contain non-user-visible jargon in code comments and `console.error` strings. Zero user impact, low value to fix now, high merge-conflict risk against ongoing phase work.

Ready for **A5 — Jobs Hub**.

---

## A5.1 Jobs Hub — Browse tab + Shell — shipped 2026-05-22
**P0 fix:** `/app/jobs` was rendering 4 empty "coming soon" stubs. Every talent tapping the Jobs bottom-nav landed on a blank page despite all data plumbing existing.

- ✅ `BrowseView.tsx` (3-line stub → full implementation):
  - Authenticated: `ProfileCompletenessGate` → Trending strip → In-your-field strip → Type-count chips → `<InfiniteJobsList>` recommended list
  - Unauthenticated: Trending public strip + "Sign in" CTA → `/auth?returnTo=/app/jobs`
  - Horizontal snap-scrolling strips (mobile-first, vertical layout maintained)
- ✅ `JobsHubHeader.tsx` (8 lines → full header): title + subtitle + "View all" link + search box deep-linking to `/app/jobs/all?q=…` + preferences-sheet trigger (`JobPreferencesSheet`, previously unmounted)
- ✅ `InfiniteJobsList.tsx` user-visible copy:
  - Empty: "Complete your professional profile configuration tracks to unlock matched employment fields." → "No matching jobs yet. Complete your profile to unlock personalized matches."
  - Loading more: "Compiling subsequent timeline updates…" → "Loading more jobs…"
  - End-of-list: "Platform Career Stream Fully Synchronized" → "You're all caught up"
- ✅ `ProfileCompletenessGate.tsx` user-visible copy:
  - "Unlock Predictive AI Matching" → "Complete your profile for better matches"
  - "Fully customized profiles radically accelerate candidate recommendation scores." → "Filling the rest helps us recommend stronger job matches."
- ✅ Auth gate: `/app/jobs` continues redirecting via `OnboardingGuard`; unauthenticated `BrowseView` fallback sends to `/auth?returnTo=/app/jobs`.

Decisions logged:
- Strips: horizontal snap-scroll (top 6 each) above vertical infinite list — matches mobile-first design system.
- `/app/jobs/all` kept intact; reachable from header "View all" + Browse "View all" link. Deferred merge to A5.7.
- ProfileCompletenessGate threshold kept at the existing 60% (matches A4 readiness floor).

Carry-over (P2, deferred to pre-launch sweep): JSDoc/comment jargon in `useJobsHubDashboard`, `useRankedJobs`, `JobCard`, `InfiniteJobsList` ("Phase Z0 Hardened", "Digital Workforce", "CTO Reference", "HUD: EXECUTING_…"). Zero user impact.

Next: **A5.2 — Companies & Locations tabs** (replace remaining 2 stubs).

---

## A5.2 — shipped

Replaced both remaining "coming soon" stubs (`CompaniesView`, `LocationsView`) with real implementations using existing card components and the dashboard RPC payload.

**Wired up:**
- `CompaniesView` — top 24 employers in a responsive 2-col grid, follow heart, click → `/app/jobs/all?company=...`, friendly empty state.
- `LocationsView` — countries grid with user's country pinned + "Your country" badge; city chips deep-link to `/app/jobs/all?city=...`.
- New `useFollowedCompanies` + `useToggleFollowCompany` hooks on the `followed_companies` table — optimistic, auth-gated, toast feedback, cache invalidation.
- Patched `CompanyDetailSheet` to the new query+mutation API (was importing a non-existent shape — pre-existing latent bug fixed).

**Humanized copy:**
- `CompanyCard` aria-labels: "Track ecosystem career updates from X" → "Follow X".
- `CountryCard`: "Local Context" badge → "Your country"; city aria-labels and company tooltips de-jargoned.
- Headers in `useCompaniesWithSignal`, `useCountriesWithSignal`, `useJobsHubDashboard` stripped of "Digital Workforce / Phase Z0 Hardened / REGISTRY_SYNC_FAULT / CTO Reference" noise. Errors now rethrow unchanged.

Next: **A5.3 — Tools tab** (consolidated AI tools hub + tool_runs ledger).

---

## A1 + A2 Re-audit — shipped 2026-05-22

Closed gaps surfaced by a second pass over auth + onboarding.

**A1**
- ✅ `useAuth.signUp` no longer hardcodes `country: "BD"` / `country_code: "+880"`. Defaults to empty strings; onboarding + PhoneCaptureStep set them from real selection.
- ✅ Welcome email duplicate removed — `AuthCallback` is now the single sender (covers email + OAuth signups).
- ✅ `useAuth.signOut` unified destination → `/auth` for everyone (was `/`, which dropped admins/companies on marketing).
- ✅ `useAuth.resetPassword` neutralized — no longer leaks account existence; toast: "If that email is registered, we've sent a reset link."
- ✅ New `src/lib/safeReturnTo.ts` validates `?returnTo=` to a same-origin path (`/...`, not `//evil.com`). Wired into `AuthChat`, `AuthClassic`, `AuthCallback`, `Start`.
- ✅ `AuthChat` completion CTA now routes via `resolvePostAuthRoute(accountType, returnTo)` instead of hardcoded `/app/feed`.
- ✅ `AuthCallback` retries OAuth `accountType` lookup up to 3× (1.8s budget) instead of one-shot.
- ✅ `AccountUpgradeModal` rewritten — copy is now "Finish setting up your account" / "We need a couple more details to personalize your experience." Removed all "Infrastructure Upgrade", "deep learning core infrastructure pipelines", "MIGRATION_TERMINAL", "Phase Z0", "CTO Reference" jargon. Added a corner "Sign out" escape hatch.

**A2**
- ✅ `PhoneCaptureModal` adds a corner "Sign out" link so users blocked at this gate aren't permanently locked out.
- ✅ `OnboardingWizard` header adds a "Sign out" link (hidden when `preAuth`) so empty lookup data isn't a dead end.
- ✅ `PhoneCaptureStep` copy drops the false "verification codes" promise (no OTP is sent). New copy: "We'll use this so employers can reach you about jobs."
- ✅ Telemetry events renamed to plain English: `onboarding_institution_node_selected` → `onboarding_institution_selected`; `onboarding_phone_country_code_altered` → `onboarding_phone_country_changed`; `onboarding_phone_duplicate_intercepted` → `onboarding_phone_duplicate`; `onboarding_wizard_preauth_stashed` → `onboarding_preauth_stashed`.
- ✅ `OnboardingWizard` JSDoc + section comments scrubbed ("Phase Z0 Hardened", "Multi-Stage Personalization", "Ingress", "HUD HEADER COVER BAR METRIC PLOTS ROW", "ENFORCING_IMMUTABLE_ONBOARDING_GATEWAY_LOCK" all gone).
- ✅ `App.OnboardingGuard.needsUpgrade` tightened to `!careerStageId` only. Freeform-institution users (legitimately `institution_id = null`) no longer re-trigger the upgrade gate.

Carry-overs / deferred:
- P1 #13 Company onboarding wizard — out of scope, tracked for A9/Companies group.
- P2 #10 AuthClassic "Try the chat experience instead" CTA label, #16 verbose submit error, #17 done as part of P1.
- Long-standing carry-overs unchanged: `country_code = "BD"` admin backfill, manifest preview 401, auth audit log retention check.

---

## A5.3 — Tools tab (Consolidated AI Tools Hub) — shipped 2026-05-22

Replaced the `ToolsView` "coming soon" stub with the full consolidated hub described in `mem://product/consolidated-ai-tools-hub`.

**Wired up:**
- `ToolsView.tsx` rewritten: Up-Next recommendation card (powered by `useNextBestTool`), 7-tool responsive grid (CV, Application answers, Score me vs job, Career assessment, Mock interview, Salary analysis, Portfolio builder), Recent activity list (last 5 `tool_runs` with humanized labels + relative dates).
- 4 new routes under `/app/tools/*`: `assessment`, `mock-interview`, `salary-analysis`, `portfolio` — all reuse the existing `App*` setup pages. Existing `/app/services/*` routes kept for backward compatibility.
- "Score me vs job" tile opens the `ScoreMeJobPicker` sheet → routes to `/app/jobs/:id?score=1` → auto-triggers `AIJobInsights` scoring on `AppJobDetail`.
- `useNextBestTool` reason codes mapped to plain-English copy (no_cv / low_completeness / saved_recent / saved_unscored / no_assessment_recent / no_salary_recent / default).

**Humanized copy:**
- `ScoreMeJobPicker`: sheet title "Analyze Profile Matching Alignment" → "Score me vs a job"; description "occupational tracking target node…ledger debit" → "Pick a saved or recent job…Costs 10 credits per score"; search placeholder, empty state, error toast, "Ecosystem Organization" → "Company", "Staged Path" → "Saved" all rewritten.
- `AppJobDetail`: "Synthetic alignment compatibility calculations complete." → "Match score ready."; "The system intelligence core failed to interpret parameters." → "Couldn't score this job right now."; "Secure registration route parameter copied to system buffer." → "Link copied."; "Record Unassigned / targeted career tracking row" → "Job not found / This job may have been removed".
- `useToolRuns`, `useNextBestTool`: removed "Digital Workforce / Phase Z1 / CTO Reference / HUD" jargon from JSDoc + console errors. Auth error string "Authentication session required." → "Please sign in first." Also added `next-best-tool` invalidation on successful tool-run record so Up Next updates immediately.

Next: A5.4 onward per launch audit.

---

## A5.4 — Job Detail Refinement — shipped 2026-05-22

Polished both job detail surfaces (`/app/jobs/:id` and public `/jobs/:id`) to match the A5.1–A5.3 quality bar. Pure UI/copy work — no DB, RPC, or business-logic changes.

**`src/pages/app/AppJobDetail.tsx` — full rewrite (830 → ~470 lines):**
- Removed all "HUD LEVEL 1..9", "Phase Z1 Integration Stability Locked", "Reconciled AI Competability Alignment Strip" comments.
- Renamed internals: `compileDeadlineMetadata` → `getDeadlineMeta`, `compileSalaryCurrencyLabel` → `formatSalaryRange`, `jobRecordState` → `job`, `unverifiedJobIdentifierStr` → `jobId`, etc.
- User-visible copy fixes:
  - "Evaluate Synthetic Capability Alignment" → "See why you match"
  - "Excellent Capability Fit / Sufficient Profile Parity / Minimal Alignment Overlap" → "Strong match / Decent match / Light match"
  - "Quantum Cost: 10 Credits · Unlocks structural gap analysis manifests" → "10 credits · gap analysis + tailored learning suggestions"
  - "Verify Match" → "Score me"
  - "Deconstruct Rationale Breakdown" → "See full reasoning"
  - "LOCALITY: Distributed Node Framework" → plain `MapPin · location` (or "Remote")
  - "FEATURED RUN" → "Featured"
  - "Confirm & Proceed to Application / Vetting Closed / Resume Active AI Assessment Task / Inspect Existing Submission Dossier" — all replaced by the new `<JobApplyCTA>` with "Apply now / Resume assessment / View application / Closed".
  - "AI Interview Telemetry Action Required / dynamic skill mapping exam sequence" → "Finish your AI interview / Complete the short skill assessment".
  - "Role Core Specification Description" → "About this role"; "Decompress Full Narrative Record" → "Read more"; "Core Technical Competency Requirements" → "Requirements"; "Secondary Preferred Differentiator Vectors" → "Nice to have"; "TRANSMISSION TIMELINE SIGNED" → "Posted {ago}".
  - "REGISTRY ROW STATE: APPLIED" → "Applied · {status}".
- Toasts: "Failed to compile profile record mapping index" → "Couldn't load this job"; "Deduction layer rejected. Evaluation requires 10 active credits" → "You need 10 credits to score this match"; "Transaction blocked. Additional balance volume required: 5 Credits" handled inside `JobApplyCTA`/`ExternalApplicationPrep` now.

**New `src/domains/jobs/components/JobApplyCTA.tsx`:**
- Single unified apply CTA. Branches once on `application_type` (`in_app | link | email`), `existingApplication`, `deadlinePassed`, and `authMode` (`in-app | public`).
- Public mode → "Sign in to apply" with `safeReturnTo(/app/jobs/:id/apply)` deep-link.
- Email mode → primary `mailto:` button + secondary copy-email icon.
- Link mode → opens `ExternalApplicationPrep` sheet.
- Already-applied → "View application" / "Resume assessment".
- Used in both the sticky bar of `AppJobDetail` and the public `PublicJobDetail` sticky bar.

**`WhyYouMatchPanel` wired into `AppJobDetail`:**
- `score-job-match` response includes `verified_match`; stored on `liveScore` state and rendered via existing `<WhyYouMatchPanel verifiedMatch={...} />` below the match-score card.
- Panel header text humanized: "Ecosystem Match Reasoning" → "Why you match", "Verified Trajectory Credentials" → "Verified credentials", "Demonstrated Knowledge Vectors" → "Skills you've shown", "Strategic Skill Revision Gaps" → "Skills to practice", "Calibrate and reconcile gap markers" → "Practice these skills". "Phase Z0 Hardened" header comment removed.

**`PublicJobDetail.tsx`:**
- Sticky apply button replaced with `<JobApplyCTA authMode="public" />` (still routes through auth, but uses the unified CTA so future updates propagate to both surfaces).
- Job interface extended to include `application_type`, `application_url`, `application_email`, `ai_assessment_enabled` (already returned by `getPublicActiveJobById('*')`).
- Sign-in banner + RelatedJobs + JSON-LD JobPosting + dynamic title/meta — already in place from Phase 3.5; unchanged.

**`AppJobApplication.tsx` jargon scrub:**
- `SUBMISSION_STAGES` messages: "Syncing Repository Nodes / Hardening CV Telemetry Node / Generating AI Interview Matrix / Finalizing Registry Handshake" → "Saving your application / Uploading your CV / Preparing AI interview / Almost done".
- "Initialize Vetting AI Interview" → "Start AI interview".
- "Synthetic context narrative successfully parsed and written" → "Cover letter generated".
- "HUD LEVEL 1..5" comments → plain section labels.
- "Phase Z1 Cryptographic Gate Locked" header removed.

**`ExternalApplicationPrep.tsx` jargon scrub:**
- "Phase Z0 Hardened" header + "HUD: MODAL CONTAINER BRANDING" / "VIEW PROTOCOL 1..4" comments → plain section labels.

**Files:**
- Created: `src/domains/jobs/components/JobApplyCTA.tsx`
- Rewritten: `src/pages/app/AppJobDetail.tsx`
- Edited: `src/pages/PublicJobDetail.tsx`, `src/pages/app/AppJobApplication.tsx`, `src/domains/jobs/components/WhyYouMatchPanel.tsx`, `src/domains/jobs/components/ExternalApplicationPrep.tsx`, `.lovable/launch-audit.md`, `.lovable/plan.md`.

Next: pick A6 (Gigs Hub parity) or A7 (Profile / Talent Mirror polish).

---

## A5.5 — Jobs Hub Closeout — shipped 2026-05-22

Batched closeout sweep of remaining Jobs Hub surfaces. Pure UI/copy + comment scrubs. No DB, RPC, or behavior changes.

**Plan deviation:** the plan called for redirecting `/app/jobs/all` → `/app/jobs?tab=browse` and deleting `AppJobs.tsx`. On inspection, `AppJobs` is the only surface with real filtered search (text + type + experience + min-salary + company/location URL params); the Browse tab only shows recommendations. Deleting it would regress filtering UX. Instead, **kept the route and deeply humanized `AppJobs.tsx`**. Header/Browse "View all" links continue pointing at `/app/jobs/all`.

**`AppJobs.tsx` — full rewrite (426 → ~330 lines):**
- Removed "Phase Z1 Integration Stability Locked" / "HUD LEVEL 1..4" comments.
- Renamed internals: `jobsRegistryPayload` → `jobs`, `urlSearchParamsMap` → `params`, `textSearchQueryInput` → `query`, `selectedJobTypesArray` → `selectedTypes`, `minimumSalaryValueInt` → `minSalaryK`, `compositeActiveFiltersCounterInt` → `activeFilterCount`, etc.
- User-visible copy:
  - "Placement Opportunities Index" → "All jobs"
  - "Hub Matrix" → "Jobs Hub"
  - "Searching active tracking records registry…" → "Loading jobs…"
  - "Found N open positions aligned with profile parameters." → "N jobs matching your filters."
  - "Search matching positions by title designation or explicit corporate identifier…" → "Search by title, company or skill…"
  - "Refine Parameters Matrix" → "Filters"
  - "Employment Structural Variant" → "Job type"
  - "Minimum Salary Threshold" / "UNLIMITED FALLBACK" → "Minimum salary" / "Any"
  - "Reset Matrix" / "Apply Criteria" → "Reset" / "Apply"
  - "Criteria Index Unmatched / No career opening entries resolved matching…" → "No jobs match those filters / Try clearing some filters or broaden your search."
  - "Load Additional Placements" / "Synchronizing Index Rows…" → "Load more jobs" / "Loading…"
- Also accepts `?q=` (from Browse tab) in addition to `?search=` for backward compatibility.

**`JobAssessment.tsx` — full rewrite (351 → ~290 lines):**
- "Phase Z1 Transaction Matrix Sealed" / "HARDENED HARDWARE CLEANUP GATES" / "TRANSACTION MUTATION" headers removed.
- Renamed: `assessmentRecordState` → `assessmentRef`, `answersBufferMap` → `answers`, `isRecordingEngineActive` → `recording`, `recordingIntervalTime` → `recordSeconds`, `unverifiedAssessmentIdStr` → `assessmentId`.
- Copy: "Exit Assessment / TASK N OF M / Execution Vector / Stop Pipeline / Re-record Channel / Initialize Audio Capture / Submit Assessment Artifacts / Next Segment / Input your evaluation response parameter string block…" → "Exit / Question N of M / Progress / Stop recording / Re-record / Start recording / Submit assessment / Next / Type your answer here…".
- Toasts: "Voice response artifact secured." → "Voice answer saved."; "Failed to transmit audio asset to repository pipeline." → "Couldn't upload your voice answer. Please try again."; "Microphone hardware channel access refused by security container." → "Microphone access denied. Please allow microphone permissions."; "Submission transmission handshake failed." → "Couldn't submit your assessment. Please try again."; "Assessment registry lookup failed." → "Couldn't load this assessment."

**`JobAssessmentResults.tsx` — full rewrite (461 → ~365 lines):**
- Stripped "Neural Synthesis Active / Synthesis Report / Logic v2.6.4 / Connection Status / Dimension Tracking / Vocal Synthesis / Systematic Solving / Neural Briefing / Strategic Edge / Logic Gaps / Operational Protocol / Market Discover / Manage Applications" and italicized faux-futurist copy throughout.
- New copy: "Your assessment results / Your match score / Strong match · Good match · Needs more practice / AI scored / Skill breakdown / Technical · Communication · Problem solving / AI feedback / What you did well · Where to improve / What to do next / My applications · Browse more jobs".
- Polling stages: "Decompressing Artifacts… / Generating responses… / Loading Skill Matrix… / Finalizing Briefing…" → "Reading your answers… / Scoring your responses… / Mapping skills… / Finalizing your report…".
- Timeout copy: "The synthesis is exceeding typical logic cycles…" → "This is taking longer than usual…".
- Empty state: "List Missing / Return to Dashboard" → "Assessment not found / Back to applications".

**`CompanyDetailSheet.tsx` — surgical scrub:**
- Removed "Phase Z0 Hardened" + "HUD: FIXED HEADER ROW SECTION" + "STRUCTURAL VISUAL DRAG HANDLE" + "Automated Efficiency" comments.
- Renamed `userIsFollowingTarget` → `isFollowing`, `corporateInitialsString` → `companyInitials`, `handleFollowRelationshipToggle` → `handleFollowToggle`.
- Copy: "Organization Profile Matrix" → "Company details"; "active role / active roles" → "open role / open roles"; "+N fresh" → "+N this fortnight"; "Open Structural Roles" → "Open roles"; "No active occupational target vacancies mapped to this corporate taxonomy grid right now." → "No open roles at this company right now."; "corporate tracking branding logo" → "logo".
- Event names renamed: `company_detail_sheet_expanded` → `company_detail_sheet_opened`, `company_sheet_job_saved_toggled` → `company_sheet_job_save_toggled`, `company_sheet_job_navigation_triggered` → `company_sheet_job_opened`.

**`RelatedJobs.tsx` — full rewrite (186 → ~150 lines):**
- Removed "Phase Z0 Hardened" + "HUD: SECTION COMPLIANCE HEADER STRIP" + "PHASE 1/2/3" comments and decorative "Discovery Active" badge.
- Renamed: `extractInstitutionalGeography` → `extractCountry`, `executeDiscoveryProtocol` → `loadRelatedJobs`, `trajectoryBuffer` → `buffer`, `filterRegistry` → `excludeIds`, `institutionalNodes/geographicNodes/featuredNodes` → `sameCompany/nearby/featured`, `initializeJobHandshake` → `openJob`.
- Section title humanized: "Institutional_Sync: ACME" → "More at ACME"; "Regional_Sync: BANGLADESH" → "Other jobs in Bangladesh"; "Strategic_Deployments" → "Featured jobs"; default "Recommended_Syncs" → "Recommended for you".
- Telemetry events renamed: `opportunity_discovery_initiated/success/navigation_redirect` → `related_jobs_load/loaded/open`.

**`JobPreferencesSheet.tsx` — scrub:**
- "Phase Z0 Hardened" / "Automated Efficiency" / "HUD LEVEL 1..3" / "SECTOR A/B/C" / "PROTOCOL: Dynamic Location Discovery Map Pipeline" comments removed.
- Copy: "Match Constraint Registry / Deployment Preferences Matrix Configuration Node" → "Job preferences / Tell us what kinds of roles you want."; "Vector: Contract Models Model" → "Job type"; "Vector: Targeted Deployment Geographies" → "Preferred locations"; "Vector: Compensation Range Bounds" → "Salary range"; "Registry floor Min / Registry ceiling Max" → "Minimum / Maximum"; "Synchronizing Constraint Bounds… / Commit Constraints Configuration" → "Saving… / Save preferences"; "Ecosystem parsing matrices convert multicurrency parity variables…" → "Salaries are auto-converted between BDT and USD when matching jobs.".
- Toasts: "Syncing constraint matrix parameters down to profile registry…" → "Saving your preferences…"; "AI deployment constraint profile finalized cleanly" → "Preferences saved"; "Ledger constraint registration timeout." → "Couldn't save your preferences. Please try again.".

**`InfiniteJobsList.tsx` — comment-only scrub:**
- "Phase Z0 Hardened" + "CTO Reference" + "TanStack Infinite Query Server State Synchronization Hook" + "High-Performance Defensive Intersection Observer Lifecycle Management" + "Instrument Incident Telemetry Metrics Over Query Exceptions" + "Consolidate dataset mapping allocations natively from nested infinity pages" + "Log active viewport compilation milestones" comments → plain English where useful, deleted where noise.
- Renamed `apiQueryError` → `queryError`, `currentSentinelNode` → `sentinel`, `intersectionObserverInstance` → `observer`, `structuralEntry` → `entry`.
- Event renamed: `infinite_jobs_feed_compiled` → `infinite_jobs_loaded`. Telemetry action `useRankedJobs_infinite_query_fetch` → `fetch_ranked_jobs`.

**Files**
- Rewritten: `src/pages/app/AppJobs.tsx`, `src/pages/app/JobAssessment.tsx`, `src/pages/app/JobAssessmentResults.tsx`, `src/domains/jobs/components/RelatedJobs.tsx`
- Edited: `src/domains/jobs/components/CompanyDetailSheet.tsx`, `src/domains/jobs/components/JobPreferencesSheet.tsx`, `src/domains/jobs/components/InfiniteJobsList.tsx`, `.lovable/launch-audit.md`, `.lovable/plan.md`

**Deferred (carry-over to pre-launch sweep):**
- `useJobsHubDashboard`, `useRankedJobs`, `JobCard` JSDoc/comments — still contain "Phase Z0" jargon. Zero user impact.
- `/app/jobs/all` route consolidation — re-evaluate whether to merge the filtered-search surface into the Browse tab as a unified experience after A6.

## A5 Jobs Hub — COMPLETE
A5.1 → A5.5 all shipped. No P0/P1 launch blockers remain on the Jobs Hub. Ready for **A6 (Gigs Hub parity)** or **A7 (Profile / Talent Mirror polish)**.


---

## A6 Gigs Hub — shipped 2026-05-23

Brought `/app/gigs/*` to the A5 quality bar. All 5 tabs (For You / Tasks / Course / Client / My activity) work, default landing is For You with `AvailabilityWidget` + `GigForYouTab` + `InfiniteGigsList` already wired — no architectural changes needed.

**Humanized copy (talent-facing only):**
- `src/pages/app/Gigs.tsx`: header "Ecosystem Gig Hub" → "Gigs"; subtitle and CTA rewritten ("Post a new gig with AI"); tab labels (Matched Gigs → For You, Quick Micro Tasks → Quick tasks, Course Bundle → Course gigs, Client Market → Client work, My Activity → My activity); strip headers, empty states, search placeholders, card badges (COURSE MATRIX BUNDLE → COURSE GIG, EXTERNAL CORPORATE GIG → CLIENT GIG, FLAG_PRIORITY → FEATURED, SUBTASKS BOUND → SUBTASKS), credit/bid labels, work-tab section titles (Hashed Micro Task Submission Logs → My submissions, Proposals Bids Register → My bids, Operational Contracts Vault → Active contracts), button copy ("Deliver Artifact" → "Submit deliverable", "Publish Escrow Deliverable Artifacts" → "Submit deliverable", "Authorizing Archive Transport Loop..." → "Submitting..."), dialog title & labels (Transmit Assignment Deliverable Archive → Submit deliverable, Deliverable Manifest Document Title → Title, Implementation Architecture Remarks Summary → Notes, Secure Document Asset Files Ledger → Files), empty/error toasts.
- `src/pages/app/GigDisputes.tsx`: header "My Contract Disputes Ledger" → "My disputes"; subtitle, loading state ("Compiling Active Dispute Data..." → "Loading disputes..."), empty state, "Incident Reason Ref" → "Reason", "Initiation Anchor" → "Opened by", "System Final Settlement Verdict" → "Final verdict", "UNASSIGNED TIMELOG PARAMETER" → "Unknown date".
- `src/pages/app/GigAppeals.tsx`: subtitle, empty state, "UNKNOWN REGISTRATION DATE" → "Unknown date", "Administrative Resolution Notes" → "Resolution notes".
- `src/pages/app/MarketplaceGigDetail.tsx`: error msgs ("Gig registry node unreachable." → "Gig not found.", "Resource missing." → "Gig not found.", "Failed to finalize submission handshake." → "Couldn't submit your proposal."), success toast ("Strategic proposal dispatched to client registry." → "Proposal submitted."), section title "Trust Ledger" → "Client reviews", card title "Proposal Active" → "Proposal submitted", form title "Initialize Proposal" → "Submit a proposal", label "Strategic Narrative" → "Your pitch", CTA "Transmit Proposal" → "Submit proposal".
- `src/domains/gigs/components/talent/InfiniteGigsList.tsx`: end-of-list "Ecosystem Stream Lock Fully Synchronized" → "You're all caught up".
- `src/domains/gigs/components/talent/BidCoachDialog.tsx`: error toast humanized.
- `src/domains/gigs/components/talent/RecommendedBiddersPanel.tsx`: success + error toasts humanized.
- `src/domains/gigs/components/talent/CourseSharingGigForm.tsx`, `CVUploadGigForm.tsx`: "Ecosystem ... timeout/failed" error msgs humanized.
- `src/domains/gigs/components/talent/JobPostingGigForm.tsx`: CTA "Commit To Ecosystem Registry" → "Post job gig".

**Verified:** rg sweep on `src/pages/app/Gig*` + `src/domains/gigs/components/talent/` — remaining "Phase Z0/Z1", "HUD LEVEL" hits are all in JSDoc/code comments only, zero user impact.

**Out of scope (deferred):** JSDoc/comment jargon in gig components, admin `/dashboard/gigs/*`, Gro10x employer gigs, visual redesign.

Ready for **A7 (Profile/Talent Mirror polish)** or **A8 (Career Abroad)**.


---

## A7 Profile & Talent Mirror — shipped 2026-05-23

Humanized user-visible copy across the Profile / Talent Mirror / My Gigs surfaces. No schema, RPC, or business-logic changes.

**Files edited (visible strings only):**
- `src/pages/app/MyGigs.tsx`: header "Output Hub" → "My Gigs"; subtitle rewritten; dropped "Launch Candidate · Phase Z1 Production Contract Locked" version banner.
- `src/domains/profile/components/talent/ProfilePhotoUpload.tsx` + `CoverImageUpload.tsx`: all toasts and validation messages rewritten ("Format Rejected: Ingress pipeline requires..." → "Please upload a valid image file.", "Synchronizing avatar binary asset..." → "Uploading photo…", "Initialize Cover Node Ingress" → "Upload a cover image", "Syncing Synapse Ledger…" → "Uploading…", etc.).
- `src/domains/profile/components/talent/ProfileEditDialog.tsx`: loading toast, success/error toasts, footer buttons ("Syncing Ledger Node…" → "Saving…", "Authorize Ledger Sync" → "Save profile").
- `src/domains/profile/components/talent/ProfileCompletionMeter.tsx`: checklist labels ("Artifact Sync (CV)" → "Upload CV", "Professional Ledger" → "Work experience", "Academic Registry" → "Education"), status pills ("Synchronized Verified" / "Awaiting Ingress" → "Complete" / "To do").
- `src/domains/profile/components/talent/ProfileCompletionPrompt.tsx`: section header ("Registry Synchronization Alignment" → "Complete your profile"), summary copy, gap labels ("Network Handshake" → "LinkedIn profile"), CTAs ("Complete Nodes" → "Finish profile", "Synchronize Digital Professional Identity Vector" → "Complete my profile").
- `src/domains/profile/components/talent/SkillsEditor.tsx`: title ("Core Vector Skill Matrix" → "Your skills"), subtitle, placeholder, add button title, empty state ("Matrix Vector Fields Awaiting Data Ingress" → "No skills added yet").
- `src/domains/profile/components/talent/ExperienceEditor.tsx` + `EducationEditor.tsx`: headers ("Professional Experience Registry" → "Work experience", "Academic Credential Registry" → "Education"), subtitles, add buttons ("Deploy Node" → "Add experience"), empty states ("Experience Ledger Vacant" / "Academic Directory Empty" → "No experience added yet" / "No education added yet").
- `src/domains/profile/components/talent/PublicProfileSettings.tsx`: header ("Public Trajectory Discoverability" → "Public profile settings"), toggle label ("Make Vector Profile Discoverable" → "Make my profile public"), handle label/CTA, public URL banner ("Ecosystem Ingress Synchronized Live At:" → "Live at:").
- `src/domains/profile/components/talent/PayoutAccountsManager.tsx`: loading ("Hydrating Disbursement Node Ledger…" → "Loading payout accounts…"), empty state, add button ("Add Ingress Disbursement Route" → "Add payout account").
- `src/domains/profile/components/talent/IdentityDocsUpload.tsx`: loading, timestamp ("Transmission committed on" → "Submitted on"), rejection reason label, NID back label, submit CTA ("Processing Secure Ledger Ingress…" / "Commit Document for Audit Review" → "Uploading…" / "Submit for review").
- `src/domains/profile/components/talent/ServiceHistoryCard.tsx`: loading ("Synchronizing historical pipeline records…" → "Loading your service history…"), error header ("Ecosystem Ingress Sync Fault" → "Couldn't load history").
- `src/domains/profile/components/talent/ApplicationHistoryCard.tsx`: empty state ("Pipeline Ledger Vacant" → "No applications yet").
- `src/domains/profile/components/talent/CVUploadSection.tsx`: card title ("Neural Artifact Sync" → "Upload your CV"), description, badge ("Node Verified" → "CV on file"), progress text, error/success headers/descriptions, retry CTA ("Re-Initialize Calibration Sync" → "Try again"), footer ribbon ("Neural Engine Vector Ingress Protocol Alignment Core v2.6 Mapped" → "Powered by AI · CV parsing").
- `src/domains/profile/components/talent/ProfileSectionEditor.tsx`: about-label/placeholder, language select items ("Native Dialect" / "Fluent Ingress" / "Basic Operational" → "Native" / "Fluent" / "Basic"), cancel CTA ("Abort Section Changes" → "Cancel"), save CTA ("Authorize Segment Sync" → "Save").
- `src/components/talent/TrackCompletionBadge.tsx`: tooltip rewritten.
- `src/domains/learning/components/talent/TalentMirrorPanel.tsx`: section header ("Integrated Specialization Tracks Masteries Ledger" → "Mastery by course").

**Verified:** rg sweep on profile/talent components for visible Vector/Ingress/Synchroniz/Ledger/Ecosystem/Handshake/Telemetry/Phase-Z strings — 0 hits in JSX text or toast strings. Remaining hits are JSDoc/identifier-level only (zero user impact).

**Deferred:** JSDoc/identifier-level jargon across profile components, admin profile surfaces, Career Abroad shell (A8).

V0.5 launch-readiness sweep across **A5 Jobs + A6 Gigs + A7 Profile/Mirror + B3-B5 cross-cutting** is now complete. Ready for **A8 (Career Abroad)** or admin shell cleanup.

---

## A8 Career Abroad — shipped 2026-05-23

Humanized user-visible copy across the Study Abroad / Career Abroad surfaces. No schema, RPC, or business-logic changes.

**Files edited (visible strings only):**
- `src/pages/app/CareerAbroad.tsx`: full rewrite of the deprecation redirect interceptor; fixed the broken `h-4 w-4定位` className (Chinese chars were silently invalidating the class); loader "Rerouting to Study Abroad Ingress..." → "Taking you to Study Abroad…"; stripped "Phase Z1 Redirect Insulation Sealed" version banner.
- `src/pages/app/AbroadHub.tsx`: full rewrite. Header "Global Mobility Ecosystem" → "Study Abroad", subtitle rewritten, tool cards ("IELTS Language Evaluator Coach" → "IELTS prep & speaking coach", "Universal Language Research Lab" → "Language learning lab"), section header ("Verified Destination Target Nodes" → "Destinations"), empty state ("No country-specific destination neural interfaces are active…" → "No destinations available right now…"), footer CTA ("Audit Active Portfolio Submissions" → "My applications").
- `src/pages/app/AbroadApplications.tsx`: full rewrite. Header "International Matriculation Portfolios" → "My applications", subtitle, empty state, intake fallback ("Intake to be confirmed" → "Intake TBC"), date label ("Settle Coordinates:" → "Updated").
- `src/pages/app/AbroadCounsellor.tsx`: header ("Counselor Workspace Dashboard" → "Counsellor workspace"), subtitle, active count badge ("ACTIVE ALLOCATIONS" → "active"), loader ("Syncing Registration Ledger Contexts..." → "Loading applications…"), access denied ("Access Credential Refused" → "Access denied"), empty column ("Empty Sector" → "No applications"), term label ("TERM:" / "PENDING" → "Term:" / "TBC"), stage select placeholder ("ADVANCE COHORT →" → "Move stage →"), action button title ("Audit detail records spec file" → "Open application details"), toasts ("Classification state successfully advanced." → "Stage updated.").
- `src/pages/app/StudyAbroad.tsx`: wallet subtitle ("Available for Roadmap synthesis" → "Available for your roadmap"), CTA ("Consult Advisor" → "Talk to advisor"), error state ("Registry unreachable" / "Sync failed. Please retry." → "Couldn't load programs" / "Something went wrong. Please try again."), empty state ("No nodes found" / "Adjust your filters." → "No programs match your filters" / "Try adjusting…").
- `src/pages/app/StudyAbroadRoadmap.tsx`: error toast ("Roadmap sync interrupted. Admin agents notified." → "Something went wrong. Please try again."), boundary fallback rewritten.
- `src/domains/abroad/components/talent/RoadmapBuilderSheet.tsx`: header ("Build My Career Abroad Roadmap" → "Build my study abroad roadmap"), success toast ("🔥 Roadmap Generated!" / "Successfully consumed…" → "Roadmap ready" / "100 credits used from your wallet."), wallet-deficit toast ("Wallet Deficit" / "This automated agent service requires…" → "Not enough credits" / "This roadmap costs 100 credits…"), all field labels simplified (Target Degree Level → Degree level, "Bachelors Degree" → "Bachelor's", Estimated Budget Level → Budget level, "Low Budget Scale" → "Low", IELTS Band Score → IELTS score, CGPA → GPA, Professional Work Experience → Work experience), CTA ("Generate AI Roadmap (100 Credits)" → "Generate roadmap (100 credits)").
- `src/domains/abroad/components/talent/RoadmapIntakeForm.tsx`: header ("Initialize_Admissions" / "Trajectory_Mapping_v3.4" → "Build your roadmap" / "Step N of 3"), step badge ("PHASE_0N" → "Step 0N"), DEGREE_LEVELS labels ("Undergraduate_Core" → "Bachelor's", etc.), BUDGET_NODES labels ("FISCAL_EFFICIENT" → "Budget-friendly", etc.), country limit toast ("TRAJECTORY_LIMIT: Max 3 countries permitted." → "You can pick up to 3 countries."), step 2 title ("Academic_Core_Metrics" → "Academic background", "Target Field of Study" → "Field of study"), step 3 title ("Fiscal_Authorization" → "Budget & payment"), wallet rows ("SYNC_GENERATION_FEE" / "VAULT_BALANCE" / "Insufficient_Capital_Detected" → "Roadmap cost" / "Your balance" / "Not enough credits"), select placeholder ("Select_Term..." → "Select..."), success toast ("NEURAL_GENERATION_INITIALIZED" → "Roadmap is being built…"), error toast simplified, CTAs ("ADVANCE_PHASE" → "Next", "GENERATE_ROADMAP" → "Generate roadmap").
- `src/domains/abroad/components/talent/RoadmapTimeline.tsx`: **bug fix** — removed `title.trim().replace(/\s+/g, "_")` which was turning every readable step title (e.g. "Apply to universities") into "Apply_to_universities" in the rendered timeline; humanized "PHASE_MONTH_N" → "Month N", "ACTIVE_SYNC" → "Active", action button ("EXECUTE_PHASE_TASKS" / "SYNCHRONIZING_PHASE_TASKS..." → "Start this month's tasks" / "Working…").

**Verified:** rg sweep over the touched files. Remaining matches for jargon markers are confined to query-key strings, internal error codes (caught and mapped to user-friendly toasts), and code comments — zero user-visible hits.

**Deferred:** Admin abroad shells (`src/shells/admin/routes/abroad.ts`, `src/domains/abroad/components/admin/*`); `StudyAbroadDetail.tsx` and `StudyAbroadRoadmapResults.tsx` (clean enough to not block launch — flag for B6 admin sweep if needed).

Phase A8 closes out the talent-side launch-readiness sweep. Next remaining: **admin shell cleanup** across `/dashboard/*`.

---

## D1 — Gro10x Auth/Shell — verified clean 2026-05-24

Scope: `Gro10xLanding`, `Gro10xWelcome`, `Gro10xSignIn`, `Gro10xTopBar`, `Gro10xSideNav`, `Gro10xBottomNav`, `Gro10xPageGate`, `Gro10xInstallButton`, `Gro10xAppShell`.

**Verified:** rg sweep across the full `src/gro10x/` tree for Vector/Ingress/Phase-Z/HUD/Synchroniz/Telemetry/Ecosystem/Handshake/Nexus/Orchestrat/Conduit/Substrate/Propagat — **0 user-visible hits** (only `stopPropagation` event handlers matched, which are framework-level, not copy).

**Finding:** The Gro10x employer shell was authored after the talent/admin shells and never adopted the jargon house-style. All visible copy is already in plain English (e.g. Landing tagline "The professional inbox of AI agents.", PageGate "You're not connected to a company workspace yet.", BottomNav labels Inbox/Activities/Learn/Feed/Company). No edits required for D1.

**Implication for Track D plan:** D2–D5 (Work, Gigs, Learn, Inbox, Agents, Me) are very likely also clean. Recommend a single rg pass over D2–D5 to confirm, then close Track D and proceed directly to **Track C — Admin shell cleanup** (which we already know has heavy jargon from the deferral notes in A5–A8).

