## Sub-phase 2.1 — Feed shell & top widgets

Goal: Reshape the top of `/app/feed` so the **banner carousel returns as the hero**, **Quick Actions becomes a single slim row**, and the **profile/header card looks intentional**. Banner is admin-managed and supports image / GIF / video.

---

### 1. Banner aspect-ratio recommendation (your question)

You asked whether a Reels-style ratio makes sense once we support video. My recommendation:

**Keep 3:1 as the default banner ratio. Don't go to 9:16.**

Why:
- 9:16 (Reels/Stories) on a 390px mobile screen = ~693px tall. That's the **entire viewport** before any feed content shows. It kills scroll discovery and feels like an interstitial.
- 3:1 on 390px = 130px tall — banner-shaped, scannable, leaves room for Quick Actions + composer + first post above the fold.
- Industry parallel: LinkedIn, Twitter, YouTube home, Instagram web all use wide banners (~3:1 to 4:1) for the in-feed hero, never 9:16.

What I'll do instead so video/animation still feel rich:
- **3:1 frame, but media is `object-cover`** — vertical clips center-crop, just like Instagram in-feed video crops to 4:5/1:1.
- **Optional `media_focal_point` column** (default `center`) so admins can keep faces/products visible inside the 3:1 crop.
- **Tap → opens full-bleed lightbox** at the media's native aspect ratio (so a 9:16 promo video plays beautifully when the user taps).
- **Auto-play muted, loop, `playsInline`** — same behaviour as Reels in-feed previews.

If after launch we feel it's too short for video, we can add a `tall` variant (4:3 ≈ 290px) without restructuring anything.

---

### 2. Slim Quick Actions (single row)

- New layout: **horizontal scroll snap row, 5 visible icons + a "More →" pill** opening a bottom-sheet with all agents.
- Height: ~76px including label (icon 44px + 10px label).
- Order: most-used personal agents first → fallback to global most-popular → always-pinned **Messages** (with unread badge) at the end.
- Removes the boxed card chrome — it sits flat on the feed background, like iOS Shortcuts.

---

### 3. Profile / Feed header redesign

`FeedHeader.tsx` becomes a **stacked identity strip**:

```text
┌─────────────────────────────────────────────┐
│ [Avatar 44]  Asad Khan                       │
│              Product Designer · Dhaka, BD    │
│              ⚡ 12.5 cr   ▰▰▰▱▱  68% complete │
└─────────────────────────────────────────────┘
```

- Avatar tap → `/app/profile/me`
- Credits chip tap → `/app/transactions`
- Completion bar tap → onboarding next-step or profile edit
- One-line greeting removed (saves vertical space)

---

### 4. New top-of-feed order

```text
1. FeedHeader (slim identity strip)            — ~64px
2. BannerCarousel (3:1, image/GIF/video)        — ~140px
3. QuickActionsGrid (1-row scroll snap)         — ~76px
4. ComposePost (existing, untouched in 2.1)
5. FeedFilters (untouched in 2.1, redesigned in 2.3)
6. Feed items
```

Total above-the-fold (390×672 viewport) ≈ 420px → composer & first card visible without scroll. ✅

---

### 5. Database migration

Extend `banners` table for rich media (admin-managed today, so RLS already correct):

```sql
alter table public.banners
  add column media_type text not null default 'image'
    check (media_type in ('image','gif','video')),
  add column media_url text,                    -- if null, fall back to image_url
  add column poster_url text,                   -- video poster frame
  add column link_url text,                     -- external URL alternative to link_content_id
  add column cta_label text,
  add column focal_point text default 'center'  -- center | top | bottom | left | right
    check (focal_point in ('center','top','bottom','left','right')),
  add column start_at timestamptz,
  add column end_at timestamptz;

-- backfill: existing rows already have image_url; media_url stays null and renderer falls back.
-- optional partial index for active+scheduled
create index if not exists idx_banners_active_window on public.banners (display_order)
  where is_active and (end_at is null or end_at > now());
```

No data deletion. Existing `BannerManager` admin UI gains 5 new fields.

---

### 6. Files to create / edit

**Edit**
- `src/pages/app/Feed.tsx` — reorder, drop the boxed wrapper around composer
- `src/components/feed/FeedHeader.tsx` — full redesign per §3
- `src/components/feed/QuickActionsGrid.tsx` — slim 1-row + bottom-sheet "More"
- `src/components/BannerCarousel.tsx` — render image/gif via `<img>`, video via `<video autoplay muted loop playsInline poster>`, respect `focal_point`, schedule window
- `src/components/dashboard/BannerManager.tsx` — admin form: media type radio, video URL, poster, focal point, schedule, CTA label, link URL

**Create**
- `src/components/feed/QuickActionsSheet.tsx` — bottom-sheet listing all available agents
- `src/components/feed/BannerLightbox.tsx` — full-bleed native-ratio playback on tap

**No changes**
- `ComposePost`, `FeedFilters`, `PostCard` — those are 2.4 / 2.3 / 2.2 territory.

---

### 7. Acceptance criteria

- [ ] On a 390×672 viewport the user sees: Header → Banner → Quick Actions row → start of Composer, all above the fold.
- [ ] Banner can render still image, animated GIF, and muted auto-loop video.
- [ ] Tapping a video banner opens a full-bleed player at the video's native ratio.
- [ ] Admin in `/dashboard?tab=banners` can pick media type, upload/paste URL, set focal point, schedule a window, and add a CTA label.
- [ ] Quick Actions is a single horizontal row with snap scrolling; "More" opens a sheet with every active agent.
- [ ] Profile strip shows avatar, name, profession+location, credits, completion %.
- [ ] No horizontal page scroll on mobile; existing pull-to-refresh still works.

---

### 8. Out of scope (deferred)

- Auto-rule banners (announcements/credits offers) → later iteration
- Composer changes → **2.4**
- Reaction button consolidation → **2.2**
- Filter redesign → **2.3**

---

If this looks right, approve and I'll implement 2.1 end-to-end.
