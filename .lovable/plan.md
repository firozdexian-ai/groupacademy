# Sub-phase 2.1.5 — Profile Card, Quick Actions, Composer & Career Level

Four targeted polish items before we move to 2.2. You're right about the wallet vs. lifetime-transactions distinction — that was a slip in 2.1, and it changes how the profile card communicates progress.

---

## 1. Profile Card — Animated "Doodle" Background

Bring back the admin-managed living background behind the identity strip while keeping the new typography intact. Like Google Doodle: themes swap on occasions (Eid, Independence Day, New Year, etc.).

**Schema (new table)**
```sql
create table public.profile_card_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,                                  -- "Eid 2026"
  media_type text not null check (media_type in ('image','gif','video','lottie','gradient')),
  media_url text,
  poster_url text,
  gradient_css text,                                   -- when media_type='gradient'
  overlay_opacity numeric default 0.55,                -- readability scrim
  text_color text default 'auto',                      -- 'light'|'dark'|'auto'
  start_at timestamptz, end_at timestamptz,            -- scheduling window
  priority int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
```
Active = highest-priority active row inside its date window (nulls = always).

**Components**
- `ProfileCardBackdrop.tsx` (new) — fetches the active theme via React Query, renders absolutely behind `FeedHeader` content. Honours `prefers-reduced-motion` (poster fallback for video/lottie).
- `FeedHeader.tsx` — wrap children in a relative container with the backdrop + scrim. Auto-flip text/icon tints when `text_color='light'`.
- Admin: new "Profile Card Themes" tab in the existing banner area, same uploader + scheduling UX as `BannerManager`.

---

## 2. Quick Actions — Fixed Top-5 Grid (no side-scroll)

Per your "no horizontal scroll" rule. Selection math stays exactly the same — personal usage frequency first, fall back to global popularity — but the row becomes a hard 5-column grid.

```text
[ Agent1 ] [ Agent2 ] [ Agent3 ] [ Agent4 ] [ Agent5 ]
```
- `grid grid-cols-5 gap-2`, no `overflow-x`, no `snap-*`.
- Each cell `min-w-0`, label `truncate` — fits comfortably at 390px.
- **Messages**: move out of the row, pin a small icon-with-badge inside `FeedHeader` next to the credits chip (its natural home).
- **More agents**: a tiny ghost link "View all agents →" right below the row, opening the existing `QuickActionsSheet`.

File: rewrite the render block of `QuickActionsGrid.tsx`; ranking logic in the `useQuery` is unchanged, `VISIBLE_LIMIT` stays at 5, drop the Messages/More tiles.

---

## 3. ComposePost — Rebuild

The current card (your screenshot — "DEPLOY CAREER UPDATES…", "ABORT SYNC", "0/1000 PAYLOAD") was inherited from an older iteration and clashes with the new slim shell. Replace with a calm, modern composer.

**Collapsed**
```text
┌─────────────────────────────────────────────┐
│ (avatar)  What's on your mind, Rakib?      │
│           [📷]  [#]  [✨ AI]                │
└─────────────────────────────────────────────┘
```

**Expanded**
- Plain `Textarea`, sentence-case placeholder: "Share an update with your community…"
- Tag chips: soft `bg-muted` pills (no italics, no uppercase, no wide tracking), capped at 5.
- Footer: left = `120 / 1000` muted counter; right = `Cancel` (ghost) + `Post` (default primary). No shadow-2xl, no scale-on-focus, no purple ring.
- Card chrome: `rounded-2xl border border-border/40 bg-card` — matches `FeedHeader` and `BannerCarousel`.

Image upload, AI rewrite, and scheduler stay deferred to **2.4** — icons render but show "Coming soon" tooltip so the layout is final.

---

## 4. Career Level — Lifetime Transactions, not Wallet Balance

Big correction. The number on the card today (`3,830`) is `talent_credits.balance` — that's the wallet, which goes up and down. Career progression / gamification should be tied to **lifetime transaction volume** (earned + spent), which only ever grows.

**Two distinct displays in `FeedHeader`**
- **Wallet chip** (existing) — current `balance`, links to `/app/transactions`. Stays as-is.
- **Career Level bar** (replaces the profile-completion bar) — derived from lifetime transacted credits.

**Source of truth**
- New view `public.talent_lifetime_credits` aggregating `credit_transactions` per talent:
  ```sql
  create or replace view public.talent_lifetime_credits as
  select talent_id,
         sum(abs(amount))::numeric        as lifetime_volume,
         sum(case when amount > 0 then amount else 0 end)::numeric as lifetime_earned,
         sum(case when amount < 0 then -amount else 0 end)::numeric as lifetime_spent
  from public.credit_transactions
  group by talent_id;
  ```
  RLS: each talent reads their own row; admins read all.
- New helper `src/lib/careerLevels.ts`:
  ```ts
  // Tunable thresholds (admin-configurable later)
  export const LEVELS = [
    { level: 1, label: "Explorer",   min: 0      },
    { level: 2, label: "Builder",    min: 500    },
    { level: 3, label: "Contender",  min: 2_000  },
    { level: 4, label: "Achiever",   min: 5_000  },
    { level: 5, label: "Strategist", min: 12_000 },
    { level: 6, label: "Luminary",   min: 25_000 },
    { level: 7, label: "Icon",       min: 50_000 },
  ];
  // returns { level, label, progressPct, toNext }
  ```
- New hook `useCareerLevel.ts` — reads `talent_lifetime_credits`, computes level + progress to next tier.

**UI in `FeedHeader`**
```text
Lv 3 · Contender ▓▓▓▓▓▓░░░░ 62%   1,240 to Strategist
```
Tap → opens a small sheet explaining how the level is calculated and what the next tier unlocks. The old profile-completion percentage moves into the profile page itself (where it actually drives action), not the feed header.

---

## Files Touched
- `supabase/migrations/<new>.sql` — `profile_card_themes` table + RLS, `talent_lifetime_credits` view + RLS.
- `src/components/feed/ProfileCardBackdrop.tsx` (new)
- `src/components/feed/FeedHeader.tsx` (backdrop wrapper, Messages icon, swap completion bar → Career Level)
- `src/components/feed/QuickActionsGrid.tsx` (fixed 5-col grid)
- `src/components/feed/ComposePost.tsx` (rewrite UI; submit logic untouched)
- `src/components/dashboard/ProfileCardThemeManager.tsx` (new admin tab)
- `src/hooks/useCareerLevel.ts` (new)
- `src/lib/careerLevels.ts` (new)

## Validation
- 390px viewport: 5 quick actions fit without scroll; profile card shows active theme with legible text; composer collapsed = single line, expanded = clean modern card; Career Level bar reflects lifetime `credit_transactions` volume — confirmed it never decreases when wallet drops.
- Admin can schedule a theme (e.g. Eid 2026, Apr 1–10) and watch it auto-activate.
- `prefers-reduced-motion` disables video/lottie playback, falls back to poster.

After this lands → **Sub-phase 2.2: Reactions & card actions**.