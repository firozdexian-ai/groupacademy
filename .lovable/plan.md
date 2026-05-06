# Phase 1.5 — Auth & Onboarding: Closeout (before Phase 2)

Goal: clean every loose end in **authentication + onboarding** so we can hand off to Phase 2 (Dashboard / Feed / Home) on a stable base. No new feature areas — just gaps, leaks, polish, and the telemetry plumbing the next phases will need.

## Audit findings (what's still wrong / missing)

1. **Wizard is mounted twice.** `App.tsx OnboardingGuard` mounts `<OnboardingWizard>` for any `/app/*` route AND `pages/app/Feed.tsx` mounts it again on the feed. Two instances flicker / race the `setShowWizard` state. One of them must go (the global guard wins).
2. **CV step still has the old, duplicated "career track" selector.** It overlaps with the new `ProfessionStep` from 1.3, has uppercase chrome ("PROFILE UPDATED", "SKILLS FOUND"), and forces selecting a category here even though step 3 covers it. Strip the in-CV category picker, keep only upload + parse summary.
3. **Google OAuth users have no phone.** Mandatory phone is enforced in classic signup but Google sign-in skips it. After OAuth, the talent has `phone = ''` and breaks the global "Mandatory phone capture" rule. Need a one-shot "complete your phone" gate inside onboarding (step 1.5 — between Welcome and CV) that **only renders if phone is empty**.
4. **No telemetry sink.** `trackOnboardingStep` / `trackCoachEvent` write to `console.debug`. The `platform_events` table is already there and admin-readable — wire both helpers to it (`event_kind = 'onboarding_step' | 'career_coach'`, `payload` for action + meta). No new table.
5. **Suspected duplicate is silent.** `is_suspected_duplicate` gets set, welcome credits are skipped, but: (a) admin gets no notification, (b) the user sees no message, (c) `platform_events` doesn't record it. Fire one `platform_events` row (`event_kind = 'duplicate_cv_detected'`) and show a soft toast: *"Looks like you've used GroUp before — welcome back. Reach out if you need to recover an old account."*
6. **Wizard skip is too cheap.** `Skip for now` jumps straight to `completeOnboarding` without persisting profession/goal — those users then bypass Career Coach binding and matching. Soft-friction confirmation modal + always set `onboarding_completed_at` but **don't** mark profile as complete (`profile_complete` flag → false) so dashboard can nudge later.
7. **Welcome email not sent.** Email confirmation is off (per your decision), but no transactional email goes out on signup. Send one via the existing `notify.groupacademy.online` native queue (per Email Architecture core memory) — a simple "Welcome to GroUp" with a link to `/app/feed`.
8. **HIBP leaked-password check is off.** Free, one-toggle protection. Turn it on through `configure_auth` (no UI changes).
9. **CV bucket inconsistency.** CV upload writes to `portfolio-uploads` with a **public** URL. Per security core ("`talent-cvs` requires signed URLs"), the canonical CV bucket is `talent-cvs` and must be private. Migrate the CV write path to `talent-cvs`, store the path (not public URL) in `talents.cv_url`, and produce signed URLs on read in the few places that need it (CV preview, parse-cv edge function).
10. **Resume mid-onboarding is fragile.** `OnboardingWizard` syncs `savedStep` only forward, but if a user lands on `/app/jobs` mid-flow the guard re-mounts and sometimes resets to step 0 because the talent context hasn't loaded yet. Add a small skeleton state (don't render the wizard until `talent` is hydrated).
11. **Auth chat password setter** allows any 8-char string. Add a tiny inline strength indicator + reject obvious weak passwords (length + 1 number) — UI only; HIBP does the rest.
12. **`/reset-password`** page exists but no path tests forgot-password from `AuthClassic`. Add a "Forgot password?" link in `AuthClassic` (Aisha already supports it).
13. **Auth callback** — when Google OAuth succeeds for a brand-new user, the `talents` row may not exist yet (it's created via trigger on first login but timing varies). `/auth/callback` should retry `useAccountType` once before deciding the route, otherwise new Google signups briefly land on `/` before bouncing to `/app/feed`.

## Plan

### 1.5.a — Single source of truth for the wizard
- Remove the wizard mount from `pages/app/Feed.tsx`. Keep only `App.tsx OnboardingGuard`.
- Guard waits for `talent !== null && !isTalentLoading` before deciding to show the wizard (kills the reset-to-step-0 flicker).

### 1.5.b — CV step cleanup
- Delete the in-CV "Choose your career track" `Select` block (lines 330–351) and its save handler — `ProfessionStep` owns this now.
- Replace ALL-CAPS micro labels (`PROFILE UPDATED`, `SKILLS FOUND`, `EXPERIENCE`, `Click or drag to replace`) with sentence case.
- Drop the `selectedCategory` state and the `categories` fetch from this file entirely. `Continue` becomes simply `onContinue()` after the file is uploaded (or skipped).

### 1.5.c — Mandatory phone gate (post-OAuth)
- New step `PhoneCaptureStep.tsx` inserted **only when** `talent.phone` is empty. Reuses `<PhoneInput>` from `ui/phone-input`. Saves `phone`, `country`, `country_code` to `talents`.
- `OnboardingWizard.ONBOARDING_NODES` becomes a runtime-filtered array: `[welcome, phone?, cv, profession, goal, explore]`. `phone` is included only if `!talent.phone`. Step indices and progress bar adapt automatically.

### 1.5.d — Telemetry → platform_events
- Update `src/lib/onboarding/telemetry.ts`:
  - `trackOnboardingStep(stepId, action, meta)` → fire-and-forget `supabase.from("platform_events").insert({ event_kind: "onboarding_step", subject_kind: "talent", subject_id: talentId, payload: { stepId, action, ...meta } })`.
  - `trackCoachEvent(action, meta)` → same, with `event_kind = "career_coach"`.
  - Pass `talentId` from caller (read from `useTalent` once at the top of each step).
  - Keep the `console.debug` for dev; just add the insert.
- No schema change — `platform_events` already exists and admins can read it.

### 1.5.e — Duplicate detection: surface it
- In `useOnboarding.completeOnboarding`, when `isDuplicate` is true, also `INSERT INTO platform_events (event_kind = 'duplicate_cv_detected', subject_kind='talent', subject_id, payload: { fingerprint })`.
- Replace the silent "you're all set" toast with: *"Welcome back — looks like you've been here before. If you have an old account, [contact support](/app/messages?to=support) to recover it."* (markdown link rendered via existing toast description support, or plain text if not supported).
- No admin-UI surface in 1.5; the row in `platform_events` is enough — admin tile comes in Phase 2.

### 1.5.f — Skip-with-friction
- Tap on `Skip for now` opens a small AlertDialog: *"Skip setup? You'll miss your AI Career Coach and personalised job matches. You can finish anytime from your profile."* Buttons: **"Finish later"** (proceed) / **"Keep going"** (cancel).
- On confirm, call `skipOnboarding()` AND fire `platform_events` `onboarding_skipped` with the current step id.
- Add a derived `talents.profile_complete` virtual flag computed in TS (no schema): `!!profession_category_id && !!primary_goal && !!phone`. Used by Phase 2 dashboard.

### 1.5.g — Welcome transactional email
- New edge function `send-welcome-email` (no JWT verification; called server-side from a DB trigger or from `signUp` directly).
- Triggered on first INSERT into `talents` (DB trigger calling `pg_net` to invoke the function), payload `{ talent_id, email, full_name }`.
- The function sends through the existing `notify.groupacademy.online` queue (per memory). Subject: *"Welcome to GroUp Academy, {first_name}"*. Body: short, links to `/app/feed` and `/app/career-coach`.
- If the queue isn't reachable, log and swallow — never block signup.

### 1.5.h — HIBP + password UX
- Call `configure_auth` to enable `password_hibp_enabled: true`.
- In `useAuthChat` `set_password` step, add a sub-component that:
  - Shows length/strength dot (weak / fair / strong).
  - Rejects passwords with no digit OR length < 8.
- In `AuthClassic`, add a "Forgot password?" link → `handleForgotPassword(email)`.

### 1.5.i — CV bucket migration to `talent-cvs`
- Migration: ensure `talent-cvs` bucket exists, **private**, with these RLS storage policies:
  - User can `select`/`insert`/`update`/`delete` only objects under `auth.uid()/...`.
  - Admins can read all (via `has_role`).
- Update `CVUploadStep.handleCVUpload` to upload to `talent-cvs/{user_id}/cv_v3.{ext}`, store the **path** in `talents.cv_url`, and call `createSignedUrl(path, 3600)` for the parse-cv edge function and any preview.
- Update `parse-cv` edge function (and any other CV reader) to accept either a public URL or a path → fetches the file via service role.
- Backfill: leave existing `portfolio-uploads/.../cv_v*` untouched (don't break old links). New uploads only.

### 1.5.j — Auth callback resilience
- In `AuthCallback.tsx`, after `useAccountType` resolves, if `accountType === 'unknown'` AND `user.app_metadata.provider === 'google'`, wait 600ms and re-query once before falling back to `/app/feed`.
- Add a small fallback: if still `unknown`, just go to `/app/feed` (don't bounce to `/`).

### 1.5.k — `OnboardingGuard` hydration check
- In `App.tsx`, render `null` (or a tiny spinner) while `isTalentLoading` is true. Only decide `showWizard` after `talent` is loaded. Removes the brief re-render at step 0.

## Files changed (planned)
- `src/App.tsx` — guard waits for hydration
- `src/pages/app/Feed.tsx` — remove duplicate wizard mount
- `src/components/onboarding/OnboardingWizard.tsx` — runtime-filtered steps (phone optional), skip dialog
- `src/components/onboarding/CVUploadStep.tsx` — strip category picker, sentence-case copy, talent-cvs bucket, signed URL
- `src/components/onboarding/PhoneCaptureStep.tsx` — **new**
- `src/hooks/useAuth.ts` — strength validation hook for `set_password`
- `src/hooks/useAuthChat.ts` — wire strength validator + forgot-password discoverability
- `src/hooks/useOnboarding.ts` — duplicate `platform_events` log + softer messaging + skip event
- `src/lib/onboarding/telemetry.ts` — write to `platform_events`
- `src/pages/AuthClassic.tsx` — "Forgot password?" link
- `src/pages/AuthCallback.tsx` — retry account-type once for OAuth
- `supabase/functions/send-welcome-email/` — **new** edge function
- `supabase/functions/parse-cv/index.ts` — accept path + service-role download
- DB migration:
  - Trigger on `talents` INSERT → `pg_net` invoke `send-welcome-email` (idempotent on email)
  - Storage bucket `talent-cvs` (private) + policies (user-scoped + admin read)
- `configure_auth` call: `password_hibp_enabled: true`

## Out of scope (Phase 2 and beyond)
- Dashboard / Feed / Home redesign — that's **Phase 2**.
- Admin "Suspected Duplicates" review UI (the `platform_events` row ships now, the admin tile is later).
- WhatsApp connect for verification (still in "Profile Verification" phase, post-Phase 2).
- Per-goal sub-coaches.
- Funnel charts in admin (the rows land in `platform_events`; charts in Phase 2's admin pass).

## Open questions
1. **Welcome email** — happy with a single "Welcome" email at signup, or also a follow-up at onboarding completion (mentioning credits awarded)? My recommendation: only signup for now, less spammy.
2. **Skip friction** — soft modal (recommended) or a stronger 2-tap confirm ("Type 'skip' to continue")? Soft is enough given the flag captures intent.
3. **CV bucket migration** — keep old uploads on `portfolio-uploads` (read-only, never written again) or move them too? My recommendation: leave them — migration risk outweighs benefit, and they were already public by user choice.
