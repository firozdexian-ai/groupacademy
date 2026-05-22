## A1 + A2 Re-audit — gaps found

We shipped A1-FIX and A2 already, but a deeper pass found several real issues — some are direct contradictions of the A2 closeout notes, others are user-visible jargon, and a few are correctness bugs that affect company/admin signups and locked-out users.

### A1 — Auth (gaps)

**P0 — must fix**
1. **`useAuth.signUp` still hardcodes `country: "BD"` / `country_code: "+880"`** (lines 158-159). The A2 audit explicitly claimed these were removed, but the auth path itself still defaults to Bangladesh for every email signup that doesn't pass values. Direct contradiction of `mem://strategy/global-product-standard` and `mem://auth/mandatory-global-phone-capture`. → fall back to `""` / `null`; let onboarding + PhoneCaptureStep set them.

2. **Open-redirect via `?returnTo=`**. None of `AuthChat`, `AuthClassic`, `AuthCallback`, `Start`, or `JobApplyRedirect` validate that `returnTo` is a same-origin relative path. A crafted `?returnTo=https://evil.com` would navigate users off the app after sign-in. → add a `safeReturnTo()` helper that only accepts paths starting with `/` and not `//`.

**P1 — fix before launch**
3. **`AccountUpgradeModal` is jargon top-to-bottom** and user-visible: chip reads "Infrastructure Upgrade Active", sr-only title is "Account Infrastructure Upgrade Protocol", description mentions "deep learning core infrastructure pipelines" and "multi-agent compute environments". Screen readers and search indexers pick this up. → replace with "Finish setting up your account" / "We need a couple more details to personalize your experience."

4. **Welcome email fires twice on email signup**. `useAuth.signUp` (line 172) AND `AuthCallback` (line 33-43) both call `sendTransactionalEmail` with the same `idempotencyKey`. Server is idempotent but we waste an edge invocation per signup. → drop the call from `useAuth.signUp` (let `AuthCallback` own welcome email for both email + OAuth).

5. **`AuthChat` completion button bypasses `resolvePostAuthRoute`** (line 215): `navigate(searchParams.get("returnTo") || "/app/feed")`. A company/admin who somehow lands in the chat flow goes to `/app/feed` instead of `/company` / `/dashboard`. → use `resolvePostAuthRoute(accountType, returnTo)`.

6. **`signOut` always navigates to `/`**. Admin/company users get bounced to the marketing landing instead of `/auth`. Minor UX. → route to `/auth` for non-talent users, `/` otherwise; or unify to `/auth` for everyone (cleaner).

7. **Account-existence enumeration on `resetPassword`** (`useAuth.ts:215`): toast confirms a link was sent regardless of account existence — but Supabase response leaks 422 for unknown emails on some configurations. → swallow error, always toast "If that email is registered, we've sent a reset link."

8. **`AuthCallback` retry for new OAuth users is one-shot 600ms**. On slow connections the `talents` row trigger may take longer; user lands on `accountType==='unknown'` → routed to `/app/feed` fallback even if they should go elsewhere. → poll up to 3× at 600ms intervals.

9. **Carry-overs from A1 not yet closed**: `talents.country_code = "BD"` backfill for admin row, manifest preview 401, auth audit log retention check.

**P2**
10. `AuthClassic.tsx:402-405` "Try the chat experience instead" — points back to `/auth` (chat) ✓ correct, but UX is confusing. Consider relabeling.

### A2 — Onboarding (gaps)

**P0 — must fix**
11. **No exit hatch from `OnboardingGuard`**. `OnboardingWizard` requires non-empty `countries`, `career_stages`, `schools(academy_id)` lookups. If any lookup is empty (e.g. stage has no `academy_id` → empty schools), user sees "No fields available for this track yet" and is **permanently locked out of the app**. Same applies to `PhoneCaptureModal` and `AccountUpgradeModal`. → add a "Sign out" link in the corner of all three uncloseable gates so users can recover.

12. **`PhoneCaptureStep` promises verification it doesn't perform**. Copy says "to send verification codes" but no OTP is sent or verified. Currently we only capture + dedupe. → either (a) drop the verification-codes line, or (b) actually send an OTP. Lowest-risk for launch is (a).

