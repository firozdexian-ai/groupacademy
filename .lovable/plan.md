# Gigs Overhaul: Course-Projects + Universal Uploads

Three coordinated phases. Each phase ships independently and is usable on its own.

---

## Phase 1 — Simplify the Gigs surface (UI clean-up)

**Problem:** Three tabs (Platform Tasks / Projects / Build Academy) plus 9 categories + filters = decision fatigue.

**New structure — 2 tabs only:**

```text
┌─────────────────────────────────────────┐
│  Earn          [ Course-Projects ] [ My Work ]
│  ───────────────────────────────────────
│  Browse course-projects you can build   │
│  → Course card → expand subtasks        │
└─────────────────────────────────────────┘
```

- **Course-Projects** — every available course bundle (replaces Platform Tasks + Projects + Build Academy).
- **My Work** — claimed/in-progress/submitted/paid (renames "My Submissions").
- Old `gigs` micro-task table → quietly retired from the UI but kept in DB; existing rows shown under "Quick Tasks" pinned at top of Course-Projects tab if any are active.
- Marketplace (employer projects) moves to its own route `/app/marketplace` (already exists) — separated entirely from earning gigs to remove confusion.

---

## Phase 2 — Universal in-app uploader

**Problem:** Today most gig forms ask for an external link (Drive/Dropbox). Friction + trust gap.

- Add a single reusable `<GigUploader>` component (drag-drop, multi-file, progress, preview).
- Backend: new Supabase Storage bucket `gig-submissions` (private, RLS: talent reads own, admin/content_lead reads all, signed URLs for review).
- Supports: images, PDF, video (≤200 MB), audio, ZIP, docs, slides.
- Every gig form gets the uploader. External link becomes optional secondary field ("Or paste a link if file is too large").
- AI auto-review (existing `auto-review-gig-submission`) extended to fetch the uploaded file via signed URL for vision/audio scoring.

---

## Phase 3 — Course-as-Project bundling (the big one)

**Concept:** One course = one Project. All resources needed for that course (cover, intro video, slides per module, quizzes, reading material, captions, translation) are subtasks under it. One talent claims the whole project, completes every subtask, gets the bundled reward + completion bonus.

### Data model

New table `course_projects`:
```text
id, course_id, status (open|claimed|in_progress|submitted|approved|paid),
claimed_by (talent_id), claimed_at, deadline, total_credit_reward,
completion_bonus, progress_percent, submitted_at, approved_at
```

New table `course_project_subtasks`:
```text
id, project_id, kind (cover|intro_video|module_slides|module_quiz|
  module_video|reading|caption|translation), module_id (nullable),
title, brief, expected_format, credit_reward, status, submitted_files (jsonb),
submitted_at, ai_score, reviewer_notes
```

- Auto-generated when admin marks a course as "open for production" — system spawns the project + all required subtasks based on course modules.
- `content_gigs` table kept for legacy data but new flow writes to these two tables.

### Talent UX

```text
Course-Project Card                       
┌──────────────────────────────────────┐
│ AI Product Management 101            │
│ 12 subtasks · 240 credits + 50 bonus │
│ Est. 8–12 hrs · Deadline: 14 days    │
│                       [ Claim Project ]
└──────────────────────────────────────┘

After claim → expand to checklist:
  ☐ Course cover (10 cr)
  ☐ Intro video (40 cr)
  ☐ Module 1 slides (20 cr)   [Upload]
  ☐ Module 1 quiz (15 cr)     [Upload]
  ☐ ... 
  
Progress bar + "Submit project" enabled at 100%.
```

- Once claimed, project is locked to that talent for the deadline window.
- If talent abandons (deadline passes without submission), project auto-releases, partial work archived, no payout.
- Completion bonus only paid when ALL subtasks approved.

### Admin UX

- New admin page `Course Production` — list of open/claimed/submitted projects, kanban-style.
- Bulk approve/reject per project; reviewer sees all subtask uploads inline.

---

## Execution order

1. **Phase 1** (UI simplification) — small, immediate clarity win. ~1 build cycle.
2. **Phase 2** (uploader + storage bucket + RLS) — unblocks Phase 3 and improves existing flow today. ~1 cycle.
3. **Phase 3** (course-projects schema, auto-generation, claim/lock/submit flow, admin review) — the structural change. ~2–3 cycles.

Each phase is independently shippable; you can stop after any of them and the app remains coherent.

## Open assumption — confirm or correct

- Existing `gigs` micro-tasks (CV upload, job sharing, etc.) — I'm assuming these stay alive as "Quick Tasks" alongside Course-Projects, **not** folded into the bundle. Say so if you'd rather kill them entirely.
