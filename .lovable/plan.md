# Phase 9g — Small-domains edge function hardening sweep

Apply the hardened pattern (talent/agents/jobs/abroad/learning) to the remaining six small domains in one combined sweep, since each is tiny on its own. After this, every owner-domain has a typed wrapper layer and we can confidently add a tooling guard in Phase 9h.

## Scope — 6 domains, 13 edge functions

| Domain | Functions | In-domain callers | New (currently raw) |
|---|---|---|---|
| gigs | `ai-bid-coach`, `generate-outreach-message`, `parse-job-post`, `generate-job-share-caption` | 4 components | — |
| profile | `claim-public-handle`, `parse-cv` | 2 components + 1 hook | hook still raw |
| finance | `update-stripe-secret`, `process-withdrawal`, `create-checkout` | 3 admin components + 1 talent component | — |
| messaging | `unipile-connect` | 0 (manifest only) | `MessagingChannelsTab` (×4 raw calls) |
| marketing | `lead-hunt-match` | 1 admin component | — |
| analytics | (none today) | — | `admin-report-builder` in `ReportsBuilderTab` |

Notes:
- `generate-outreach-message`, `parse-job-post`, `generate-job-share-caption`, `parse-cv` are owned by **talent / jobs / profile** respectively. The current gigs manifest re-wraps them, which is exactly the duplication the README forbids. Phase 9g will collapse those callers onto the owner-domain wrappers and drop the duplicates.

## Steps

### 1. Contracts pass
- Audit `src/edge/contracts/{gigs,profile,finance,messaging,marketing}.ts` against real call-site bodies; tighten with `.passthrough()` where needed.
- Create `src/edge/contracts/analytics.ts` with `AdminReportBuilderRequest` + response schema (read `ReportsBuilderTab.tsx` body shape verbatim — Phase 9 preserves runtime behavior).
- Remove cross-owner duplicates from `gigs.ts` (`GenerateOutreachMessageRequest`, `ParseJobPostRequest`, `GenerateJobShareCaptionRequest`) — re-export from the owner domain instead.

### 2. Wrapper files (one per domain)
For each domain, create `src/domains/<domain>/api/<domain>Api.ts` with **named async wrappers** using the canonical pattern:

```ts
const { data, error } = await supabase.functions.invoke("<fn>", { body });
if (error) throw new EdgeFunctionError("<fn>", error);
return parseEdgeResponse("<fn>", <fn>ResponseSchema, data);
```

Wrappers to ship:
- `gigs/api/gigsApi.ts` → `aiBidCoach` only (the other three are cross-domain re-exports of owner wrappers).
- `profile/api/profileApi.ts` → `claimPublicHandle`, `parseCv` (the `parse-cv` owner is profile per the existing manifest — confirm vs jobs README row before finalizing; if jobs already owns it, drop the duplicate and keep the import path single-source).
- `finance/api/financeApi.ts` → `updateStripeSecret`, `processWithdrawal`, `createCheckout` (note: today's manifest leaks the raw `{ data, error }` shape — wrappers will return parsed data and throw on failure; callers updated accordingly).
- `messaging/api/messagingApi.ts` → `unipileConnect`.
- `marketing/api/marketingApi.ts` → `leadHuntMatch` (today's manifest also leaks `{ data, error }`; same fix).
- `analytics/api/analyticsApi.ts` → `adminReportBuilder`.

### 3. Convert manifests + index.ts to barrels
Each `<domain>/api/manifest.ts` and `<domain>/index.ts` becomes pure re-export. Delete the `<domain>Api` const + `<Domain>Api` type.

### 4. Migrate call sites (~14 files)
- **gigs (4):** `JobSharingGigForm`, `JobPostingGigForm`, `CVUploadGigForm`, `BidCoachDialog`.
- **profile (3):** `CVUploadSection` (in-domain), `usePublicProfileSettings` (raw → `claimPublicHandle`), plus the `profileApi.parseCv` caller already in `gigs/CVUploadGigForm`.
- **finance (4):** `CreditPurchaseSheet`, `WithdrawalsTab`, `PaymentSettingsTab` (×2 invocations).
- **messaging (1):** `MessagingChannelsTab` — replace all 4 raw `unipile-connect` invokes with `unipileConnect`.
- **marketing (1):** `LeadHunterManager` — adapt from `{ data, error }` to try/catch.
- **analytics (1):** `ReportsBuilderTab` — replace raw `admin-report-builder` invoke with `adminReportBuilder`.

### 5. Update `src/edge/README.md`
Add ownership rows for all 6 new domains so every shipped wrapper is accounted for.

### 6. Update `.lovable/known-edge-contract-drift.md`
- Log any drift discovered while writing contracts.
- Note that returning-shape change (raw `{data,error}` → throw + parsed payload) is intentional behavior alignment, not regression.
- If `parse-cv` ownership is genuinely shared between jobs (README) and profile (manifest), document the resolution there.

### 7. Verify
- `tsc` clean.
- `rg "supabase.functions.invoke" src/domains` returns 0 hits outside `<domain>Api.ts` files.
- `rg "(gigsApi|profileApi|financeApi|messagingApi|marketingApi|analyticsApi)\."` returns 0 hits repo-wide (named imports only).

### 8. Mark Phase 9g ✅ and queue Phase 9h
Phase 9h scope (preview, **not** part of 9g):
- ~45 cross-domain raw invokes outside `src/domains/*` (pages, hooks, gro10x, lib helpers) — bulk migrate to owner-domain wrappers.
- Add an ESLint rule banning `supabase.functions.invoke` outside `src/domains/*/api/*.ts` and `src/components/ai-instructor/AIChatPanel.tsx` (the one documented SSE streaming exception).

## Out of scope for Phase 9g
- Out-of-domain raw invokes (Phase 9h).
- Fixing the existing drift entries (call-site body bugs) in `known-edge-contract-drift.md`.
- Any behavior change beyond returning parsed data + throwing on failure (which a few finance/marketing callers already expect via destructuring — these are the only callers needing a small `try/catch` adaptation).

## Risk
Low. Pattern is identical to five completed phases; total touched files ≈ 20; every change is mechanical and verified by `tsc` plus the two `rg` invariants.
