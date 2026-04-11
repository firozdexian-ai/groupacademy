# Transform "For You" Tab into Messenger-Style Agent Chat Hub

## Summary

Rename the "For You" tab to "Agents", replace the grid layout with a WhatsApp-style chat list, move "Recommended for You" to the Collection tab, and add country-specific Study Abroad agents.

---

## Changes

### 1. Rename Tab & Restructure Layout

- Change `TABS[0]` from `{ key: "for-you", label: "For You" }` to `{ key: "agents", label: "Agents" }`
- Update `activeTab` default and all references from `"for-you"` to `"agents"`

### 2. Messenger-Style Agent List (replaces 4-column grid)

Replace the current `grid grid-cols-4` agent cards with a vertical list resembling WhatsApp chats:

```text
+--------------------------------------------------+
| [Avatar]  Job Hunter                              |
|           Career Agent · 1 cr/msg                 |
+--------------------------------------------------+
| [Avatar]  Application Helper                      |
|           Career Agent · 1 cr/msg                 |
+--------------------------------------------------+
| [Avatar]  IELTS Speaking Coach                    |
|           Education · 1 cr/msg                    |
+--------------------------------------------------+
```

Each row shows:

- Round avatar (placeholder or `avatar_url` from DB)
- Agent name (bold)
- Description/designation line (category or short description)
- Credit cost badge on the right
- Last message preview if user has a session (from `agent_chat_sessions`)
- Tapping opens `/app/agents/{agent_key}`

### 3. Move "Recommended for You" to Collection Tab

- Remove the entire "Recommended for You" section (AI recommendations, the 10-credit button, processing card) from the agents tab
- Add it as a new section at the top of the Collection tab, above "Special Collections"
- Also remove "Expiring Soon" and "Hot Jobs" job lists from the agents tab (they already exist in Collection)
-  "Featured Jobs" section should also be taken to collections. 

### 4. Add Country-Specific Study Abroad Agents

The migration from the previous session only inserted one "Study Abroad Advisor". Add country-specific agents via a new DB migration:

- Study Abroad - USA
- Study Abroad - UK  
- Study Abroad - Canada
- Study Abroad - Australia
- Study Abroad - Germany
- Study Abroad - Malaysia

Each with `category = 'education'`, unique `agent_key` (e.g., `study-abroad-usa`), and a system prompt specialized for that country's visa, university, and scholarship landscape.

### 5. Performance: Fetch Recent Sessions for Chat Preview

To show "last message" previews in the messenger list, fetch the user's latest `agent_chat_sessions` with a single query (joined or batched), not per-agent. This keeps it to 1 DB call.

### 6. Admin Management

Agents are already managed via the `AIAgentsManager` in the admin dashboard (reads/writes `ai_agents` table). No admin changes needed — new agents appear automatically once inserted.

---

## Files Modified


| File                        | Change                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `src/pages/app/JobsHub.tsx` | Rename tab, replace grid with messenger list, move recommendations to Collection tab |
| DB migration (new)          | Insert country-specific Study Abroad agents                                          |


## Files NOT Changed

- `AgentChat.tsx`, `AgentChatDialog.tsx`, `useAgentChat.ts` — no changes needed, the chat experience stays the same
- `AIAgentsManager.tsx` — admin already supports all agents from the DB