

# Career Abroad Section Improvements

## Overview

After reviewing the Career Abroad hub, Study Abroad listing, Study Abroad Detail, IELTS Prep, and Roadmap pages, here are the improvements to align with the tighter, mobile-optimized layout standard applied across all other tabs.

---

## Improvements

### 1. Career Abroad Hub (`CareerAbroad.tsx`) - Tighten Layout

**Current issues:**
- `py-6 space-y-8` creates excessive vertical gap on mobile
- The AI Roadmap CTA card is very tall on mobile with `p-6`, `gap-6`, 4 check-circle features in a flex-wrap, and a full-width button column -- pushing the IELTS CTA below the fold
- The IELTS CTA card is centered on mobile (`text-center`) and has `p-6` plus `gap-6`, making it oversized
- The sections grid uses `grid-cols-1` on mobile, creating 3 tall stacked cards when they could be more compact

**Fixes:**
- Reduce `py-6` to `py-4` and `space-y-8` to `space-y-5`
- Roadmap CTA: reduce padding to `p-4`, gap to `gap-4`, collapse the 4 features into 2 rows of 2 on mobile, and inline the button with the credit cost
- IELTS CTA: reduce padding to `p-4`, gap to `gap-3`, left-align text on mobile, and remove the separate feature pills column (redundant since IELTS page shows all details)
- Countries grid: reduce padding from `p-4` to `p-3` and flag size from `text-3xl` to `text-2xl` for tighter mobile cards

### 2. Study Abroad Listing (`StudyAbroad.tsx`) - Mobile Spacing

**Current issues:**
- `py-6` and `mb-6` create generous spacing
- Header title is `text-2xl` which is large for mobile
- The sticky filter bar has `mb-6` below it, pushing results far down

**Fixes:**
- Reduce `py-6` to `py-4` and header `mb-6` to `mb-4`
- Reduce title to `text-xl` for consistency with other sub-pages
- Reduce filter bar `mb-6` to `mb-4`

### 3. Study Abroad Detail (`StudyAbroadDetail.tsx`) - Sticky Mobile CTA

**Current issues:**
- The "Visit Website" / "Chat with Counselor" CTA is at the bottom of the page, requiring a full scroll to reach
- The "Apply Now" button in the header is `hidden sm:flex`, meaning mobile users have no visible CTA without scrolling to the bottom
- The stats grid uses `grid-cols-2 md:grid-cols-4` with `p-2.5` icon containers -- slightly generous on mobile

**Fixes:**
- Add a sticky bottom CTA bar on mobile (same pattern as Job Detail) with "Visit Website" and "Chat with Counselor" buttons
- Add `pb-28` to main container for bottom bar clearance
- Reduce stats icon container from `p-2.5` to `p-2` on mobile

### 4. IELTS Prep (`IELTSPrep.tsx`) - Tighter Layout

**Current issues:**
- `py-6` and `mb-8` between sections and resources create large gaps
- The credit badge in the header wraps awkwardly on narrow screens
- Section cards use `p-4` with `mb-3` on the icon container -- slightly generous
- The AI Practice CTA at the bottom has `p-6` padding

**Fixes:**
- Reduce `py-6` to `py-4`, `mb-8` to `mb-5`, and `mb-6` to `mb-4`
- Move the credit badge below the subtitle on mobile instead of beside it (prevent wrapping)
- Reduce section card icon `mb-3` to `mb-2` and CTA padding from `p-6` to `p-4`

### 5. Roadmap Intake Form (`RoadmapIntakeForm.tsx`) - Compact Wizard

**Current issues:**
- `mb-6` after the progress bar creates a large gap before the form card
- Country selection grid uses `grid-cols-3` on mobile with `text-xl` flags and `p-2` padding -- takes significant vertical space for 12 countries
- The `space-y-6` inside each step's CardContent creates large gaps between form fields
- The navigation buttons at the bottom use `mt-6` spacing

**Fixes:**
- Reduce progress bar `mb-6` to `mb-4`
- Country grid: use `grid-cols-4` on mobile with smaller flags (`text-lg`) and `p-1.5` padding
- Reduce `space-y-6` to `space-y-4` inside CardContent for tighter field grouping
- Reduce navigation button `mt-6` to `mt-4`

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/app/CareerAbroad.tsx` | Reduce spacing to `space-y-5`, `py-4`; compact Roadmap and IELTS CTAs; reduce country card padding |
| `src/pages/app/StudyAbroad.tsx` | Reduce `py-6` to `py-4`, `mb-6` to `mb-4`, title to `text-xl` |
| `src/pages/app/StudyAbroadDetail.tsx` | Add sticky bottom CTA bar on mobile, `pb-28` clearance, compact stats icons |
| `src/pages/app/IELTSPrep.tsx` | Reduce spacing (`py-4`, `mb-5`), compact section cards and CTA, mobile-friendly credit badge |
| `src/components/abroad/RoadmapIntakeForm.tsx` | Reduce `mb-6` to `mb-4`, `space-y-6` to `space-y-4`, compact country grid |

---

## What stays the same

- All existing functionality (credit gate, roadmap generation, IELTS resource unlocking)
- Color palette and theme
- No database changes
- Data fetching and navigation logic unchanged

