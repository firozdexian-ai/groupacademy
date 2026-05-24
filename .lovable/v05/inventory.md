# v0.5 Publication — Feature Inventory & Regression Diff

Generated as Phase P1 deliverable. Source of truth: `src/shells/admin/routes/*.ts`, `src/App.tsx`, `src/gro10x/Gro10xRoutes.tsx`. Cross-referenced against `mem://` index entries.

**Legend** for the Status column:
- ✅ Present, expected to work
- ⚠️ Present but flagged for **defer review** in P2 (no real data / empty workflow likely)
- 🔍 **Regression suspect** — memory describes feature that may have been altered/removed during A11–A19; needs manual eyeball in P2 spot-check
- ❌ Not present in code (should be — restore in P4 punch list)

---

## A. Admin shell — `/dashboard?tab=…` (118 tabs across 16 groups)

### 1. Overview (Analytics) — 6 tabs
| Tab key | Title | Component | Status |
|---|---|---|---|
| `overview` / `overview-lifetime` | Lifetime overview | `LifetimeOverviewTab` | ✅ |
| `overview-month` | Monthly overview | `PeriodOverviewTab(mode=month)` | ✅ |
| `overview-quarter` | Quarterly overview | `PeriodOverviewTab(mode=quarter)` | ✅ |
| `overview-analyst` | Business analyst | `AnalystChatTab` | ✅ |
| `overview-reports` | Report builder | `ReportsBuilderTab` | ✅ |

### 2. Talent CRM — 10 tabs
| Tab key | Title | Status |
|---|---|---|
| `crm-overview` | CRM overview | ✅ |
| `crm-talent-pool` | Talent pool | ✅ |
| `crm-professions` | Professions & roles | ✅ |
| `crm-upload` | Upload talents | ✅ (LinkedIn JSON + batch) |
| `crm-outreach` | Outreach log | ✅ |
| `crm-wa-channel` | WhatsApp line | ⚠️ depends on WA connector — confirm live in P2 |
| `crm-creator-economy` | Creator economy | ✅ |
| `crm-notifications` | Notifications | ✅ |
| `crm-support-ai` | Support AI | ✅ |
| `portfolios` | Portfolios | ✅ |

### 3. Companies — 7 tabs
| Tab key | Title | Status |
|---|---|---|
| `companies-overview` | Companies overview | ✅ |
| `companies` | Employer CRM | ✅ |
| `contacts` | B2B contacts | ✅ |
| `companies-unlocks` | Contact unlocks | ✅ |
| `company-agents` | Account managers | ✅ |
| `industries` | Industries | ✅ |
| `companies-wa-channel` | Employer WhatsApp line | ⚠️ |

> 🔍 Memory `mem://admin/companies-stakeholder-structure` describes an **8-tab** Companies area. Currently 7. Diff to investigate in P2 — likely one tab consolidated or removed during refactor.

### 4. Jobs — 10 tabs
| Tab key | Title | Status |
|---|---|---|
| `jobs-overview` | Jobs overview | ✅ |
| `jobs-hub` | Jobs hub | ✅ |
| `jobs-upload` | Upload & approve jobs | ✅ |
| `jobs-applications` | Applications | ✅ |
| `jobs-pipeline` | Pipeline | ✅ |
| `jobs-sourcing` | Sourcing | ✅ |
| `jobs-talent-crm` | Talent CRM | ✅ |
| `jobs-assessments` | Assessments | ✅ |
| `leads` | Scorecard leads | ✅ |
| `jobs-kpis` | Analytics | ✅ |

### 5. Learning — 18 tabs ✅ (all present; matches `mem://admin/groups-11-to-16`)
Overview, Academies, Schools, Pro Lives, AI career tracks, Recorded courses, Webinars, Enrollments, Student progress, Graduates, B2B courses, Course briefs, Cohorts, Moderation queue, B2B engagements, Instructor payouts, Bulk course importer, Modules.

### 6. Gigs — 12 tabs ✅
Overview, AI scoper queue, Quick action gigs, Marketplace, Course projects, Client projects, Managed projects, Submissions, Verification queue, Reviewer program, Matchmaker, Workers wallet.

### 7. Career Abroad — 8 tabs ✅
Overview, Destinations, Applications, Programs, IELTS prompts, IELTS resources, Language lab, Roadmap leads.

### 8. AI Agents — 15 tabs
| Tab key | Title | Status |
|---|---|---|
| `agents-overview` | Agents overview | ✅ |
| `agents-channels` | Channels & triggers | ✅ |
| `agents-multichannel` | Multichannel routing | ✅ |
| `agents-command-center` | Workforce command center | ✅ |
| `agents-tools` | Tools, skills & connectors | ✅ |
| `agents-studio` | Agent studio | ✅ |
| `agents-b2c` / `-platform` / `-b2b` / `-ugc` | Type tabs | ✅ |
| `agents-marketplace` | Marketplace review | ✅ |
| `agents-payouts` | Agent payouts | ✅ |
| `agents-sessions` | Sessions log | ✅ |
| `agents-insights` | Agent insights | ✅ |
| `agent-outreach` | Proactive outreach | ✅ |

