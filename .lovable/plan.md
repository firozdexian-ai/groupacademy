## Phase 11C — Career Abroad: Visibility + Agentic Roadmap

The Abroad surface (`/app/abroad`) currently lives only inside the burger menu / desktop dropdown. Country agents (`study-abroad-usa`, `-uk`, `-canada`, `-australia`, `-germany`, `-malaysia`) and IELTS agents exist in the DB but have **zero tools wired** — they can chat but can't generate a roadmap, search programs, or estimate budgets. This plan fixes both.

### 1. Visibility — Surface Abroad without breaking the 5-tab nav

We will NOT add a 6th bottom-nav tab (would crowd mobile). Instead:

- **Jobs Hub** — add a third top filter chip "🌍 Abroad" next to Local / Remote that deep-links to `/app/jobs?location=abroad`, plus a compact "Career Abroad" card in the hub's category strip.
- **Learning Hub** — add an "Study Abroad & IELTS" tile that routes to `/app/abroad`.
- **Feed Quick Actions Grid** — promote the existing `__abroad` tile to always appear in the top-8 (currently only shown if used recently).
- **AI Agents Hub** — add a dedicated **"Study Abroad"** category row that lists the 6 country agents + IELTS coaches inline, each with a "Build my roadmap" CTA.
- **Profile dropdown / mobile menu** — keep the existing entry but rename "Career Abroad" → **"Study & Work Abroad"** with a small "New" badge for 14 days.

### 2. Plain-English copy pass

Strip jargon across `CareerAbroad.tsx`, `StudyAbroad.tsx`, `IELTSPrep.tsx`, `StudyAbroadRoadmap.tsx`:
- "Global Mobility / Active Deployment Protocol v2.6" → "Study & Work Abroad"
- "Neural Language Calibration" → "IELTS Prep"
- "Geospatial Handshake / Registry / Telemetry" → "Destinations / Programs / Search"
- Section descriptions rewritten in plain English with clear value props.

### 3. Agentic Roadmap — country agents become the entry point

**New agent tool: `generate_study_roadmap`** registered in `agent_tools` (cost: 8 credits, same as the current direct flow). Handler invokes the existing `generate-study-roadmap` edge function so we reuse all working logic.

Wire `allowed_tools` on:
- `study-abroad-advisor` → `generate_study_roadmap`, `search_kb`, `analyze_job_market`
- `study-abroad-usa | uk | canada | australia | germany | malaysia` → `generate_study_roadmap`, `search_kb` (each agent's prompt pre-anchors `targetCountries` to its own country)
- `ielts-tutor`, `ielts-listening`, `ielts-reading`, `ielts-writing`, `ielts-speaking` → `search_kb`, `generate_study_roadmap` (so an IELTS chat can also branch into a full plan)
- `career-abroad` → add `generate_study_roadmap` to the existing toolset

Update each country agent's `system_prompt` to:
- Identify itself as the destination specialist
- Ask 3–4 short qualifying questions (degree level, field, intake, budget, IELTS status)
- Then call `generate_study_roadmap` with `targetCountries` locked to its country
- Render the resulting roadmap link inline ("View your USA roadmap →")

### 4. Roadmap intake — keep the form, add the agent path

`/app/abroad/roadmap` (the structured form) stays as the "I know what I want" path. From `CareerAbroad.tsx` and from each country agent card we add **two equal CTAs**:
- "Talk to a country expert" → opens `/app/agents/study-abroad-{country}`
- "Fill the roadmap form" → `/app/abroad/roadmap?country={code}`

Both end at the same `/app/abroad/roadmap/:id` results page.

### 5. Admin / dashboard

No new admin work — `StudyAbroadRoadmapLeadsManager` already lists generated roadmaps and works for both paths (form + agent), since both call the same edge function.

### Technical Summary

**DB migration**
- Insert `generate_study_roadmap` row in `agent_tools` with `handler_kind='edge_function'`, `handler_ref='generate-study-roadmap'`, JSON schema mirroring `RoadmapRequest`, `default_credit_cost=8`.
- Update `ai_agents.allowed_tools` and `system_prompt` for the 13 abroad/IELTS agents listed above.

**Edge function**
- Extend `agent-runtime` tool dispatcher to support `handler_kind='edge_function'` (forwards args + auth header to the named function and returns its JSON). If already supported, just point the tool at it.
- Add a small wrapper inside `generate-study-roadmap` so it accepts the agent-runtime payload shape and creates the `study_abroad_roadmaps` row itself when called without a pre-existing `roadmapId`.

**Files to edit**
- `src/pages/app/CareerAbroad.tsx` — rewrite copy, add dual CTAs, add country-agent grid.
- `src/pages/app/StudyAbroad.tsx`, `src/pages/app/IELTSPrep.tsx`, `src/pages/app/StudyAbroadRoadmap.tsx` — copy pass.
- `src/pages/app/JobsHub.tsx` — add "Abroad" filter chip + Career Abroad card.
- `src/pages/app/LearningHub.tsx` (or equivalent) — add Abroad tile.
- `src/components/feed/QuickActionsGrid.tsx` — pin `__abroad` in default top-8.
- `src/pages/app/AIAgents.tsx` (agents hub) — add Study Abroad category section.
- `src/layouts/TalentAppShell.tsx` — rename menu entry + "New" badge.

**Files to create**
- `supabase/migrations/<ts>_abroad_agents_roadmap_tool.sql`

### Out of scope
- No new bottom-nav tab.
- No changes to `study_abroad_programs` table or admin managers.
- No payment/credit changes beyond registering the new tool's cost.
