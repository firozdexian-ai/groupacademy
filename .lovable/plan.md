# Phase 5 — Replicate the vertical-slice pattern across remaining domains

## Phase 5.1 — feed: DONE ✅
- 6 hooks → `src/domains/feed/hooks/` with barrel re-exports at `src/hooks/*`
- 28 components → `src/domains/feed/components/talent/` with barrel re-exports at `src/components/feed/*`
- `src/edge/contracts/feed.ts` typed RPC contracts (no edge fns yet — RPC-only domain)
- `src/domains/feed/api/manifest.ts` with `feedApi` wrapping `get_feed_engagement`, `hype_content`, `tip_comment`
- `src/domains/feed/index.ts` exposes hooks + api; components remain accessible via legacy barrels

Next: Phase 5.2 — profile (231K).


Phase 4 finished `learning/` end-to-end (hooks + talent UI + admin UI + gro10x UI + typed edge contracts). The next phase begins applying that exact same recipe to the remaining 13 domains, starting with the most heavily-used talent surface: **`feed`**.

## Progress so far (~30%)

| Domain | Hooks | Talent UI | Admin UI | Gro10x UI | Edge contracts |
|---|---|---|---|---|---|
| agents | ✅ | ✅ | ✅ | – | partial |
| jobs | ✅ | ✅ | ⏳ (297K) | ⏳ | ⏳ |
| learning | ✅ | ✅ | ✅ | ✅ | ✅ |
| **feed → next** | ⏳ | ⏳ (217K) | – | – | ⏳ |
| 12 others | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

## Phase 5.1 — `feed` domain (this phase)

Why feed first: largest remaining talent surface (217K, 28 components), 6 dedicated hooks, no admin/gro10x footprint to coordinate → cleanest second proof of the recipe. Profile (231K) and gigs (189K) follow in 5.2 / 5.3.

### Step 5.1.1 — Hooks
Move 6 hooks to `src/domains/feed/hooks/` with barrel re-exports at `src/hooks/*`:
- `useContentHype`, `useFeedEngagement`, `useFeedRecommendations`, `useHype`, `usePollVoting`, `usePostReactions`

### Step 5.1.2 — API manifest
Create `src/domains/feed/api/manifest.ts` wrapping every `supabase.functions.invoke` currently called from feed UI/hooks. Expected functions (to be confirmed during sweep): hype boost, content reactions, poll vote, feed recommendations refresh, share/notification triggers, AI caption.

### Step 5.1.3 — Talent UI
Move all 28 files from `src/components/feed/**` → `src/domains/feed/components/talent/**`. Barrel re-export at every old path. Rewrite intra-folder imports to relative paths. Surface key components in `src/domains/feed/index.ts`.

### Step 5.1.4 — Typed edge contracts
Generate `src/edge/contracts/feed.ts` with request/response types for every `feedApi` function. Wire `feedApi` to use them.

### Step 5.1.5 — Sweep direct invokes
Replace remaining direct `supabase.functions.invoke('<feed-fn>')` calls in feed UI/hooks with `feedApi.*`. (F3 fix.)

### Step 5.1.6 — Verification
Type-check passes; `/app/feed`, `/app/post/:id`, hype boost sheet, poll voting still load.

### Out of scope for Phase 5.1
- Other domains (5.2+).
- Shell route splitting / `React.lazy` (Phase 7).
- Platform extraction (Phase 6).
- Retiring barrel re-exports (Phase 8).

### Risks
- 28 files = high import fan-in across `TalentHome`, `PostDetail`, `Notifications`. Mitigation: barrel re-exports keep every existing import working until Phase 8.
- Some feed components import from `learning` / `jobs` (e.g. `QuickActionsGrid` cross-links). Mitigation: domains may import sibling `@/domains/*`; no fix needed.

## Roadmap after 5.1

```text
5.2  profile         (231K)
5.3  gigs            (189K)
5.4  abroad          (40K)
5.5  messaging
5.6  companies
5.7  marketing
5.8  ir
5.9  finance
5.10 institutions
5.11 workforce
5.12 ugc
5.13 dashboard residuals (admin tabs for jobs, agents-admin-tabs)

Phase 6  platform/ extraction (ui, auth, design-system)
Phase 7  shells/*/routes.tsx + React.lazy  ← bundle-size win lands here
Phase 8  retire all barrel re-exports
Phase 9  edge/contracts/ for every domain
```

Approve and I'll start Step 5.1.1 (feed hooks move).
