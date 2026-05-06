# Phase 3.7 — Interview Scheduling & Offers (+ 3.6 polish)

Closes the end-to-end hire flow. After 3.5 (inbound pipeline + messaging) and 3.6 (outbound CRM + sourcing), the kanban can move a card all the way to "Offer" but there is no offer artifact and no way to schedule an interview. 3.7 fills that gap and absorbs the small leftovers from 3.6.

---

## Scope

### A. Interview Scheduling
Lightweight, in-platform first — no external calendar OAuth in 3.7.

- **Recruiter side (Gro10x + Admin)**: from any application card, "Schedule interview" opens a sheet. Recruiter picks 1–5 candidate slots (date + time + duration + mode: video / phone / on-site + location/link + note).
- **Talent side**: in-app + email notification with a deep link to `/app/applications/:id/interview/:token`. Talent picks one slot or proposes alternatives.
- **Status machine**: `proposed → confirmed → rescheduled → completed → no_show → cancelled`. Confirming an interview auto-moves the application to the `interview` stage on the kanban (if not already past it).
- **Reminders**: 24h + 1h reminder via the existing email queue + in-app notifications.
- **Mode**: stores a meeting link (recruiter pastes their own Meet/Zoom URL) — no calendar provider integration in 3.7.
- **Side panel** on application detail shows upcoming interviews, status, and history.

### B. Offers
- **Generate offer** action appears once application reaches `offer` stage (or anytime via override).
- Form: title, start date, base compensation + currency, variable / equity (optional), benefits (free text), expiry date, custom note.
- Renders a branded offer letter (HTML → PDF via existing `pdfGenerator` pattern, similar to certificates).
- Talent sees offer at `/app/applications/:id/offer/:token` with **Accept / Decline / Request changes**.
- Accept → application stage auto-moves to `hired`, talent + recruiter get confirmation, offer PDF stored in storage and downloadable from both sides.
- E-signature is text-based "type your full name to accept" in 3.7 (full e-sign deferred).
- Counter-offer flow: talent can post a comment + the recruiter regenerates a v2.

### C. Direct Messaging for CRM talents (3.6 leftover)
- New `direct_message_threads` (`company_id`, `talent_id`, `relationship_id?`) + `direct_messages` (mirrors `application_messages` shape).
- Reuses `ApplicationMessageThread` UI, parameterized by `threadType: "application" | "direct"`.
- Entry points: CRM talent side sheet, sourcing result card "Message".
- Subject to existing connection-credit gating (mem: Creator Economy + Messenger Inbox).
- When the same talent later applies to a job, the thread is shown as **linked context** under the application thread.

### D. Invite to Apply (3.6 leftover)
- "Invite to apply" action from sourcing card, talent profile, or CRM relationship side sheet.
- Picks one of the company's open jobs → creates a `job_invitations` row (`job_id`, `talent_id`, `invited_by`, `expires_at`, `note`).
- New edge function `notify-job-invitation` sends in-app + email + push with deep link to apply.
- Apply landing shows an "Invited by {Company}" banner; invitation auto-marked `accepted` on submit and the resulting application is flagged `sourced=true` (reusing the 3.6 trigger by also matching against `job_invitations`).

### E. Admin oversight
- `/dashboard/admin/jobs/interviews` — read-only roll-up of interviews across all companies (filters by status, date range, company, job).
- `/dashboard/admin/jobs/offers` — same for offers (with offer value totals as a small KPI strip).
- All offer + interview state changes audited via existing audit pattern.

### F. Analytics widget update (Gro10x Work home)
Extend the existing "Sourcing this week" card pattern with a sibling **"Hiring this week"** card:
- Interviews scheduled / completed / no-show
- Offers sent / accepted / declined
- Avg time-to-offer (offer_sent_at − applied_at)

---

## Backend

### New tables (all RLS company-scoped via `is_company_member`, talent-scoped for talent access)
- `interview_slots` — one row per proposed slot tied to an `interview`.
- `interviews` (`application_id`, `company_id`, `talent_id`, `mode`, `meeting_link`, `location`, `status`, `selected_slot_id`, `note`, timestamps, `created_by`).
- `offers` (`application_id`, `company_id`, `talent_id`, `title`, `start_date`, `currency`, `base_amount numeric(14,2)`, `variable_amount`, `equity_note`, `benefits`, `expires_at`, `pdf_path`, `status` enum [`draft`|`sent`|`accepted`|`declined`|`countered`|`expired`|`withdrawn`], `signed_name`, `signed_at`, timestamps).
- `offer_versions` — append-only history of offer payloads for counter-offer trail.
- `direct_message_threads`, `direct_messages` (mirrors `application_messages` schema).
- `job_invitations` (`job_id`, `talent_id`, `invited_by`, `expires_at`, `status` enum [`pending`|`accepted`|`declined`|`expired`], `note`).

