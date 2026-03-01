

# All Courses & Events Tab Redesign

## Overview

Replace the horizontal scrolling tab strips in both **All Courses** and **Events** tabs with an **icon-based category selector** (matching the Learning Hub's icon strip pattern). Also integrate **Competitions** into the Events tab as a new category.

## Visual Layout

Both tabs will use the same pattern -- a grid of circular icon buttons for filtering:

```text
ALL COURSES TAB:
+-----------------------------------------------+
| [All]  [Courses]  [Webinars]  [Classes]       |
|  grid    book      calendar    users           |
+-----------------------------------------------+
|  Course cards (filtered)                       |
+-----------------------------------------------+

EVENTS TAB:
+-----------------------------------------------+
| [All]  [Webinars]  [In-Person]  [Competitions]|
|  grid    video      map-pin      trophy        |
+-----------------------------------------------+
|  Today / Upcoming / Past sections              |
|  + Competition cards when that filter is on    |
+-----------------------------------------------+
```

## Changes

### 1. CoursesTab -- Icon category selector (`src/components/learning/CoursesTab.tsx`)

- Remove the `Tabs` / `TabsList` / `TabsTrigger` components
- Replace with a row of circular icon buttons matching the Learning Hub's icon strip style
- Categories: **All** (LayoutGrid), **Courses** (BookOpen), **Webinars** (Calendar), **Classes** (Users)
- Remove "Videos" and "Seminar" from the filters (free videos are excluded from this tab; seminars go under Events)
- Active icon gets `bg-primary text-primary-foreground`; inactive gets `bg-primary/10 text-primary`
- Each button shows icon + label text below (same pattern as LearningHub tab selector)

### 2. EventsTab -- Icon category selector + Competitions (`src/components/learning/EventsTab.tsx`)

- Remove the `Tabs` / `TabsList` / `TabsTrigger` components
- Replace with the same icon strip pattern
- Categories: **All** (LayoutGrid), **Webinars** (Video), **In-Person** (MapPin), **Competitions** (Trophy)
- When "Competitions" is selected, fetch from the `competitions` table instead of `content`, and render competition cards (reuse the card design from `Competitions.tsx` -- featured image, status badge, prize info, dates)
- When "All" is selected, show both events and competitions together, with competitions in their own section
- Make the event image use `h-32` instead of `aspect-video` to match the compact course card style

### 3. Extract competition card for reuse

- Extract the competition card markup from `src/pages/app/Competitions.tsx` into a small inline component within EventsTab (or a shared `CompetitionCard`) to avoid duplicating the full page logic
- The card shows: featured image, title, status badge (active/upcoming/completed), prize summary, deadline, and navigates to `/app/learning/competitions/{slug}` on click

## Technical Details

### File: `src/components/learning/CoursesTab.tsx`

- Remove `Tabs`, `TabsList`, `TabsTrigger` imports
- Add `LayoutGrid` import from lucide-react
- Define filter options array: `[{ key: "all", icon: LayoutGrid, label: "All" }, { key: "recorded_course", icon: BookOpen, label: "Courses" }, { key: "live_webinar", icon: Calendar, label: "Webinars" }, { key: "batch_class", icon: Users, label: "Classes" }]`
- Replace the Tabs block with a `div` using `flex gap-4 justify-start` containing circular icon buttons
- Each button: `div` with `h-10 w-10 rounded-full flex items-center justify-center` + label `span` below
- Default filter remains "all", which excludes `free_video` (current behavior preserved)

### File: `src/components/learning/EventsTab.tsx`

- Remove `Tabs`, `TabsList`, `TabsTrigger` imports
- Add `Trophy`, `LayoutGrid` imports from lucide-react
- Add a new state value `'competitions'` to the event type
- Add a separate `useQuery` for competitions (from `competitions` table) that only runs when the filter is "all" or "competitions"
- Replace the Tabs block with the icon strip (4 icons in a grid/flex row)
- When filter is "competitions": show only competition cards
- When filter is "all": show events sections (Today, Upcoming, Past) plus a "Competitions" section
- Reduce event card image from `aspect-video` to `h-32`
- Competition card: featured image (`h-32`), title, status badge, prize count, deadline -- navigates to detail page on click

### File: `src/pages/app/Competitions.tsx`

- No changes needed; standalone page continues to work for direct URL access

### No database changes required
### No new dependencies required

