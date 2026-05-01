## Phase 11F — Gig Categorization, Platform Tasks & Verified Disbursement

Three coordinated changes based on your feedback:

1. **Recategorize gigs by resource type** (not by school) so academy build-out fits naturally inside Projects.
2. **Rename "Quick" to "Platform Tasks"**, drop top filters, expand the catalog of incentivized actions.
3. **Real verification** with primary/secondary disbursement accounts and ID/passport upload.

---

### 1. Resource-type categories (replaces school faculties as the gig taxonomy)

New canonical category set used everywhere a gig is filtered or tagged:

| Category | Maps to academy resources | Maps to marketplace work |
|---|---|---|
| Creative Services | Course cover, banner, thumbnails, slide deck design | Logo, brand, social posts |
| Video & Production | Lecture videos, intros, screencasts | Promo videos, reels |
| Writing & Content | Reading material, articles, scripts, captions | Blog posts, copy |
| Slides & Decks | Slide deck per module | Pitch decks |
| Quizzes & Assessments | Stage 5 quizzes, flashcards | — |
| Practice & Exercises | Stage 4 worksheets, labs | — |
| Web & Tech | Embeds, code samples | Web dev, automation |
| Audio & Podcast | Audio summaries | Podcast edits |
| Translation & Localization | BN/EN versions of resources | Translation |

- Add `resource_category` column to `content_gigs` and a derived mapper from existing `resource_type` → category, plus the same column on `marketplace_gigs` (replacing `skill_category` as the user-facing axis; keep the old column for back-compat).
- The Projects sidebar is replaced by this list. Selecting a category shows BOTH academy-funded content gigs and marketplace projects in that category, so academy work feeds the same pipeline ("projects remain always active").

### 2. Quick → "Platform Tasks"

- Rename tab and remove the horizontal filter chips (you confirmed they aren't needed).
- Single scrollable list grouped by reward size.
- Expand the seeded `gigs` catalog with new task types so people are rewarded for everything that grows the platform:
  - Upload free educational video (with topic suggestion)
  - Write & publish a feed post (min length, approved by mod)
  - Create a poll for the community
  - Share a course/job to socials with tracked link (already partly built — surface here)
  - Refer a friend who completes onboarding
  - Submit a verified company lead
  - Write a short review of a course they completed
  - Submit a salary data point
  - Translate one resource to Bangla / English
- Each is a row in the existing `gigs` table with reward, cooldown, max submissions; reuses `gig_submissions` + admin review.

### 3. Profile verification + disbursement

You correctly noticed Profile says "verified" but Gig header says "Verification Pending" — they're checking different things. Unify it:

**Verification gates earning withdrawal**, not just visual badge.

Required for verified status:
- Photo, phone, country (already tracked)
- Either National ID (both sides) **or** Passport scan uploaded to private `talent-id-docs` bucket (signed URLs only)
- One **primary** disbursement account on file

New tables:
- `talent_id_documents` — `talent_id`, `doc_type` (`nid` | `passport`), `front_url`, `back_url`, `extracted_name`, `extracted_number`, `status` (`pending` | `verified` | `rejected`), `reviewed_by`, `review_notes`. Optional Lovable AI extraction (Gemini vision) of name/number for admin to confirm.
- `talent_payout_accounts` — `talent_id`, `method` (bkash/bank/paypal/wise), `account_name`, `account_number`, `is_primary` (only one true per talent), `created_at`. Trigger enforces single primary.
- `talents.verification_status` (`unverified` | `pending` | `verified`) with a server-side function `recompute_talent_verification(talent_id)` that flips it based on the rules above.

UI changes:
- New `/app/profile/verify` upgraded with two new sections: **Identity document** (NID/passport upload, both pages) and **Disbursement accounts** (list + add + set primary). Remove the existing one-shot account fields from the Withdrawal page; instead Withdrawals just picks from saved accounts (default = primary).
- Gigs header "Verification Pending" pill becomes a real link to `/app/profile/verify` and reflects `verification_status`.
- Admin: new "Identity Reviews" subsection under Talent Management for approving uploaded IDs.

---

### Technical notes

- DB migration: 3 new tables, 2 columns on existing tables, 1 storage bucket (`talent-id-docs`, private), RLS so a talent only sees their own docs/accounts and admins see all.
- `recompute_talent_verification` runs on insert/update of `talent_id_documents` and `talent_payout_accounts` via triggers.
- Withdrawal RLS: block insert when `verification_status != 'verified'`.
- `BuildAcademyTab` Apply form survives but is also reachable from Profile.
- No breaking change to `MARKETPLACE_SCHOOLS` — schools remain for course catalog; only the Projects tab switches its filter axis.

### Files touched

- New: `supabase/migrations/..._verification_disbursement_categories.sql`
- New: `src/components/profile/IdentityDocsUpload.tsx`
- New: `src/components/profile/PayoutAccountsManager.tsx`
- New: `src/lib/constants/gigCategories.ts`
- Edit: `src/pages/app/Gigs.tsx` (rename tab, drop filters, swap Projects taxonomy, real verification badge)
- Edit: `src/pages/app/ProfileVerify.tsx` (add two sections + real status)
- Edit: `src/pages/app/Withdrawals.tsx` (use saved accounts, gate on verified)
- Edit: `src/pages/app/ContentStudio.tsx` and `BuildAcademyTab.tsx` (filter by `resource_category`)
- Edit: `src/components/dashboard/AdminSidebar.tsx` + new `IdentityReviews.tsx` admin page
- Data: insert ~8 new rows into `gigs` for the expanded Platform Tasks catalog

Approve to implement.