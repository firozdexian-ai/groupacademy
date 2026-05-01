
# Phase 11B — Jobs Hub, Career Agents & Menu Coverage

Scope: Jobs Hub (`/app/jobs`), Saved Items (`/app/saved`), My Applications (`/app/applications`), the 7 career agents, plus filling in missing pages referenced from the talent sidebar/burger menu and the desktop "Me" dropdown.

---

## 1. Jobs Hub — UX & language overhaul (`src/pages/app/JobsHub.tsx`)

Current page is loaded with "neural / telemetry / artifact / registry / synthesis / nodes" jargon, oversized italic black caps, and giant `rounded-[40px]` shells that conflict with the rest of the LinkedIn-style talent app.

Changes:
- **Rewrite all copy** to plain English, e.g.:
  - "Neural Agents" → "Career agents", "Artifacts" → "Browse jobs", "By Entity" → "Companies", "By Registry" → "Locations"
  - "Initialize Neural Discovery" → "Get AI job matches"
  - "Synthesizing Career Artifacts" → "Finding jobs for you"
  - "Active Nodes" → "open roles"
  - "Geospatial Registry" → "Jobs by country", "Integrated Listings" → "open roles"
  - Remove the `Operational Metadata Footer` and `v2.6 Synchronized` badge.
- **Tighten visual system**: drop `rounded-[28px..40px]`, italic-uppercase headings, and `tracking-[0.3em]`. Use the same card styling as `JobCard` / `Feed` (`rounded-2xl`, `text-sm font-semibold`, neutral spacing).
- **Mobile compaction**: switch outer container to `px-3 py-3 pb-28 space-y-6` (currently `px-6 py-6 pb-40 space-y-10`); tab bar `h-12` not `h-16`.
- **Tab order & defaults**: change to `Browse | Companies | Locations | Agents` and default to `Browse` (most users want jobs first, agents are an assist).
- **Match-discovery CTA**: keep AI recommendations but move the credit cost into a small inline `10 credits` chip beside the button instead of a separate boxed line.
- **Empty/loading states**: add a real skeleton row for collection while `collectionData` is undefined (currently nothing renders).

## 2. Career agents — align with Agent OS (`ai_agents` + `agent-runtime`)

There are 7 active career agents (`job-hunter`, `career-consultant`, `cv-coach`, `application-helper`, `interview-coach`, `remote-expert`, `career-abroad`). All currently have `allowed_tools = {}`, so the Agent OS tool-calling pipeline (`loadTools` in `agent-runtime/index.ts`) never fires for them. They are pure chat with no real action surface, which contradicts the Agent OS vision (search_kb, score_job_match, parse_cv, etc. already exist in `agent_tools`).

Changes (data migration, `UPDATE ai_agents`):

| agent_key | allowed_tools | rationale |
|---|---|---|
| `job-hunter` | `suggest_jobs, score_job_match, search_kb` | finds + ranks jobs, cites KB |
| `cv-coach` | `parse_cv, search_kb` | reads talent CV, references rubric |
| `application-helper` | `enhance_cover_letter, prepare_external_app, score_job_match, parse_cv` | core apply-assist toolset |
| `interview-coach` | `generate_interview_q, analyze_interview, search_kb` | mock interview loop |
| `career-consultant` | `score_job_match, analyze_job_market, search_kb` | strategy + market data |
| `remote-expert` | `suggest_jobs, score_job_match, search_kb` | remote-filtered discovery |
| `career-abroad` | `analyze_job_market, search_kb, suggest_jobs` | abroad market intel |

Also:
- **System-prompt cleanup**: `job-hunter` and `cv-coach` prompts hard-code Bangladesh/"ENGLISH ONLY" rules — soften to global per memory rule (Global Product Standard). Update via migration on `ai_agents.system_prompt`.
- **Pricing audit**: career agents are uniform `connection_fee = 1.3`, `message_credit_cost = 0.5`. Keep — this matches the fractional credit memory (~$0.026 / message). Document the values in a small "How credits work" link inside `AgentChat` header (no logic change needed; deduction already happens via `agent-runtime` `chargeTalent`).
- **Verify deduction path**: `agent-runtime` already deducts `message_credit_cost` per assistant turn and `connection_fee` on first contact via `chargeTalent` → `talent_credits` + `credit_transactions`. No code change needed; we add a smoke-test note in plan.md.

## 3. Jobs Hub agent panel — make it useful

Today the "Agents" tab just lists generic career+education agents. Improve:
- **Filter to job-relevant agents only** (`category = 'career'`, drop education/IELTS — those belong in Learning).
- **Add purpose label** under each card (one short line: "Find roles that fit you", "Polish your CV", "Draft tailored cover letters", "Practice interviews", etc.) sourced from a new `purpose` column or hard-coded map keyed on `agent_key`. Use hard-coded map to avoid schema churn.
- **Add credit chip** showing `connection_fee + msg cost` so users know what a chat costs.
- **Quick-action cards** above the agent list:
  - "Get AI job matches" → triggers `suggest-jobs-for-talent`
  - "Score me against a job" → opens job picker, calls `score-job-match`
  - "Polish my CV" → opens `cv-coach`
  - "Practice an interview" → opens `interview-coach`

## 4. Saved Items polish (`src/pages/app/SavedItems.tsx`)

