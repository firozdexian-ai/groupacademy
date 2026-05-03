# Admin Sidebar Groups 7–10 Restructure

Following your handwritten plan, add four new stakeholder groups after **Institutions & Organizations** (currently #6). All conversational agents shown in the notes move to `/dashboard/chat` (not new sidebar tabs), and we remove duplicates already covered elsewhere.

## New Sidebar Order (admin)

1. Overview · 2. Talent · 3. Companies · 4. AI Agents · 5. Investors · 6. Institutions
7. **Team & Workforce**
8. **GTM (Geography)**
9. **UGC & Contents**
10. **Jobs**
… then Marketing & Outreach (slimmed), Career Abroad, Monetization (slimmed), Platform Config.

## Group 7 — Team & Workforce
Tabs (data managers only, agents go to Chat):
- Dashboard (KPIs: headcount, attrition, payout this month)
- Grades & Levels
- Verticals
- Functions
- Teams
- Workforce Members *(moves out of standalone "Workforce" group)*
- Targets & Incentives
- Onboarding (checklists & status)
- Rewards & Payroll

Chat agents added: **CHRO**, **HR Admin / Onboarding**, **Recruiter**.

## Group 8 — GTM (Geography)
Tabs:
- Dashboard (geo heatmap of users, revenue, jobs)
- Countries
- States / Regions / Divisions
- Cities
- Clusters (custom groupings, e.g. "Dhaka Metro", "GCC")

Chat agent added: **Country Agent** (per-country GTM analyst/outreach).

## Group 9 — UGC & Contents
Consolidates content scattered across Learning, Marketing & Outreach, and Monetization.

Tabs:
- Content Overview (KPIs across all UGC types)
- Free Videos *(moves from Learning)*
- Blog Posts *(moves from Marketing & Outreach)*
- Feed Posts *(moves from Marketing & Outreach)*
- Competitions & Events *(moves from Marketing & Outreach)*
- Submissions, Gig Approval & Payout *(merges Manage Gigs + Marketplace Gigs + Gig Submissions from Monetization)*

Chat agents added: **Free Video Agent**, **Blog Post Agent**, **Feed Post Agent**, **Competition & Event Agent**, **UGC Outreach Agent**.

## Group 10 — Jobs
Replaces the small "Recruitment" group with a full module.

Tabs:
- Jobs Overview *(replaces Jobs KPIs)*
- Jobs Upload & Approval (new — moderation queue for posted jobs)
- Jobs Manager *(was Jobs Hub)*
- Applications (admin view of all applicants)
- Jobs Assessments (assessment templates & results)

Chat agent added: **Jobs Outreach Agent** (B2B mailto drafts to hiring managers).

## Duplicates & Cleanup

Removed / merged:
- Standalone **Workforce** group → folded into Group 7.
- **Recruitment** group → replaced by Group 10.
- Learning › *Free Videos* → moved to Group 9.
- Marketing & Outreach › *Blog Posts*, *Feed Posts*, *Competitions* → moved to Group 9.
- Monetization › *Manage Gigs*, *Marketplace Gigs*, *Gig Submissions* → merged into Group 9 single tab.
- Marketing & Outreach › *CV Outreach*, *Content Outreach*, *Service Outreach* → kept (these are operational queues, not agents) but flagged for future consolidation under one "Outreach Hub".

## Technical Changes

- **`src/components/dashboard/AdminSidebar.tsx`** — replace Workforce + Recruitment groups; add Groups 7/8/9/10; remove moved items from Learning/Marketing/Monetization.
- **`src/lib/adminAgents.ts`** — register 9 new chat agents: `hr-chro`, `hr-onboarding`, `hr-recruiter`, `gtm-country`, `ugc-video`, `ugc-blog`, `ugc-feed`, `ugc-events`, `ugc-outreach`, `jobs-outreach`. (Each gets a lightweight edge function mirroring `admin-inst-outreach` / `admin-inst-analyst` patterns.)
- **`src/pages/Dashboard.tsx`** — register lazy components for new tab keys (`hr-overview`, `hr-grades`, `hr-verticals`, `hr-functions`, `hr-teams`, `hr-targets`, `hr-onboarding`, `hr-payroll`, `gtm-overview`, `gtm-countries`, `gtm-states`, `gtm-cities`, `gtm-clusters`, `ugc-overview`, `jobs-overview`, `jobs-upload`, `jobs-applications`, `jobs-assessments`). Reuse existing components where possible (e.g. Free Videos, Blog, Feed, Competitions, Gigs, Jobs Hub).
- **Database** — add minimal tables only where missing: `hr_grades`, `hr_verticals`, `hr_functions`, `hr_teams`, `hr_targets`, `hr_onboarding_tasks`, `hr_payroll_runs`, `gtm_clusters`. (Countries/states/cities already exist in normalization triggers.) Admin-only RLS.
- **Edge functions** — scaffold the 10 new agent functions with the standard auth + Lovable AI gateway pattern. `verify_jwt = false` in `supabase/config.toml` (functions self-validate).

No changes to Talent, Companies, AI Agents, Investors, Institutions groups.

Approve to implement.
