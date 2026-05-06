# Phase 1.1 — Auth Copy & UX Cleanup (talent side)

Pure UX/copy pass. **No DB changes, no edge functions, no logic changes.** This is the lowest-risk pass that immediately makes the auth + onboarding feel like a real product instead of a developer console. We do this first because it sets the tone for every later sub-phase.

We **keep** `AuthClassic.tsx` as the explicit fallback (per your decision: if Aisha breaks, users must still get in).

The infrastructural pillars you described — **academies → schools → profession_categories → professional_roles** — are already in the database (4 academies, 19 schools, 83 categories, 829 roles, and `talents.professional_role_id` already exists). Those will be wired into the actual flow in **1.3** (onboarding restructure) and into the Career Coach in **1.4**. 1.1 is purely cosmetic so we don't double-handle.

## Files touched in 1.1 (all frontend, no backend)

```text
src/pages/AuthChat.tsx
src/pages/AuthClassic.tsx
src/pages/ResetPassword.tsx
src/hooks/useAuthChat.ts          (only fallback strings + agent name)
src/hooks/useAuth.ts              (only toast strings)
src/hooks/useOnboarding.ts        (only console + comments)
src/components/onboarding/OnboardingWizard.tsx
src/components/onboarding/WelcomeBonus.tsx
src/components/onboarding/CVUploadStep.tsx
src/components/onboarding/ServicesTour.tsx
src/components/onboarding/ProfileQuickSetup.tsx
src/components/AuthGate.tsx       (loading copy only)
```

## What gets rewritten

### 1. Aisha's voice (in `useAuthChat.ts` fallback + `AuthChat.tsx` UI labels)
Replace robotic strings with a warm, plain English tone. Examples:

| Before | After |
|---|---|
| "Welcome to GroUp Academy! 😊 I'm Aisha. To initialize your trajectory, what's your email?" | "Hi, I'm Aisha 👋 What email should I use to set you up?" |
| "Registry match confirmed! 🎉 Please enter your password to continue." | "Welcome back! Enter your password to continue." |
| "New talent node detected! Let's create your account. What's your full name?" | "Looks like you're new here. What's your full name?" |
| "Initializing human-validation check!" | "Quick check to make sure you're human." |
| "INVALID_FORMAT: Please provide a valid email artifact." | "That doesn't look like a valid email — try again?" |
| "INCOMPLETE_DATA: Bangladesh mobile artifacts require 11 digits." | "Phone number looks short — please enter the full number." |
| "🎉 Trajectory synchronized! Welcome to the Academy." | "You're in 🎉 Welcome to GroUp Academy. We've added 250 welcome credits to your wallet." |
| "SESSION_ESTABLISHED: Access granted." | "Signed in. Taking you to your dashboard…" |
| "AUTH_ERROR: …" | Plain message from Supabase, no prefix |
| "RECOVERY_LINK_DEPLOYED: Check your inbox." | "Check your inbox for the reset link." |
| "VAL_FAULT: Incorrect…" | "Not quite — the opposite of 'hot'?" |
| Header chip "Secure" | Keep, but soften micro-copy elsewhere |
| Agent status subtitle "Your AI guide" | "Your sign-in assistant" |

### 2. `useAuth.ts` toasts
| Before | After |
|---|---|
| "WELCOME_BACK: Identity verified." | "Welcome back!" |
| "INGRESS_FAULT: Signup artifact creation failed." | "We couldn't create your account. Please try again." |
| "INITIALIZING_PROFILE_ARTIFACT…" | "Setting up your profile…" |
| "REGISTRY_SYNC_DELAYED: Please sign in manually." | "Almost there — please check your inbox to confirm your email." |
| "ACCOUNT_SYNC_COMPLETE" | "Account created." |
| "SESSION_TERMINATED" | "Signed out." |
| "RECOVERY_SYNC_SENT" | "Reset link sent — check your inbox." |
| "ARTIFACT_UPDATED: Password reset complete." | "Password updated." |
| "IDENTITY_NOT_FOUND: No account linked to this phone." | "No account found for that phone number." |
| "IDENTITY_COLLISION: Multiple accounts detected. Use email ingress." | "Multiple accounts use this phone. Please sign in with email instead." |