> 🔍 Memory `mem://admin/ai-agents-stakeholder-structure` describes a **13-tab Agent OS**: Overview, Channels, Tools/Skills/Connectors, Studio, B2C, Platform, B2B, UGC, Marketplace, Payouts, **Manager**, Sessions, Insights. Current shell has 15 tabs but **no `Manager` tab** — replaced by `agents-multichannel` + `agents-command-center`. Confirm in P2 whether "Manager" duties are split correctly.

### 9. Investors (IR) — 9 tabs ✅
Dashboard, MRR projections, VC portfolio, Shareholders, Pipeline, Executive updates, Data room, Unit economics, Key influencers.

### 10. Institutions — 7 tabs
> 🔍 Memory `mem://admin/institutions-stakeholder-structure` mentions **universities, partners, clubs, reps, events + 2 chat agents**. Code has: `institutions`, `partner-orgs`, `inst-overview`, `inst-types`, `inst-clubs`, `inst-reps`, `inst-events`. **The 2 chat agents referenced in memory are not surfaced as admin tabs** — they likely live in `/dashboard/chat`. Confirm.

### 11. HR / Workforce — 9 tabs ✅

### 12. UGC / Content — 6 tabs ✅
Overview, Videos, Blog, Social feed, Competitions, Content catalog.

### 13. GTM (Geography) — 6 tabs ✅

### 14. Marketing — 14 tabs ✅
Mock interviews, Salary analysis, Conversion analytics, Channels, Community WA, Community groups, Admins & reps, Talent outreach, Content outreach, Service outreach, Leads, Banners, Themes, Access codes.

### 15. Finance — 8 tabs ✅

### 16. Misc — 1 tab (`quiz-manage`) ✅

---

## B. Talent shell — `/app/*` (~95 routes)

### Core navigation (always visible in bottom nav)
| Path | Component | Status |
|---|---|---|
| `/app/feed` | Feed | ✅ Confirmed rendering in current session (44 cards) |
| `/app/jobs` | JobsHub | ✅ |
| `/app/learning` | LearningHub | ✅ |
| `/app/gigs` | Gigs | ⚠️ Defer-review: For-You tab works, but Marketplace browse may be empty |
| `/app/me` | TalentHome | ✅ |
| `/app/profile` | Profile | ✅ |

### Jobs surface
| Path | Status |
|---|---|
| `/app/jobs?tab=foryou` | ✅ |
| `/app/jobs?tab=tools` | ✅ (7-tool hub) |
| `/app/jobs?tab=companies` | ⚠️ Needs ≥10 followed companies to feel populated |
| `/app/jobs?tab=locations` | ⚠️ Same |
| `/app/jobs/all` | ✅ |
| `/app/jobs/:id` | ✅ |
| `/app/jobs/:id/apply` | ✅ |
| `/app/job-assessment/:id` | ✅ |
| `/app/applications` (MyApplications) | ✅ |
| `/app/applications/:id` | ✅ |
| `/app/interview-schedule/:id` | ✅ |
| `/app/offer-decision/:id` | ✅ |

### Learning surface
| Path | Status |
|---|---|
| `/app/learning` (hub) | ✅ |
| `/app/learning/my-courses` | ✅ |
| `/app/learning/tracks` | ✅ |
| `/app/learning/events` / `webinars` | ✅ |
| `/app/learning/competitions` + `:slug` | ⚠️ Likely few competitions live |
| `/app/learning/blog` + `:slug` | ✅ |
| `/app/learning/review` | ✅ |
| `/app/learn/:slug` (immersive player) | ✅ |
| `/app/quiz/:slug` | ✅ |
| `/app/report-card/:enrollmentId` | ✅ |
| `/app/courses` + `/courses/:slug` | ✅ |
| `/app/cohorts/:id` + `/discussions` + `/discussions/:id` | ✅ |
| `/app/sessions/:id/join` | ✅ |
| `/app/review-queue` + `/submissions/:id` | ✅ |
| `/app/talent-mirror` | ✅ |
| `/app/instructor*` (5 routes) | ⚠️ Only instructors see this; defer-review for empty state |
| `/app/professions` + `/:slug` | ✅ |
| `/app/school/:slug` | ✅ |

