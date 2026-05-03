# Fix: AI Job Assessment Generation Failure

## Root Cause (Confirmed from Edge Logs)

The `generate-job-assessment` edge function is crashing with:
```
[Fatal Assessment Gen Error]: Cannot read properties of undefined (reading '0')
```
at `aiData.choices[0].message.content` (line 93).

The function calls the Lovable AI Gateway with model `openai/gpt-4o-mini`, which is **not in the supported model list** (supported: `google/gemini-2.5-flash`, `openai/gpt-5-mini`, etc.). The gateway returns an error payload (no `choices` array), so the destructure throws and the user sees a 500.

Secondary issues:
- No HTTP-status check on the AI response (402/429/5xx fall through silently).
- No `response_format: json_object`, so output formatting is fragile.
- The 500 error surfaced to the client is opaque ("Cannot read properties...").

## Fix Plan

### 1. `supabase/functions/generate-job-assessment/index.ts`
- Switch model to **`google/gemini-2.5-flash`** (fast, supported, JSON-capable, free tier).
- Add `response_format: { type: "json_object" }` and tighten the prompt to demand pure JSON.
- Check `aiRes.ok` before parsing; map 402 → "AI credits exhausted", 429 → "Rate limited, try again", 5xx → "AI temporarily unavailable".
- Defensive parse: verify `aiData?.choices?.[0]?.message?.content` exists; if not, log full payload and throw a clear error.
- Wrap `JSON.parse` in try/catch with the raw content logged for debugging.
- Validate the parsed shape (`mcq_questions` array length ≥ 1, `voice_questions` array) before insert.

### 2. Client-side (`src/pages/app/JobAssessment.tsx` or wherever the invoke lives)
- Surface the structured error message from the edge function (not just "failed").
- Use `handleAIError` from `src/lib/aiErrorHandler.ts` for consistent toast messaging.

### 3. Verification
- Redeploy `generate-job-assessment`.
- Curl-test with a real `jobId` + `talentId` for `gro10xnow@gmail.com` → expect 200 with `assessmentId`.
- Tail edge logs to confirm no more "undefined (reading '0')" entries.

## Out of Scope
- No schema changes.
- No changes to the assessment-taking UI or scoring logic.
- Long-running async job pattern is **not** needed — Gemini Flash returns in ~5–10s, well under the 150s timeout.

## Files Touched
- `supabase/functions/generate-job-assessment/index.ts` (model swap + hardening)
- `src/pages/app/JobAssessment.tsx` (better error surfacing — confirm exact path during implementation)
