

# Fix Profile Card Layout

## Issues
1. **Profession not showing** -- likely the text is there but truncated or the data isn't being passed. Need to verify, but the fix ensures it's always visible.
2. **Credits toggle replaces name** -- the current `ml-auto` on the credits badge pushes it to the far right, but on small screens the flex layout causes the name/profession to shrink or disappear. The credits pill should coexist with name and profession, not replace them.

## Target Layout (matching reference)

```text
+----------------------------------------------------------+
|                                                          |
|  [AVATAR]   Name                    [eye ••••]           |
|             Profession                                   |
|                                                          |
+----------------------------------------------------------+
```

All four elements are **always visible**. Tapping the credits pill toggles between `••••` (hidden) and the actual number.

## Changes to `src/components/feed/FeedHeader.tsx`

1. **Reduce avatar size** from `h-20 w-20` to `h-14 w-14` to free up horizontal space
2. **Reduce name font** from `text-lg` to `text-base`
3. **Credits pill always visible** -- remove the `showCredits` conditional rendering. Instead, always show the pill:
   - Default state: show `••••` (dots) with an eye-off icon
   - Tapped state: show the actual balance number with a coins icon
   - The pill sits on the right side via `ml-auto`, independent of the name/profession block
4. **Ensure profession always renders** below the name in `text-xs text-white/70`
5. **Move the onClick toggle** to only the credits pill, not the entire card -- so tapping the card area doesn't interfere

### Technical Detail
- Remove `onClick` from the outer content div (no more full-card tap to toggle)
- Add `onClick` with `stopPropagation` directly on the credits pill/badge
- Always render the badge; toggle only what's inside it (dots vs number)
- Use `Eye` / `EyeOff` icons from lucide-react for the toggle indicator

