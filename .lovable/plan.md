

# Jobs Hub Overhaul & Agentic Career Platform

This is a large initiative spanning 5 workstreams. I recommend splitting it across multiple sessions to maintain stability. Here is the full plan:

---

## Phase 1: Fix Broken Company Logos (Quick Win)

**Problem**: `company_logo_url` in the `jobs` table stores URLs that may be broken (dead links from LinkedIn scraping, expired URLs, etc.). The `companies` table has a separate `logo_url` field that might have better data.

**Fix**:
- Add an `onError` fallback handler to the `<img>` tag in `JobCard.tsx` and `AppJobDetail.tsx` that hides the broken image and shows the `Building2` icon fallback instead
- In the "By Company" tab, cross-reference `companies.logo_url` as a secondary source when `jobs.company_logo_url` is null
- Run a one-time DB query to audit how many logo URLs return 404s (informational)

**Files**: `JobCard.tsx`, `AppJobDetail.tsx`, `JobsHub.tsx`

---

## Phase 2: Improve "By Company" Tab

**Current**: Shows top 20 companies sorted by job count in a flat grid. Limited to 500 jobs scanned.

**New Design**:
- Add an **alphabet bar** (A-Z strip) at the top for quick-jump navigation
- Show **all companies** grouped alphabetically, with an industry filter dropdown
- Cross-reference the `companies` table for `logo_url` and `industry` data
- Each company card shows: logo, name, industry tag, job count
- Clicking a company navigates to the jobs list filtered by that company
- Remove the 500-job scan limit; use a dedicated query grouping by `company_name`

**Files**: `JobsHub.tsx` (company tab section)

---

## Phase 3: Improve "Collection" Tab

**Current**: Shows 6 job-type collections (Full-time, Part-time, etc.)

**New Design**:
- Add two new collection cards at the top: **"Hot Jobs"** (trending) and **"Expiring Soon"** (deadline within 7 days)
- These link to the jobs list with appropriate query params
- Keep existing 6 type-based collections below
- Update `JOB_COLLECTIONS` in `jobTypes.ts` or add the new entries inline

**Files**: `JobsHub.tsx` (collection tab), `jobTypes.ts`

---

## Phase 4: Improve "By Country" Tab

**Current**: Shows raw `location` strings (city-level), limited to 500 jobs. Duplicates like "Dhaka" and "Dhaka, Bangladesh" appear separately.

**New Design**:
- Parse locations into **country** (extracted from the last comma-separated segment) and **city**
- Show countries first as primary cards with total job counts and flag emojis
- Clicking a country expands to show cities within that country
- Normalize common patterns (e.g., "Bangladesh" from "Dhaka, Bangladesh")
- Remove the 500-job scan limit

**Files**: `JobsHub.tsx` (country tab section)

---

## Phase 5: Reconstruct "For You" Tab with Career Development Agents

This is the largest change. The "For You" tab transforms from a static job listing into an **agentic career hub**.

**New "For You" Tab Structure**:

```text
+------------------------------------------+
|  Career Development Agents               |
|  [Agent 1] [Agent 2] [Agent 3] [Agent 4] |
|  [Agent 5] [Agent 6] [Agent 7] ...       |
+------------------------------------------+
|  Featured Jobs (keep existing)           |
+------------------------------------------+
```

**Agent Roster** (all DB-driven via `ai_agents` table):

| # | Agent Name | Purpose | Chat Cost | Delivery Cost |
|---|-----------|---------|-----------|---------------|
| 1 | Job Hunter | Conversational job search within user's country | 1 credit/msg | 1 credit per job suggested |
| 2 | Application Helper | Helps fill external job application forms | 1 credit/msg | TBD per deliverable |
| 3 | Remote Work Expert | Remote job search + skill gap advice | 1 credit/msg | 1 credit per job suggested |
| 4 | Career Abroad Advisor | Jobs outside user's home country | 1 credit/msg | 1 credit per job suggested |
| 5 | Study Abroad Advisor | Country-wise personalized roadmaps | 1 credit/msg | Variable per roadmap |
| 6-9 | IELTS Agents (x4) | Listening, Reading, Writing, Speaking prep | 1 credit/msg | N/A |
| 10 | Career Scorecard Coach | Replaces standalone assessment | 1 credit/msg | Variable |
| 11 | Interview Prep Coach | Replaces mock interview service | 1 credit/msg | Variable |
| 12 | Salary Negotiation Coach | Replaces salary analysis service | 1 credit/msg | Variable |
| 13 | CV & Portfolio Coach | Replaces portfolio service | 1 credit/msg | Variable |

**Credit Model Change**:
- The existing `useAgentChat` hook already supports per-response credit deduction via `credit_cost` from the `ai_agents` table
- We need to add a **two-tier credit model**: standard chat cost (1 credit) vs. delivery cost (variable, set per agent)
- The Edge Function `ai-agent-chat` needs a way for the AI to signal "this is a delivery response" (e.g., via a tool call or structured output marker) so the hook can charge the higher rate
- Add a `delivery_credit_cost` column to `ai_agents` table

**Database Migration**:
```sql
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS delivery_credit_cost numeric(12,1) DEFAULT 1.0;
```

Then insert the new agent rows via migration.

**UI in "For You" Tab**:
- Show agents as a horizontal scrollable row of avatar cards (name + icon + "1 credit/msg")
- Tapping an agent opens `AgentChatDialog` (existing component)
- Keep Featured Jobs section below the agents strip
- Remove "Recommended for You" (AI batch recommendations), "Expiring Soon", and "Hot Jobs" from this tab (moved to Collection tab)

**Files**: `JobsHub.tsx`, `useAgentChat.ts`, `ai-agent-chat/index.ts`, new DB migration, `agents.ts` constants

---

## Phase 6: Transform QuickActionsGrid to Personalized Agents

**Current**: 8 hardcoded shortcuts (Jobs, Abroad, For You, Remote, Scorecard, Interview, Salary, Portfolio)

**New Design**:
- Query the user's `agent_chat_sessions` to find their **most-used agents** (by message count or session count)
- Show top 8 agents as quick-access buttons with their avatar/icon
- If user has fewer than 8 used agents, fill remaining slots with **most popular agents** platform-wide (from `ai_agents.total_conversations`)
- If user has no history, show the 8 agents with highest `total_conversations`
- Tapping navigates to `/app/agents/{agent-key}` to open chat

**Files**: `QuickActionsGrid.tsx` (rewrite to be data-driven)

---

## Implementation Order

I recommend implementing in this order across multiple sessions:

1. **Phase 1** (Logo fix) - 10 min, immediate visual improvement
2. **Phase 3** (Collection tab) - 15 min, simple additions
3. **Phase 4** (Country tab) - 20 min, location parsing
4. **Phase 2** (Company tab) - 25 min, alphabet nav + industry filter
5. **Phase 5** (Agentic For You) - 45 min, DB migration + agent setup + UI rewrite + credit model
6. **Phase 6** (QuickActionsGrid) - 15 min, depends on Phase 5

**Total**: ~2 hours of implementation work. Phases 1-4 can be done in one session. Phase 5 is the largest and should be its own session. Phase 6 follows Phase 5.

Shall I proceed with all phases, or would you like to start with Phases 1-4 first?

