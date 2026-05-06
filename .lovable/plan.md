## Phase 4.5 — Company Tracks & Branded Catalog

Bundle multiple courses into a sequenced **Track**, assign tracks to talents (B2C self-enroll or B2B sponsored), and surface a public **branded company learning page** at `/c/:slug/learn`. Tracks earn a unified completion certificate via the existing `/verify/...` flow.

### Recommended decisions (from earlier 4.5 questions)

1. **Optional steps** — counted in progress %, but only required steps gate completion.
2. **Sequential unlock** — opt-in `is_sequential` flag per track; default = all unlocked.
3. **Template ownership** — platform admin only for 4.5; instructors propose via brief in a later phase.
4. **Track certificate** — extend `certificates` with `kind` + `track_assignment_id` (no new table).

If any of these need to flip, say so before approval.

---

### Data model

**`learning_tracks`**
- `id`, `slug` (unique, for `/c/:slug/learn` deep link), `title`, `summary`, `cover_url`
- `owner_kind` (`platform` | `company`), `company_id` (nullable, FK), `created_by`
- `is_sequential boolean default false`, `is_published boolean default false`
- `enrollment_credits numeric(12,1) default 0` (B2C self-enroll price; B2B sponsored = sum of child courses)
- `b2b_enabled boolean default true`

**`learning_track_items`**
- `track_id`, `course_id`, `position int`, `is_required boolean default true`
- Unique `(track_id, course_id)`; `position` defines unlock order when `is_sequential`.

**`learning_track_assignments`**
- `id`, `track_id`, `talent_id` (the recipient), `assigned_by` (user_id), `org_id` (nullable — set when sponsored from Learning Ops)
- `status` (`invited` | `active` | `completed` | `overdue` | `cancelled`)
- `due_at`, `started_at`, `completed_at`
- Unique `(track_id, talent_id)` (re-assign reactivates).

**`certificates`** — add columns
- `kind text default 'course'` (`course` | `track` | `skill`)
- `track_assignment_id uuid` (nullable, FK)
- Existing `/verify/:code` page reads `kind` and renders the right template.

**RLS**
- Tracks: `select` if `is_published` OR `created_by = auth.uid()` OR admin.
- Track items: follow parent track.
- Assignments: talent sees own; `org_id` controllers see their org's; admin sees all.
- Certificates: same as today, with `kind='track'` rows visible to the talent + public verify by code.

### RPCs / Edge functions

- **`org_assign_track(track_id, talent_ids[], due_at)`** — atomically:
  1. Insert/refresh `learning_track_assignments`.
  2. For each required course in the track, call existing `org_assign_talents` to enroll + debit `org_wallet_ledger` (per-course pricing reuses 4.4 logic).
  3. Optional courses are NOT pre-enrolled; talent can enroll on demand.
- **`talent_enroll_track(track_id)`** — B2C self-enroll: debits learner credits by `enrollment_credits`, then enrolls them in the required courses (uses existing `enroll_in_course`).
- **`get_track_progress(assignment_id)`** — returns `{ items: [{course_id, status, percent}], required_done, total_required, optional_done, is_complete }`. Marks `completed_at` and mints a track certificate when all required are done.
- **`notify-track-event`** — `assigned`, `step_completed`, `track_completed`, `due_soon`, `overdue`. Routes through existing in-app + email dispatcher.
- **`cron-track-sweeps`** (daily) — flips assignments to `overdue` past `due_at`, queues `due_soon` (T-72h, T-24h), nudges stalled (no progress in 7d).
- **`get_company_branded_catalog(slug)`** — public RPC returning company branding (logo, banner, tagline) + published tracks + featured courses for `/c/:slug/learn`. No auth required; obeys `is_published`.

### Surfaces

**Talent (Gro10x)**
- `/gro10x/learn` — new "Tracks" section above Catalog: each assigned track renders as a card with `TrackProgressRing`, next step, due date.
- `/gro10x/learn/track/:id` — track detail: ordered course list with lock icons (sequential mode), per-step status, optional steps tagged, certificate banner once complete.

**Public**
- `/c/:slug/learn` — branded company page: logo + banner + tagline + grid of public tracks (CTA: Sign in to enroll / Sponsored by {company}). SEO-friendly with `<title>`, JSON-LD `Course` for each track.
- `/verify/:code` — already exists; renders `kind='track'` template with track title, talent name, completed required courses list.

**Gro10x Learning Ops (`/gro10x/learn/ops`)** — extend with two tabs:
- **Tracks** — list company-owned tracks; "New track" composer (drag-and-drop course ordering, required toggle, sequential toggle, publish).
- **Bulk-assign** — extend existing assignment sheet to accept either a single course or a track.

**Admin (`/dashboard` Learn console)**
- New **Tracks** tab — platform-template tracks (CRUD), publish/unpublish, see assignment counts, completion %.
- Existing **B2B Engagements** tab — show track adoption alongside course adoption.

### Components & files

**New**
- `src/hooks/useLearningTracks.ts` — list/create/update/publish, list assignments for current user.
- `src/components/learning/TrackProgressRing.tsx`
- `src/components/learning/TrackComposer.tsx` — drag-drop ordering using existing dnd primitives.
- `src/components/learning/TrackStepList.tsx` — sequential lock UX.
- `src/pages/app/AppTrackDetail.tsx` — `/gro10x/learn/track/:id`
- `src/pages/public/CompanyBrandedCatalog.tsx` — `/c/:slug/learn`
- `src/components/dashboard/learn/TracksTab.tsx` — admin platform templates.
- `src/gro10x/components/learn/OpsTracksTab.tsx` — Learning Ops tab.
- `supabase/functions/notify-track-event/index.ts`
- `supabase/functions/cron-track-sweeps/index.ts`
- One migration with all tables, RPCs, RLS, certificate column extension, `pg_cron` daily schedule.

**Edited**
- `src/App.tsx` — add `/c/:slug/learn`, `/gro10x/learn/track/:id` routes (already responsive after 4.5a).
- `src/gro10x/pages/Gro10xLearn.tsx` — Tracks section above existing assignments.
- `src/gro10x/pages/Gro10xLearnOps.tsx` — register Tracks + Bulk-assign extensions.
- `src/components/dashboard/learn/*` — add TracksTab to Learn console.
- `src/pages/Verify.tsx` (or current verify page) — branch on `kind`.

### Out of scope

- Adaptive sequencing (skip ahead based on mastery) — slated for 4.6.
- Track-level pricing tiers / discounts vs sum-of-courses.
- Instructor-proposed templates (admin-only for now).
- Custom domains on `/c/:slug/learn` (uses path slug).

### Open questions

1. **Slug source** — reuse company `handle` if it exists, or add a dedicated `learning_slug` so marketing can pick a vanity path independent of the company handle? (Recommended: reuse `handle`; add `learning_slug` only when a company asks.)
2. **Public catalog visibility default** — when a company creates a track, default to `is_published=false` (private to assignees), or `true` (publicly listed on `/c/:slug/learn`)? (Recommended: false; shipping a "Publish" toggle in the composer.)
3. **Certificate template for tracks** — list every required course on the cert, or only the track title + completion date? (Recommended: track title + date on the cert, with the verify page expanding the full course list.)
