

# Gig Marketplace — Phase 2 & Phase 3

## What Exists (Phase 1)
- `marketplace_gigs` table (employer projects) + `marketplace_bids` table (freelancer proposals)
- Browse/filter marketplace UI, gig detail page with bid submission
- Admin manager for creating gigs and viewing bids
- `selected_bid_id` column already exists on `marketplace_gigs` (ready for Phase 2)

## Phase 2: Freelancer Selection & Contract Management

### Database (1 migration)
1. **`marketplace_contracts`** — created when admin accepts a bid
   - `id`, `gig_id` (FK → marketplace_gigs), `bid_id` (FK → marketplace_bids), `freelancer_id` (FK → talents), `employer_name`, `agreed_amount`, `status` (active/completed/cancelled/disputed), `started_at`, `completed_at`, `created_at`
   - RLS: freelancer sees own contracts, admins see all

2. **`marketplace_deliverables`** — freelancer submits work
   - `id`, `contract_id` (FK → marketplace_contracts), `title`, `description`, `file_url`, `status` (submitted/approved/revision_requested), `submitted_at`, `reviewed_at`, `admin_notes`, `created_at`
   - RLS: freelancer can insert/view own, admins can view/update all

3. **`marketplace_reviews`** — post-completion ratings (Phase 3, but create table now)
   - `id`, `contract_id` (FK → marketplace_contracts), `reviewer_type` (employer/freelancer), `rating` (1-5), `comment`, `created_at`
   - RLS: authenticated can view, contract parties can insert

### Admin UI Changes (`MarketplaceGigsManager`)
- Add "Accept Bid" button in the bids dialog → creates contract, updates bid status to `accepted`, rejects other bids, sets `selected_bid_id` on gig, changes gig status to `in_progress`
- Add "View Contract" button for in-progress gigs → shows deliverables, approve/request revision actions
- Add "Mark Complete" button → changes contract status, triggers credit transfer

### Freelancer UI — New Page: `/app/my-gigs`
- **My Bids** tab: list of all submitted bids with statuses (pending/accepted/rejected)
- **Active Contracts** tab: accepted gigs with deliverable submission form (title, description, file upload)
- **Completed** tab: past contracts with earned credits and reviews
- Navigation link added to Gigs page and bottom nav

### Credit Integration on Completion
- When admin marks a contract complete, call `add_credits` to transfer the agreed amount to the freelancer's earned balance
- Record as `marketplace_earning` transaction type

## Phase 3: Reviews & Ratings (within same build)
- After contract completion, freelancer can leave a review (rating + comment)
- Reviews shown on gig detail page and freelancer profile
- Average rating badge on marketplace cards

## Files to Create
- `src/pages/app/MyGigs.tsx` — freelancer's gig management page (bids, contracts, deliverables)

## Files to Edit
- `src/components/dashboard/MarketplaceGigsManager.tsx` — accept bid, manage contracts/deliverables, mark complete
- `src/pages/app/MarketplaceGigDetail.tsx` — show reviews section
- `src/pages/app/Marketplace.tsx` — show rating on gig cards if available
- `src/App.tsx` — add `/app/my-gigs` route
- `src/lib/routes.ts` — add route constant
- `src/pages/app/Gigs.tsx` — add "My Gigs" navigation link
- `src/components/dashboard/AdminSidebar.tsx` — no change needed (already has marketplace-gigs)

## Execution Order
1. Database migration (3 tables + RLS)
2. Admin accept-bid + contract management in `MarketplaceGigsManager`
3. `MyGigs` page for freelancers (bids, contracts, deliverables)
4. Credit transfer on completion
5. Reviews UI on gig detail + marketplace cards
6. Route wiring

