

# Multi-Channel Outreach, Duplicate Enrichment, Profile Data, and Profession Hygiene

## Issues Found

### 1. Outreach is WhatsApp-only — but uploaded leads mostly have email/LinkedIn, not phone
Current outreach (`sendProductOutreach`) requires `talent.phone` and opens WhatsApp links. For uploaded/scraped leads who only have email or LinkedIn, there's no outreach path at all.

### 2. Duplicates are skipped, NOT enriched
In `LinkedInJsonUpload.tsx` lines 280-292, when a duplicate is detected (by email or linkedin_url), the code does `duplicates++; continue;` — it completely skips the record instead of merging new data into the existing record.

### 3. TalentDetailDialog shows only 4 fields — ignores education, experience, skills, country
The DB has `education`, `experience`, `skills`, `institution`, `field_of_study`, `country`, `current_status` columns — all populated by CV parsing and JSON import. But `TalentDetailDialog` only shows email, phone, profession, and join date. The Profile tab doesn't render any of this rich data.

### 4. `custom_profession` gets raw headline/job_title — not standardized
The parser maps `headline` or `job_title` directly to `custom_profession`. Values like "Sr. Software Engineer at Google" are designations, not profession types. We should extract the core profession and optionally attempt to match it to existing `profession_categories`.

---

## Plan

### Fix 1: Multi-Channel Outreach (Email + LinkedIn + WhatsApp)

**Outreach tab in TalentDetailDialog** — Add "Send Email" and "Open LinkedIn" action buttons alongside WhatsApp:
- **Email**: Compose a `mailto:` link with a pre-filled subject/body using the outreach templates (adapted for email format). For uploaded talents without phone, this becomes the primary channel.
- **LinkedIn**: Open the talent's `linkedin_url` with a "Copy Message" button that puts the outreach text in clipboard for pasting into LinkedIn DMs.
- Track all channels in `outreach_messages` table with a new `channel` column.

**TalentPoolManager action menu** — Add "Email Invite" and "LinkedIn Invite" options for talents without phone numbers. Currently only WhatsApp options show.

**AI-Powered Outreach Composer** — Add a small AI compose button in the outreach tab that generates a personalized invite message using the talent's profile data (skills, headline, country). Uses the existing AI edge function pattern. This makes outreach contextual rather than template-only.

**DB Migration**: Add `channel` column to `outreach_messages` (default 'whatsapp').

### Fix 2: Enrich Duplicates Instead of Skipping

In `LinkedInJsonUpload.tsx`, change the dedup logic: when a duplicate is found, use `UPDATE` to merge new non-null fields into the existing record (only fill empty fields, never overwrite existing data). Report these as "enriched" in the summary instead of "duplicates skipped".

### Fix 3: Show Full Profile Data in TalentDetailDialog

Expand the Profile tab to render:
- **Country & City** with flag
- **Education** — institution, degree, field of study (from JSONB array)
- **Experience** — company, title, dates (from JSONB array)  
- **Skills** — as badge chips (from JSONB array)
- **About/Bio** — if available
- **Current Status** badge

Also update the `TalentProfile` interface to include these fields in the select query.

### Fix 4: Standardize Profession from Headline

Update `linkedinJsonParser.ts`:
- Extract core profession from headline by stripping company context ("Sr. Software Engineer at Google" → "Software Engineer")
- Strip seniority prefixes (Sr., Jr., Lead, Principal, etc.) for cleaner mapping
- Store original headline as a separate field or in notes for context

---

## Files to Change

| File | Change |
|------|--------|
| DB migration | Add `channel` column to `outreach_messages` |
| `src/lib/linkedinJsonParser.ts` | Add `extractProfession()` helper; update talent parser |
| `src/components/dashboard/LinkedInJsonUpload.tsx` | Replace skip-on-duplicate with upsert/enrich logic |
| `src/components/dashboard/TalentDetailDialog.tsx` | Add education/experience/skills/country sections; add Email/LinkedIn outreach buttons |
| `src/components/dashboard/TalentPoolManager.tsx` | Add Email/LinkedIn outreach actions in menu for phoneless talents |
| `src/lib/outreachTemplates.ts` | Add email-formatted templates and LinkedIn message variants |

