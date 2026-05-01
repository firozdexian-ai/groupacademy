## Phase 12A — Consolidated UI & Information Architecture Refresh

Combines the previous Phase 12A draft (compact UI for Learning/Feed, Jobs Tools tab, Quick Launch fix, Career Abroad cleanup) with the new feedback on Pathways/Academy/Arena structure.

---

### A. Learning Hub shell — compact rewrite

`src/pages/app/LearningHub.tsx`

- Replace giant "LEARNING ACADEMY" header with `text-xl font-bold "Academy"` + small subtitle, drop Sparkles pulse, drop "Active Professional Deployment Protocol" tagline, drop "Registry Sync: Optimized" chip and decorative footer.
- Banner: `BannerCarousel placement="learning"` inside `rounded-2xl` (not `rounded-[40px] shadow-2xl`).
- Tab nav: same compact pill bar as `JobsHub` — `h-12 bg-muted/50 rounded-xl border border-border/50 sticky top-14`, single-line `text-xs font-medium` labels, no two-line "detail" subtext, no Zap badge. Plain labels:
  1. **My Hub** (was My Hub)
  2. **Career Path** (was Pathways) — user explicitly renamed
  3. **Academy** (was Academy / courses)
  4. **Arena** (was Arena / events)
- Wrapper: `max-w-4xl px-3 py-3 space-y-5 pb-28`.

### B. Career Path tab (TracksTab) — open schools, gate professions

`src/components/learning/TracksTab.tsx` + `src/pages/app/SchoolDetail.tsx`

User feedback: in Executive academy, schools are visible but professions inside are not browsable. Open the schools, let students enter professions, then **only the connection-request CTA is gated** — directed at the school's lead instructor.

