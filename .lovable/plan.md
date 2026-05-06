# Phase 1.2 — Talent Auth Hardening (Revised)

Goal: make the talent auth flow (Aisha + classic) deterministic, resilient, and observable. Add Google sign-in. Defer email/phone *verification* to the later profile-verification phase — sign-up itself stays one-shot.

## Decisions captured from this round

- **Auto-confirm email = ON.** Users land in the app immediately after signup. Email verification will be enforced later as part of *profile verification* (gates trust badges / payouts / etc., not access).
- **Anti-abuse via duplicate-profile heuristic** during CV parse in onboarding (1.3). Scope here in 1.2 = enable auto-confirm + add a stub `cv_fingerprint` column we can populate in 1.3. No detection logic in 1.2.
- **Google sign-in** = "Continue with Google" button at the top of the Aisha screen (and on Classic), shown before/with the input — not a tiny link.
- **Phone OTP sign-in = out of scope.** Phone will be verified later via a WhatsApp-based mechanism designed in the verification phase.

## Findings from current code (unchanged)

1. `useAuthChat.ts` is an ad-hoc `switch` with closure drift on `collectedData` and no explicit error / awaiting states.
2. `useAuth.signUp` uses `setTimeout(1500)` + a 3×500 ms `getSession()` poll to guess whether confirmations are on. With auto-confirm ON this poll is pure latency.
3. `callAgent` swallows errors and never validates the agent reply shape (`res.action` could be `undefined`).
4. No Google sign-in anywhere.
5. `onAuthStateChange` listener and `getSession()` audit run in parallel — minor race that can flash unauthenticated UI.
6. Dead code / leftover strings: `createStudentProfile` helper, `MSG_ARTIFACT_` id prefix, `NEURAL_SERVICE_FAULT`, `// HUD: IDENTITY_STATE_LISTENER`.

## Plan

### 1.2.a — Turn on auto-confirm email
- Call `configure_auth` with `auto_confirm_email: true` (other flags unchanged).
- Update `useAuth.signUp` accordingly: after `supabase.auth.signUp` we expect `authData.session` to be present; treat its absence as a real error, not as "check your inbox".
- Drop the `setTimeout(1500)` and the 3-iteration `getSession()` poll entirely.

### 1.2.b — Deterministic state machine for `useAuthChat`
- Replace the `switch` with a typed reducer (`authChatReducer`) over `{ step, flow, collected, quiz, error }`. All transitions go through `dispatch({ type, payload })`.
- New explicit terminal states: `error_recoverable` (bad creds, network) and `error_fatal` (account locked / signup blocked) rendered as in-thread cards instead of toasts.
- Remove `collectedData` from `useCallback` deps — reducer state is read fresh inside the dispatch.
- Keep all current copy (already cleaned in 1.1) — only the wiring changes.

### 1.2.c — Validate AI agent responses with Zod
- Add `src/lib/schemas/authAgent.ts` exporting `AuthAgentReplySchema` (`reply: string`, `action: AuthAction enum`, `quiz: { answer: string } | null`).
- In `callAgent`, parse the JSON through the schema. On parse failure, log once and fall through to `getFallbackProtocol` (same behavior as a network error — now safe).
- Tighten `AuthAction` to a `z.enum` so the reducer's exhaustiveness check catches drift.

### 1.2.d — Google sign-in (managed, talent only)
- Run `configure_social_auth({ providers: ["google"] })` to enable the Lovable-managed Google provider.
- Add `signInWithGoogle()` to `useAuth` using the Lovable module:
  ```ts
  import { lovable } from "@/integrations/lovable";
  await lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}/auth/callback`,
    extraParams: { prompt: "select_account" },
  });
  ```
- Add a prominent **"Continue with Google"** button at the top of `AuthChat.tsx` (above the chat thread / always visible) and `AuthClassic.tsx`.
- Add a thin `/auth/callback` page that waits for `onAuthStateChange`, then redirects via `resolvePostAuthRoute` (uses existing `useAccountType` so OAuth users land in the right portal).
- Verify the existing `handle_new_user` trigger handles OAuth metadata gracefully (no `phone`, no `country`). If gaps, add a tiny migration with safe defaults so the `talents` row is always created.

### 1.2.e — Race-free session bootstrap in `useAuth`
- Run `getSession()` first, set state, then attach `onAuthStateChange` — eliminates the dual-source race.
- Stop calling `supabase.auth.signOut()` inside the `TOKEN_REFRESHED && !session` branch (session is already gone).

### 1.2.f — Anti-abuse stub (foundation only)
- Migration: add nullable `cv_fingerprint TEXT` column + index on `talents`. No logic yet.
- 1.3 will populate it during CV parse and run a duplicate check across active talents to block credit farming.

### 1.2.g — Cleanup
- Delete unused `createStudentProfile` from `useAuth.ts`.
- Replace `MSG_ARTIFACT_` ids with `crypto.randomUUID()`.
- Remove `NEURAL_SERVICE_FAULT` literal — throw a plain `Error("agent_unreachable")` the reducer handles.
- Strip `// HUD: IDENTITY_STATE_LISTENER` and similar leftover comments.

## Files changed (planned)

- `src/hooks/useAuthChat.ts` — refactor to reducer
- `src/hooks/useAuth.ts` — drop polling, add `signInWithGoogle`, fix race, cleanup
- `src/pages/AuthChat.tsx` — add Google button, error-state cards
- `src/pages/AuthClassic.tsx` — add Google button
- `src/pages/AuthCallback.tsx` — **new**, OAuth landing
- `src/lib/schemas/authAgent.ts` — **new**, Zod schema
- `src/App.tsx` — register `/auth/callback`
- `src/integrations/lovable/*` — generated by `configure_social_auth` (do not edit)
- DB migration: `talents.cv_fingerprint` column + index; possibly small `handle_new_user` patch for OAuth users

## Out of scope (deferred)

- Profession / seniority / goal capture → 1.3
- CV-fingerprint duplicate detection logic → 1.3
- Career Coach agent → 1.4
- Telemetry table → 1.5
- Email + phone verification (and WhatsApp connection mechanism) → later "Profile Verification" phase
- Phone-based OTP sign-in — explicitly dropped

## Open questions

None — both prior questions answered. Ready to implement on approval.
