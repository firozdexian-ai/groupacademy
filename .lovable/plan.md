

# AI Agents Tab Improvements

## Overview

After reviewing the AI Agents listing page and chat experience, here are the improvements to align with the tighter, mobile-optimized layout standard established across the Feed, Jobs, Learning, and Profile tabs.

---

## Improvements

### 1. AI Agents Listing (`AIAgents.tsx`) - Tighten Layout

**Current issues:**
- `py-6 space-y-6` creates too much vertical gap on mobile (should be `py-4 space-y-4` to match other tabs)
- Hero header padding `p-5` is slightly generous

**Fixes:**
- Reduce `py-6` to `py-4` and `space-y-6` to `space-y-4`
- Reduce hero padding from `p-5` to `p-4`

### 2. Agent Cards (`AgentCard.tsx`) - Compact Mobile Layout

**Current issues:**
- Cards have a `pt-2` spacer above the avatar that wastes space
- The description `min-h-[2.5rem]` forces all cards to the same height even when unnecessary
- Both "Active" badge AND "Resume" button show for active sessions, which is redundant

**Fixes:**
- Remove the `pt-2` spacer above the avatar
- Remove the `min-h-[2.5rem]` from description (let natural height work)
- Remove the separate "Active" badge since the "Resume" button already communicates the state

### 3. Chat Dialog (`AgentChatDialog.tsx`) - Full-Height Mobile Experience

**Current issues:**
- Container has `max-h-[700px]` which clips the chat on taller phones and wastes space on shorter ones
- The `h-[calc(100vh-8rem)]` doesn't account for the bottom navigation bar (`pb-24` / 6rem), so the input area may be hidden behind the nav
- The border/rounded-lg/shadow on the container creates an unnecessary "card within a page" feel on mobile -- it should feel like a native full-screen chat
- The "AI can make mistakes" disclaimer takes up vertical space in the input area

**Fixes:**
- Remove `max-h-[700px]`, `border`, `rounded-lg`, and `shadow-sm` on mobile to make it feel like a native chat screen
- Adjust height calc to `h-[calc(100vh-8rem)]` to account for bottom nav (matching the `pb-24` standard)
- Remove the "AI can make mistakes" text on mobile (keep on desktop) to save input area space
- Add `pb-16` to the parent page (`AgentChat.tsx`) to ensure the input clears the bottom navigation

### 4. Chat Input Area - Better Mobile Touch Targets

**Current issues:**
- Input `min-h-[44px]` is good but the overall form padding `p-4` could be tighter
- Send button at `h-11 w-11` is fine

**Fixes:**
- Reduce form padding to `p-3` on mobile for a more native messaging feel
- Ensure the input area has a subtle top border for clear separation

### 5. Empty State Suggestions - Horizontal Scroll

**Current issue:** The suggestion chips use `flex-wrap` which can create 3-4 rows on mobile, pushing the input far down on the first visit.

**Fix:** Switch to `overflow-x-auto flex-nowrap` horizontal scroll for suggestions, so they stay in a single row and the chat input remains visible.

### 6. Agent Filters (`AgentFilters.tsx`) - Minor Spacing

**Current issue:** `space-y-3` between search and category pills is slightly generous.

**Fix:** Reduce to `space-y-2` for tighter grouping.

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/app/AIAgents.tsx` | Reduce spacing to `space-y-4`, `py-4`, hero padding to `p-4` |
| `src/components/ai-agents/AgentCard.tsx` | Remove `pt-2` spacer, `min-h` on description, remove redundant Active badge |
| `src/components/ai-agents/AgentChatDialog.tsx` | Remove `max-h-[700px]` and border on mobile, adjust height for bottom nav, remove disclaimer on mobile, horizontal suggestions scroll |
| `src/pages/app/AgentChat.tsx` | Add `pb-16` for bottom nav clearance |
| `src/components/ai-agents/AgentFilters.tsx` | Reduce `space-y-3` to `space-y-2` |

---

## What stays the same

- All existing functionality (credit gate, session management, streaming)
- Color palette and theme
- No database changes
- Agent data fetching logic unchanged

