# Sub-phase 2.3 — Community Filter System (single row)

Replace the existing content-type filter row with a **single 4-slot row** focused on community scope. Content-type filters (Posts/Courses/Videos/etc.) move into the "More" sheet.

## What the user sees

One row, exactly 4 tiles, no horizontal scroll:

```text
[ 🌐 Global ] [ 🇧🇩 Bangladesh ] [ 💼 Marketing ] [ ⋯ More ]
```

- **Global** — everyone's feed (replaces today's "All"). Default.
- **My Country** — pill labeled with the talent's country (e.g. "Bangladesh"), icon `MapPin`.
- **My Profession** — pill labeled with the talent's profession (e.g. "Marketing"), icon `Briefcase`.
- **More** — opens the existing bottom sheet with content-type options (Posts, Courses, Videos, Articles, Polls).

### Fallback when profile is incomplete

If the talent is missing country and/or profession, fill the empty slots with the most common content-type filters so the row still shows 4 useful tiles:

| Country set? | Profession set? | Slot 2          | Slot 3            |
|--------------|-----------------|-----------------|-------------------|
| yes          | yes             | Country pill    | Profession pill   |
| yes          | no              | Country pill    | Posts             |
| no           | yes             | Posts           | Profession pill   |
| no           | no              | Posts           | Courses           |

Slot 1 is always **Global**, slot 4 is always **More**. Anything not surfaced lives in the More sheet.

### Active state behavior

- Only one tile is "active" at a time across the whole row (scope OR type, not both).
- Picking Global / Country / Profession sets `scope` and resets `type` to `all`.
- Picking a type from the More sheet (or from a fallback slot) sets `type` and resets `scope` to `global`.
- The active tile uses `bg-primary text-primary-foreground`; others use `bg-card border-border/60`.

### Empty state

When a Country or Profession scope returns 0 items, show a soft card:
> "Nothing in {label} yet. Be the first — or **switch to Global**."

## What changes under the hood

### Types & state
Extend `useFeedRecommendations`:

```ts
export type FeedScope = "global" | "country" | "profession";

export interface FeedFilters {
  type: FeedFilterType;   // existing — "all" | "post" | "course" | "video" | "blog" | "poll"
  scope: FeedScope;       // new — defaults to "global"
}
```

- Persist both in the existing localStorage key.
- If user previously selected Country/Profession but later cleared their profile, fall back to `global`.

### Filtering logic
After the existing content-type filter, apply scope:

- `global` → no extra filter.
- `country` → keep posts whose author's `talents.country` matches the talent's country.
- `profession` → keep posts whose author's `talents.profession` matches the talent's profession.
- Non-post items (courses/videos/blogs) have no author country/profession, so:
  - In `global` scope → always included.
  - In `country` or `profession` scope → **excluded** (community scope is about people, not catalog content).

### Data
Extend the post fetcher in `useFeedRecommendations` to pull author scope fields via the existing join:

```ts
.select(`*, author:talents!inner(country, profession)`)
```

Flatten `author_country` and `author_profession` onto the resulting `FeedItem` so filtering is a pure client-side comparison. No DB migration needed.

### UI

`src/components/feed/FeedFilters.tsx` is rewritten to render the new 4-slot row:

- Slot 1: always Global.
- Slot 2 + 3: dynamic per fallback table above.
- Slot 4: More button → opens existing `Sheet` with all content-type options + Country/Profession entries that didn't fit.

The current 3-primary + More structure is replaced; the More sheet logic and styling stay the same.

`Feed.tsx` only needs to keep passing `filters` and `setFilters`; no second row added.

`FeedHeader.tsx` is unchanged for this sub-phase (career level pill stays where it is).

## Acceptance checklist

- One row, four tiles, no horizontal scroll at 390px.
- New users (no country/profession) see Global + Posts + Courses + More.
- Talents with full profiles see Global + Country + Profession + More.
- Country/Profession scopes hide catalog items (courses/videos/blogs).
- Empty scope view offers a one-tap return to Global.
- Selection persists across reloads; stale selections fall back to Global gracefully.

## Out of scope

- City-level scope, Following feed, multi-select scopes — later phase.
- Server-side ranking changes — pure client filter on the already-fetched list.

After 2.3 ships → **2.4: Post detail view & deep linking** (`/app/feed/post/:id`).
