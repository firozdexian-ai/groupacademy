

# Home Page and Profile Tab Improvements

## Overview

Based on the current state of the app and the reference screenshots, here are the improvement areas for the Home (Feed) page and Profile tab.

---

## Home Page Improvements

### 1. Banner Aspect Ratio Fix

The reference banners show a **wider, shorter aspect ratio** (~2.5:1 to 3:1). The current `h-44` compact height makes the banner too tall relative to its width on mobile, cropping the banner artwork poorly.

**Fix:** Change compact height from `h-44` to `h-36` (144px) and use `rounded-2xl` for softer corners matching the reference. Also use `aspect-ratio` approach for better responsiveness.

**File:** `src/components/BannerCarousel.tsx`

### 2. Feed Header - Remove Redundant "Updated" Timestamp

The "Updated less than a minute ago" text between the header and banner wastes vertical space. Remove or move it to be less prominent.

**File:** `src/pages/app/Feed.tsx`

### 3. Quick Actions Grid - Add Background Cards

The current quick actions are just floating icons. Add a subtle card background (`bg-card rounded-2xl p-4 shadow-sm`) around the grid for better visual grouping, matching the reference app style.

**File:** `src/components/feed/QuickActionsGrid.tsx`

### 4. Tighten Vertical Spacing

The `space-y-6` gap between sections on the main column is too generous on mobile. Reduce to `space-y-4` for a denser, more app-like feel.

**File:** `src/pages/app/Feed.tsx`

---

## Profile Tab Improvements

### 5. Profile Hero - Match Reference Style

The reference shows the profile photo on the left side with a ring border, name and tagline to the right, on a branded gradient background. The current layout already has this general structure but can be improved:

- Make the avatar slightly larger (`h-24 w-24`) with a thicker white ring (`ring-4 ring-white`)
- Add the user's profession/tagline more prominently
- Ensure the gradient background extends to cover the full hero area with proper padding

**File:** `src/pages/app/Profile.tsx`

### 6. Quick Actions - Use Grid Instead of Horizontal Scroll

The horizontal scroll for quick actions (My Learning, Saved Jobs, Applications, Edit Profile) is hard to discover. Switch to a 2x2 grid layout so all items are visible without scrolling.

**File:** `src/pages/app/Profile.tsx`

### 7. Credits Card - Better Integration

Move the credits card from floating overlap to be part of the quick actions section for cleaner layout. Show it as the first item in a stats row.

**File:** `src/pages/app/Profile.tsx`

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/BannerCarousel.tsx` | Reduce compact height to `h-36`, use `rounded-2xl` |
| `src/pages/app/Feed.tsx` | Remove timestamp, tighten `space-y-6` to `space-y-4` |
| `src/components/feed/QuickActionsGrid.tsx` | Wrap grid in a card container |
| `src/pages/app/Profile.tsx` | Larger avatar with white ring, 2x2 quick actions grid, cleaner credits integration |

---

## What stays the same

- All colors, gradients, and theme remain untouched
- No backend or database changes
- All existing functionality preserved
- Bottom navigation unchanged

