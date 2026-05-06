# Phase 1 Plan — Content & Learning Admin (Deep Dive)

## Audit Findings

The Learn area has **11 sidebar entries**. Of those, several are real (ContentList, EnrollmentsManager, LearnerProgressManager) while many are scaffolds or have major gaps. Below is the file-by-file status and the exact work needed to ship a complete Learn admin.

### Stub files (placeholder cards, no functionality)
| File | Current state | Needed |
|---|---|---|
| `learn/B2BCoursesTab.tsx` (13 lines) | Static description card | Real list of company → course assignments + cohort progress |
| `learn/GraduatesTab.tsx` (13 lines) | Static description card | Table of certified graduates with filters + CSV export |
| `learn/LearnOverviewTab.tsx` (47 lines) | 4 raw counts | Add: active vs ready content split, upcoming live sessions, pending readiness fixes, top-performing courses, enrollment trend (30d) |

### Thin scaffolds (CRUD exists but missing key admin UX)
| File | Gap |
|---|---|
| `LearnSimpleTabs.tsx` (Academies / Schools / Professional Lives) | Uses `SimpleAdminRegistry` — no cover image upload, no slug auto-gen, no "feature on homepage" toggle, no soft-delete |
| `ContentList.tsx` | Has readiness badges (just shipped). Missing: **"Inactive only" filter**, bulk publish/unpublish, duplicate course, "preview as talent" link, sort by readiness/enrollment |
| `ContentEdit.tsx` | Long form. Missing: live readiness checklist sidebar, AI cover-image generator, AI description rewriter, change history |
| `ModulePickerPanel.tsx` (157 lines) | Module CRUD only. Missing: drag-reorder, bulk-add resources from URL list, preview each resource inline |
| `EnrollmentsManager.tsx` | Full list. Missing: refund/credit-restore action, manual enrol on behalf of talent, attendance mark for live sessions |
| `LearnerProgressManager.tsx` | Per-learner view. Missing: cohort comparison, "stuck on module X" cohort, nudge-via-WhatsApp action |
| `QuizManagement.tsx` | Quiz list. Missing: AI question generator from module content, randomization controls, per-question analytics |
| `FlashcardEditor.tsx` | Card CRUD. Missing: AI deck generation from a module/PDF, import from CSV |
| `QuizResultsViewer.tsx` | Result drill-down. Missing: per-question success rate heatmap, export to CSV |
| `CourseProjectsManager.tsx` (666 lines) | Big component. Missing: rubric template library, AI auto-grade hint, deliverable file viewer |

### Missing entirely (no admin surface yet)
1. **Certificates admin** — issue/revoke certificates, regenerate PDFs, view `certificate_verifications` log. Memory `[Certificates]` defines the system; admin UX is absent.
2. **Career Tracks** — sidebar maps to `ContentList` filtered by type, but tracks have their own `career_tracks` + `career_track_steps` tables (per memory). Needs dedicated track builder (steps, gating, credit cost).
3. **Recorded vs Online split** — both `courses` and `webinars` route to the same `ContentList`. Need stronger type-aware UI: webinars show event date/timezone/seats/Join URL columns; recorded shows modules/resources counts.
4. **Instructors admin** in sidebar (`Instructors.tsx` exists as a page) but **not wired into Learn group** — missing nav item; also no instructor performance panel.
5. **Sessions** (`Sessions.tsx`, `SessionNew.tsx`, `SessionEdit.tsx`) — exist as pages but not surfaced in admin sidebar at all. Should appear under each webinar's edit screen as a sub-tab.

### Cross-cutting fixes
- **Mobile / safe areas**: ContentList and EnrollmentsManager have horizontal-scroll tables on phones; convert to stacked cards under `md`.
- **Readiness explanations**: when a course is auto-deactivated, surface the exact failing rule on the list row tooltip + a "Fix now" deep-link to the missing module/resource.
- **AI helpers** (Lovable AI, English-only): description rewriter, cover-image generator, quiz auto-gen, flashcard auto-gen — all behind one shared `generate-learning-content` edge function with `task` switch.

---

## Build Order (sub-phases inside Phase 1)

```text
1.1  ContentList polish              Inactive filter, bulk actions, duplicate,
                                     preview-as-talent, sort by readiness
1.2  Webinar/Recorded type-aware     Split list columns; expose Sessions sub-tab
                                     in ContentEdit for webinars
1.3  ContentEdit readiness sidebar   Live checklist + "Fix now" jump links;
                                     AI description + cover image generators
1.4  Modules & Resources UX          Drag-reorder, bulk-add resources, inline
                                     preview, mobile stacked cards
1.5  Quizzes & Flashcards AI         Auto-generate from module content; CSV
                                     import; per-question analytics
1.6  Career Tracks builder           Dedicated CRUD for tracks + steps + gating
1.7  Certificates admin              Issue/revoke/regenerate, verification log
1.8  Graduates tab                   Real table from certificates+enrollments
1.9  B2B Courses tab                 Company-cohort progress aggregate
1.10 Learn Overview upgrade          Trends, readiness debt, upcoming sessions
1.11 Instructors in Learn nav        Add nav entry + performance panel
1.12 Mobile pass + safe areas        Stacked cards across all Learn tables
```

Each sub-phase is one approved build cycle. 1.1–1.4 unlock the highest daily-use pain (catalog + readiness). 1.5–1.6 unlock content velocity. 1.7–1.9 close revenue-credibility gaps. 1.10–1.12 polish.

---

## Database / Edge work (consolidated)
- **New edge function**: `generate-learning-content` — tasks: `rewrite_description`, `generate_cover_image`, `generate_quiz_questions`, `generate_flashcard_deck`. English only. Verifies `auth.getUser` + admin role.
- **No new tables required** for 1.1–1.5; `career_tracks`, `career_track_steps`, `certificates`, `certificate_verifications` already exist.
- Add a small SQL view `v_course_readiness_reasons` returning `{content_id, reason_code, reason_label, missing_count}` so the UI can render exact "why inactive" tooltips without recomputing rules client-side.
- Migration: `learn_audit_log` table (content_id, actor_id, action, diff jsonb, created_at) for change history in 1.3.

## Files affected (Phase 1 total)
Roughly 18 edits + 4 new files + 1 migration + 1 edge function. We'll ship one sub-phase per approval.

---

## Recommended start
Approve and I'll begin with **Sub-phase 1.1 — ContentList polish** (Inactive-only filter, bulk publish/unpublish, duplicate, preview-as-talent, sort by readiness/enrollment, mobile stacked cards). It's the lowest-risk, highest-daily-use win and sets the table-pattern reused in 1.2.