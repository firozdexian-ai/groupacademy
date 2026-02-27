

# Profile Card Redesign -- Match Reference Layout

## What's Changing

The profile card needs to switch from a **vertically centered** layout to a **left-aligned avatar with text beside it** layout, matching your reference screenshot.

## Reference Layout (from your screenshot)

```text
+--------------------------------------------------+
|                                                  |
|  [LARGE       ]   Name                           |
|  [AVATAR      ]   Profession / Tagline           |
|  [PHOTO       ]                    [credits pill] |
|                                                  |
+--------------------------------------------------+
         (admin-managed background image)
```

Key differences from current implementation:
- Avatar is **large** and positioned on the **left side**, slightly overlapping the card edge
- Name and profession are to the **right** of the avatar, left-aligned
- No heavy dark overlay -- the banner image is visible with only a subtle gradient
- Credits pill is on the **right side** of the card (hidden by default, tap to reveal)

## Technical Changes

### File: `src/components/feed/FeedHeader.tsx`

1. **Layout**: Change from `flex-col items-center` (vertical center) to a horizontal `flex items-center` layout
   - Avatar on the left, large (`h-24 w-24` or similar) with a white/green ring
   - Text block (name + profession) to the right of avatar
   - Credits pill positioned on the right side of the card

2. **Overlay**: Replace the heavy `bg-black/50` overlay with a subtle left-to-right gradient (`bg-gradient-to-r from-black/40 to-transparent`) so the banner artwork remains visible on the right

3. **Avatar**: Increase size to ~`h-20 w-20` with a thick ring (`ring-4 ring-white/40`), positioned with some left padding. Clicking navigates to profile.

4. **Text**: 
   - Name: bold, white, larger font (`text-lg font-bold`)
   - Profession: smaller muted white text below (`text-xs text-white/70`)

5. **Credits**: A pill/badge on the right side of the card, hidden by default and shown on tap (toggle). Uses `absolute right-4` positioning or flex spacer.

6. **Aspect ratio**: Keep the existing `aspect-[3/1]` container with rounded corners

