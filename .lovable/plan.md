## Phase 4.2 — Cohorts, Live Classes & Attendance

Builds on the closed-loop instructor model (4.1) and the live-event primitives already in `course_sessions`, `JoinLivePanel`, and `WebinarLanding`. Goal: turn the platform from "schedule a single live event" into a real cohort-based learning surface — with sessions, attendance, recordings, and reminders shared across talent, instructor, employer (Gro10x), and admin.

### Goals

- First-class cohorts with start/end dates, capacity, and per-cohort enrollments.
- A real session calendar per course (lectures, office hours, reviews) — not just one `event_date`.
- Automated attendance tracking with green-room CTA, manual instructor override, and exports.
- One join-flow that works on web, mobile PWA, and Gro10x for employer-assigned learners.
- Admin/instructor visibility into cohort health (enrollment, attendance, completion).

---

### Sub-deliverables

1. **Cohort model** — make a course optionally cohort-driven and let many cohorts share the same content.
2. **Session calendar** — extend `course_sessions` (already exists, single-table) into a usable schedule per cohort with timezone, duration, recording, resources.
3. **Green-room & join flow** — generalize `JoinLivePanel` to a session-level component with countdown, "in waiting room" state, and post-session recording.
4. **Attendance engine** — auto-mark on join, manual override by instructor, plus a fallback "I attended" self-report.
5. **Reminders & comms** — email + in-app notifications at T-24h, T-1h, T-5min, plus "session is live" + "recording ready".
6. **Instructor cockpit** — `Sessions` tab inside `/app/instructor/courses/:id` for CRUD, attendance grid, broadcast message.
7. **Talent surface** — `My Cohort` panel on `AppCourseDetail`, plus an "Upcoming sessions" rail on `AppMyLearning` and `LearningHub`.
8. **Gro10x employer surface** — show cohort progress per assigned learner inside `Gro10xLearn` (uses existing assignments).
9. **Admin Learn console** — new "Cohorts" tab listing all cohorts, capacity utilization, attendance rate, and a "force-close" action.

---

### Technical Details

#### Database

- `cohorts`: `id, content_id, code, name, starts_on, ends_on, timezone, capacity, status (planning/open/in_progress/completed/archived), instructor_engagement_id, brief_id, created_at`.
- `cohort_enrollments`: links `enrollments.id ↔ cohort_id`. Backfill existing enrollments into a synthetic "self-paced" cohort per content (so the cohort table is the new join point).
- Extend `course_sessions`:
  - add `cohort_id uuid` (nullable for legacy), `event_timezone`, `kind` (`lecture/office_hours/review/exam/orientation`), `module_id` (optional anchor), `is_mandatory`, `resources jsonb`.
  - keep existing single-event behavior for legacy courses.
- `session_attendance`: `session_id, user_id, status (attended/partial/absent/excused), joined_at, left_at, source (auto/self/instructor), duration_seconds`. Unique on `(session_id, user_id)`.
- `session_messages` (lightweight broadcast log per session, optional but used by reminders).
- Helper RPCs:
  - `cohort_health(cohort_id)` → enrollment count, attendance %, avg progress, dropoff.
  - `mark_session_attendance(session_id)` → idempotent self-mark with auth check.
  - `instructor_session_attendance(session_id)` → grid of enrolled learners + status (instructor only).
- Trigger: when `course_sessions.status` flips to `completed` and `recording_link` is set, fire `notify-learning-event` ("recording ready").

#### Edge functions

- `notify-learning-event` (new) — single function with `kind` discriminator: `session_reminder | session_live | recording_ready | cohort_started | cohort_completed`. Fans out to in-app + email via existing `notify.groupacademy.online` queue.
- `cron-session-reminders` (scheduled) — runs every 5 min, finds sessions in T-24h/T-1h/T-5min windows and queues notifications. Idempotent via a `notification_dispatch` ledger row keyed `(session_id, kind, window)`.
- Reuse `ai-item-generate` instructor credit pool — no new credit type.

#### Frontend

- New hooks: `useCohorts`, `useCohort(cohortId)`, `useCohortSessions`, `useSessionAttendance`, `useUpcomingSessions(userId)`.
- Generalize `JoinLivePanel.tsx` → accept a `session` prop; existing `course.event_date` path becomes a thin adapter (keeps WebinarLanding working).
- New components:
  - `cohorts/CohortHeader.tsx` (talent-facing)
  - `cohorts/SessionList.tsx`, `cohorts/SessionCard.tsx`
  - `instructor/SessionsTab.tsx`, `instructor/AttendanceGrid.tsx`, `instructor/SessionComposer.tsx`
  - `learning/UpcomingSessionsRail.tsx` (used in `AppMyLearning` + `LearningHub`)
  - admin: `dashboard/learn/CohortsTab.tsx` plus a session-detail drawer.
- Routes:
  - `/app/instructor/courses/:contentId/cohorts/:cohortId` (cockpit)
  - `/app/cohorts/:cohortId` (talent cohort home)
  - `/app/sessions/:sessionId/join` (auth-gated redirect that records attendance + opens meeting link in new tab).
- Gro10x: `Gro10xLearn` learner row gets a "next session" chip and per-cohort attendance %.

#### UX rules

- Mobile-first, vertical only. Compact spacing (`py-2 space-y-2`).
- Use existing brand tokens (Tech Blue / Cyan / Success Green) and `eventTime` helpers (UTC stored, BDT-default rendering).
- Auth-gated: `/sessions/:id/join` requires login; unauthed users are sent to AuthChat with redirect back.
- Notifications respect existing user prefs (reuse `notification_preferences`).

---

### Out of scope for 4.2 (handled later)

- Embedded video provider (Daily.co / LiveKit) — sticks with paste-your-own meeting link until 4.4 cohort polish.
- Paid cohort pricing tiers — handled in 5.x monetization.
- Peer-to-peer breakout rooms.

---

### Open questions

1. Should every existing course be force-migrated into a synthetic "self-paced cohort", or only courses flagged `live_cohort`/`hybrid`? (Recommended: yes — single join model is simpler.)
2. Attendance threshold for "attended" — minutes-based (e.g. ≥ 50% of session) or instructor-defined per session? (Recommended: 50% default, instructor override per session.)
3. Should cohort capacity hard-block enrollment or just warn admins? (Recommended: hard-block past 100%, allow waitlist via existing saved-items pattern.)
4. Reminder channels — email + in-app only, or also WhatsApp link push? (Recommended: email + in-app for 4.2; WhatsApp deferred.)
