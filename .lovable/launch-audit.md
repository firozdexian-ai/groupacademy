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
