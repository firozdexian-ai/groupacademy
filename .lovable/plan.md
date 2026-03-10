

# Gig Infrastructure Consolidation Plan

## The Problem: Two Separate Systems

The platform currently has **two completely separate gig systems** that confuse users and fragment admin workflows:

```text
System 1: "Earn Credits" Gigs (internal)          System 2: "Freelance Marketplace" (external)
─────────────────────────────────                  ──────────────────────────────────────────
Table: gigs + gig_submissions                      Table: marketplace_gigs + marketplace_bids
                                                          + marketplace_contracts
                                                          + marketplace_deliverables
                                                          + marketplace_reviews

UI: /app/gigs (bottom nav)                         UI: /app/marketplace, /app/my-gigs
Categories: cv_upload, job_posting,                Categories: 6 Freelancing Academy schools
            job_sharing, content_creation,
            course_resell

Model: "Do task → admin approves → earn credits"   Model: "Employer posts project → freelancer
                                                           bids → contract → deliverable → pay"

Admin: GigsManager + GigSubmissionsManager         Admin: MarketplaceGigsManager
```

**The identity crisis**: System 1 gigs are tasks GroUp Academy (the company) wants done. System 2 is an employer-freelancer marketplace. They look unrelated, live in separate pages, and use different terminology — but from the user's perspective they're both "gigs you do to earn credits."

## The Vision: GroUp Academy as the Employer

GroUp Academy IS the employer. All gigs on the platform are posted BY GroUp Academy (at least initially). This reframes everything:

- **System 1** gigs (CV upload, job sharing, etc.) are simply GroUp Academy-posted micro-tasks with auto-approval logic
- **System 2** marketplace gigs are GroUp Academy-posted larger projects with proposal/deliverable workflows
- Both live under one unified "Gigs" experience with consistent UI

## Proposed Unified Architecture

### Single Entry Point: `/app/gigs`

```text
┌─────────────────────────────────────────────────┐
│  Gigs                                           │
│  Complete tasks & projects to earn credits       │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ Quick     │ │ Projects │ │ My Activity  │    │
│  │ Tasks     │ │          │ │              │    │
│  └──────────┘ └──────────┘ └──────────────┘    │
│                                                 │
│  ── Quick Tasks (current System 1) ──          │
│  [CV Upload]  [Share a Job]  [Post a Job]      │
│  [Create Content]  [Resell a Course]           │
│                                                 │
│  ── Projects (current System 2) ──             │
│  Posted by: GroUp Academy                       │
│  [Logo Design for Partner]  [Write Blog Post]  │
│  [Build Landing Page]  etc.                    │
└─────────────────────────────────────────────────┘
```

### Three Tabs

| Tab | Source | Content |
|-----|--------|---------|
| **Quick Tasks** | `gigs` table | Repeatable micro-tasks (CV upload, job sharing). Instant submit, admin approves. Same as today. |
| **Projects** | `marketplace_gigs` table | Larger scoped work. Browse, submit proposal, deliver work. All posted by GroUp Academy (employer_name = "GroUp Academy"). |
| **My Activity** | Both `gig_submissions` + `marketplace_bids/contracts` | Unified view of all submissions, bids, active contracts, completed work. Replaces both "My Submissions" tab and entire `/app/my-gigs` page. |

### What Changes

**UI (frontend only — no DB changes needed)**:

1. **Merge `/app/gigs`, `/app/marketplace`, `/app/my-gigs` into one `/app/gigs` page** with three tabs
2. **Remove** the "Marketplace" button from the Gigs header
3. **Remove** `/app/my-gigs` as a standalone route (redirect to `/app/gigs?tab=activity`)
4. **Keep** `/app/marketplace/:id` for project detail/bid submission (rename visually to "Project Detail")
5. **Update bottom nav** label from "Gigs" to stay "Gigs" (no change needed)
6. **Consistent branding**: All marketplace gigs show "Posted by GroUp Academy" instead of arbitrary employer names
7. **Unified "My Activity" tab**: Combine `MySubmissions` (quick tasks) + bids/contracts/deliverables (projects) into a single chronological view with section headers

**Admin side**:
- Keep both `GigsManager` and `MarketplaceGigsManager` as separate admin tools (they manage different tables)
- Pre-fill `employer_name = "GroUp Academy"` in MarketplaceGigsManager
- No structural changes needed

**Database**: No migrations. Both table systems stay as-is. The consolidation is purely a UI/routing change.

### Improved Ideas

1. **"Posted by GroUp Academy" badge**: Every project card shows a verified company badge, making it feel like a real employer relationship
2. **Skill-match indicators**: Projects show match % against the user's profile skills (reuse the `CircularMatchBadge` component from Feed)
3. **Progress dashboard in "My Activity"**: Show total credits earned, tasks completed, projects delivered — a mini freelancer profile
4. **"Recommended for you"** section at the top based on user's skills and past completions
5. **Completion streaks**: "Complete 3 quick tasks this week → bonus 50 credits" gamification layer (UI only, reward logic via existing credit RPCs)

### Files to Change

| File | Action |
|------|--------|
| `src/pages/app/Gigs.tsx` | Rewrite as unified 3-tab page incorporating Marketplace browse + MyGigs activity |
| `src/pages/app/Marketplace.tsx` | Remove (merge into Gigs.tsx) |
| `src/pages/app/MyGigs.tsx` | Remove (merge into Gigs.tsx "My Activity" tab) |
| `src/pages/app/MarketplaceGigDetail.tsx` | Keep, update header text from "Marketplace" to "Project Detail" |
| `src/lib/routes.ts` | Remove `marketplace` route, update `myGigs` to redirect |
| `src/App.tsx` | Update route registrations |
| `src/components/dashboard/MarketplaceGigsManager.tsx` | Pre-fill employer_name = "GroUp Academy" |

### Effort: Medium (single session)
No database changes. Pure frontend consolidation + UI redesign of one page.

