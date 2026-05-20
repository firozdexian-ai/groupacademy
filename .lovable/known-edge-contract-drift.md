# Known edge-function contract drift

Surfaced during Phase 9a/9b (typed wrapper migration). These are
**pre-existing** runtime bugs where a call site passes a body shape the
edge function rejects. Phase 9 does not fix them — wrappers preserve
exact runtime behavior. Fix in a dedicated follow-up.

---

## 1. `generate-outreach-message`

- **Call site:** `src/domains/talent/components/admin/TalentOutreachConsoleTab.tsx` (`generateOutreach`)
- **Sends:** `{ talent_id, product_context }`
- **Edge fn expects:** `{ parsedCV, product }` — returns 400 otherwise.
- **User-visible effect:** "Generation failed" toast on every click of
  the Generate button in the Talent Outreach Console.
- **Fix sketch:** either (a) load the talent's parsed CV client-side and
  forward as `parsedCV`, or (b) refactor the edge function to accept
  `talent_id` and resolve the CV server-side. (b) is the cleaner path.

## 2. `ai-support-assistant`

- **Call sites:**
  - `src/pages/app/ProfileVerify.tsx` — `{ type: "verification_sync_error", error, context }`
  - `src/pages/app/ProfileEdit.tsx` — `{ type: "profile_edit_error", event, context }`
  - `src/pages/app/ProfileBuilder.tsx` — `{ type: "onboarding_failure", error, context }`
- **Edge fn expects:** `{ image, context }` with `image` required —
  throws `IMAGE_ARTIFACT_REQUIRED` otherwise.
- **User-visible effect:** None — these are fire-and-forget error
  telemetry calls. Failures are swallowed; no telemetry is captured.
- **Fix sketch:** these aren't support-assistant invocations at all;
  they're error-logging events. Route them to a real telemetry sink
  (Sentry, a `log-client-error` edge function, or a `client_errors`
  table) and drop the `ai-support-assistant` call.

---

When fixing, also remove the entry here.
