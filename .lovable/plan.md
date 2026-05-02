# Talent Segment — Round 2: Uploads, Outreach Agent, Polish

Build on the approved Talent group. Three additions + one verification pass, then we move to the next stakeholder.

## 1. New tab: Talent Upload (`?tab=talent-upload`)

Bring back the bulk-ingest flow inside the Talent group. New file `src/components/dashboard/talent/TalentUploadTab.tsx` composed of three sub-tabs (shadcn `Tabs`), all under a branded header:

```text
Talent Upload
├── Single Upload     — one CV / LinkedIn URL → parse → create talent
├── Batch Upload      — existing BatchTalentUpload (drag many CVs / LinkedIn JSON)
└── Gig Submissions   — review CV uploads coming from the cv-upload gig
```

- **Single Upload**: a thin wrapper that reuses the parsing path inside `BatchTalentUpload` for one file/URL, with inline preview of parsed fields before commit.
- **Batch Upload**: re-mount existing `BatchTalentUpload` (already production-ready, no changes needed).
- **Gig Submissions (CV uploads)**: filter `gig_submissions` to the CV-upload gig, list pending entries with the parsed talent preview, status badge (auto-approved / needs review), and a "Convert to talent" / "View talent" action. Auto-approval continues via the existing `auto-review-gig-submission` pipeline; this view is observability + manual override.

Sidebar entry added between **Talent Pool** and **Aisha Console** with the `Upload` icon. New route key registered in `Dashboard.tsx` lazy map.

## 2. New tab: Talent Outreach Agent (`?tab=talent-outreach`)

A fourth conversational console (same shell as Aisha / AI General) focused on **uploaded-but-not-registered** talents. New files:
- `src/components/dashboard/talent/TalentOutreachConsoleTab.tsx`
- `supabase/functions/admin-talent-outreach/index.ts`

Edge-function tools:
- `unregistered_talents(filter)` — talents in DB without `auth_user_id` (came from CV upload / batch / gig).
- `outreach_queue_status()` — counts: never contacted / contacted / responded / signed up.
- `send_invite(talent_ids[], channel)` — uses native email queue (`enqueue_email`) with a "Claim your profile" template; logs to `admin_notifications` + a new `talent_outreach_log` table (talent_id, channel, sent_at, status, response_at).
- `recent_outreach(limit)` — last sends with status.

DB migration adds `talent_outreach_log` (RLS: admin only) and an index on `talents (auth_user_id IS NULL)` for fast unregistered queries.

Sidebar slot below AI General Console, icon `Send`.

## 3. Seed Professional Roles (8–12 per category)

Generate the seed list with Lovable AI (Gemini 2.5 Flash) using the current `profession_categories`, present a single migration that inserts them into `professional_roles` with `display_order`. You'll be able to edit/disable inline in the Roles panel. No client changes needed — panel already exists.

## 4. Verification pass (no scope creep)

Before declaring the Talent segment done:
- Smoke-test all 7 sub-tabs for render / 403 / empty-state behavior.
- Confirm `ai-auth-agent` writes one row per session into `aisha_conversations` (deploy + curl test with a fake session id).
- Confirm `admin-aisha-analyst` and `admin-ai-general-analyst` respond for `super_admin` and reject anonymous calls.
- Confirm new talent insert fires the `admin_notifications` trigger (insert a test row via psql, check notification, delete).
- Lint / type-check the new files.

## Updated Talent sidebar

```text
Talent (collapsible)
├── Overview
├── Talent Pool
├── Talent Upload          (NEW)
├── Aisha Console
├── Lead Hunter
├── AI General Console
├── Talent Outreach Agent  (NEW)
└── Professions & Roles
```

## Files

**New**
- `src/components/dashboard/talent/TalentUploadTab.tsx`
- `src/components/dashboard/talent/TalentOutreachConsoleTab.tsx`
- `supabase/functions/admin-talent-outreach/index.ts`
- Migration: `talent_outreach_log` table + RLS + index on unregistered talents + seed insert into `professional_roles`.

**Edited**
- `src/components/dashboard/AdminSidebar.tsx` — add 2 sidebar items.
- `src/pages/Dashboard.tsx` — register 2 lazy routes.

## Out of scope (next step)
- Moving Academic Infrastructure into Learning group.
- Onboarding wizard role-picker UI work.

Approve and I'll build it, ask any inline follow-ups (e.g. invite email copy) as I go.
