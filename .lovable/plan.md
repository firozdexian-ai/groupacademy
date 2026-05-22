# Phase A4 — Talent landing: Feed + Home + Shell

Following the master plan: small sub-phases, each independently shippable. Same lens as A1–A3: P0 broken, P1 polish/copy/jargon, P2 defer.

## Surfaces in scope

| Route | File | Role |
|---|---|---|
| `/app` → `/app/feed` | `App.tsx` redirect | Default landing |
| `/app/feed` | `Feed.tsx` + `src/domains/feed/components/talent/*` (~28 components) | Social feed |
| `/app/me` | `TalentHome.tsx` | Talent dashboard (readiness, pitches, credentials) |
| `TalentAppShell.tsx` | Layout | Header, bottom nav, notifications |
| `OnboardingGuard` | `App.tsx` | Gate wrapping shell |

Out of scope (deferred to their own phases): JobsHub, LearningHub, AbroadHub, AdminShell, AIAgents.

## Preliminary findings (static read)

### P0 candidates
- `TalentHome.tsx:24,45-48,57,74` still calls `adminSupportAssistant({ type: "talent_home_error", ... })` — same broken edge contract we ripped out of `TalentPublicProfile` in A3. Each error path silently logs to a dead endpoint. → swap to `trackError` like A3.
- `App.tsx:501` hardcodes `/app/feed` as the post-login landing. A returning talent who has never posted lands on an empty feed — `TalentHome` (`/app/me`) is the more meaningful "dashboard" but is hidden. → decide canonical landing: keep Feed (social default) but ensure Home is one tap away in bottom nav (currently it isn't — nav goes Home→Feed).

### P1 candidates (copy / jargon — same theme as A1–A3)
- `TalentHome.tsx`:
  - "Employers are currently matching against your node." → "Employers can find and contact you."
  - "outreach nodes" → "messages from employers"
  - "mastery nodes synchronized" → "verified skills"
  - "Profile Pinned for 24h." / "Boost operational fault." → "Your profile is pinned to the top for 24 hours." / "Couldn't boost your profile — please try again."
- `ComposePost.tsx:23-25,40` doc comment + telemetry event name reference "Digital Workforce", "Phase Z0", "Automated Efficiency protocols". Replace tracking event name with plain `compose_opened` and clean the doc.
- `FeedHeader`, `FeedFilters`, `FeedCardRedesigned` likely have similar jargon — full pass needed.
- `TalentAppShell.tsx:64-66,106` comments reference "Institutional User Experience Perimeter" / "PHASE: Real-Time_Notification_Orchestration" — internal but worth scrubbing for consistency.

### P1 — Functional checks to verify with live walkthrough
- `useFeedRecommendations` (263 LOC): confirm pagination + refresh + interest signal mutations work; check empty/error state copy.
- Hype + comment realtime path (memory: Agentic Feed Notifications) — confirm `feed_posts` and `post_comments` channels subscribe & unsubscribe cleanly; no double-handlers on remount.
- Quick Actions Grid (memory: Dynamic Personalized Quick Actions Grid) — `QuickActionsGrid.tsx` exists in feed components; verify it's actually mounted somewhere and personalized data loads.
- Bottom nav active state for `/app/me` and `/app/feed` (Shell line 199-200 only handles `/app/feed`).

### P2 (defer)
- Feed performance (virtualized list, image lazy-load) — track separately.
- `TalentHome` widget expansion (recent applications, saved jobs, upcoming sessions) — feature work, not audit.
- Onboarding-to-Feed transition animation.

## Sub-phases

### A4-FIX-1 — `TalentHome` cleanup (P0+P1, ~30 min)
- Drop `adminSupportAssistant` import + calls; replace with `trackError`.
- Humanize all copy ("node", "mastery", "operational fault", "Hidden from employers" → friendlier).
- Verify boost mutation + readiness rendering still work.

### A4-FIX-2 — Feed copy + jargon pass (P1, ~30 min)
- Walk every file in `src/domains/feed/components/talent/` for "node / synthesis / digital workforce / phase / protocol / telemetry / nodes synchronized".
- Replace tracking event names (`active_editor_session_initialized` etc.) with plain snake_case.
- Empty/error states: "Nothing here yet…" already OK; check others.

### A4-FIX-3 — Shell + nav polish (P1, ~20 min)
- Scrub `TalentAppShell` comments and any user-visible jargon strings.
- Confirm bottom-nav active-state logic covers `/app/me` and `/app/feed` correctly; consider adding `/app/me` to bottom nav (or keeping Home → Feed and adding a dedicated "Me" slot).
- Verify notification bell badge count + mark-as-read still work.

### A4-FIX-4 — Landing decision (P1, ~10 min)
Pick one:
- Keep `/app` → `/app/feed` (current) and ensure `/app/me` is reachable in 1 tap.
- Switch `/app` → `/app/me` for returning users and `/app/feed` for first-time.
- Recommend keeping Feed default + adding a "Home" / readiness chip in `FeedHeader` that deep-links to `/app/me`.

### A4-FIX-5 — Verification
- `gro10xnow@gmail.com` (admin): `/app/feed` and `/app/me` reachable without RBAC bounce.
- Fresh test `*@gro10x.com`: sign up → finish onboarding → land on `/app/feed`; tap Home → `/app/me` shows readiness card with empty pitches; create a post → appears in feed; hype it; comment; refresh.
- Check console for residual `adminSupportAssistant` / `Digital Workforce` log noise.

### A4-AUDIT-BACKFILL
- Add the missing `## A2 Onboarding — shipped` block to `.lovable/launch-audit.md` (mirror A1/A3 format) so the audit log is complete before we push deeper into the master plan.
- Add `## A4 Talent Landing — audit + shipped` block once A4-FIX-1..4 ship.

## Order & dependencies

A4-AUDIT-BACKFILL (write A2 entry) → A4-FIX-1 → A4-FIX-2 → A4-FIX-3 → A4-FIX-4 → A4-FIX-5. Each ships and is verified before the next.

## Out of scope (later phases)

- **A5 — Jobs Hub** (`/app/jobs`, JobsHub + tools tab + InfiniteJobsList + match scoring) — biggest single surface, deserves its own pass.
- **A6 — Learning Hub** (`/app/learning`, review queue, certificates).
- **A7 — Gigs / Projects / Reviewer** (`/app/gigs`, `/app/projects`, `/app/reviewer`).
- **A8 — Abroad + IELTS** (`/app/abroad/*`).
- **A9 — Admin shell** (`/dashboard/*`, 16 groups per memory index).
- **A10 — Public surfaces** (`/jobs/:id`, `/t/:handle`, `/projects/*`, `/c/:slug/*`, marketing site).

That is the launch master plan after A4.
