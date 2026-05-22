# Phase 10j.5k13 — Delete redundant shim folders

## What you're seeing and why

You're right. Files like `src/components/feed/PostCard.tsx` currently contain only:

```ts
export * from "@/domains/feed/components/talent/PostCard";
```

These are **re-export shims** — leftovers from earlier phases when we moved code into `src/domains/*` but kept the old paths working so nothing broke mid-refactor. They're not "the new structure," they're scaffolding we forgot to take down.

Count today: **124 shim files** across `src/components/{feed,gigs,jobs,learning,profile,ai-agents,messages}/` and `src/hooks/use*` — all one-line re-exports. About **73 other files** still import through those old paths.

The refactor batches (5k1–5k12) have been moving *data access* (`supabase.from(...)`) into repos. That's a different axis. Folder cleanup wasn't part of those batches, which is why you don't see structural change in the file tree. Fair criticism — should have done this earlier.

## Plan

### Step 1 — Rewrite importers (~73 files)
Mechanical find-replace of old paths to canonical domain paths. Examples:

```
@/components/feed/PostCard         → @/domains/feed/components/talent/PostCard
@/components/gigs/GigCard          → @/domains/gigs/components/talent/GigCard
@/components/jobs/JobCard          → @/domains/jobs/components/JobCard
@/components/learning/CoursesTab   → @/domains/learning/components/talent/CoursesTab
@/components/profile/SkillsEditor  → @/domains/profile/components/talent/SkillsEditor
@/components/ai-agents/AgentCard   → @/domains/agents/components/talent/AgentCard
@/components/messages/ChatBubble   → @/domains/messaging/components/talent/ChatBubble
@/hooks/useFeedEngagement          → @/domains/feed/hooks/useFeedEngagement
@/hooks/useCredits                 → @/domains/finance/hooks/useCredits
…etc
```

Driven by reading each shim's single `export * from` line to get the exact target — no guessing.

### Step 2 — Delete the 124 shim files
Once nothing imports them, `rm` them. Folders that become empty (`src/components/feed/`, `src/components/gigs/`, etc.) get removed too.

### Step 3 — Verify
- `rg "@/components/(feed|gigs|jobs|learning|profile|ai-agents|messages)/" src` → must return 0
- `rg "from \"@/hooks/(useFeed|useHype|usePoll|usePost|useCredits|useCreditPurchase|useDirectMessages|useMessageThreads|useAgent|useContent|usePayment)" src` → 0
- Build passes (TS + Vite).

### Step 4 — Update plan.md
Record removed folders and new file counts.

## Why one batch instead of eight
This is mechanical and low-risk: every shim has exactly one re-export target, so the mapping is unambiguous. Splitting it across batches would just delay the cleanup you actually want to see.

## Out of scope
- `src/hooks/use{Auth,Toast,Mobile,MediaQuery,…}` — these are real hooks, not shims. Keep.
- `src/components/ui/*` (shadcn) — real components. Keep.
- Repo/api boundary work (already done in 5k1–5k12).

## After this
File tree will actually look like: `src/domains/<domain>/{components,hooks,repo,api}` + `src/pages` + `src/shells` + `src/platform` + `src/lib` + real `src/hooks`. No phantom folders.

Approve and I'll execute in one pass.

---
## ✅ Executed
- Deleted **124 shim files** across `src/components/{feed,gigs,jobs,learning,profile,ai-agents,messages}/` and `src/hooks/`
- Rewrote **114 import statements** across **73 files** to point directly at `@/domains/*`
- Removed 8 now-empty directories: `src/components/{feed,gigs,profile,messages,ai-agents}`, `src/components/jobs`, `src/components/learning/views`, `src/components/jobs/views`
- Verified: `rg '@/components/(feed|gigs|jobs|learning|profile|ai-agents|messages)/' src` → **0 matches**
- Verified: shim hook imports → **0 matches**
