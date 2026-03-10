

# Career Abroad (Group 6) — Audit Plan

## Components & Issues Found

| Component | Lines | Issues |
|-----------|-------|--------|
| **StudyAbroadManager.tsx** | 657 | No mobile card fallback for 7-column table; `overflow-x-auto` allows horizontal scroll; form grids use `grid-cols-2` without responsive prefix; "Add Program" button needs icon-only on mobile; country filter `w-[180px]` needs responsive width; pagination text not hidden on mobile; delete uses `confirm()` instead of AlertDialog |
| **IELTSResourcesManager.tsx** | 532 | No mobile card fallback for 7-column table; `overflow-x-auto` allows horizontal scroll; form grid `grid-cols-2` (line 410) needs responsive prefix; "Add Resource" button needs icon-only on mobile; section filter `w-[180px]` needs responsive width; delete uses `confirm()` instead of AlertDialog |
| **StudyAbroadRoadmapLeadsManager.tsx** | 438 | KPI cards use `p-4` + `text-2xl` instead of compact `p-3` + `text-lg`; no mobile card fallback for 7-column table; detail dialog grids use fixed `grid-cols-2`/`grid-cols-3` without responsive prefix; status filter `w-[180px]` needs responsive width; "Export" button needs icon-only on mobile |

---

## Fix Details

### 1. StudyAbroadManager.tsx
- **Table**: Add mobile card fallback showing program name, university, country flag, degree badge, status badges, and action buttons
- **Form grids**: All `grid-cols-2` (lines 479, 531, 549) → `grid-cols-1 sm:grid-cols-2`
- **"Add Program" button**: Icon-only on mobile
- **Country filter**: `w-[180px]` → `w-full sm:w-[180px]`
- **Pagination**: Hide "Previous"/"Next" text on mobile
- **Delete**: Replace `confirm()` with AlertDialog

### 2. IELTSResourcesManager.tsx
- **Table**: Add mobile card fallback showing section icon, title, type badge, difficulty badge, status, and action buttons
- **Form grid**: `grid-cols-2` (line 410) → `grid-cols-1 sm:grid-cols-2`
- **"Add Resource" button**: Icon-only on mobile
- **Section filter**: `w-[180px]` → `w-full sm:w-[180px]`
- **Delete**: Replace `confirm()` with AlertDialog

### 3. StudyAbroadRoadmapLeadsManager.tsx
- **KPI cards**: `p-4` → `p-3`, `text-2xl` → `text-lg`
- **Table**: Add mobile card fallback showing name, email, country badges, intake, degree, status badge, view button
- **Detail dialog grids**: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`, `grid-cols-3` → `grid-cols-2 sm:grid-cols-3`
- **Status filter**: `w-[180px]` → `w-full sm:w-[180px]`
- **"Export" button**: Icon-only on mobile

## Files to Change

| File | Effort |
|------|--------|
| `StudyAbroadManager.tsx` | Medium (~60 lines — mobile cards + form grids + AlertDialog) |
| `IELTSResourcesManager.tsx` | Medium (~50 lines — mobile cards + form grid + AlertDialog) |
| `StudyAbroadRoadmapLeadsManager.tsx` | Medium (~40 lines — KPIs + mobile cards + dialog grids) |

No database changes needed.

