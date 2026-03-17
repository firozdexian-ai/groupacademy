# Internal Workforce Platform — Phased Build Plan

This is a large, multi-system vision. I'll break it into concrete buildable phases, starting with the foundational layer that everything else depends on.

---

## Understanding the Vision

You want to build an **internal workforce operating system** where:

1. **Executives** (Talent Execs, BDEs, etc.) are assigned to talents and earn 10% commission on their talents' credit usage
2. **AI Executives** mirror each human role — they create JDs, post jobs, guide daily tasks, and ensure targets are met even without human follow-up
3. A **6-month sustainability plan** ensures every hire becomes self-sustaining through the credit economy
4. Roles span: Country Director → Head of TA → Talent Executives (university-type, profession-type) → BDEs (industry/city/job-type) → Academy Chancellors → School Deans → Career Abroad Executives

---

## What We Can Build Now (Phase 1) — Foundation

This phase creates the data layer and admin tools that everything else plugs into.

### 1. Workforce Roles & Assignment System

**New DB table: `workforce_members**`

- `id`, `talent_id` (FK to talents — every employee is also a talent), `role_type` (enum: country_director, head_of_ta, talent_executive, bde, academy_chancellor, school_dean, career_abroad_exec), `specialization` (JSON — e.g., `{type: "university", value: "BRAC University"}` or `{type: "industry", value: "IT"}`), `reports_to` (FK to workforce_members), `country`, `city`, `status` (active/probation/inactive), `hired_at`, `probation_ends_at`

**New DB table: `talent_assignments**`

- `id`, `talent_id` (the onboarded talent), `assigned_to` (FK to workforce_members), `assigned_at`
- This is the "string" — linking every onboarded talent to the executive who brought them in

### 2. Commission Engine (10% Credit Kickback)

**New DB trigger on `credit_transactions**`: When any talent uses credits (negative transaction), check `talent_assignments` for their assigned executive, and if found, insert a 10% commission credit into that executive's wallet as `is_earned = true`.

This covers:

- Welcome bonus (250 credits → 25 credits to exec) .. dont assign credits for credits being awarded but when anyone use credit from here.. then allocate it. 
- Every service usage (50 credit mock interview → 5 credits to exec)
- Course enrollments, AI agent chats, everything

### 3. Workforce Dashboard Tab

A new admin section **"Workforce"** showing:

- All workforce members with role, specialization, assigned talent count
- Per-member: talents they've onboarded, total credit consumption by their talents, commission earned this month
- KPIs: Active execs, total commissions paid, top performers

### 4. Executive View (Talent Exec Role Upgrade)

Upgrade the existing `talent_exec` role so when they log in to the dashboard, they see:

- **My Talents**: Only talents assigned to them (not the full pool)
- **My Commission**: Their earned credits from talent activity
- **My Tools**: Upload/invite talents (same tools as now, but auto-assigns to them)
- **My Targets**: Simple target tracker (e.g., "Onboard 50 talents this month")

---

## What Comes Next (Phase 2) — AI Executives

Phase 2 builds on Phase 1's data:

- AI Executive personas (one per workforce role) stored in `ai_agents` table
- Each AI Executive has a system prompt tailored to its role's KPIs and daily tasks
- Auto-generates daily task lists, JDs, and outreach plans
- Posts jobs automatically when a role is created

This requires Phase 1's workforce structure to exist first.

## Phase 3 — 6-Month Sustainability Journey

- Milestone tracker per workforce member
- AI Executive monitors progress and suggests interventions
- Auto-alerts management when someone is falling behind

---

## Phase 1 Implementation Plan


| Change                       | Detail                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| **DB Migration**             | Create `workforce_members` table, `talent_assignments` table, add `workforce_role_type` enum             |
| **DB Trigger**               | Commission trigger on `credit_transactions` — auto-pays 10% to assigned executive                        |
| **New Component**            | `WorkforceManager.tsx` — admin view for managing workforce members, assignments, and commission tracking |
| **Update AdminSidebar**      | Add "Workforce" group with the new manager                                                               |
| **Update Dashboard.tsx**     | Add workforce tab routing                                                                                |
| **Update TalentPoolManager** | When talent_exec uploads/invites, auto-create assignment record                                          |
| **Executive Dashboard View** | Filter talent pool to show only "my talents" for talent_exec users                                       |


### Files to Create/Change


| File                                             | Action                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| DB migration                                     | New tables: `workforce_members`, `talent_assignments`; new enum; commission trigger |
| `src/components/dashboard/WorkforceManager.tsx`  | New — full workforce CRUD + commission dashboard                                    |
| `src/components/dashboard/AdminSidebar.tsx`      | Add Workforce group                                                                 |
| `src/pages/Dashboard.tsx`                        | Add workforce tab                                                                   |
| `src/components/dashboard/TalentPoolManager.tsx` | Auto-assign on upload/invite for talent_exec                                        |


This gives you the operating backbone — every executive tracked, every talent "stringed", every credit transaction generating commission. Phase 2 (AI Executives) and Phase 3 (sustainability journeys) layer on top naturally.