- Strip "Archive Registry / Telemetry Node / Artifacts Sync'd / Initialize Discovery Phase" jargon → "Saved", "items saved", "Browse the feed".
- Replace `rounded-[24px..48px]` and `text-4xl font-black uppercase italic` with the standard `rounded-2xl`, `text-2xl font-semibold` used elsewhere.
- Remove the dead "event" type from `TYPE_ICONS`/`TYPE_COLORS` (events aren't saveable here) or wire it through.
- Mobile-tighten container: `px-4 py-4 pb-28 space-y-4`.
- Drop the "Operational Trace Footer".

## 5. My Applications polish (`src/pages/app/MyApplications.tsx`)

- Rewrite copy: "Registry Ledger" → "My applications", "Active Professional Applications" → "Track your job applications", timeline labels `Registry/Logic Check/Synthesis/Handshake` → `Submitted/Reviewed/Interview/Offer`. "Execute Synthesis" → "Take assessment", "Initialize Interview" → "Generate AI interview", "Result Analysis: 82%" → "View result · 82%".
- Fix tabs: only the `all` tab has content; `submitted/reviewed/shortlisted` panes are missing `<TabsContent>`. Either render all four by filtering `applications` by `application_status`, or remove unused tabs.
- Mobile: compact to `px-4 py-4 pb-28 space-y-6`, switch oversized `h-60` skeletons to `h-32`.

## 6. Sidebar/menu coverage — fill missing pages

These items exist in the burger menu and/or `Me ▼` dropdown but route to placeholders or other pages:

| Menu item | Today | Action |
|---|---|---|
| **Withdraw earnings** | navigates to `/app/profile` (no withdrawal UI) | Build `src/pages/app/Withdrawals.tsx` at `/app/withdrawals`. Show withdrawable (Earned) balance from `useCredits`, request form (amount, bKash/bank), insert into a new `withdrawal_requests` table; admin-side picks it up under `Credits Manager`. |
| **Verify your profile** | opens `/app/profile/edit` | Replace with a dedicated `/app/profile/verify` page summarizing what's required (CV, photo, phone, country, email confirm) with one-click jumps. Keep edit link as a fallback. |
| **Career Abroad** | exists `/app/abroad` ✓ | OK, no change. |
| **Switch to Company Portal** | opens `/company` ✓ | OK. |
| **Language** | non-functional toggle | Hide for now (i18n not in scope) and add a `Coming soon` tag, OR remove the row entirely. Recommend: remove. |
| **Refer the app** | `navigator.share` ✓ | OK. |
| **About GroUp Academy** | opens `/` | OK. |

Admin sidebar (`AdminSidebar.tsx`) — verified: every `value` (e.g. `withdrawals` not present yet, `agent-payouts`, `withdrawals` admin view) is rendered through `Dashboard.tsx`. Add admin tab `withdrawals` that lists rows from the new `withdrawal_requests` table with approve/mark-paid actions. Insert under existing **AI & Monetization** group below `Credits Manager`.

## 7. Database migration

```sql
-- 7a. Career agents — wire allowed_tools
UPDATE ai_agents SET allowed_tools = ARRAY['suggest_jobs','score_job_match','search_kb']         WHERE agent_key = 'job-hunter';
UPDATE ai_agents SET allowed_tools = ARRAY['parse_cv','search_kb']                                 WHERE agent_key = 'cv-coach';
UPDATE ai_agents SET allowed_tools = ARRAY['enhance_cover_letter','prepare_external_app','score_job_match','parse_cv'] WHERE agent_key = 'application-helper';
UPDATE ai_agents SET allowed_tools = ARRAY['generate_interview_q','analyze_interview','search_kb'] WHERE agent_key = 'interview-coach';
UPDATE ai_agents SET allowed_tools = ARRAY['score_job_match','analyze_job_market','search_kb']     WHERE agent_key = 'career-consultant';
UPDATE ai_agents SET allowed_tools = ARRAY['suggest_jobs','score_job_match','search_kb']           WHERE agent_key = 'remote-expert';
UPDATE ai_agents SET allowed_tools = ARRAY['analyze_job_market','search_kb','suggest_jobs']        WHERE agent_key = 'career-abroad';

-- 7b. Soften region-locked prompts (job-hunter, cv-coach, career-consultant)
-- Replace BD-specific clauses with global wording.

-- 7c. Withdrawals
CREATE TABLE public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  amount_credits numeric(12,1) not null check (amount_credits > 0),
  method text not null check (method in ('bkash','bank')),
  payout_details jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','paid','rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Talent can insert own withdrawal" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));
CREATE POLICY "Talent can read own withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage withdrawals" ON public.withdrawal_requests
  FOR ALL USING (has_any_admin_role(auth.uid())) WITH CHECK (has_any_admin_role(auth.uid()));
```

## 8. Files to edit / create

Edit:
- `src/pages/app/JobsHub.tsx` — copy + layout + agent panel + quick actions.
- `src/pages/app/SavedItems.tsx` — copy + layout.
- `src/pages/app/MyApplications.tsx` — copy + tabs + layout.
- `src/layouts/TalentAppShell.tsx` — repoint Withdraw + Verify menu items, drop Language row.
- `src/App.tsx` — add `/app/withdrawals` and `/app/profile/verify` routes.
- `src/components/dashboard/AdminSidebar.tsx` + `src/pages/Dashboard.tsx` — add Withdrawals admin tab.

Create:
- `src/pages/app/Withdrawals.tsx`
- `src/pages/app/ProfileVerify.tsx`
- `src/components/dashboard/WithdrawalsPanel.tsx`
- `supabase/migrations/<ts>_phase_11b.sql`

No edge-function changes needed — `agent-runtime` already supports `allowed_tools` and credit deduction.

## 9. Out of scope (next phases)
- Learning Hub overhaul (separate pass).
- Gigs / AI Agents marketplace polish.
- i18n / language switcher.
- Real bKash/bank integration for withdrawals — only the request workflow lands now.

Approve to implement.
