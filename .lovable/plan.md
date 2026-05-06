# Sub-phase 1.2 — Type-Aware Catalog & Sessions Management

Goal: Make the admin Content list visually distinguish Live vs Recorded items, surface event-specific signals (date, capacity, sessions count, recording status), and add a fully-functional **Sessions** sub-tab inside `ContentEdit` so admins can schedule and manage multi-session live courses (batch classes / recurring webinars) without leaving the course editor.

---

## Part A — Type-Aware ContentList (`src/components/dashboard/ContentList.tsx`)

Today every catalog row renders the same metadata strip (price · duration · enrollments). Live and offline items hide their most important data (event date, capacity fill, session count, venue).

### A1. Type-aware metadata strip on each card
For each `content_type`, render a different chip set:
- **recorded_course / free_video**: modules count · total duration · enrollments · readiness
- **live_webinar**: event date in `event_timezone` · duration · capacity bar (`current_enrollment / max_capacity`) · "Live in 2d" countdown chip · session count
- **batch_class**: next session date · total sessions · capacity bar · enrolled
- **offline_seminar**: event date · venue name · capacity bar

### A2. Visual treatment per type
- Add a left accent bar color per type (already partly in `TYPE_CONFIG`); also colorize the type pill background for instant scan.
- New "LIVE NOW" pulsing badge when `event_date` is within ±duration window.
- New "PAST" muted badge when `event_date < now()` and item still published (prompts admin to unpublish or duplicate).

### A3. New filters & quick segments
Add to `ContentFilters.tsx`:
- Quick segment tabs at the top: **All · Recorded · Live & Webinars · Offline · Free**
- Date filter for live items: `Upcoming · This week · Past · Undated`
- "Has recording" toggle (live items where `youtube_url` set post-event)

### A4. Bulk action additions (live-aware)
- Bulk "Reschedule…" for selected live items (opens sheet with date+timezone picker, writes `event_date` for all).
- Bulk "Mark recording uploaded" — sets `youtube_url` from clipboard per row (manual confirm step).

### A5. Sessions count badge
Each live/batch row fetches `count(course_sessions)` (single aggregated query keyed by `content_id IN (...)`) and shows "3 sessions" chip; clicking deep-links to `ContentEdit?tab=sessions`.

---

## Part B — Sessions sub-tab in ContentEdit (`src/pages/ContentEdit.tsx`)

`ContentEdit` is currently a single long form. We introduce a tabbed shell so multi-session live courses get a real management surface backed by `public.course_sessions` (already exists, RLS in place — see migration `20251202073824`).

### B1. Tab shell
Wrap the existing form in a `Tabs` component with these tabs (the last two are conditional on `content_type`):
- **Schema** (existing form)
- **Modules** (existing module editor — unchanged this phase)
- **Sessions** *(new — only for `live_webinar`, `batch_class`, `offline_seminar`)*
- **Readiness** (the existing readiness sidebar moves here on mobile; stays as sidebar on desktop)

Tab state is mirrored to URL `?tab=sessions` so deep links from ContentList work.

### B2. Sessions tab UI (new component `src/components/dashboard/CourseSessionsManager.tsx`)
Layout:
```text
┌──────────────────────────────────────────────────────┐
│  Sessions for "Course Title"     [+ Add Session]     │
│  Timezone: Asia/Dhaka (BDT)        [Bulk reschedule] │
├──────────────────────────────────────────────────────┤
│  ▸ Session 1 · Mon Dec 9, 7:00 PM BDT · 60min        │
│      Instructor: Aisha · Status: scheduled           │
│      Meeting: zoom.us/...      [Edit] [Cancel] [Del] │
│  ▸ Session 2 · ...                                   │
└──────────────────────────────────────────────────────┘
```
Per-session fields (matches `course_sessions` schema):
- `title`, `description`, `scheduled_date` (UTC, picker uses `EventDateTimeField` + `event_timezone` from parent course as default), `duration_minutes`, `instructor_id` (select from `instructors`), `meeting_link`, `recording_link`, `status` (scheduled/ongoing/completed/cancelled).

### B3. Session quick-actions
- **Generate recurring series**: dialog "Every week, N sessions, starting <date>" creates rows in one batch insert.
- **Mark completed + attach recording**: status → `completed`, paste `recording_link`.
- **Copy meeting link** button per row.
- **Send reminder** stub button (queues a notification job — wired in a later sub-phase, but the row inserts into `notification_outbox` if table exists, otherwise toast "Reminders queue not yet configured").

### B4. Auto-sync helpers
- If the course has `event_date` set but no rows in `course_sessions`, show a one-click "Create first session from course event date" prompt.
- If user adds a session, optionally update parent `content.event_date` to earliest scheduled session (toggle in dialog).

### B5. Permissions & data
- All reads/writes via supabase client; RLS already restricts to admins.
- Single query: `course_sessions` filtered by `content_id`, ordered by `scheduled_date asc`.
- Use the same `EventDateTimeField` + `DEFAULT_EVENT_TZ` pattern already used in the schema form for consistency.

---

## Part C — Small supporting changes

- `ContentList.tsx` query: add `event_timezone`, `youtube_url` to selected columns; aggregate session counts in a follow-up `.from('course_sessions').select('content_id', { count: 'exact', head: false })` grouped client-side.
- New helper `src/lib/eventTime.ts` already exposes `formatEventInTz`; reuse for all date rendering — no inline `toLocaleString`.
- English-only copy throughout (per global rule).

---

## Files

**New**
- `src/components/dashboard/CourseSessionsManager.tsx` — Sessions tab manager + add/edit dialog.
- `src/components/dashboard/SessionFormDialog.tsx` — single session create/edit form.
- `src/components/dashboard/RecurringSessionDialog.tsx` — bulk generate.

**Edited**
- `src/pages/ContentEdit.tsx` — wrap in Tabs, mount Sessions tab conditionally, sync `?tab=` URL.
- `src/components/dashboard/ContentList.tsx` — type-aware chips, LIVE/PAST badges, sessions-count chip, session counts batched query.
- `src/components/dashboard/ContentFilters.tsx` — quick segment tabs, date-window filter, "has recording" toggle.

**No DB migration needed** — `course_sessions` table, enum, RLS, indexes already exist.

---

## Out of scope (handled in later sub-phases)
- Drag-reorder of modules (1.4)
- AI quiz/flashcard generation (1.5)
- Talent-side Sessions list & ICS download (separate talent-app sub-phase)
- Reminder email scheduling (lives in Phase 2 notifications)

Reply **continue** to implement.
