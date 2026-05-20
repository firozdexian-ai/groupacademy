## Phase 5.7 — `marketing` domain vertical slice

Pure admin domain — no talent-facing routes. Extract 13 admin tabs + 5 lead-management subviews + 1 graph hook + 1 typed edge contract for the only edge invoke in the area (`lead-hunt-match`).

### Scope

**Admin UI → `src/domains/marketing/components/admin/` (+ barrels at `src/components/dashboard/marketing/*`)** — 13 files
- `AccessCodesTab`, `AdminsRepsTab`, `BannersTab`
- `CommunityMessagingChannelTab` (wrapper around `MessagingChannelsTab` — re-import from `@/domains/messaging`)
- `ContentOutreachTab`, `LeadsActivitiesTab`, `MarketingAnalyticsTab`, `MktSimpleTabs`
- `ServiceOutreachTab`, `TalentOutreachTab`, `ThemesTab`
- `StandaloneMockInterviewCodeGenerator`, `StandaloneSalaryCodeGenerator`

**Admin leads → `src/domains/marketing/components/admin/leads/` (+ barrels at `src/components/dashboard/marketing/leads/*`)** — 5 files
- `LeadHunterManager`, `MockInterviewCodeGenerator`, `MockInterviewLeadsManager`
- `SalaryAnalysisCodeGenerator`, `SalaryAnalysisLeadsManager`

**Hooks → `src/domains/marketing/components/admin/hooks/` (+ barrel at `src/components/dashboard/marketing/hooks/useMarketingGraph.ts`)** — 1 file
- `useMarketingGraph`

**Edge contract → `src/edge/contracts/marketing.ts`**
- `LeadHuntMatchRequest`: `{ jobTitle, companyName, jobDescription, leadsRequested }`
- `LeadHuntMatchResponse`: `Record<string, unknown>` (permissive — UI reads `data` opaquely)

**API manifest → `src/domains/marketing/api/manifest.ts`**
- `marketingApi.leadHuntMatch(body)` wraps `supabase.functions.invoke("lead-hunt-match", { body })` and returns the typed envelope.

**Domain index → `src/domains/marketing/index.ts`**
- Re-export all admin tabs, leads, hook, `marketingApi`.

**F3 sweep**
- Replace the single `supabase.functions.invoke("lead-hunt-match", …)` in `LeadHunterManager` with `marketingApi.leadHuntMatch(…)`.
- Fix the internal import in `CommunityMessagingChannelTab` to point at `@/domains/messaging/components/admin/MessagingChannelsTab` (matches Phase 5.5 + 5.6 pattern).
- Rewrite any `../hooks/useMarketingGraph` or `../DashboardSkeleton` relative imports to absolute `@/` paths after copy.

### Importers that keep working via barrels
- `src/pages/Dashboard.tsx` — sole external consumer of `components/dashboard/marketing/*`.

### Verification
- Type-check passes.
- `/dashboard` Marketing group tabs (Overview / Banners / Themes / Content / Service / Talent / Community Messaging / Analytics / Access Codes / Leads / Admins) all mount.
- Lead Hunter "Hunt leads" action still fires through `marketingApi.leadHuntMatch`.
- `rg "functions.invoke" src/domains/marketing/` returns 0.

### Out of scope
- `useOffers`, `useOnboarding` (those belong to `talent`/`onboarding` domains — not marketing).
- Public marketing landing pages (`/`, `/about`, `/pricing`) — owned by the marketing shell, separate from this admin extraction.
- `src/components/marketing/` (does not exist).
- Phases 6–9.

### Risk
- Low/medium. 19 files, 1 edge fn, 1 cross-domain (messaging) import to retarget. No talent UI to retest.

### Progress after 5.7
~53%. Next: 5.8 ir (Investor Relations admin group).

### Roadmap remainder
```text
5.8  ir
5.9  finance
5.10 institutions
5.11 workforce
5.12 ugc
5.13 dashboard residuals (jobs admin, agents admin, etc.)
Phase 6  platform/ extraction (notifications, credits, payments)
Phase 7  shells/*/routes.tsx + React.lazy
Phase 8  retire barrel re-exports
Phase 9  edge/contracts/ for every domain
```
