
# Implement Profile Card + Feed Card Refinements

Two sets of changes from earlier approved feedback that haven't been applied yet.

---

## 1. Profile Card -- Center-Aligned Layout (`src/components/feed/FeedHeader.tsx`)

**Current**: Left-aligned layout with "Hi, FirstName! wave" greeting, small 10x10 avatar, credits always visible on right.

**Changes**:
- Switch to vertical center-aligned layout (`flex flex-col items-center text-center`)
- Display **full name** (e.g., "Firoze Uddin Ahmed") instead of "Hi, FirstName! wave"
- Show **profession** below name in smaller muted text
- Enlarge avatar from `h-10 w-10` to `h-16 w-16`, centered
- Credits badge centered below avatar, **hidden by default** -- tap to reveal (toggle state)
- Keep the 3:1 aspect ratio background image (already implemented)

---

## 2. Feed Cards -- Remove Skip, Add Share, Embed YouTube (`src/components/feed/FeedCardRedesigned.tsx`)

**Current**: Shows static thumbnail with play overlay for videos/courses. Has "Skip" + action button at bottom.

**Changes**:

### a) YouTube Embed for Videos/Courses
- When `item.youtubeUrl` exists, replace the static thumbnail + play overlay with an embedded YouTube `iframe` (16:9 aspect ratio)
- Extract video ID using regex pattern already used elsewhere: `/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/`
- Users can watch directly from the feed

### b) Remove Skip Button, Add Share
- Remove the "Skip" button entirely (remove `onNotInterested` usage)
- Replace with type-specific action buttons:

| Type | Button 1 | Button 2 |
|------|----------|----------|
| Course | Learn More | Share |
| Video | Watch on YouTube | Share |
| Blog | Read | Share |

- Use the existing `ShareSheet` component for the Share button
- "Watch on YouTube" opens `item.youtubeUrl` in a new tab
- Generate share URLs based on item type and slug/id

### c) Interface Cleanup
- The `onNotInterested` prop can remain in the interface for backward compatibility but won't render a button

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/feed/FeedHeader.tsx` | Center layout, full name, larger avatar, hidden credits toggle |
| `src/components/feed/FeedCardRedesigned.tsx` | YouTube embed, remove Skip, add ShareSheet, type-specific actions |
