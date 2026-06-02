
# Talent-side Drop-off Audit & Fix Plan (E1)

A deep-dive of every "coming soon" surface, stub view, and orphaned page that's causing talents to bounce. Split into **what's actually broken**, **why it's broken**, and **what we ship** — grouped so we can land it in one focused track without touching backend logic.

---

## 1. What we found

### 1a. Hard "Coming Soon" gates on routes that DO have real code

| Route | Gate (App.tsx) | Real page that exists but is bypassed |
|---|---|---|
| `/app/languages` | `ComingSoonGate languages-hub` | `src/pages/app/LanguagesHub.tsx` (full hub) |
| `/app/languages/:code/practice` | `ComingSoonGate languages-practice` | `src/pages/app/LanguagePracticePage.tsx` |
| `/app/languages/:code/instructors` | `ComingSoonGate languages-instructors` | `src/pages/app/LanguageInstructorsPage.tsx` |
| `/app/talents` | `ComingSoonGate talent-directory` | `src/pages/app/TalentDirectory.tsx` (working, used by Connections) |
| `/app/learning/competitions` | `ComingSoonGate competitions` | Detail page `CompetitionDetail.tsx` exists; list page is the only thing missing |
| `/app/projects` | `ComingSoonGate managed-projects` | `MyProjects.tsx` + `ProjectRoom.tsx` ship; gate hides the index |
| `/app/reviewer` | `ComingSoonGate reviewer-program` | `ReviewerCockpit.tsx` exists (full screen) |

These are the **single biggest drop-off cause** — links inside the app (AbroadHub → `/app/languages`, public profile → `/app/talents/:id`, CoursesTab/EventsTab → competitions, Connections → `/app/talents/:id`) lead to a dead "Join the waitlist" form even though the destination page is built.

### 1b. Stub view files inside the domain structure

| File | State | Impact |
|---|---|---|
| `src/domains/learning/components/talent/views/TracksView.tsx` | 3 lines, returns `"Career Path coming soon."` | `/app/learning?tab=tracks` shows a one-liner — Career Path is the **2nd tab** of Learning Hub |
| `src/domains/learning/components/talent/views/MyHubView.tsx` | 33 lines, only renders sessions rail + courses list | Missing: Next-Best-Action card, Talent Mirror summary, Skill Credentials — all of which are already built components (`NextActionsCard`, `TalentMirrorPanel`, `SkillCredentialsPanel`) and just not wired in |
| `src/pages/app/CareerAbroad.tsx` | Legacy redirect only — fine, keep |
| `src/pages/app/TalentMirror.tsx` | Works but isolated from `/app/learning` |

### 1c. Disabled feature affordances inside live pages

- `src/domains/feed/components/talent/ComposePost.tsx` — Image upload and AI rewrite buttons exist but are disabled with `"coming soon"` tooltips (2 places each). Image upload was previously working via `feed_posts.media_url`; AI rewrite has an edge function already (`ai-content-originality`, `ai-item-rewrite`). Re-enabling these is a UI wire-up.
- `LearningCareerTracksTab` (admin side) still says `(Coming Soon)` in an `<h2>` — admin only, low priority but mentioned for completeness.

### 1d. Public-side cosmetic gate
- `PublicLeaderboard.tsx` still title-cases `"Top reviewers · Coming soon"` even though reviewer leaderboard data flows. Minor; tied to 1a if we ungate reviewer.

---

## 2. Why this hurts conversion

Three failure modes, in order of severity:

1. **Click → dead end.** AbroadHub, Connections, public profile, course/event cards all link to gated routes. The user took an action and got a waitlist form.
2. **Tab → empty screen.** `Career Path` tab in Learning Hub renders a single grey sentence.
3. **Affordance teases.** Compose post shows disabled buttons with "coming soon" tooltips, signalling the product is incomplete.

The previous v0.5 jargon work (D1–D4) cleaned copy but didn't reconnect these wires.

---

## 3. What we ship (E1 — talent reconnect pass)