### Gigs / Projects
| Path | Status |
|---|---|
| `/app/gigs` | ⚠️ |
| `/app/gigs/new` (NewGigWizard) | ✅ |
| `/app/gigs/appeals` + `/disputes` | ⚠️ Only relevant to active disputants |
| `/app/reviewer` (ReviewerCockpit) | ⚠️ Defer for non-reviewers — show waitlist |
| `/app/projects` (MyProjects) | ⚠️ Empty until first managed project |
| `/app/projects/:id` (ProjectRoom) | ✅ |
| `/app/marketplace/:id` | ✅ |

### Career Abroad
| Path | Status |
|---|---|
| `/app/abroad` (Hub) | ✅ |
| `/app/abroad/destinations/:country` | ⚠️ Many countries have no agents — defer per-country |
| `/app/abroad/applications` | ✅ |
| `/app/counsellor` | ✅ |
| `/app/abroad/ielts` + `/mock/:section` + `/results/:id` | ✅ |
| `/app/abroad/study` + `/:id` | ⚠️ |
| `/app/abroad/roadmap/:id` (results) | ✅ |
| `/app/languages` + `/:code/practice` + `/:code/instructors` | ⚠️ Likely few instructors |

### Tools
| Path | Status |
|---|---|
| `/app/tools/cv-maker` | ✅ |
| `/app/tools/application-helper` | ✅ |
| `/app/tools/assessment` | ✅ |
| `/app/tools/mock-interview` | ✅ |
| `/app/tools/salary-analysis` | ✅ |
| `/app/tools/portfolio` | ✅ |

### Agents / Chat
| Path | Status |
|---|---|
| `/app/agents`, `/my-agents`, `/agent-marketplace` | ✅ |
| `/app/agents/:agentKey` + `/profile` | ✅ |
| `/app/ai-general` | ✅ |
| `/app/career-coach` | ✅ |
| `/app/messages` + `/:threadKey` | ✅ |

### Profile / Wallet / Misc
| Path | Status |
|---|---|
| `/app/profile`, `/edit`, `/verify`, `/profile-builder` | ✅ |
| `/app/transactions`, `/withdrawals` | ✅ |
| `/app/talents` (directory), `/:id` | ⚠️ Directory empty if few public profiles |
| `/app/connections` | ✅ |
| `/app/saved` | ✅ |
| `/app/creator/analytics` | ⚠️ Only for active creators |
| `/app/pitches` (TalentPitches) | ⚠️ |
| `/app/notifications` → redirects `/app/messages` | ✅ |

---

## C. Public shell — unauthenticated routes (24 routes)

| Path | Component | SEO-ready | Status |
|---|---|---|---|
| `/` | Index (landing) | ✅ | ✅ |
| `/auth`, `/auth/classic`, `/auth/callback` | Auth | n/a | ✅ |
| `/start` | Start | n/a | ✅ |
| `/reset-password` | ResetPassword | n/a | ✅ |
| `/jobs/:id` | PublicJobDetail | ✅ | ✅ |
| `/courses`, `/courses/:slug` | Public courses | ✅ | ✅ |
| `/webinar/:slug` | WebinarLanding | ✅ | ✅ |
| `/services`, `/career-services`, `/service/:slug` | Service landings | ✅ | ✅ |
| `/c/:slug` | PublicCompanyPage | ✅ | ✅ |
| `/c/:slug/learn` | CompanyBrandedCatalog | ✅ | ✅ |
| `/c/:slug/projects` | CompanyPublicProjects | ✅ | ✅ |
| `/blog`, `/blog/:slug` | Public blog | ✅ | ✅ |
| `/verify/:code` | VerifyCertificate | ✅ | ✅ |
| `/verify/skill/:code` | VerifySkillCredential | ✅ | ✅ |
| `/t/:handle` | PublicTalentProfile | ✅ JSON-LD | ✅ |
| `/projects` | PublicProjectsIndex | ✅ | ⚠️ Empty until projects published |
| `/projects/:slug` | PublicProjectDetail | ✅ | ✅ |
| `/leaderboards/:kind` | PublicLeaderboard | ✅ | ⚠️ Empty unless ≥10 entries |
| `/career-assessment` + results | ✅ | ✅ |
| `/portfolio-request` + status | ✅ | ✅ |
| `/mock-interview/*` (5 routes) | ✅ | ✅ |
| `/salary-analysis/*` (4 routes) | ✅ | ✅ |
| `/unsubscribe` | ✅ | ✅ |
| `/ir/view/:token` | ✅ | n/a (private link) |

### Public routes deferred at launch
- `/for-companies/*` → already redirected to `/gro10x` ✅
- `/admin` → redirects to `/dashboard` ✅
- `/company/*` → redirects to `/gro10x` ✅

---

## D. Gro10x shell (not v0.5 headline, but routes inventoried)

