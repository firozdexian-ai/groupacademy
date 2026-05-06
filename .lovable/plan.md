# Phase 3.3 — Consolidated AI Tools Hub

## What I missed

There are already **4 mature career services** in a separate hub (`ServicesHub` at `/app/services`) that I was ignoring. Plus 2 in the Tools tab and 1 component-only tool. **7 working tools total**, spread across 2 hubs. Goal of 3.3: bring them all into one home.

## Current state

| # | Tool | Status | Lives at |
|---|---|---|---|
| 1 | Career Assessment | Built | `/app/services/assessment` |
| 2 | Mock Interview | Built | `/app/services/mock-interview` |
| 3 | Salary AI | Built | `/app/services/salary-analysis` |
| 4 | Portfolio Service | Built | `/app/services/portfolio` |
| 5 | ATS CV Maker | Built | `/app/tools/cv-maker` |
| 6 | Application Answers | Built | `/app/tools/application-helper` |
| 7 | Score me vs job | Component built, no entry | dashboard widgets only |

## Final consolidated list (7 tools)

**Profile builders** (sharpen who you are)
1. ATS CV Maker — 15 cr
2. Career Assessment — paid
3. Salary Insight — paid (no free first run; 250 welcome credits already cover it)
4. Portfolio Service — paid request

**Job-specific tools** (win this role)
5. Score me vs job — 10 cr (new inline picker)
6. Application Answers — 10 cr
7. Mock Interview — paid

No new tools. No new edge functions. Pure consolidation + personalization.

## Pricing change — remove "first analysis free" everywhere

Per your direction: 250 welcome credits already cover trial usage, so the Salary AI's "First Analysis Free" / "Free Audit" framing is removed.
- `src/pages/SalaryAnalysis.tsx` lines 74, 92, 217 — replace "First Analysis Free", "Initialize Free Audit", "Launch Free Audit" with neutral CTA copy showing the actual credit price.
- Remove any free-first-run logic in salary edge / hooks (none currently in code; only the marketing copy).
- Update [AI Salary Analysis](mem://product/ai-salary-analysis-free-then-paid-model) memory to reflect "always paid via credits".

## What changes in 3.3

### 1. Jobs > Tools tab becomes the only AI Tools home

```text
Tools tab
┌──────────────────────────────────────────┐
│ Up next for you  (1 personalized card)   │
├──────────────────────────────────────────┤
│ Profile builders                         │
│  CV  •  Assessment  •  Salary  •  Folio  │
├──────────────────────────────────────────┤
│ Job-specific tools                       │
│  Score-me  •  Answers  •  Mock interview │
├──────────────────────────────────────────┤
│ Recent results (resume / re-download)    │
├──────────────────────────────────────────┤
│ Talk to a career agent (existing list)   │
└──────────────────────────────────────────┘
```

### 2. Deprecate ServicesHub
- Replace `/app/services` route with redirect to `/app/jobs?tab=tools`.
- Remove "Services" sidebar/nav entries pointing to it.
- Keep underlying tool routes (deep links from emails/transactions still work).

### 3. "Up next for you" — rule-based pick
First match wins:
1. No CV → CV Maker
2. Profile <60% → Tune profile
3. Saved job, deadline ≤7d → Application Answers (pre-loaded with that job)
4. Saved job without AI score → Score me vs job (pre-loaded)
5. No assessment in 90d → Career Assessment
6. No salary lookup in 30d → Salary Insight
7. Else → Mock Interview

Powered by `get_next_best_tool(user_id) → { tool_key, reason, job_id }` reading `talents`, `saved_items`, `tool_runs`.

### 4. "Score me vs job" gets a real entry
- New `ScoreMeJobPicker` sheet listing saved jobs + recent applications + last viewed.
- On select → existing `score-job-match` edge → result in existing `AIJobInsights` sheet.
- 10 credits, deducted only after edge succeeds.

### 5. Recent results rail
- New `tool_runs` table (user_id, tool_key, cost_credits, payload jsonb, job_id, created_at, RLS own-rows-only).
- Each tool calls a single `recordToolRun()` helper after successful credit deduction.
- Tools tab shows last 5 runs with click-to-resume (`?run=<id>` prefill).

## Backend (1 table + 1 RPC, 0 edges)

### `tool_runs`
| Column | Type |
|---|---|
| id | uuid pk |
| user_id | uuid not null, RLS |
| tool_key | text (cv/assessment/salary/portfolio/score/answers/interview) |
| cost_credits | numeric(12,1) |
| payload | jsonb (≤8 KB summary) |
| job_id | uuid nullable |
| created_at | timestamptz default now() |

RLS: own rows only.

### `get_next_best_tool(p_user_id uuid) returns jsonb`
SECURITY INVOKER, `search_path = public`.

## Frontend wiring

**New**
- `src/components/jobs/ToolsHub.tsx` (extracted from JobsHub)
- `src/components/jobs/ScoreMeJobPicker.tsx`
- `src/hooks/useNextBestTool.ts`
- `src/hooks/useToolRuns.ts` (list + recordToolRun helper)

**Modified**
- `src/pages/app/JobsHub.tsx` — render `<ToolsHub />` for tools tab
- `src/pages/SalaryAnalysis.tsx` — strip "free" copy (lines 74, 92, 217)
- 6 tool pages (CVMaker, ApplicationHelper, AppMockInterviewSetup, AppCareerAssessment, AppSalaryAnalysisSetup, AppPortfolioRequest) — single `recordToolRun()` call after credit deduction; no other behavior changes
- `src/App.tsx` — `/app/services` → `<Navigate to="/app/jobs?tab=tools" />`
- Sidebar/nav — drop "Services" link

**Untouched**
- All public service landing pages, tool flows, credit pricing logic, PDF templates

## Out of scope (3.4)
- Job Details redesign
- Application workflow
- AI assessment-on-job

Approve to proceed.
