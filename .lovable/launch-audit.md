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

