# Fix Signup & Onboarding Drop-off

Real users are bouncing off three points:

1. Email/password signup blocks on "email not confirmed" (auth logs confirm: `error_code=email_not_confirmed`).
2. The university search at onboarding Step 3 does not respond to typing for some users.
3. Onboarding (country → stage → university → profession) runs *after* signup, so users invest effort only after the friction of creating an account.

This plan fixes all three and unifies the funnel.

---

## 1. Remove email verification at signup

**What changes (user-visible):** New email/password users land directly inside the app right after submitting the form — no inbox check, no "verify your email" wall. Google sign-in already works this way.

**Why:** Verification mail latency was the #1 blocker today. Most of our value (AI agents, jobs, abroad services) needs an account but does not need a verified inbox to start. We'll re-introduce verification later only where it matters (payouts, withdrawals, certificates).

**Technical:**
- Enable **auto-confirm email signups** on the auth provider (`configure_auth → auto_confirm_email: true`).
- In `useAuth.signUp`, replace the "check your email to verify" toast with a "Welcome — let's set up your profile" toast and route straight to the onboarding/post-auth destination.
- In `AuthClassic` + `AuthChat`, on successful signup, navigate immediately (no "check inbox" state).
- Move the welcome email fire-and-forget out of `AuthCallback` and into the signup success path so we still send it once.
- Keep password reset email flow intact (that one *must* hit inbox).

---

## 2. Fix the university search at onboarding Step 3

**What's wrong:** The combobox uses cmdk's built-in filter against `value={institution.name}`. Two real failure modes today:

- The institutions query filters by `ilike("country", country.name)`. If `gtm_countries.name` doesn't match the string stored in `institutions.country` (e.g. "United States" vs "USA", "Bangladesh" vs "BD"), the list is empty and typing looks "broken".
- When the list is large (1000 rows), cmdk's default scoring can feel unresponsive while the popover re-renders.

**Fix:**
- Switch Step 3 to server-side search: as the user types (debounced 200ms), query `institutions` with `ilike(name, %q%)` AND optional country filter, limited to ~30 rows. Set cmdk `shouldFilter={false}`.
- Make the country filter a *boost*, not a hard filter — if zero matches in the selected country, fall back to a global search so users can still find their school.
- Add a clear "Add my university" inline option when no match is found, which stores a free-text `institution` value on the talent row and queues an admin review. This stops dead-ends.
- Show small skeleton rows while the query is in flight instead of a single spinner so the input feels alive.

---

## 3. Move onboarding *before* account creation

**Goal:** the user picks Country → Career Stage → University → Profession first, *then* we ask for email/Google. This way the form fields they fill define why they should sign up, and the account creation is the final, motivated click.

**New flow:**

```
/start  (public)
   1. Country
   2. Career stage
   3. University (with "add my university" fallback)
   4. Profession / school
   5. Sign up panel: [Continue with Google]  OR  [email + password]
        → on success, immediately persist the choices to talents
        → land on /app/feed with onboarding marked complete
```

**Routing:**
- New public route `/start` rendering the existing `OnboardingWizard` in "pre-auth" mode (no Supabase writes — choices live in `sessionStorage` + URL params).
- `/auth` becomes the final step inside `/start` rather than a separate destination. Direct visits to `/auth` still work (returning users), but the default CTA from the marketing site / landing pages points to `/start`.
- After successful auth (email or Google), an effect reads the stashed selections and writes them to `talents` in one shot, then calls `provision_or_get_instance` for the Campus Ambassador (same as today).
- Google OAuth callback (`/auth/callback`) checks for stashed pre-auth selections and applies them before redirecting.

**Edge cases handled:**
- User already has an account and clicks "Sign in" at step 5 → we still apply their fresh choices, overwriting only fields they explicitly chose.
- User bails before step 5 → nothing is written, nothing to clean up.
- User signs in with Google mid-flow but their `talents` row already has these fields → we don't overwrite non-null values; we only fill blanks.
- Returning user with `onboarding_completed_at` set → `/start` short-circuits straight to `/app/feed`.

---

## 4. Funnel hygiene

- Track each step with `trackEvent`: `start_step_viewed`, `start_step_completed`, `start_signup_method_chosen`, `start_signup_succeeded`, `start_signup_failed`. This gives us a real drop-off chart per step.
- Preserve `utm_*`, `ref`, `job_id`, etc. across the pre-auth → auth handoff (already supported by `FUNNEL_KEYS` — just thread it through `sessionStorage`).

---

## Out of scope (intentionally)

- Re-enabling verification later for sensitive actions (payouts, certificates) — separate task.
- Redesign of the wizard visuals — keeping the current look.
- Phone capture step ordering — staying where it is today (post-signup).

## Technical change list

- `supabase--configure_auth` → `auto_confirm_email: true`.
- `src/hooks/useAuth.ts` — drop verify-email toast; route on success.
- `src/pages/AuthClassic.tsx`, `src/pages/AuthChat.tsx` — post-signup redirect immediately.
- `src/pages/AuthCallback.tsx` — apply stashed pre-auth onboarding selections if present.
- `src/components/onboarding/OnboardingWizard.tsx`
  - Step 3: server-side `ilike` search, `shouldFilter={false}`, "Add my university" fallback, soft country filter.
  - New `mode: "pre-auth" | "authenticated"` prop. In pre-auth mode, selections go to `sessionStorage` and the final step shows the auth panel instead of submitting to the DB.
- New page `src/pages/Start.tsx` mounting the wizard in pre-auth mode.
- `src/App.tsx` routes — add `/start`, point landing/marketing CTAs to it.
- `src/lib/postAuthRoute.ts` — if `pending_onboarding` exists in `sessionStorage`, route through a "finalize" handler before `/app/feed`.
- Analytics events as listed above.