**P1**
13. **No company onboarding path post-signup**. `OnboardingGuard` only handles talents. Companies created via `/for-companies` admin flow get an `account_type='company'` user but no in-app guided setup. Out-of-scope for A2 to build, but should be documented and ProtectedRoute should at minimum not crash. → audit-only confirmation; flag for A9/Companies group.

14. **Telemetry event names are still jargon** in `OnboardingWizard` (`onboarding_institution_node_selected`, `onboarding_phone_country_code_altered`, `onboarding_wizard_preauth_stashed`). These appear in analytics dashboards for the team. → rename to plain English (`onboarding_institution_selected`, etc.).

15. **`OnboardingWizard` JSDoc and section comments are still jargon-heavy**: "Multi-Stage Personalization Wizard", "Phase Z0 Hardened", "Ingress", "HUD HEADER COVER BAR METRIC PLOTS ROW", "ENFORCING_IMMUTABLE_ONBOARDING_GATEWAY_LOCK". Not user-visible but distracting in code review. → strip.

16. **Generic error toast hides actionable info**. On submit failure (line 332) we say "Something went wrong setting up your profile." Doesn't help the user act. → keep the friendly toast but log error code to Sentry/console (already via `trackError`).

**P2**
17. `OnboardingWizard.tsx:222` legacy upgrade gate fires when `careerStageId || institutionId` is missing — but real "legacy" condition is just `!careerStageId` (institutionId can legitimately be null for freeform). → tighten gate so freeform-institution users aren't asked to re-onboard.

### Scope to implement now

This plan covers only **P0 + P1**. P2s tracked but deferred.

### Execution

| # | File | Change |
|---|------|--------|
| 1 | `src/hooks/useAuth.ts` | Drop hardcoded `"BD"` / `"+880"` defaults in `signUp` user_metadata; drop duplicate welcome-email call. |
| 2 | `src/lib/safeReturnTo.ts` (new) | `safeReturnTo(raw?: string \| null): string \| null` — accepts only `/path` (no `//`, no scheme). |
| 2 | `src/pages/AuthChat.tsx`, `AuthClassic.tsx`, `AuthCallback.tsx`, `Start.tsx`, `App.tsx` (`JobApplyRedirect`), `src/components/ProtectedRoute.tsx` | Pipe `returnTo` through `safeReturnTo()`. |
| 3 | `src/components/auth/AccountUpgradeModal.tsx` | Replace jargon copy in chip / title / description; strip CTO/HUD comments. |
| 5 | `src/pages/AuthChat.tsx` | `isComplete` button uses `resolvePostAuthRoute(accountType, returnTo)`. |
| 6 | `src/hooks/useAuth.ts` | `signOut` navigates to `/auth` for non-talents (or unify to `/auth`). |
| 7 | `src/hooks/useAuth.ts` | `resetPassword` swallows errors + returns neutral toast. |
| 8 | `src/pages/AuthCallback.tsx` | Replace one-shot 600ms retry with up to 3 polls. |
| 11 | `src/components/auth/AccountUpgradeModal.tsx`, `src/components/onboarding/PhoneCaptureModal.tsx`, and the `OnboardingWizard` header | Add a small `Sign out` link in the corner that calls `useAuth().signOut()`. |
| 12 | `src/components/onboarding/PhoneCaptureStep.tsx` | Drop "verification codes" from copy. |
| 14 | `src/components/onboarding/OnboardingWizard.tsx` | Rename telemetry event names to plain English. |
| 15 | `src/components/onboarding/OnboardingWizard.tsx` | Scrub JSDoc + section comments. |
| 17 | `src/App.tsx` | Tighten `needsUpgrade` to just `!careerStageId`. |
| — | `.lovable/launch-audit.md` | Append "A1/A2 re-audit shipped" block. |

No DB migrations. Est. 45-60 min.

### Out of scope (tracked)

- Company onboarding wizard (#13) → A9 / Companies group.
- `country_code` backfill, manifest 401, audit log retention (carry-overs) → pre-launch ops sweep.
- P2 #10, #16 partial, #17 if we don't get to it.
