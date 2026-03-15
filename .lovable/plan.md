

# Email Outreach Tracking, Placeholder Cleanup, and Communication Improvements

## Current State (from database)

- **173 uploaded talents** have placeholder emails (no real email) but DO have LinkedIn URLs
- **Outreach tracking**: Only 2 records exist, both `whatsapp` channel. Email/LinkedIn inserts use `as any` casts, don't await results, and don't refresh the outreach badge display
- The outreach records query (`loadOutreachRecords`) does not select `channel`, so there's no way to distinguish WhatsApp vs Email vs LinkedIn sends in the UI
- Email/LinkedIn sends in the action menu are fire-and-forget — no visual confirmation badge appears after sending

## Plan

### 1. Fix Email/LinkedIn Outreach Tracking

**TalentPoolManager.tsx**:
- Update `loadOutreachRecords` query to also select `channel`
- Add `channel` to the `OutreachRecord` interface
- Make email/linkedin insert calls `await` the result and refresh outreach records afterward (same pattern as WhatsApp sends)
- Show outreach badges per channel: display separate "Email Sent" / "LinkedIn Sent" / "WhatsApp Sent" indicators in the talent row and detail dialog

**TalentDetailDialog.tsx**:
- Add `channel` to outreach record display in the Outreach tab
- Show channel icon (Mail/Linkedin/MessageSquare) next to each outreach history entry

### 2. Handle Placeholder Email Talents

Rather than deleting 173 records (they have LinkedIn data, skills, experience), mark them clearly and exclude from email outreach:
- Add a KPI badge "No Email: 173" in the stats row
- In the action menu, hide "Email Invite" for talents whose email contains "placeholder" or "noemail"
- Show "LinkedIn Only" badge on those talent rows so admin knows the available channel
- Add a filter option: "Has Real Email" / "LinkedIn Only" to segment outreach targets

### 3. Outreach Tracking Improvements

- Add "Outreach Status" column to the talent table showing last outreach channel + date
- Add bulk outreach capability: select multiple talents and "Copy All LinkedIn Messages" or "Open All Email Invites" (batch of up to 10)
- Add outreach KPIs to the stats row: "Contacted This Week" count, "Unreached" count (talents with no outreach record)

## Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/TalentPoolManager.tsx` | Fix outreach tracking for email/linkedin, add channel to records, placeholder email detection, outreach KPIs, bulk actions |
| `src/components/dashboard/TalentDetailDialog.tsx` | Show channel icons in outreach history, hide email button for placeholder emails |

No database changes needed — `channel` column already exists on `outreach_messages`.

