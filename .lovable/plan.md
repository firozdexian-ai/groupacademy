# Phase A2 — Onboarding

## What I found

Onboarding has **one** live surface (`OnboardingWizard`) and a lot of unused code.

**Live:**
- `src/pages/Start.tsx` → `<OnboardingWizard preAuth />` (pre-signup country/stage/uni/profession)
- `src/components/auth/AccountUpgradeModal.tsx` → `<OnboardingWizard />` (post-auth, writes directly)
- `src/lib/finalizePendingOnboarding.ts` → applies pre-auth stash after sign-in (already wired in `AuthChat`, `AuthClassic`, `AuthCallback`) ✅

**Dead code (not imported anywhere):**
- `PhoneCaptureStep.tsx` (180 LOC) — yet memory says **mandatory global phone is required**
- `WelcomeBonus.tsx` (270 LOC) — 250-credit animation never shown
- `ServicesTour.tsx`, `GoalStep.tsx`, `CVUploadStep.tsx`, `ProfessionStep.tsx` (~1300 LOC)
- `src/hooks/useOnboarding.ts` (136 LOC) — only declares itself

**Issues across the live wizard:**
1. **Copy is corporate techno-babble end-to-end.** Every visible string: "Initialize Trajectory Index", "Determine Base Geographical Region", "Continue Ingress", "Finalize Synchronization & Link", "Ecosystem sync error", "Synchronize your workspace ledger configuration", error toasts, loading phases — all unreadable to a normal user.
2. **Phone is never captured.** Mandatory-phone memory is violated for Google OAuth signups. `PhoneCaptureStep` exists but is orphaned.
3. **Defaults `+880` / `BD`** in PhoneCaptureStep — violates Global Product Standard.
4. **`Start.tsx` hard-codes `returnTo=/app/feed`** — company / admin signups land on talent feed.
5. **No "already completed onboarding" guard** in `AccountUpgradeModal` invocation path (verify).

## Sub-phases (each small, independently shippable)

### A2-FIX-1 — Dead-code triage (10 min, no risk)
Decide per file (recommend: **delete all six orphans + `useOnboarding`**; resurrect `PhoneCaptureStep` in A2-FIX-3 from git/this file's last known good).
- Delete: `WelcomeBonus.tsx`, `ServicesTour.tsx`, `GoalStep.tsx`, `CVUploadStep.tsx`, `ProfessionStep.tsx`, `hooks/useOnboarding.ts`
- Keep `PhoneCaptureStep.tsx` (needed for A2-FIX-3) but rewrite in that phase
- Verify build still passes

### A2-FIX-2 — Humanize `OnboardingWizard` copy (~30 min)
File: `src/components/onboarding/OnboardingWizard.tsx` only. Pure string changes, no logic.

| Where | From | To |
|---|---|---|
| Header title | "INITIALIZE TRAJECTORY INDEX" | "Set up your profile" |
| Step subtitle | "Stage X of Y · Country Analysis" | "Step X of Y · Country" |
| Step 1 header | "Determine Base Geographical Region" | "Where are you based?" |
| Step 1 sub | "We match dynamic localized criteria…" | "We'll show jobs, salaries, and opportunities near you." |
| Step 2 header | "Identify Professional Persona Tier" | "Where are you in your career?" |
| Step 2 sub | "Calibrate target experience curves…" | "Pick the stage that fits you best." |
| Step 3 header | "Specify Academic Institutional Core" | "Where did you study?" |
| Step 3 sub | "Synchronize your workspace ledger…" | "Connect with peers and your campus community." |
| Step 3 placeholder | "Search academic university ledger matrix…" | "Search your university…" |
| Step 3 empty | "No match. Try a shorter name…" | (keep — already fine) |
| Step 3 footer | "Can't trace your absolute cluster node?…" | "Can't find your university? Add it — you can change this later." |
| Step 4 header | "Target Specific Specialization Sub-School" | "What's your field?" |
| Step 4 sub (no academy) | "Select the authoritative professional discipline…" | "Choose the path that fits you best." |
| Step 4 sub (academy) | "Curated specific instructional tracks…" | "Tracks tailored for {stage} talent." |
| Back btn | "Back" | "Back" (keep) |
| Continue btn | "CONTINUE INGRESS" | "Continue" |
| Final btn | "Finalize Synchronization & Link" | "Finish" |
| Loading phases | "Saving your profile parameters…" / "Connecting to {x} Campus Agent…" / "Almost ready…" | "Saving…" / "Connecting you to {x}…" / "Almost done…" |
| Success toast | "Connected to {x} AI Campus Ambassador" / "Your {school} specialization pathway is configured and live." | "You're connected to {x}" / "Your {school} workspace is ready." |
| Error toast | "Ecosystem sync error: Setup execution timed out." / "Please attempt confirmation again…" | "Something went wrong setting up your profile." / "Please try again — your choices are saved." |
| Empty country | "No baseline geographical clusters registered…" | "No countries available right now." |
| Empty schools | "No vocational sub-school structures mapped…" | "No fields available for this track yet." |

Also fix the duplicate `tracking-tight tracking-wide` Tailwind classes while we're in there.

### A2-FIX-3 — Mandatory phone capture (~45 min)
1. Rewrite `PhoneCaptureStep.tsx`:
   - Remove `+880` / `BD` default; default to the country selected in the wizard (passed via prop) or empty.
   - Replace all copy: header → "Add your phone number", sub → "We'll use this to alert you about job replies and verification codes.", button → "Continue", loading → "Saving…", duplicate error → "This phone number is already on another account.", generic error → "Couldn't save your phone — please try again."
2. Wire it into the post-auth onboarding gate:
   - In `AccountUpgradeModal` (or a new `<OnboardingGate>` wrapping `OnboardingWizard`), after wizard's `onComplete`, check `talent.phone` — if empty, show `PhoneCaptureStep` before closing.
   - For OAuth users whose talents row was created without a phone, same gate triggers on first app load if `onboardingCompletedAt` set but `phone` null.
3. Add cheap guard so users with completed onboarding + phone never see the modal again.

### A2-FIX-4 — `Start.tsx` post-auth routing (~10 min)
Replace the hard-coded `returnTo=/app/feed` with `resolvePostAuthRoute(accountType) ?? "/app/feed"` so company / admin signups land on their correct workspace.

### A2-FIX-5 — Verification pass
- Log in as `something@gro10x.com` (new test account) → walk full Start → /auth → onboarding → phone capture → land on `/app/feed`.
- Sign in via Google (separate test account) → confirm phone capture gate fires.
- Re-open `AccountUpgradeModal` for a user who already onboarded → modal does not reappear.
- `gro10xnow@gmail.com` → `/start` should still bounce straight to `/dashboard` (admin route).

## Order & dependencies

A2-FIX-1 → A2-FIX-2 → A2-FIX-4 (independent, parallel-safe after 1) → A2-FIX-3 (needs PhoneCaptureStep kept by 1) → A2-FIX-5.

Each phase ships and we verify before moving to the next, matching the user's "small steps, no big mistakes" preference.

## Out of scope (defer)

- WelcomeBonus / ServicesTour / GoalStep / CVUploadStep / ProfessionStep resurrection — none are referenced; if you want them later we'll spec them as a separate phase.
- Backfill of existing `talents` rows with `country_code='BD'` → P2, separate DB migration phase.
- AuthClassic / AuthChat copy polish — covered later (A3 or in `auth` polish bundle).
