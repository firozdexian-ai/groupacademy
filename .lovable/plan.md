

# Feed Layout Restructure: Admin Banner Header + Cleanup

## Overview

Transform the Feed header area into an admin-changeable banner with the user greeting overlaid on top, move the promotional BannerCarousel below Quick Actions, and remove the low-engagement "Recommended for you" and "Career Insights" sections from mobile.

---

## Current Feed Layout (top to bottom)

1. FeedHeader ("Hi, Firoz!" with hardcoded background)
2. BannerCarousel (promotional banners)
3. QuickActionsGrid (8 action buttons)
4. PersonalizedPromptCard ("Recommended for you")
5. CareerInsightsStack ("Career Insights")
6. FeedFilters
7. Feed Items

## New Feed Layout (top to bottom)

1. **Hero Banner** -- Admin-changeable background image with user greeting overlaid (avatar + "Hi, Firoz!" + subtitle)
2. QuickActionsGrid (8 action buttons)
3. BannerCarousel (promotional banners -- moved below Quick Actions)
4. FeedFilters
5. Feed Items

"Recommended for you" and "Career Insights" are removed from mobile entirely. On desktop sidebar, they remain as-is since they fill useful whitespace there.

---

## Changes

### 1. New `banners.placement` column

Add a `placement` column to the existing `banners` table so admins can designate a banner as the "feed hero" vs the regular carousel.

- Values: `'carousel'` (default) or `'hero'`
- Only one hero banner should be active at a time (enforced by UI, not constraint)
- This reuses the existing banners infrastructure -- no new table needed

### 2. Update FeedHeader to use admin banner image

Instead of the hardcoded `feed-bg.jpg` background, FeedHeader will:
- Query `banners` for an active banner with `placement = 'hero'`
- Use that banner's `image_url` as the background
- Fall back to a gradient/default if no hero banner is set
- Keep the greeting overlay (avatar, name, subtitle) exactly as-is
- **Banner size**: Same as the current FeedHeader -- full-width, `h-36` on mobile (compact), matching the existing carousel compact height. Recommended upload size: **1200x400px (3:1 ratio)** -- same as existing banners.

### 3. Reorder Feed layout

In `Feed.tsx`, change the order:
- FeedHeader (now with admin banner)
- QuickActionsGrid
- BannerCarousel (moved down)
- FeedFilters
- Feed Items

### 4. Remove mobile-only widgets

Remove the `lg:hidden` block containing `PersonalizedPromptCard` and `CareerInsightsStack` from the mobile feed. They remain in the desktop sidebar only.

### 5. Update BannerManager

Add a "Placement" dropdown (Hero / Carousel) to the banner creation form and display list so admins can control which banner appears as the feed header.

---

## Technical Summary

| File | Changes |
|------|---------|
| Database migration | Add `placement TEXT DEFAULT 'carousel'` to `banners` table |
| `src/components/feed/FeedHeader.tsx` | Fetch hero banner from DB, use as background image, keep greeting overlay |
| `src/pages/app/Feed.tsx` | Reorder: Header > QuickActions > BannerCarousel. Remove mobile PersonalizedPromptCard + CareerInsightsStack block |
| `src/components/BannerCarousel.tsx` | Filter to only show `placement = 'carousel'` banners |
| `src/components/dashboard/BannerManager.tsx` | Add placement selector (Hero/Carousel) to create form and list view |

## What stays the same

- All existing banner CRUD functionality
- Desktop sidebar keeps PersonalizedPromptCard and CareerInsightsStack
- BannerCarousel navigation (arrows, dots, auto-rotate)
- Greeting overlay design (avatar, name, subtitle)
- No changes to feed items, filters, or pull-to-refresh