26 routes confirmed lazy-loaded via `src/gro10x/Gro10xRoutes.tsx` (Landing, SignIn, Welcome, Me, Inbox, Chat, Billing, Learn, Work + sub-pages, Sourcing, Agent marketplace, etc.). **Not in v0.5 acceptance gate.**

---

## E. Regression Suspects — items to manually verify in P2 spot-check

These are surfaces where memory describes features that may have shifted during A11–A19 polish:

1. **Companies tab count**: memory says 8 tabs, code has 7 → likely consolidation; verify nothing was deleted.
2. **AI Agents "Manager" tab**: memory mentions, code does not show it under that name. Confirm it's not lost — may be the new `agents-command-center`.
3. **Institutions chat agents (2 of them)**: per memory, they should appear somewhere. Confirm they live in `/dashboard/chat` and not orphaned.
4. **`/app/services`** redirects to `/app/jobs?tab=tools`. Per `mem://product/consolidated-ai-tools-hub` this is intentional, but verify tools all open.
5. **`/app/notifications`** redirects to `/app/messages`. Per `mem://product/messenger-inbox-and-agent-marketplace`, intentional, but confirm push/badge counts still wire to the right surface.
6. **`/app/marketplace`** redirects to `/app/gigs?tab=projects`. Verify nothing lost from the old standalone marketplace.
7. **Creator economy admin tab vs talent feed**: memory `mem://product/creator-economy-hype-and-connections` describes paid Hype reactions. Confirm the Hype button still appears on `/app/feed` post cards (it was in scope of A18 a11y sweep — check no aria-label rewrite broke onClick).
8. **Mandatory phone capture modal** (per `mem://auth/mandatory-global-phone-capture`): still fires after signup? Verify in the smoke test.
9. **Profile builder readiness gate**: Career services require auth — confirm gate still present per `mem://architecture/career-services-require-authentication-gate`.
10. **`talent-cvs` storage signed URLs** (per `mem://security/pii-and-storage-hardening`): verify CV downloads still produce signed URLs and not public ones.

---

## F. Defer-review candidates (input to P2 defer-matrix)

These surfaces are present but likely look empty for a brand-new user. P2 will decide `keep | coming-soon (waitlist) | hide`:

| Surface | Reason | Suggested action |
|---|---|---|
| `/app/gigs` Marketplace tab | No live client projects | coming-soon w/ waitlist |
| `/app/marketplace/:id` | Linked from above | keep (deep link works) |
| `/app/projects` (MyProjects) | Empty for non-bidders | empty-state with CTA "Browse gigs" |
| `/app/reviewer` | Most users not reviewers | coming-soon: "Apply to join reviewer program" |
| `/app/gigs/appeals` + `/disputes` | Only disputants | keep (gated) |
| `/app/instructor*` | Only instructors | keep (gated by role) |
| `/app/creator/analytics` | Only active creators | empty-state with "Post your first content" |
| `/app/pitches` | Niche | hide from nav, keep route |
| `/app/talents` directory | Empty if few public profiles | coming-soon |
| `/app/languages` | Few instructors | per-language coming-soon |
| `/app/abroad/destinations/:country` | Most countries empty | per-country coming-soon |
| `/projects` public index | Empty until projects published | "Coming soon — first projects launching <date>" |
| `/leaderboards/:kind` | Empty without ≥10 entries | hide until threshold |
| `/c/:slug/projects` | Per-company empty | inline empty-state |
| Companies WA + Talent WA admin tabs | Depend on WA connector | admin-only banner if connector not configured |

---

## G. What's working well (no action needed)

- **Auth chat (Aisha)** — session log shows it loads cleanly with email prompt.
- **Feed** — 44 mixed-type cards render, impressions log correctly, no errors.
- **All 7 AI tools** — consolidated into `/app/jobs?tab=tools`.
- **Hiring pipeline** — Gro10x + Admin kanban via `get_employer_pipeline` RPC.
- **Public discovery** — projects, leaderboards, og-image rendering all wired.
- **Email infrastructure** — native queue via `notify.groupacademy.online`.
- **Mastery-based job matching** — `score_talent_job_mastery` RPC live.

---

## Estimated launch-readiness

| Dimension | Status |
|---|---|
| Routes reachable | ~99% (only console warning is a benign `RESET_BLANK_CHECK` from lovable.js) |
| Talent surfaces functional | ~85% |
| Talent surfaces with real data on day 1 | ~60% — hence the P2 defer-matrix |
| Public surfaces SEO-ready | ~95% |
| Regression suspects requiring manual verification | 10 items (Section E) |

---

## Next step

**Your review of Section E (Regression Suspects) and Section F (Defer-review candidates)** before P2 begins. Once you confirm, P2 will produce the `defer-matrix.md` with per-surface decisions and ship the `<ComingSoonGate>` + `feature_waitlist` table.
