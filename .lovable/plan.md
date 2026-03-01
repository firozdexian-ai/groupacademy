

# Learning Hub: Convert to Tabbed Interface

## Overview

Transform the Learning Hub from a scrollable page with navigation links into a **tabbed single-page layout**. The four quick action icons (My Courses, Tracks, All Courses, Events) become tab selectors. The default tab is **My Courses**. All content sections below the icons (CareerTracksPreview, ActiveCourseHero, UnifiedDiscovery, QuickStats) are removed from the hub page itself.

## How It Works

```text
+-------------------------------+
|  Banner Carousel (learning)   |
+-------------------------------+
| [My Courses] [Tracks] [All Courses] [Events]  <- icon strip (active = highlighted)
+-------------------------------+
|                               |
|   Content for selected tab    |
|   (inline, no page nav)       |
|                               |
+-------------------------------+
```

- Tapping an icon switches the visible content below (no route change, stays on `/app/learning`)
- The selected icon gets a visual highlight (filled background, bold label)
- The existing sub-routes (`/app/learning/my-courses`, `/app/learning/courses`, etc.) still work for direct links but now redirect to the hub with the correct tab pre-selected

## Changes

### 1. `src/pages/app/LearningHub.tsx` -- Major rewrite

- Add a `tab` state (`"my-courses" | "tracks" | "courses" | "events"`) defaulting to `"my-courses"`
- The icon strip becomes a tab selector: clicking an icon sets the active tab instead of navigating
- Active icon gets `bg-primary text-white` styling; inactive stays `bg-primary/10 text-primary`
- Below the icon strip, render content conditionally based on the active tab:
  - **My Courses**: Inline the enrollment list from `AppMyLearning` (active/completed tabs, stats cards, course cards)
  - **Tracks**: Inline the career tracks content from `AppProfessions` (academies, schools, profession lines)
  - **All Courses**: Inline the course catalog from `AppCourses` (filter tabs, course grid)
  - **Events**: Inline the events list from `AppEvents` (upcoming, today, past events)
- Remove: `CareerTracksPreview`, `ActiveCourseHero`, `UnifiedDiscovery`, `QuickStats` imports and usage
- Keep: `BannerCarousel` at top

### 2. Extract tab content into reusable components

To keep the hub file manageable, extract the inner content of each existing page into embeddable components:

- **`src/components/learning/MyCoursesTab.tsx`** -- Extract from `AppMyLearning.tsx`: the stats cards, tabs (active/completed), and course grid. Remove the back button and page header. Accept `talentId` as prop.
- **`src/components/learning/TracksTab.tsx`** -- Extract from `AppProfessions.tsx`: the academy/school/profession hierarchy. Remove back button and header.
- **`src/components/learning/CoursesTab.tsx`** -- Extract from `AppCourses.tsx`: the filter tabs and course grid. Remove back button and header.
- **`src/components/learning/EventsTab.tsx`** -- Extract from `AppEvents.tsx`: the event type filter and event cards. Remove header.

### 3. Update existing pages to use extracted components

- `AppMyLearning.tsx`, `AppCourses.tsx`, `AppEvents.tsx`, `AppProfessions.tsx` -- These still exist for direct URL access but will now just wrap the extracted tab components with a back button and page header. This avoids code duplication.

### 4. Route handling

- The existing sub-routes (`/app/learning/my-courses`, `/app/learning/courses`, etc.) continue to work as standalone pages
- Optionally, support a query param like `?tab=tracks` on `/app/learning` so links can deep-link to a specific tab

## Technical Notes

- Each tab component manages its own data fetching via `useQuery` (queries only run when the tab is active, leveraging React Query's `enabled` flag or simply mounting/unmounting)
- No database changes required
- No new dependencies needed
- The `useLearningStats` hook can be removed from LearningHub since the stats are now inside MyCoursesTab