### Storage
- New private bucket `offer-letters` (signed URLs, recruiter + talent + admin only).

### RPCs
- `get_application_hire_state(p_application_id)` → returns latest interview + offer for the side panel in one round-trip.
- `get_hiring_stats(p_company_id, p_window_days)` → powers the Gro10x Work card.
- `confirm_interview_slot(p_interview_id, p_slot_id)` — atomic state transition + auto-stage update.
- `accept_offer(p_offer_id, p_signed_name)` — atomic stage transition to `hired`, marks offer accepted, fires notifications.

### Triggers
- `trg_interview_status_sync` — when interview confirmed, ensure `job_applications.stage >= 'interview'`.
- `trg_offer_accepted_to_hired` — when offer accepted, move application to `hired` stage and append to `application_history`.
- `trg_job_invitation_accept` — when an application is created and a matching pending `job_invitations` row exists, mark invitation accepted and set `application.sourced=true` (extends the 3.6 sourced flag logic).

### Edge functions
- `notify-interview-proposed` / `notify-interview-confirmed` / `notify-interview-reminder` (cron-driven via existing pg_cron pattern at 24h + 1h horizons).
- `generate-offer-pdf` — server-side render of offer letter PDF, stores in `offer-letters` bucket.
- `notify-offer-sent` / `notify-offer-decision`.
- `notify-job-invitation`.

---

## Frontend file plan

### Interviews
- `src/components/interviews/ScheduleInterviewSheet.tsx`
- `src/components/interviews/InterviewSlotPicker.tsx` (talent side)
- `src/components/interviews/InterviewPanel.tsx` (side panel block)
- `src/pages/app/AppInterviewSchedule.tsx` (talent confirm/reschedule page)
- `src/hooks/useInterviews.ts`

### Offers
- `src/components/offers/OfferComposer.tsx` (recruiter)
- `src/components/offers/OfferLetterTemplate.tsx` (PDF + on-screen)
- `src/components/offers/OfferDecisionPanel.tsx` (talent accept/decline)
- `src/pages/app/AppOfferDecision.tsx`
- `src/lib/offerPdfGenerator.ts`
- `src/hooks/useOffers.ts`

### Direct messaging (CRM)
- Extend `src/components/applications/ApplicationMessageThread.tsx` to accept `threadType` + `threadId` + new hook.
- `src/hooks/useDirectMessages.ts`
- Wire into `TalentPipelinePanel.tsx` and sourcing result card.

### Invite to apply
- `src/components/sourcing/InviteToApplyDialog.tsx`
- Banner block on `PublicJobDetail.tsx` + `AppApplicationDetail.tsx` apply flow.

### Admin
- `src/pages/admin/jobs/AdminInterviews.tsx`
- `src/pages/admin/jobs/AdminOffers.tsx`
- Register under Admin → Jobs group (mem: Admin Groups 7-10).

### Touchpoints
- `src/components/applications/ApplicationKanbanCard.tsx` — show interview + offer chips.
- `src/components/applications/ApplicationDetailSheet.tsx` — mount `InterviewPanel` + offer block.
- `src/gro10x/pages/Gro10xWork.tsx` — add "Hiring this week" card.
- `src/gro10x/Gro10xRoutes.tsx` — no new routes (sheets only inside Work).

---

## Out of scope (later phases)
- Google/Outlook calendar OAuth + auto-create events
- Real e-signature (DocuSign / HelloSign)
- Background-check integrations
- Multi-round interview kits / scorecards (queued for Assessments subphase)
- Talent-side saved searches / job alerts (still deferred per earlier decision)
- Self-serve job posting & employer billing (separate subphase)

---

## Open questions

1. **Offer PDF branding** — use the company's logo/name only, or co-brand with Group Academy footer? Recommendation: company-branded with a small "Powered by Group Academy" footer, matching certificate pattern.
2. **Counter-offer credit cost** — should talent counter-offers cost credits (to deter spam) or be free? Recommendation: free for the first counter, credits only if they request a third revision.
3. **Interview reminder channels** — email + in-app by default; should we also push via SMS for confirmed interviews (uses Twilio connector, costs money)? Recommendation: in-app + email only in 3.7; add SMS as an opt-in toggle later.

Approve to implement, or tell me which of A–F to drop / reorder.
