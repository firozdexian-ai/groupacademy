

# In-Course Player: Complete UX Overhaul

## Problems Identified

1. **Duplicate "Start Learning" buttons** -- AppCourseDetail.tsx shows both an inline CTA (line 383-390) and a sticky bottom bar CTA (line 426-454) on mobile, both saying "Start Learning"
2. **Module list slides in from the side as a Sheet** -- On mobile, the module list opens as a left-sliding sidebar (Sheet), which feels clunky and breaks the vertical-only design principle
3. **Stage navigation scrolls horizontally** -- StageNavigation uses `overflow-x-auto` (line 43), violating the no-horizontal-scroll rule
4. **Discuss stage uses a 2-column grid on mobile** -- `lg:grid-cols-2` on DiscussStage puts audio and AI chat side by side, but on mobile the AI chat card is a fixed 500px height which is awkward
5. **Orientation stage uses a 2-column grid** -- `md:grid-cols-2` for video + infographic can cause horizontal layout issues on smaller tablets
6. **Overall layout is desktop-first** -- The header, sidebar, and content area use a `flex` horizontal layout that wastes space on mobile
7. **Course detail page shows inline CTA that's redundant with sticky bar**

---

## Changes

### 1. Fix duplicate "Start Learning" on Course Detail (`src/pages/app/AppCourseDetail.tsx`)

- Hide the inline "Start Learning" / "Enroll Now" button on mobile (add `hidden md:block` to the wrapper div at line 381)
- The sticky bottom bar already handles mobile -- no need for two CTAs

### 2. Replace side-sliding Sheet with inline collapsible module list (`src/pages/ImmersiveCoursePlayer.tsx`)

- Remove the `Sheet` / `SheetContent` approach for mobile module navigation
- Replace with an inline `Collapsible` (Radix) section at the top of the content area that expands/collapses vertically
- Default to collapsed, showing current module name and a chevron
- When expanded, shows the full `ImmersiveModuleList` in a vertically scrollable container (max-height with overflow)
- This keeps everything vertical -- no sideways drawer

### 3. Redesign StageNavigation for vertical-first (`src/components/player/StageNavigation.tsx`)

- Replace the horizontal scrollable pill strip with a **vertical step indicator** on mobile
- Use a compact vertical layout: small circles connected by vertical lines, with the current stage expanded to show the name
- On desktop (sm+), keep the horizontal layout but remove `overflow-x-auto`
- Alternatively: use a 3x2 grid of stage icons (fits in 2 rows, no scrolling)

**Chosen approach**: Convert to a 3-column grid (2 rows) on mobile, horizontal strip on sm+:
```text
Mobile:
[Orientation] [Learn]    [Discuss]
[Practice]    [Assess]   [Progress]
```

### 4. Make Discuss stage fully vertical (`src/components/player/stages/DiscussStage.tsx`)

- Change `lg:grid-cols-2` to always stack vertically
- Audio section first, then AI chat below
- AI chat height: change from fixed `h-[500px]` to `h-[400px]` for a better mobile fit
- Remove the grid entirely, use simple `space-y-6` stacking

### 5. Make Orientation stage vertical on mobile (`src/components/player/stages/OrientationStage.tsx`)

- Remove `md:grid-cols-2` -- always stack video above infographic vertically
- This prevents side-by-side layout on smaller screens

### 6. Simplify the player header (`src/pages/ImmersiveCoursePlayer.tsx`)

- Make the header more compact on mobile
- Show a slim progress bar directly below the header (always visible, not just on sm+)
- Remove `hidden sm:block` from the progress section so mobile users see their progress

### 7. Remove desktop sidebar, use collapsible everywhere (`src/pages/ImmersiveCoursePlayer.tsx`)

- Remove the `aside` desktop sidebar (lines 357-367)
- Use the same collapsible module list for all screen sizes (above the stage content)
- This simplifies the layout to a single-column flow and removes the horizontal `flex` split

---

## Technical Details

### Files Modified

**`src/pages/app/AppCourseDetail.tsx`**
- Line 381: Add `hidden md:block` to the inline CTA wrapper div

**`src/pages/ImmersiveCoursePlayer.tsx`**
- Remove `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetTrigger` imports
- Add `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` imports
- Remove the `<aside>` desktop sidebar block (lines 357-367)
- Remove the mobile Sheet block (lines 373-397)
- Replace with a `Collapsible` above `StageNavigation`:
  - Trigger: a button showing "Module X: [title]" with a ChevronDown icon
  - Content: `ImmersiveModuleList` wrapped in a `max-h-[50vh] overflow-y-auto` container
- Change main layout from `flex flex-1 overflow-hidden` to a simple single-column layout
- Remove `hidden sm:block` from progress bar so it's always visible
- Make progress bar span full width below the header

**`src/components/player/StageNavigation.tsx`**
- Change container from `flex items-center gap-1 overflow-x-auto` to `grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-1`
- Remove the connector line div between stages on mobile (keep on sm+)
- Make each stage button more compact on mobile: icon + abbreviated name below

**`src/components/player/stages/DiscussStage.tsx`**
- Line 70: Change `grid gap-6 lg:grid-cols-2` to `space-y-6`
- Line 126: Change AI chat card height from `h-[500px]` to `h-[400px]`

**`src/components/player/stages/OrientationStage.tsx`**
- Line 67: Change `grid gap-6 md:grid-cols-2` to `space-y-6`

### No database changes required
### No new dependencies required