Grouped so each chunk is independently shippable. **Frontend only — no schema, no edge functions added.**

### E1.1 — Ungate routes that have real pages
Edit `src/App.tsx` only:
- `/app/languages` → `<LanguagesHub />`
- `/app/languages/:code/practice` → `<LanguagePracticePage />`
- `/app/languages/:code/instructors` → `<LanguageInstructorsPage />`
- `/app/talents` → `<TalentDirectory />`
- `/app/projects` → `<MyProjects />` (project room already lives at `/app/projects/:projectId`)
- `/app/reviewer` → `<ReviewerCockpit />`

Keep `ComingSoonGate` only for **`/app/learning/competitions`** (no built list page) and `abroad-country-*` per-country gates (intentional regional rollout).

### E1.2 — Build the Career Path (TracksView) properly
Replace `views/TracksView.tsx` stub with a real composition of components that already exist:
- `CareerTracksPreview` (already exported from domain index)
- `TracksTab` (already in the domain barrel)
- Empty-state CTA → `/app/learning/tracks` (which routes to `AppProfessions`)

No new components — pure assembly of existing ones.

### E1.3 — Enrich MyHubView (Learning home)
Insert into `MyHubView.tsx` (in this order, above Enrolled Courses):
- `<NextActionsCard />` — Next-Best-Action, already built
- `<TrackProgressRing />` — when user is on a track
- `<SkillCredentialsPanel compact />` — collapsible, already built
- Keep existing UpcomingSessionsRail + MyCoursesTab

`TalentMirror` page stays as the deep-link; the panel becomes a *summary* on the hub.

### E1.4 — Re-enable Feed compose affordances
In `ComposePost.tsx`:
- Wire image upload to existing `feed-media` storage bucket pattern used elsewhere (Profile cover, talent CV) — single file, ≤5 MB.
- Wire "AI rewrite" button to existing `ai-content-originality` edge function (already invoked elsewhere), or fall back to a simple `/functions/v1/ai-instructor-chat` call. If wiring the AI is out of scope for a pure UI pass, hide the button instead of showing it disabled with "coming soon".

### E1.5 — Public leaderboard polish
Drop the `"Coming soon"` suffix from `PublicLeaderboard.tsx` reviewer title once E1.1 ungates `/app/reviewer`.

### E1.6 — Cleanup
- Remove `LearningCareerTracksTab` admin stub or replace with a "Manage tracks" link to the working admin Tracks page.
- Remove the `Career Abroad coming soon` line from `TracksView` after E1.2.

---

## 4. Out of scope (next tracks)

- **E2 — Competitions list page** (only remaining real "coming soon"; needs design + a `competitions` query).
- **E3 — Per-country abroad gates** (deliberate go-to-market rollout, leave gated).
- **D5 — Gigs/projects talent-hub copy scrub** (continuing the jargon series).
- Backend / RLS / edge functions.
- Visual redesign.

---

## 5. Technical notes

- All page imports for E1.1 already exist in `src/pages/app/` — no new files.
- `MyProjects.tsx` already filters by `auth.uid()` via existing hooks; no policy changes needed.
- `TalentDirectory.tsx` uses `search_public_talents` RPC — already shipping for employer CRM (memory: *Employer CRM & Sourcing*).
- `ReviewerCockpit` is gated behind `has_role(_, 'reviewer')` server-side; ungating the route is safe — non-reviewers see the apprentice-onboarding state already built into the page.
- `ComposePost` media wiring uses the same `storage_upload` pattern as `CoverImageUpload`.

---

## 6. Deliverable

One PR-equivalent batch:
- 1 file changed in `src/App.tsx` (route swaps).
- 2 files rewritten (`TracksView.tsx`, `MyHubView.tsx`).
- 1 file edited (`ComposePost.tsx`).
- 1 small edit in `PublicLeaderboard.tsx`.
- Optional: 1 admin tab cleanup.

Followed by a verification sweep: `rg -n "coming soon"` should return only the competitions route, per-country abroad gates, and (if we hide rather than wire) the feed AI button — all intentional.
