# Jobs Hub Consolidation v2 — Recruiter Operating System

## Vision

Convert the admin Jobs section into a single **Jobs Hub** that owns the entire recruitment loop — from posting a job, through ingesting applications from any channel, to AI-scoring and reaching out to candidates. The hub becomes a tool not just for internal admins but for **employer partners**, who get one place to manage applications from GroUp Academy *and* from external sources (LinkedIn, Facebook, email, walk-ins).

## Sidebar Reshape

```text
Recruitment
├── Jobs KPIs           (unchanged)
├── Jobs Hub            (NEW – consolidated)
│    ├── Tab 1: Manage         (jobs inventory + edit/create + engagement)
│    ├── Tab 2: Applications   (platform + external + AI relevance)
│    ├── Tab 3: Outreach       (multi-channel job promotion + candidate outreach)
│    └── Tab 4: Upload & Verify (single, batch, JSON, gig submissions)
└── (Standalone "Applications" sidebar entry removed — folded into Jobs Hub Tab 2)
```

CV Outreach is also linked from Tab 3 (kept for non-job CV outreach in Marketing & Outreach unchanged, since it serves wider products).

---

## Tab 1 — Manage

Extracted from current 653-line `JobsManager`. Inventory, status filters, engagement sub-card, plus the AI-powered Job Form Dialog (Title, Company, Salary, AI-Enhance Description button, source platform tagging — **all existing AI features preserved**).

Improvements:
- Bulk activate / deactivate / delete
- Inline `is_active` and `is_featured` toggles in the row
- "Stale jobs" quick filter (deadline passed or >60 days old)
- Source platform icon in the row

---

## Tab 2 — Applications (Unified Pipeline)

This is the new heart of the hub. Replaces the standalone `JobApplicationsManager` and absorbs **external applications** as a first-class concept.

### Two application sources, one table

| Source | How it enters | Stored in |
|---|---|---|
| Platform | User clicks Apply on the job → existing flow | `job_applications` (existing) |
| External | Admin or employer uploads CV+contact, picks a job | `job_applications` with `source = 'external'` |

The unified table shows both, with a Source badge column. Filters: status, delivery, **source** (platform / external / all), **AI fit score range**.

### "Add External Application" action

A button on each job (and at the top of Tab 2) opens a dialog:

1. **Upload CV** (PDF/DOCX) or paste CV text — runs the existing `parse-cv` edge function (keeps the AI parser already used elsewhere).
2. **Extracted candidate panel** — name, email, phone, profession, skills (editable, same UX pattern as `JobPostingGigForm`).
3. **Talent matching** — query `talents` by email/phone:
   - If a talent exists → link `talent_id` automatically.
   - If not → create a lightweight talent record (`get_or_create_talent` RPC already exists) so the candidate joins the talent database, can be contacted, and can later claim their account via the existing email-link flow.
4. **Save** → inserts a `job_applications` row (`source = 'external'`, `application_status = 'submitted'`, `is_paid = true` since admin-entered).

### AI Relevance Scoring

Every application (platform OR external) gets a "Score Match" button that calls the existing **`score-job-match`** edge function (already deployed). Result is persisted as a numeric score + short rationale.

- Score badge in the table (Strong / Good / Fair / Weak with color)
- Sortable column → admins/employers triage fastest
- **Bulk score** action — score all unscored applications for a job in one click (sequential calls with progress toast)
- Score is cached so re-opening doesn't re-spend AI tokens

### Employer-facing benefit

Because external applications get the same scoring and the same contact tooling, the Jobs Hub becomes a real **applicant tracking system** for partner companies — they manage all their inbound (regardless of channel) inside our infrastructure, which deepens platform stickiness.

---

## Tab 3 — Outreach (Multi-Channel, Restored)

Restores the previous channel-aware structure.

### Job Promotion Outreach (NEW for jobs)

For any active job, generate a channel-specific post:

| Channel | Output |
|---|---|
| WhatsApp | Short conversational post with job + apply link |
| LinkedIn | Professional formatted post with hashtags |
| Facebook | Engaging post with emoji + CTA |
| Email | Subject line + HTML body |

Uses the existing **`generate-job-share-caption`** edge function (already AI-powered) with a `channel` parameter. Shows a channel counter ("Posted to 3 / 4 channels") with one-click copy per channel and a "Mark as posted" log so we track distribution per job.

### Candidate Outreach

For any application row (platform or external), an outreach button that:
- Pre-fills WhatsApp / Email / LinkedIn templates from `outreachTemplates.ts` with candidate name + job context
- One-click open in WhatsApp / mailto / LinkedIn
- Logs the outreach attempt against the application (re-using `delivery_status` + a new `notes` field if needed)

CVOutreachGenerator (existing 147-line component, full AI parser kept) is embedded as a sub-section for ad-hoc CV-driven outreach.

---

## Tab 4 — Upload & Verify

Consolidated job ingestion:

