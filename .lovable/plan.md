

# Learning Hub: Replace Header + Compact Quick Actions

## Changes

### 1. Remove the top gradient card (greeting, stats, resume button)
The large gradient card with personalized greeting, streak stats, and credit balance will be removed entirely. This frees up prime screen real estate.

### 2. Add a dedicated Banner Carousel for the Learning page
Reuse the existing `BannerCarousel` component but with a new `placement` filter so admins can upload learning-specific banners separately from the home feed banners.

- Add a new placement value `"learning"` to filter banners for this page
- Pass a `placement` prop to `BannerCarousel` (currently hardcoded to `"carousel"`)
- If no learning banners exist yet, the component gracefully returns null (no empty space)

### 3. Convert Quick Actions from 2x2 cards to a single-row icon strip
Replace the current `QuickActionCard` grid (2 columns, card-style with chevrons) with a compact single-row of 4 circular icons + labels -- matching the `QuickActionsGrid` style used on the Home Feed.

The four items in one row:
- My Courses (BookOpen icon)
- Career Tracks (Target icon)
- All Courses (Library icon)
- Events (Calendar icon)

---

## Technical Details

### File: `src/components/BannerCarousel.tsx`
- Add an optional `placement` prop (default: `"carousel"` for backward compatibility)
- Use the prop in the database query filter instead of the hardcoded `"carousel"` string

### File: `src/pages/app/LearningHub.tsx`
- Remove the entire gradient header section (lines 44-88: greeting, stats row, credit balance, resume button)
- Remove unused imports: `GraduationCap`, `ChevronRight`, `LearningStatsRow`, `CreditBalance`, `getGreeting` function
- Add `BannerCarousel` at the top with `placement="learning"`
- Replace the `QuickActionCard` 2x2 grid with a compact icon row (4 icons in a single `grid-cols-4` layout with circular icon containers and small labels, same pattern as `QuickActionsGrid`)
- Remove the `QuickActionCard` import

### File: `src/components/learning/QuickActionCard.tsx`
- No changes needed (kept for potential reuse elsewhere, but no longer imported by LearningHub)

