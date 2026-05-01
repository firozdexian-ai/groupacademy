## Phase 11I — Agent Marketplace polish & inbox backfill

Targeted fixes to `/app/agents`, agent profile, and the messenger inbox based on the latest feedback.

### 1. Eliminate duplicate search bar
`AIAgents.tsx` renders its own search input in the sticky header AND the `AgentFilters` component (which has another search). Remove the search field inside `AgentFilters` entirely; keep only the compact one in the header. `AgentFilters` becomes a pure category picker.

### 2. Compact icon-based filters with "More"
Replace the horizontally-scrolling pill strip in `AgentFilters` with a fixed 4-slot icon row (no sideways scroll on mobile):
- Slot 1–3: top three categories (All, Career, Education)
- Slot 4: a `More` button that opens a bottom sheet listing remaining categories (Finance, Wellness, Company, plus future ones)
- Each slot is a small square icon + 1-line label, active state filled with primary color
- Strip the cyberpunk "Trajectory_Filters / Registry_All" labels — use plain English category names

### 3. Bring instructor / school agents into the marketplace
The `ai_instructors` table and the in-course `AIChatPanel` produce a separate set of agents that never surface in `/app/agents`. Plan:
- Add a SQL migration that, for each row in `ai_instructors` (or each instructor referenced by `content_instructors`), upserts a corresponding row in `ai_agents` with `agent_type = 'instructor'`, mapping `name`, `avatar_url`, profession line, and a default `credit_cost`.
- Backfill once + add a trigger on `ai_instructors` insert/update to keep `ai_agents` in sync.
- Add `instructor` to `AgentCategory` and the icon row (under "Education" — it shares the same icon).
- Marketplace card and profile already render any `ai_agents` row, so no UI change needed beyond the new category.

### 4. Add a marketplace banner
Insert a single 3:1 banner slot above the filters in `AIAgents.tsx`. Reuse the existing `BannerCarousel` component, scoped to a new `placement = 'agents_marketplace'`. Falls back to nothing if no active banners.

### 5. Fix mobile CTA layout on agent cards
On mobile, the `Message` icon button on `AgentCard` was getting clipped/hidden next to the wide "View Profile" button. Restructure the card CTA:
- Single primary button: `View Profile` (full width)
- Move the connect/message action INSIDE the profile page only
- On `AgentProfile.tsx`, replace the bottom "Connect & Message" button with a button that shows the connection cost inline:
  - Not yet connected: `Connect · {connection_fee} credits` (or `Connect · Free` if 0)
  - Already connected: `Message` (routes to `/app/messages/:agentKey`)
- "Connected" status is detected by the existing `agent_chat_sessions` lookup or by a new `agent_connections` row (see step 6).

### 6. Backfill historical conversations into the inbox
Users who chatted with agents before Phase 11H have no `message_threads` row, so the inbox looks empty. Migration:
- One-time SQL backfill: for every distinct `(talent_id, agent_key)` in `agent_chat_sessions`, insert a `message_threads` row (if absent) with `last_message_at = max(updated_at)` and a preview taken from the last message in the JSON.
- Also backfill any prior `ai_chat_sessions` (instructor chats) once those instructors exist as `ai_agents` rows (step 3).
- Verify the existing `agent_session_to_thread` trigger covers future inserts.

### 7. Connection model (lightweight)
To make "connected" meaningful and to gate the Message CTA:
- Add `agent_connections (talent_id, agent_key, connected_at, connection_fee_paid)` table with RLS (talent owns their rows).
- `Connect` button on profile creates the row, deducts `connection_fee` if > 0, then routes to `/app/messages/:agentKey`.
- `useMessageThreads` and `AgentProfile` use this table to decide CTA label.
- Backfill: any historical `agent_chat_sessions` row implies a free connection — insert matching `agent_connections` rows in the same migration as step 6.

### Files touched
- `src/pages/app/AIAgents.tsx` — remove duplicate search, add banner slot, simplified filter wiring
- `src/components/ai-agents/AgentFilters.tsx` — rewrite as 4-icon row + More sheet, drop internal search
- `src/components/ai-agents/AgentCard.tsx` — single full-width "View Profile" CTA
- `src/pages/app/AgentProfile.tsx` — Connect/Message CTA with fee inline; uses `agent_connections`
- `src/hooks/useMessageThreads.ts` — no logic change; benefits from backfill
- New migration: `agent_connections` table + RLS, instructor→ai_agents sync trigger + backfill, message_threads backfill from `agent_chat_sessions` and `ai_chat_sessions`
- `src/lib/constants/agents.ts` — add `instructor` category metadata

### Out of scope
- Web (desktop) dual-pane redesign for `/app/messages` — leaving as-is for now.
- Editing the cyberpunk copy elsewhere in the app.