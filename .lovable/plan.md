

# LinkedIn JSON Import — Universal Batch Upload for Talents, Contacts, and Investors

## What This Does

Adds a **3rd upload method** ("LinkedIn JSON") alongside the existing "Upload CVs" and "Paste CV Links" tabs in the Talent Pool, and reuses the same LinkedIn JSON parser for **Contacts** and **IR Investors** managers — giving you one scraper format that feeds all three systems.

## Data Mapping

The LinkedIn scraper JSON maps cleanly to all three tables:

```text
LinkedIn Field          → Talent              → Contact                → IR Investor
─────────────────────────────────────────────────────────────────────────────────────
fullName                  full_name              full_name                full_name
email                     email                  email                    email
mobileNumber              phone                  phone                    phone
headline                  custom_profession      designation              title
linkedinUrl               linkedin_url           linkedin_url             linkedin_url
companyName               (experience context)   (resolve → company_id)   (resolve → vc_firm_id)
addressWithCountry        country (parsed)       —                        —
profilePicHighQuality     profile_photo_url      —                        —
about                     (bio/summary)          notes                    relationship_summary
experiences[]             experience (JSONB)     —                        —
educations[]              education (JSONB)      —                        —
skills[]                  skills (JSONB)         —                        —
```

## Implementation

### 1. Shared Parser Utility — `src/lib/linkedinJsonParser.ts`

A pure TypeScript module with three functions:
- **`parseLinkedInForTalents(json)`** — Maps each profile to a talent insert object (full_name, email, phone, linkedin_url, custom_profession from headline, country from address, profile_photo_url, education/experience/skills as JSONB arrays)
- **`parseLinkedInForContacts(json)`** — Maps to contact insert objects (full_name, email, phone, designation from headline, linkedin_url, source = "linkedin_import")
- **`parseLinkedInForInvestors(json)`** — Maps to investor insert objects (full_name, email, phone, title from headline, linkedin_url)

Each function handles null/missing fields gracefully and returns `{ valid: ParsedRecord[], skipped: SkippedRecord[] }`.

### 2. Reusable Upload Component — `src/components/dashboard/LinkedInJsonUpload.tsx`

A single component used across all three managers. Props:
- `mode: 'talent' | 'contact' | 'investor'`
- `onComplete: () => void`

UI flow:
1. File drop zone / file picker for `.json` files
2. **Preview table** showing parsed records with validation badges (missing email, missing name, etc.)
3. Company/VC firm resolution step (for contacts/investors — match `companyName` against existing companies/vc_firms, show unmatched ones)
4. "Import X records" button with progress bar
5. Summary: imported count, skipped count, duplicate count (dedup by email + linkedin_url)

### 3. Integration Points

**BatchTalentUpload.tsx** — Add a 3rd tab "LinkedIn JSON" alongside "Upload Files" and "Paste Links", rendering `<LinkedInJsonUpload mode="talent" />`.

**ContactsManager.tsx** — Add an "Import LinkedIn" button next to "Add Contact", opening a dialog with `<LinkedInJsonUpload mode="contact" />`. For company resolution: match `companyName` against existing `companies` table rows (case-insensitive), skip unmatched.

**InvestorsManager.tsx** — Add an "Import LinkedIn" button next to "Add Investor", opening a dialog with `<LinkedInJsonUpload mode="investor" />`. For VC firm resolution: match against `ir_vc_firms` table.

### 4. Deduplication Logic

Before inserting, check existing records:
- **Talents**: Match by `LOWER(email)` OR `linkedin_url`
- **Contacts**: Match by `LOWER(email)` AND `company_id`
- **Investors**: Match by `LOWER(email)`

Duplicates are flagged in the preview (not silently skipped), letting admin choose to skip or update.

## Files to Create/Change

| File | Action | Effort |
|------|--------|--------|
| `src/lib/linkedinJsonParser.ts` | Create | Medium |
| `src/components/dashboard/LinkedInJsonUpload.tsx` | Create | Medium |
| `src/components/dashboard/BatchTalentUpload.tsx` | Add 3rd tab | Light |
| `src/components/dashboard/ContactsManager.tsx` | Add import button + dialog | Light |
| `src/components/dashboard/ir/InvestorsManager.tsx` | Add import button + dialog | Light |

No database migrations needed — all fields already exist in the target tables.

