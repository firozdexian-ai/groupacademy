# Admin Panel — Segment 1: Overview

Transform the current single "Business Overview" into a 3-tab time-scoped command center, and add two AI tools: a **Business Analyst** chat agent and a **Report Builder** agent that produces shareable canvases.

## 1. Restructure the Overview page

Rebuild `DashboardOverview.tsx` as a tabbed shell with 5 tabs:

```text
[ Lifetime ] [ This Month ] [ This Quarter ] [ Analyst ] [ Reports ]
```

- **Lifetime** — current KPI grid (Talents, Revenue, Credits, Agents, Jobs, etc.) — no date filter.
- **This Month** — same KPI shape, scoped to current calendar month, with delta vs. previous month (▲/▼ %).
- **This Quarter** — same KPIs scoped to current quarter, with delta vs. previous quarter and a small sparkline (3 months).
- Add a **period switcher** (MTD / QTD / Custom range) at the top of Month/Quarter tabs.
- Reuse `StatsCard` and add a thin `<TrendDelta />` helper. New shared hook `useOverviewMetrics(period)` (parallel `count` + `sum` queries with `gte/lte` on `created_at`).
- Add Top movers row: "Fastest growing service this month", "Top earning agent", "Most active company".

## 2. Business Analyst Agent (chat)

A new tab "Analyst" that opens a chat interface backed by an edge function `admin-analyst`:

- **Edge function**: validates JWT → confirms `super_admin` role via `user_roles` (hard gate) → uses Lovable AI (`google/gemini-2.5-pro`) with tool-calling. Tools exposed to the model:
  - `run_metric(metric, period)` — whitelisted aggregate queries (transactions, signups, revenue, credits issued, jobs posted, applications, gigs, courses sold, etc.).
  - `count_table(table, filters)` — only allowed against a whitelist of safe tables.
  - `top_n(dimension, metric, period, limit)` — group-by helper.
  - `time_series(metric, period, granularity)` — daily/weekly buckets.
- **No raw SQL execution.** All access goes through whitelisted RPC helpers (`analyst_metric`, `analyst_top_n`, `analyst_series`) created with `security definer` and `set search_path = public`, callable only when `has_role(auth.uid(), 'super_admin')`.
- Frontend: streaming chat (SSE) reusing the Lovable AI streaming pattern, renders markdown + small inline tables/number cards when the model returns structured tool results.
- Persist threads in a new `admin_analyst_threads` / `admin_analyst_messages` pair (RLS: super_admin only).

Example prompts seeded in the empty state:
- "How many transactions happened today?"
- "Revenue this month vs last month, by service."
- "Top 10 companies by credits spent this quarter."

## 3. Report Builder Agent (canvas)

Tab "Reports" — generates a shareable visual report from a natural-language brief.

- **Edge function** `admin-report-builder`:
  1. LLM plans the report → returns a structured JSON spec (title, period, sections: `kpi | bar | line | pie | table | note`).
  2. Backend executes each section via the same whitelisted analyst RPCs.
  3. Returns spec + resolved data.
- **Frontend canvas** (`AdminReportCanvas.tsx`): renders the spec using Recharts (already in deps) on a printable A4-style canvas with the platform's brand tokens. Each block is editable inline (title, swap chart type, remove, reorder via drag).
- **Save / share / export**:
  - Save to new table `admin_reports` (super_admin RLS) — stores `spec_json`, `data_snapshot`, `title`, `period`.
  - Share link `/admin/reports/:id` — gated to internal/super scope; optional public read-only token for stakeholders.
  - Export as PNG (html2canvas, already used) and PDF (existing `pdfGenerator`).

Seeded prompts:
- "Month-on-month talent growth, last 12 months."
- "Job distribution across countries this quarter."
- "Credit economy: issued vs spent vs withdrawn, last 6 months."

## 4. Database changes

```sql
-- Threads + messages for the analyst chat
create table admin_analyst_threads (id uuid pk, user_id uuid, title text, created_at, updated_at);
create table admin_analyst_messages (id uuid pk, thread_id uuid fk, role text, content text, tool_calls jsonb, created_at);

-- Saved reports
create table admin_reports (id uuid pk, user_id uuid, title text, period jsonb,
  spec_json jsonb, data_snapshot jsonb, share_token text unique, created_at, updated_at);

-- Whitelisted analyst RPCs (security definer, gated by has_role super_admin)
create function analyst_metric(metric text, period jsonb) returns jsonb ...;
create function analyst_top_n(dimension text, metric text, period jsonb, n int) returns jsonb ...;
create function analyst_series(metric text, period jsonb, granularity text) returns jsonb ...;
```

All tables: RLS on, super_admin only (via `has_role`). Functions: `set search_path = public`.

## 5. Files

- New: `src/components/dashboard/overview/{LifetimeTab,PeriodTab,AnalystTab,ReportsTab,TrendDelta,PeriodSwitcher}.tsx`
- New: `src/components/dashboard/overview/AdminReportCanvas.tsx`
- New hooks: `useOverviewMetrics.ts`, `useAdminAnalystChat.ts`, `useAdminReports.ts`
- New edge functions: `supabase/functions/admin-analyst/index.ts`, `supabase/functions/admin-report-builder/index.ts`
- Modified: `src/components/dashboard/DashboardOverview.tsx` (becomes tab shell), `src/pages/Dashboard.tsx` (label tweaks), 1 migration file.

## 6. Security notes

- Hard role check (`super_admin`) in every edge function and RPC — no client-trusted flags.
- No arbitrary SQL: model can only invoke the 3 whitelisted RPCs with enumerated metric keys.
- Share tokens for reports use `gen_random_uuid()` and are revocable.

Approve and I'll implement Segment 1 in build mode, then we move to the next admin segment.