

# Admin Content Management — Filters, Readiness Indicators & AI Status

## Problem
The admin ContentList currently only supports:
- A single content_type filter (passed as prop)
- Text search
- Newest-first ordering

Missing capabilities:
1. **No AI content status** — no way to see which courses have AI-generated module descriptions/talking points
2. **No course readiness/completion indicator** — no way to see at a glance which courses have modules, descriptions, videos, etc.
3. **No filtering by program, level, or readiness** — hard to find courses that need work

## Plan

### 1. Enhance the ContentList query to include readiness data
Modify the `loadContent` function to fetch additional computed fields:
- Join with `course_modules` to get `module_count`, `modules_with_descriptions`, `modules_with_video`
- Include `profession_line_id` and `profession_level_id` in the selected fields

Since Supabase JS client can't do aggregated subqueries easily, we'll use a **database view** (or just fetch module stats separately in a second query grouped by content_id for the current page of results).

**Approach**: After fetching the page of content, run a second query to get module stats for those content IDs. This avoids schema changes and keeps it simple.

### 2. Add filter controls to ContentList
Add a filter bar above the content grid with:
- **Program filter** — dropdown of `profession_categories` (fetched once)
- **Level filter** — dropdown of `profession_levels` (Foundation/Intermediate/Executive)
- **Readiness filter** — dropdown: All, No Modules, Has Modules, Has Descriptions, Has Videos, Complete
- **Sort** — dropdown: Newest, Oldest, Title A-Z, Title Z-A

### 3. Add readiness indicator to each content card
On each card, show a small **readiness meter**:
- A progress bar or badge strip showing: Modules (count), Descriptions (%), Videos (%)
- Color-coded: red (0%), yellow (partial), green (100%)
- A small "AI" badge if all module descriptions are populated (indicating AI-generated talking points exist)

### 4. Update the Content interface
Extend the local `Content` interface with:
```
module_count: number;
modules_with_desc: number;
modules_with_video: number;
profession_line_id: string | null;
profession_level_id: string | null;
```

### Files to modify
- `src/components/dashboard/ContentList.tsx` — main changes (filters, readiness badges, enriched query)

### No database changes needed
All data already exists in `content` and `course_modules` tables. We just need to query it properly.

