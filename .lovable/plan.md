

# Marketing & Outreach (Group 5) — Audit Plan

## Components & Issues Found

| Component | Lines | Issues |
|-----------|-------|--------|
| **MarketingAnalytics.tsx** | 616 | Header `text-2xl` too large; SummaryCard uses `CardContent pt-4` + `text-2xl` instead of compact `p-3` + `text-lg`; bar chart `left: 80` margin clips on 393px; tab trigger text clips on mobile |
| **CVOutreachGenerator.tsx** | 735 | Analytics "Total Messages" uses `text-4xl`; analytics Recent Activity table has no mobile card fallback; form `md:grid-cols-2` stacks correctly but result grid `md:grid-cols-4` needs `grid-cols-2` base |
| **ContentOutreachManager.tsx** | 579 | Share dialog uses fixed `w-1/3` sidebar layout that breaks on mobile — needs vertical stack below sm; talent table has no mobile card fallback; header "Refresh" button text on mobile |
| **ServiceOutreachManager.tsx** | 439 | Same share dialog `w-1/3` sidebar issue as ContentOutreach; service cards `md:grid-cols-2` OK but "Promote" button text can wrap |
| **BlogManager.tsx** | 657 | Table has no mobile card fallback; pagination text "Previous"/"Next" not hidden on mobile; form dialog uses `max-w-4xl` (fine) but form grid `grid-cols-2` needs `grid-cols-1 sm:grid-cols-2`; header `text-2xl` should be `text-lg` |
| **FeedPostsManager.tsx** | 520 | Table (6 columns) has no mobile card fallback; no pagination; header `text-2xl` too large; form dialog grid `grid-cols-2` needs responsive prefix; no search/filter |
| **CompetitionsManager.tsx** | 641 | Table has no mobile card fallback; pagination text not hidden on mobile; status select `w-[180px]` should be responsive; form dialog grid `grid-cols-2` needs `grid-cols-1 sm:grid-cols-2` |

---

## Fix Details

### 1. MarketingAnalytics.tsx
- **Header**: `text-2xl` to `text-lg`, reduce description size
- **SummaryCard**: Replace `CardContent pt-4` + `text-2xl` with `p-3` + `text-lg` compact pattern
- **Tab triggers**: Hide text on mobile, show icon-only `<span className="hidden sm:inline">Jobs</span>`
- **Bar chart margin**: Reduce `left: 80` to `left: 40` for mobile fit

### 2. CVOutreachGenerator.tsx
- **Analytics "Total Messages"**: `text-4xl` to `text-2xl`
- **Result grid**: Change `md:grid-cols-4` to `grid-cols-2 md:grid-cols-4`
- **Recent Activity table**: Add mobile card fallback

### 3. ContentOutreachManager.tsx
- **Share dialog**: Replace `flex gap-6` with `flex flex-col sm:flex-row` and `w-1/3` with `w-full sm:w-1/3` so channels stack vertically on mobile
- **Talent table**: Add `sm:hidden` mobile card layout (name, phone, status badge, action button)
- **Refresh button**: Icon-only on mobile

### 4. ServiceOutreachManager.tsx
- **Share dialog**: Same vertical-stack fix as ContentOutreach
- **Service cards**: Ensure "Promote" button doesn't wrap — use icon-only on smallest screens

### 5. BlogManager.tsx
- **Header**: `text-2xl` to `text-lg`
- **Table**: Add mobile card fallback (image, title, category badge, status badge, edit/delete)
- **Pagination**: Hide "Previous"/"Next" text on mobile
- **Form grid**: `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`

### 6. FeedPostsManager.tsx
- **Header**: `text-2xl` to `text-lg`; "Create Post" button icon-only on mobile
- **Table**: Add mobile card fallback (content preview, type badge, author, status, pin/edit/delete)
- **Form grid**: `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`

### 7. CompetitionsManager.tsx
- **Table**: Add mobile card fallback (title, category badge, dates, status selector, edit/delete)
- **Pagination**: Hide "Previous"/"Next" text on mobile
- **Status filter**: `w-[180px]` to `w-full sm:w-[180px]`
- **Form grids**: All `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`
- **"Add Competition" button**: Icon-only on mobile

---

## Files to Change

| File | Effort |
|------|--------|
| `MarketingAnalytics.tsx` | Medium (~30 lines) |
| `CVOutreachGenerator.tsx` | Light (~15 lines) |
| `ContentOutreachManager.tsx` | Medium (~50 lines — dialog + mobile cards) |
| `ServiceOutreachManager.tsx` | Light (~15 lines — dialog fix) |
| `BlogManager.tsx` | Medium (~50 lines — mobile cards + form grids) |
| `FeedPostsManager.tsx` | Medium (~50 lines — mobile cards + form grids) |
| `CompetitionsManager.tsx` | Medium (~50 lines — mobile cards + form grids) |

No database changes needed.

