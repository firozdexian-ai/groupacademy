

# Revised Plan: Include CompaniesManager & ContactsManager in Migration

## Why the Original Plan Excluded Them

The B2B outreach emails in CompaniesManager and ContactsManager are **sales/marketing emails** (cold outreach to external companies). The transactional email system is explicitly designed to reject non-transactional sends to protect domain reputation — mixing cold outreach with password resets and receipts on the same domain can damage deliverability for all emails.

## What We Can Do Instead

These components already have a solid pattern: compose the email content using templates (`companyOutreachTemplates.ts`), open `mailto:`, and log the outreach to `contact_outreach` table. The issue is that `mailto:` depends on the user's local email client.

### Option A: Send via Platform with a Dedicated Outreach Template (Recommended)

Create a **separate outreach Edge Function** (`send-outreach-email`) that:
- Sends from a different queue purpose (`outreach` vs `transactional`) to keep reputation separation
- Uses the existing `companyOutreachTemplates.ts` content as the email body
- Logs to `contact_outreach` table (already happening)
- Does NOT go through `send-transactional-email` (which blocks non-transactional sends)

**However**, this conflicts with the Lovable email infrastructure rules — the system only supports auth and transactional purposes. Outreach/marketing emails would be rejected by the API.

### Option B: Keep mailto: but Improve the UX (Pragmatic)

Keep the `mailto:` links for CompaniesManager and ContactsManager since these are genuinely B2B sales emails that should come from the executive's own email address (Towsif Ahmed's `info@dexian.com.bd`), not from `notify@groupacademy.online`. The recipient expects to reply to a real person, not a platform no-reply address.

**Improvements we CAN make:**
1. Add a "Copy to Clipboard" button alongside mailto so users on devices without email clients can still send
2. Ensure outreach logging to `contact_outreach` is reliable (it already works)

### Recommendation

**Go with Option B.** These B2B outreach emails are fundamentally different from transactional emails:
- They're sent FROM a named sales executive, not from the platform
- Recipients expect to reply to a real person
- The content is personalized sales pitches, not system notifications
- Sending them from `notify@groupacademy.online` would actually reduce effectiveness

The existing mailto + outreach logging pattern is the correct architecture for this use case. We'll add a clipboard fallback for better UX.

## Updated Migration Plan

The full migration plan stays the same for all 7 steps, with this change:

**Step 6 (Admin Outreach) becomes:**
- Replace mailto in `TalentDetailDialog.tsx` → platform send via `talent-invite` template
- Replace mailto in `EmailComposer.tsx` → platform send via `investor-update` template  
- Replace mailto in `JobApplicationsManager.tsx` → platform send via `send-job-application`
- Replace mailto in `InvestorsManager.tsx` / `InvestorDetailSheet.tsx` → open EmailComposer
- **CompaniesManager.tsx** → Keep mailto (B2B sales from executive's personal email), add clipboard fallback
- **ContactsManager.tsx** → Keep mailto (B2B contact outreach), add clipboard fallback

No other steps change.