- **Single Upload** — opens the Job Form Dialog (with AI Enhance Description preserved).
- **AI Parser for Single Posting** — paste a raw job description / URL / screenshot → calls existing `parse-job-post` edge function → pre-fills the Job Form Dialog. (This is the AI parser the user wants restored at the single-posting entry point.)
- **Batch Upload** — `BatchLinkedInJobUpload` rendered inline.
- **LinkedIn JSON Upload** — `LinkedInJsonUpload` rendered inline.
- **Pending Gig Submissions** — filtered view of `gig_submissions` where `gigs.category = 'job_posting'`. Each row has "Review & Publish" → opens the Job Form Dialog pre-filled from `submission_data.curated_data` so the admin can correct AI extraction before going live. Approve flow calls existing `award_gig_credits` RPC.

---

## Database Changes

Single migration:

```sql
-- 1. Track application source
ALTER TABLE public.job_applications
  ADD COLUMN source text NOT NULL DEFAULT 'platform'
    CHECK (source IN ('platform','external')),
  ADD COLUMN ai_match_score integer
    CHECK (ai_match_score BETWEEN 0 AND 100),
  ADD COLUMN ai_match_rationale text,
  ADD COLUMN ai_scored_at timestamptz,
  ADD COLUMN external_notes text,            -- admin-only notes for external apps
  ADD COLUMN added_by uuid REFERENCES auth.users(id);  -- who added an external app

CREATE INDEX idx_job_applications_source ON public.job_applications(source);
CREATE INDEX idx_job_applications_score  ON public.job_applications(ai_match_score DESC NULLS LAST);

-- 2. Track per-channel job promotion
CREATE TABLE public.job_channel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp','linkedin','facebook','email','other')),
  posted_by uuid REFERENCES auth.users(id),
  caption text,
  posted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, channel, posted_at)
);
ALTER TABLE public.job_channel_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage channel posts"
  ON public.job_channel_posts FOR ALL
  USING (public.has_any_admin_role(auth.uid()))
  WITH CHECK (public.has_any_admin_role(auth.uid()));
```

RLS on `job_applications` for the new columns: existing admin policies cover them; no policy change needed for admins. For external applications, only admins can set `source='external'` (enforced via existing policies + form-side guard).

## Edge Functions

All existing — **no new functions needed**:
- `parse-cv` → external application CV parsing
- `parse-job-post` → single-posting AI parser
- `enhance-job-description` → AI Enhance in Job Form
- `score-job-match` → AI relevance scoring (call with `application_id`)
- `generate-job-share-caption` → multi-channel post generation (extend body to accept `channel`)
- `get_or_create_talent` RPC → external candidate → talent linking

Only `generate-job-share-caption` may need a tiny tweak to vary tone per channel; verifying that's already supported before changing.

## File Plan

**New**
- `src/components/dashboard/jobs-hub/JobsHub.tsx` (4-tab shell, ~150 lines)
- `src/components/dashboard/jobs-hub/JobsManageTab.tsx`
- `src/components/dashboard/jobs-hub/JobsApplicationsTab.tsx` (unified pipeline + AI score column)
- `src/components/dashboard/jobs-hub/JobsOutreachTab.tsx` (multi-channel posts + candidate outreach)
- `src/components/dashboard/jobs-hub/JobsUploadTab.tsx`
- `src/components/dashboard/jobs-hub/JobFormDialog.tsx` (shared, AI-enhance preserved)
- `src/components/dashboard/jobs-hub/AddExternalApplicationDialog.tsx` (CV parse + talent linking)
- `src/components/dashboard/jobs-hub/AIRelevanceScore.tsx` (badge + score button)
- `src/components/dashboard/jobs-hub/ChannelPromotionCard.tsx` (4-channel generator)
- `src/components/dashboard/jobs-hub/PendingJobSubmissions.tsx`

**Modified**
- `src/pages/Dashboard.tsx` — register `jobs-hub`, drop standalone `applications` and `jobs` (alias `jobs` → hub for back-compat)
- `src/components/dashboard/AdminSidebar.tsx` — Recruitment group: KPIs, Jobs Hub. Remove "Applications".
- (Optional) Keep `JobsManager.tsx` and `JobApplicationsManager.tsx` as thin re-exports for one release, then remove.

## Why This Is Worth Doing

1. **One screen, one workflow** — recruiter never leaves the hub for a single end-to-end action (post → promote → ingest → score → contact).
2. **External applications + talent auto-linking** turns inbound from any channel into platform talent records — every external applicant becomes a potential platform user.
3. **AI relevance score** is a clear value-add for employers; it's the single feature that differentiates this from a spreadsheet.
4. **Channel-aware outreach** restores the structure the team already trusted; generation stays AI-driven.
5. **All existing AI tools are preserved** (CV parse, job parse, description enhance, match scoring, share caption); we're re-organising surfaces, not removing capabilities.

## Out of Scope

- Per-employer login/permissions for the hub (current admin/talent_exec roles are sufficient for now; multi-tenant employer access is a separate, larger plan).
- Email-thread tracking inside the platform (we still link out to mailto/WhatsApp).
- Pricing changes for AI scoring (admin/internal use is free; if this is later exposed to employers, a credit cost can be added easily on the score button).