- Restyle category selector to compact pills (drop `rounded-[28px] grid-cols-5 gap-3 p-2` with 14×14 tiles → switch to a horizontal scroll-free `grid grid-cols-5` of slim chips `h-9 rounded-lg text-[10px] font-semibold`).
- All school cards become **clickable regardless of `is_ready`** (currently locked behind readiness). Route to `/app/learning/tracks/school/:slug` for everyone.
- In `SchoolDetail.tsx` (existing page): always render the profession list. For each profession card add:
  - A "Request to connect with instructor" button (replaces enrollment for not-yet-ready professions).
  - On click: insert a row into a new `instructor_connection_requests` table `(talent_id, school_id, profession_id, instructor_id, status, created_at)` with RLS allowing the talent to insert their own and the instructor (resolved via `user_roles`/`talents.user_id` tied to the school's lead instructor) to read.
  - When request is created, enqueue a notification to the instructor via existing `enqueue_email` + push to `notifications` (so instructors can later trigger a broadcast push to interested students for cohort kick-off).
- Remove "BROWSE_ACADEMY", "NO_ACTIVE_TRAJECTORY_NODES", "Sync_Status" copy → "Browse academy", "No active programs yet", "Progress".
- Card chrome: `rounded-2xl border border-border/40 p-4`, drop `rounded-[32px] backdrop-blur shadow-2xl`.

### C. Academy tab (CoursesTab) — consolidate webinars + classes

`src/components/learning/CoursesTab.tsx`

User feedback: "courses" = recorded; consolidate `live_webinar` and `batch_class` into a single visual section that **shows webinars as single events and classes as batches** in cards.

- Filter chip set becomes 2 chips only: **Courses** (`recorded_course`) and **Live Programs** (`live_webinar` + `batch_class`).
- In "Live Programs" view, render a unified card list:
  - For `live_webinar` → card shows single event date/time badge.
  - For `batch_class` → card shows batch label ("Batch starts {date} · 8 weeks") and capacity progress.
- Remove `offline_seminar` from Academy (moves to Arena).
- Card style: compact — `rounded-2xl`, `aspect-[16/9]` thumb, `p-3`, `text-sm font-semibold` titles (drop `text-xl uppercase italic`), drop `EVERGREEN_TRACK`/`SYNC_NOW`/`NEURAL_VIDEO` copy → "Course", "Webinar", "Batch class", "Open".
- Filter bar: `h-12 bg-muted/50 rounded-xl` matching JobsHub.

### D. Arena tab (EventsTab) — events + study abroad

User feedback: Arena should be the **fourth events-oriented tab** covering in-person seminars + competitions + (new) study abroad section. Webinars/classes leave Arena (handled in Academy).

`src/components/learning/EventsTab.tsx`

- Filter chip set becomes 3: **In-Person** (`offline_seminar`), **Competitions**, **Study Abroad**.
- Drop the `live_webinar` filter from Arena (lives in Academy now).
- Add **Study Abroad** sub-view rendering:
  - Top: "Talk to a country specialist" compact strip (links into Agent Marketplace `?category=abroad`).
  - "Browse universities" grid (links to `/app/abroad/study?country=…`).
  - "IELTS Prep" entry card (links to `/app/abroad/ielts`).
  - "Build my 12-month roadmap" CTA (links to `/app/abroad/roadmap`).
  - Implementation: extract these blocks from `CareerAbroad.tsx` into a new `src/components/learning/StudyAbroadSection.tsx` so `CareerAbroad` page can be retired (route still redirects → `/app/learning?tab=events&kind=abroad`).
- Restyle all event/competition cards to compact: `rounded-2xl`, `p-3`, `text-sm font-semibold`, drop `REGISTER_SYNC`/`COMM_NODE`/`PRIZE_LAYERS`/`ENTER_HUB` copy → "Register", "WhatsApp", "{n} prizes", "View".

### E. My Hub tab (MyCoursesTab) — compact cards

`src/components/learning/MyCoursesTab.tsx`

- Drop the two large "ACTIVE_TRAJECTORIES / GRADUATED_NODES" badges; replace inner `Tabs` with simple section headers "In progress" and "Completed".
- Cards: `rounded-2xl`, `h-24` image, `p-3`, `text-sm font-semibold` titles (no italic/uppercase). Replace "SYNC_PROGRESS" → "Progress", "COHORT_SYNC" → "WhatsApp group", "VERIFY_CREDENTIAL" → "View certificate", "RE_INITIALIZE_SYNC" → "Retry", "CURRICULUM_OFFLINE" → "Nothing here yet".

### F. Feed UI consolidation

**`src/components/feed/FeedCardRedesigned.tsx`** — currently `rounded-[32px]`, `p-6`, `text-lg font-black uppercase italic`, "INITIALIZE_VIDEO"/"AUTHORIZE_COURSE" pill copy.

- Compact rewrite: `rounded-2xl border border-border/40`, `p-3`, title `text-sm font-semibold line-clamp-2` (no italic/uppercase). Action labels: "Watch" / "Open course" / "Read" / "View". Action button `h-9 text-xs`. Floating bookmark/match cluster `h-8 w-8 rounded-lg`. Reduce match-reason block to one `text-[11px] text-muted-foreground line-clamp-2` line.

**`src/pages/app/Feed.tsx`** — remove the second `BannerCarousel compact` (duplicate visual weight). Tighten to `px-3 py-3`.

### G. Quick Launch grid fix

`src/components/feed/QuickActionsGrid.tsx`

- Container: `rounded-2xl p-3 border border-border/40`. Drop "QUICK_LAUNCH_NODE" italic header and "AUTHORIZED" chip → small `text-xs font-semibold "Quick actions"`.
- Tiles: `h-12 w-12 rounded-xl`; label `text-[10px] font-medium normal-case`.
- Replace the **Abroad shortcut** (the "just a chat agent button" the user flagged) with a **Messages** shortcut → opens `/app/messages`. If unread thread count > 0, show a tiny badge.
- Keep grid `grid-cols-4 overflow-hidden` (no horizontal scroll).

### H. Jobs Hub — replace Agents tab with Career Tools

`src/pages/app/JobsHub.tsx`

- Rename tab `agents` → `tools` (icon `Wrench`). Drop `careerAgents` query and the agent cards section entirely.
- Tools tab content (traditional, **non-agentic**):
  1. **AI Job Matches** — existing `suggest-jobs-for-talent` flow (10 credits).
  2. **ATS-Friendly CV Maker** — NEW. Form-based builder, outputs PDF via existing `pdfGenerator.ts` + new `ATSCVTemplate`. Route `/app/tools/cv-maker`. Credit-gated `CV_GENERATION` (15 credits, add to `creditPricing.ts`).
  3. **Score Me vs Job** — existing flow.
  4. **Application Answer Sheet** — NEW. User pastes JD + question list, gets prepared answers PDF. Route `/app/tools/application-helper`. Edge function `generate-application-answers` (Lovable AI Gateway, `google/gemini-3-flash-preview`, JWT verify, CORS, Zod validation). Credit `APPLICATION_ANSWERS` (10).

### I. Locations tab — pin residency country, drop `/app/jobs?location=abroad`

`src/pages/app/JobsHub.tsx`

- Detect `talent.residency_country` (or country derived from phone). Pin as the first card with header **"Jobs in your country"**.
- Add divider + **"Explore other countries"** header above the rest of `countryGroups`.
- Update `/app/jobs?location=abroad` route to redirect to Locations tab (no preselected country).

### J. Career Abroad page retirement

`src/pages/app/CareerAbroad.tsx`

User: "study abroad section… inside the learning tab actually."

- Remove the country-agent grid and the 3-section card block from CareerAbroad.
- The page becomes a thin redirect → `/app/learning?tab=events&kind=abroad` (Arena → Study Abroad sub-view).
- All deep-link routes (`/app/abroad/study`, `/app/abroad/ielts`, `/app/abroad/roadmap`) keep working as standalone pages.
- Update `src/lib/routes.ts` and bottom-nav to drop the dedicated "Abroad" entry; surface remains via Quick Launch (Messages now) + Arena tab.

---

### Technical Details

**New files**
- `src/pages/app/tools/CVMaker.tsx`
- `src/pages/app/tools/ApplicationHelper.tsx`
- `src/components/tools/ATSCVTemplate.tsx`
- `src/components/learning/StudyAbroadSection.tsx`
- `supabase/functions/generate-application-answers/index.ts`

**Edited files**
- `src/pages/app/LearningHub.tsx`
- `src/components/learning/MyCoursesTab.tsx`
- `src/components/learning/TracksTab.tsx`
- `src/components/learning/CoursesTab.tsx`
- `src/components/learning/EventsTab.tsx`
- `src/pages/app/SchoolDetail.tsx` (open profession list + connect-instructor CTA)
- `src/components/feed/FeedCardRedesigned.tsx`
- `src/components/feed/QuickActionsGrid.tsx`
- `src/pages/app/Feed.tsx`
- `src/pages/app/JobsHub.tsx` (Tools tab + pinned residency country)
- `src/pages/app/CareerAbroad.tsx` (becomes redirect)
- `src/lib/creditPricing.ts` (add `CV_GENERATION`, `APPLICATION_ANSWERS`)
- `src/lib/routes.ts` and `src/App.tsx` (register tool routes; redirect `/app/abroad`)

**DB migration**
- `instructor_connection_requests` table: `(id uuid pk default gen_random_uuid(), talent_id uuid not null, school_id uuid not null, profession_id uuid, instructor_id uuid, message text, status text default 'pending', created_at timestamptz default now())`
- RLS enabled; talent can `insert`/`select` own rows (`auth.uid() = (select user_id from talents where id = talent_id)`); instructor can `select`/`update` rows where `instructor_id` resolves to their `user_id`; admins via `has_role(auth.uid(),'admin')`.
- Trigger `on_instructor_connection_request_created` → calls `enqueue_email` to instructor + inserts a row in `notifications` for them.
- All functions `set search_path = public` and `security definer` where needed.

**No schema changes** for the rest (all data already present).

**Memory updates after implementation**
- Update `mem://features/learning-hub-tabbed-interface` to record: tabs renamed (My Hub / Career Path / Academy / Arena); Academy consolidates webinars+classes; Arena now hosts in-person + competitions + study abroad.
- New memory `mem://product/career-tools-traditional-suite` for non-agentic Jobs Tools tab.
- Update `mem://product/agentic-career-hub-transformation` to note Jobs Hub no longer surfaces agent cards (marketplace is the single agent surface).

**Risks**
- Visual regression on Learning Hub — mitigated by mirroring the JobsHub/Messages compact patterns already shipped.
- Instructor connection-request notification needs an instructor → user mapping; if a school has no resolvable lead instructor, fall back to admin inbox so requests are never lost.

---

Approve to proceed with the consolidated Phase 12A.