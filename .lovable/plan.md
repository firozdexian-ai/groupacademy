

# Learning Tab Improvements

## Overview

After reviewing the Learning Hub and all its sub-pages (My Courses, All Courses, Course Detail), here are the improvement areas for better mobile UX, tighter layout, and visual consistency with the already-improved Feed, Jobs, and Profile tabs.

---

## Improvements

### 1. Learning Hub (`LearningHub.tsx`) - Tighten Layout

**Current issues:**
- `space-y-6` and `py-6` create too much vertical gap on mobile
- The header gradient section has generous `p-6` padding
- The "Quick Actions" section uses a `SectionHeader` which adds its own spacing overhead

**Fixes:**
- Reduce outer `space-y-6` to `space-y-4` and `py-6` to `py-4`
- Reduce header padding from `p-6` to `p-5`
- Remove the `SectionHeader` for Quick Actions (it adds unnecessary icon + "View all" for a static 4-item grid) and replace with a simple `h2`

### 2. Learning Hub - Wrap Quick Actions in Card Container

**Current issue:** The 4 quick action cards float independently, unlike the Feed page where quick actions are wrapped in a `bg-card rounded-2xl p-4 shadow-sm` container.

**Fix:** Wrap the quick actions grid in a card container for visual grouping consistency with the Feed tab.

### 3. Career Tracks Preview - Use SectionHeader

**Current issue:** CareerTracksPreview has its own custom header with icon + "View All" button, not using the reusable `SectionHeader` component.

**Fix:** Replace the custom header with `SectionHeader` for consistency.

### 4. Active Course Hero - Mobile Optimization

**Current issues:**
- The `lg:grid-cols-[1fr,280px]` layout means the "Up Next" sidebar is hidden below on mobile but takes full width, creating a long vertical stack
- The hero card uses `md:grid-cols-[200px,1fr]` which means on mobile the thumbnail is full-width aspect-video (tall), pushing the CTA far down

**Fixes:**
- On mobile, make the hero card more compact: reduce thumbnail height and show content side-by-side or stacked tighter
- For the "Up Next" section, show it as a compact horizontal scroll on mobile instead of a vertical stack

### 5. Unified Discovery - Mobile Grid Fix

**Current issue:** Grid is `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`. On mobile, single-column cards are very tall and only 1 fits on screen.

**Fix:** Use `grid-cols-2` on mobile for discovery cards (similar to Services Hub pattern), with smaller thumbnails and tighter text.

### 6. Quick Stats - Tighter Mobile Cards

**Current issue:** Stats cards use `p-4` with `text-2xl` values, taking significant vertical space.

**Fix:** Reduce padding to `p-3` and value font size to `text-xl` for a more compact mobile footprint.

### 7. Course Detail (`AppCourseDetail.tsx`) - Sticky Bottom CTA

**Current issue:** Like the Jobs page before, the Enroll/Start Learning button is mid-page and requires scrolling to find.

**Fix:** Add a sticky bottom CTA bar on mobile (same pattern as Jobs detail page) with the primary action always visible.

### 8. All Courses (`AppCourses.tsx`) - Mobile Spacing

**Current issue:** `py-6` creates unnecessary top/bottom padding on mobile.

**Fix:** Reduce to `py-4` on mobile, consistent with the Jobs listing fix.

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/app/LearningHub.tsx` | Reduce spacing to `space-y-4`, `py-4`, wrap quick actions in card container |
| `src/components/learning/CareerTracksPreview.tsx` | Replace custom header with `SectionHeader` component |
| `src/components/learning/ActiveCourseHero.tsx` | Compact mobile thumbnail, horizontal "Up Next" on mobile |
| `src/components/learning/UnifiedDiscovery.tsx` | Change mobile grid to `grid-cols-2` |
| `src/components/learning/QuickStats.tsx` | Reduce padding to `p-3`, value to `text-xl` |
| `src/pages/app/AppCourseDetail.tsx` | Add sticky bottom CTA bar on mobile |
| `src/pages/app/AppCourses.tsx` | Reduce `py-6` to `py-4` |

---

## What stays the same

- All existing functionality (enrollment, credits, progress tracking)
- Color palette and theme
- No database changes
- Data fetching logic unchanged

