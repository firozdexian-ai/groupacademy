# Admin Restructure — Final Groups 11–16

This completes the 16-group admin sidebar. Existing groups 1–10 (Overview, Talent, Companies, AI Agents, Investors, Institutions, Workforce, GTM, UGC & Contents, Jobs) stay as-is. We now restructure the remaining legacy groups (Learning, Marketing & Outreach, Career Abroad, Monetization, Platform Config) into the layout from your notes and remove duplicates.

## Final sidebar order

1–10. (unchanged)

**11. Learn**
- Dashboard (overview)
- Academies (registry)
- Schools (registry)
- Professional Lives (career-story library)
- Career Track AI Courses
- Recorded Courses
- Online Courses (Webinars & Live Classes — merged tab)
- Enrollments
- Learner Progress
- Graduates (new — completed-with-certificate view)
- B2B Courses (company-assigned cohorts)

**12. Gig Economy**
- Overview & Dashboard
- Quick Action Gigs
- Course Projects
- Client Projects
- Gig Submissions (approval queue)
- Gig Workers & Wallet (people + payouts merged)

**13. Career Abroad**
- Dashboard
- University Programs
- IELTS Resources (redesigned as course-module style — reuses module/lesson UI)
- Roadmap Leads

**14. Marketing & Outreach**
- Analytics Overview
- Channels
- Community
- Admins & Reps
- Talent Outreach (logs)
- Content Outreach (logs)
- Service & Agent Outreach (logs)
- Leads & Activities
- Banner Management (moved from Platform Config)
- Access Codes (moved from Platform Config)

**15. Finance & Monetization**
- Dashboard
- Talent Credits Management
- Gro10x Credit Management
- Company Credit Management
- Transactions
- Payment Infrastructure (Stripe / Paddle / bKash config)
- Invoices & Payments
- Withdrawals (gig/creator payouts)

**16. Platform Config & Others**
- Support AI
- Team Members
- Notifications Center
- Anything left (system settings, feature flags)

## Duplicates removed

- `Recruitment` group (already replaced by group 10 Jobs)
- Banners + Access Codes — moved out of Platform Config into Marketing
- Withdrawals — moved into Finance
- Notifications — moved into Platform Config (centralized)
- Standalone "AI Content Tools" — replaced by chat agents
- Legacy `study-abroad` / `ielts` / `roadmap-leads` flat tabs — folded under Career Abroad with Dashboard
- Old Monetization leads tabs (Assessment / Mock / Salary / Portfolio leads) — these are service leads; consolidated under a single **Service Leads** tab inside Marketing → Leads & Activities (filterable by service type) instead of 4 separate sidebar entries

## Agents → moved to `/dashboard/chat`

Add these to `ADMIN_AGENTS` and remove any duplicate sidebar tabs:

- **Learn**: `learn-dean` (Academies & Schools Dean Agent — analytics + outreach to instructors/deans)
- **Gig Economy**: one agent per major category — `gig-design`, `gig-dev`, `gig-content`, `gig-data`, `gig-ops` (drafts gig briefs, screens submissions, suggests pricing). Plus `gig-ops-manager` for overall gig health.
- **Career Abroad**: `abroad-counselor` (study-plan + university shortlisting), `abroad-ielts-coach` (IELTS prep guidance), `abroad-outreach` (university partner mailto drafts)
- **Marketing & Outreach**: `mkt-outreach-strategist` (campaign planner across channels + community), `mkt-content-outreach` (already partially exists — consolidate)
- **Finance**: `fin-controller` (read-only finance analyst — MRR, transactions, gross margin, payout health), `fin-credits-ops` (credit issuance / refund drafts)

That brings total chat agents to ~25, all reachable from the unified chat inbox.

## Technical changes

```text
src/components/dashboard/AdminSidebar.tsx   — replace groups 11–16
src/pages/Dashboard.tsx                     — register new tab keys + lazy components
src/lib/adminAgents.ts                      — add ~9 new agent entries
src/components/dashboard/learn/             — new: LearnOverviewTab, GraduatesTab,
                                              OnlineCoursesTab (merge webinars+live),
                                              B2BCoursesTab
src/components/dashboard/gig/               — new: GigOverviewTab, QuickActionGigsTab,
                                              CourseProjectsTab, ClientProjectsTab,
                                              GigWorkersWalletTab
src/components/dashboard/abroad/            — new: AbroadOverviewTab,
                                              IeltsModulesTab (course-module style)
src/components/dashboard/marketing/         — new: ChannelsTab, CommunityTab,
                                              AdminsRepsTab, LeadsActivitiesTab
src/components/dashboard/finance/           — new: FinOverviewTab, TalentCreditsTab,
                                              Gro10xCreditsTab, CompanyCreditsTab,
                                              TransactionsTab, PaymentInfraTab,
                                              InvoicesPaymentsTab
supabase/functions/                         — 9 new lightweight chat-agent functions
                                              (admin-learn-dean, admin-gig-*,
                                              admin-abroad-*, admin-fin-controller,
                                              admin-fin-credits-ops, admin-mkt-strategist)
supabase/migrations/...sql                  — new tables:
                                              academies, schools, professional_lives,
                                              gig_categories, mkt_channels,
                                              mkt_community_groups, fin_payment_configs
                                              (admin-only RLS via has_role)
```

All new edge functions follow the existing pattern: `verify_jwt = false` in config + manual `auth.getUser(token)` + `has_role(user, 'admin')` check.

## Open questions

If you want any of the following changed, say so and I'll revise before building:
1. Should **Online Courses** truly merge Webinars + Live Classes into one tab, or keep them separate?
2. **Service Leads** — keep one combined tab under Marketing, or restore 4 separate tabs (assessment / mock / salary / portfolio) under Finance?
3. Any additional category-specific Gig Agents beyond the 5 listed (design/dev/content/data/ops)?

Approve to start implementation.
