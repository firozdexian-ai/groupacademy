
# Admin Panel — Talent Stakeholder Restructure

Convert the current flat "Talent & Leads" sidebar group into a collapsible **Talent** group with 6 sub-views, mirroring the Overview pattern. Each sub-view is its own lazy-loaded route under `?tab=talent-*`.

```
Talent (collapsible)
├── Overview            ?tab=talent-overview        (NEW)
├── Talent Pool         ?tab=talent                 (existing TalentPoolManager)
├── Aisha Console       ?tab=talent-aisha           (NEW)
├── Lead Hunter         ?tab=lead-hunter            (existing LeadHunterManager, polished)
├── AI General Console  ?tab=talent-ai-general      (NEW)
└── Professions & Roles ?tab=professions            (existing + new Roles layer)
```

## 1. Talent Overview (new)

Branded header (rounded-[40px], italic uppercase) matching Lifetime Overview. KPI grid + breakdowns:

- **KPIs (StatsCard)**: Total talents, New today / 7d / 30d (with WoW & MoM deltas), Profile completion rate, CV uploaded %, Profession-tagged %, Active in last 30d.
- **Breakdowns**:
  - Talents by Academy (bar)
  - Talents by Profession Category (bar) — highlights the "untagged" gap
  - Talents by Professional Role (top 15)
  - Talents by Country (top 10)
  - Onboarding funnel: Aisha conversations started → email captured → completed signup → profile complete → CV parsed
- **Recent activity feed**: last 20 signups with academy / profession / completion %.

Data source: direct queries on `talents`, `profession_categories`, new `professional_roles`, and `aisha_conversations` (see §3). All queries client-side via supabase-js — no edge function needed for v1.

## 2. Talent Pool (existing)

Keep `TalentPoolManager` as-is under the new sidebar slot. No code changes.

## 3. Aisha Console (new)

Two-pane view:

- **Left rail**: list of recent Aisha conversations (completed + abandoned), search, filter (today / 7d / abandoned only).
- **Right pane**: chat with **AishaAdmin agent** — a new edge function `admin-aisha-analyst` modelled on `admin-analyst`. System prompt grants tools:
  - `aisha_count(status, since)` — completed / abandoned / in-progress conversations
  - `aisha_recent(limit, status)` — recent leads
  - `aisha_drop_off_step()` — where leads abandon (email / country / phone / quiz / password)
  - `notify_super_admin_on_signup` (config toggle, not tool) — push notifications for every new talent
- **Notifications**: insert a new admin-only notification row whenever a talent is created (DB trigger on `talents` insert → `admin_notifications` table). Surfaced in the existing super-admin notification bell.

