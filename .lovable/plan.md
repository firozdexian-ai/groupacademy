## A5.3 — Consolidated AI Tools Hub

### Goal
Replace the `ToolsView.tsx` "coming soon" stub with a fully functional hub that surfaces all 7 AI tools, shows a personalized "Up next" recommendation, and displays recent tool activity.

### Current State
- `ToolsView.tsx` is a 3-line stub.
- All 7 tool page components exist: `CVMaker`, `ApplicationHelper`, `AppCareerAssessment`, `AppMockInterviewSetup`, `AppSalaryAnalysisSetup`, `AppPortfolioRequest`, and `ScoreMeJobPicker` + `AppJobDetail` (for the score-me flow).
- Routes: `/app/tools/cv-maker` and `/app/tools/application-helper` exist. The other 4 tools live under `/app/services/*`.
- `useNextBestTool` and `useToolRuns` hooks exist but are jargon-heavy.
- `ScoreMeJobPicker` and `AppJobDetail` contain user-visible jargon.
- `/app/services` already redirects to `/app/jobs?tab=tools`.

### Changes

#### 1. ToolsView.tsx (full rewrite)
Replace the stub with a responsive hub containing:
- **Header**: "AI Career Tools" + subtitle.
- **Up Next card**: Uses `useNextBestTool` to show the recommended tool with `tool_key`, `reason`, and a CTA button. If no recommendation, show a generic "Explore tools" prompt.
- **Tools grid**: 7 cards in a responsive 1-2 column grid:
  | Tool | Route | Cost | Icon |
  |---|---|---|---|
  | ATS-friendly CV | `/app/tools/cv-maker` | 15 cr | FileText |
  | Application answers | `/app/tools/application-helper` | 10 cr | ClipboardList |
  | Career assessment | `/app/tools/assessment` | 50 cr | Target |
  | Mock interview | `/app/tools/mock-interview` | 50 cr | Zap |
  | Salary analysis | `/app/tools/salary-analysis` | 50 cr | Coins |
  | Portfolio builder | `/app/tools/portfolio` | 500 cr | Sparkles |
  | Score me vs job | Opens `ScoreMeJobPicker` sheet | 10 cr | TrendingUp |

  Each card shows: icon, title, one-line description, credit cost badge, and link/action.
- **Recent activity**: Uses `useToolRuns(limit=5)` to show last runs with tool name, relative date, and credit cost. Empty state: "No tool runs yet. Pick a tool above to get started."

#### 2. New tool routes in App.tsx
Add under the `/app/*` shell:
```
/app/tools/assessment        → AppCareerAssessment
/app/tools/mock-interview    → AppMockInterviewSetup
/app/tools/salary-analysis   → AppSalaryAnalysisSetup
/app/tools/portfolio         → AppPortfolioRequest
```
Keep existing `/app/services/*` routes for backward compatibility.

#### 3. Jargon scrub (user-visible + code comments)
- `ScoreMeJobPicker.tsx`: rewrite Sheet title/description, button labels, aria-labels, empty state, error toast, and section comments to plain English.
- `useToolRuns.ts`: remove "Digital Workforce", "Phase Z1", "CTO Reference", "HUD" comments; keep functionality intact.
- `useNextBestTool.ts`: same treatment.
- `AppJobDetail.tsx`: humanize the 3 user-facing strings: "Synthetic alignment compatibility calculations complete." → "Match score ready."; "Secure registration route parameter copied to system buffer." → "Link copied."; "Record Unassigned" / body copy → friendly "Job not found" language.

#### 4. Audit log
Append A5.3 shipped block to `.lovable/launch-audit.md`.

### No DB changes required.
All data comes from existing `tool_runs` table, `get_next_best_tool` RPC, and existing tool page components.

### Est. time: 45–60 min.