The `signUp` "REGISTRY_SYNC_DELAYED" branch will get a real "check your inbox" UX in 1.2; for 1.1 we just fix the words.

### 3. `OnboardingWizard.tsx` chrome
| Before | After |
|---|---|
| "INITIALIZATION / SEQUENCE ACTIVE" badge | Remove. Just show step name. |
| "Skip Sequence" | "Skip for now" |
| "PLATFORM SECURED" footer | Remove footer entirely (visual noise on mobile). |
| Step labels: "Welcome / Profile Audit / Platform Tour" | "Welcome / Your profile / Quick tour" |
| Toast "Access Granted — Initialization bypassed. Redirecting to hub." | "Skipped for now. You can finish your profile anytime from your dashboard." |
| Toast "Profile Verified — 250 Welcome Credits…" | "All set! 250 welcome credits are in your wallet." |

Also: the header has `className="flex flex-col hidden sm:flex"` which is a CSS bug (`hidden` and `flex` collide). Fix to `hidden sm:flex flex-col`.

### 4. `WelcomeBonus.tsx`, `CVUploadStep.tsx`, `ServicesTour.tsx`, `ProfileQuickSetup.tsx`
Sweep all copy — buttons, headings, helper text — for the same robotic tone. I'll read each and rewrite in the same style as the table above. (These are bigger files, so the actual rewrites happen in code; this plan just commits to doing them.)

### 5. AuthChat surface tweaks (still no logic change)
- Soften the "Hiring? Apply for company access →" link — keep it but make it less prominent (move to the very bottom in muted).
- The "Use email & password instead" link stays as-is — it's the fallback path you asked us to keep.
- `getInputPlaceholder` strings updated to match new tone.
- Password strength labels: keep "Weak / Fair / Good / Strong" (already fine).

### 6. AuthClassic.tsx
Same copy sweep — I haven't fully reviewed it yet, but I'll apply the same tone rules. No structural changes (still the fallback).

### 7. `AuthGate.tsx`
Loading copy: "Verifying session…" instead of any technical phrase.

## What 1.1 does NOT do (saved for later sub-phases)

- **No** addition of a Google sign-in button (1.2).
- **No** change to the signUp 1.5s timeout / session-poll dance (1.2).
- **No** new onboarding steps for profession/role (1.3 — this is where we'll wire `profession_categories` + `professional_roles` into the wizard).
- **No** Career Coach agent (1.4 — and per your guidance, we will **reuse the existing `ai_instructors` per-`profession_category_id`** as the Career Coach persona, not build a parallel set. CV parsing in 1.4 will resolve the closest `professional_role` → its `profession_category_id` → that profession's `ai_instructor` becomes the talent's coach).
- **No** Zod validation of agent responses (1.2).
- **No** rate limiting (1.2).
- **No** `createStudentProfile` cleanup (1.2).
- **No** telemetry (1.5).

## How we verify 1.1

After the change, walk these flows in the 390px viewport and confirm every visible string reads naturally:

1. Open `/auth/chat` fresh (no session). Type a new email → name → country → phone → captcha → password → land on `/app/feed`.
2. Open `/auth/chat` with an existing email. Enter password → land on dashboard.
3. Tap "Forgot password?" → reset email → click link → `/reset-password` → set new password.
4. Open `/auth/classic` → both sign-in and sign-up paths.
5. Trigger a deliberate failure (wrong password, bad email format) — confirm error copy is human.
6. Complete the 3-step onboarding wizard, then run "Skip for now" on a separate test account.

No DB seed, no migration, no edge function deploy needed.

## Why this order is right

You asked us to keep Aisha but harden everything around her. Trying to fix the state machine, swap captcha logic, or add new onboarding steps **before** cleaning the surface copy means every diff is mixed (UX + logic) and harder to review. Doing 1.1 first gives us a clean baseline; 1.2 then becomes a focused logic-only pass; 1.3 is a focused structural pass; 1.4 is the new Career Coach.

---

**Ready to execute on approval.** Once approved I'll switch to build mode and ship 1.1 as a single coherent change set, then come back for 1.2 planning.