Schema additions (migration):
- `aisha_conversations` (id, started_at, completed_at, email, name, country, phone, last_step, abandoned bool, talent_id nullable, raw_messages jsonb). Backfilled from edge function logs going forward — `ai-auth-agent` updated to upsert one row per conversation keyed by session.
- `admin_notifications` if not already present (check existing `notifications` table first; reuse if there's an admin scope).

## 4. Lead Hunter (polish existing)

Keep current functionality, plus:
- Search by phone / email / name (already partially there).
- New filter: "Match against job requirement" — pick a job from `jobs`, run server-side ranking RPC (`rank_talents_for_job(job_id, limit)`) reusing the matching logic from the jobs hub.
- Branded header to match Overview style.

## 5. AI General Console (new)

Same chat pattern as Aisha Console but powered by a new `admin-ai-general-analyst` edge function. Tools:
- `general_chat_count(since)` — total chats with AI General
- `profile_completion_stats()` — % complete, median fields filled, CV uploaded %
- `outreach_nudge(talent_ids[], message)` — sends an in-app notification + email asking the user to complete their profile/upload CV (uses existing `enqueue_email` RPC + `notifications` insert).
- `general_chat_recent(limit, intent_filter)`.

This is the place where the super admin can say *"nudge the 412 talents who haven't uploaded a CV"* and AI General will draft + send.

## 6. Professions & Roles (extend existing)

The core gap: 2,362 of 2,646 talents are untagged because Profession Categories are too broad (e.g. "Video Production & Editing"). Introduce a child level: **Professional Roles**.

Schema migration:
- New table `professional_roles` (id, profession_category_id FK, name, slug, display_order, is_active). RLS: admin manage / anyone select active.
- New column `talents.professional_role_id uuid` nullable, FK → `professional_roles(id) ON DELETE SET NULL`.
- Seed table with curated roles per category (e.g. for Video → Motion Designer, Senior Motion Designer, Video Editor, Colorist, Animator, VFX Artist; for Marketing → Performance Marketer, SEO Specialist, Brand Manager, etc.). Initial seed list confirmed with you in a follow-up; ~8–12 roles per category.

`ProfessionsManager` UI changes:
- Two-column master/detail: left = Profession Categories (existing), right = Roles for the selected category with inline add/edit/reorder/disable.
- Per-row counts: "X talents tagged".
- "Untagged talents" link next to each category.

Talent profile / onboarding (small follow-up wiring, included here to close the loop):
- Where the user already picks a profession (onboarding wizard + profile edit), add a dependent role dropdown that appears once a category is selected. Optional — does not block submit.
- Bulk re-tag tool inside `ProfessionsManager`: pick a category → search untagged talents whose `headline`/`custom_profession` matches a role keyword → assign in bulk.

## Sidebar & routing wiring

- `src/components/dashboard/AdminSidebar.tsx`: replace the flat "Talent & Leads" group with a `Collapsible` group called **Talent** containing the 6 items above. Icons: `LayoutDashboard`, `DatabaseIcon`, `Sparkles` (Aisha), `Target`, `Bot` (AI General), `GraduationCap`.
- `src/pages/Dashboard.tsx`: register lazy components for `talent-overview`, `talent-aisha`, `talent-ai-general`. Keep `talent`, `lead-hunter`, `professions` keys for back-compat.
- Both new agent consoles reuse the same chat shell as `AnalystChatTab` (extract a small `<AdminAnalystShell>` component to avoid copy-paste).

## Files

New:
- `src/components/dashboard/talent/TalentOverviewTab.tsx`
- `src/components/dashboard/talent/AishaConsoleTab.tsx`
- `src/components/dashboard/talent/AIGeneralConsoleTab.tsx`
- `src/components/dashboard/talent/AdminAnalystShell.tsx` (extracted)
- `src/components/dashboard/talent/ProfessionalRolesPanel.tsx` (used inside ProfessionsManager)
- `supabase/functions/admin-aisha-analyst/index.ts`
- `supabase/functions/admin-ai-general-analyst/index.ts`
- Migrations: `professional_roles` table + `talents.professional_role_id` + `aisha_conversations` table + admin signup notification trigger + RLS + seed roles.

Edited:
- `AdminSidebar.tsx`, `Dashboard.tsx`, `ProfessionsManager.tsx`, `LeadHunterManager.tsx` (header polish + job-match filter), `ai-auth-agent/index.ts` (upsert into `aisha_conversations`).

## Out of scope for this pass

- Moving the academic infrastructure into the Learning tab (you mentioned it as a future move; flagged for a later step).
- Onboarding wizard role-picker UI changes beyond a single dependent dropdown — heavier UX work tracked separately if needed.

## Open questions before I build

1. Aisha conversation logging: OK to start logging from "now" (no historical backfill, since there's no source-of-truth log today)?
2. For the seed list of Professional Roles per category, do you want me to draft it with AI based on existing categories and have you approve before insert, or just ship a sensible default and let you edit in the UI?
3. Admin signup notifications: send only in-app (notification bell), or also email you at a configured address?

Approve and I'll implement, asking the open questions inline as I go.
