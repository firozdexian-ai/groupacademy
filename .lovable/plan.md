

# Fix Content Readiness Badge — Distinguish Detailed Descriptions from Placeholders

## Problem
All modules have a short one-line description (~60-90 chars) from creation, so the readiness badge shows 100% for descriptions everywhere. The badge should only count modules with proper AI-generated detailed descriptions (typically 1000+ chars).

**Data evidence:** 2,099 modules have short placeholders (≤200 chars), 672 have detailed AI descriptions (>200 chars).

## Solution
Change the description readiness check from "has any description" to "has a description longer than 200 characters." This cleanly separates placeholder descriptions from AI-generated content.

## Changes

### 1. `src/components/dashboard/ContentList.tsx`
In both places where `modules_with_desc` is computed (lines 110 and 159), change the check from:
```
row.description?.trim()
```
to:
```
row.description?.trim() && row.description.trim().length > 200
```

### 2. `src/components/dashboard/ContentReadinessBadge.tsx`
Rename the label from the FileText icon to show "AI Desc" or similar to make it clearer what's being tracked. The AI sparkle badge logic (`hasAI = descPct === 100`) already works correctly — it will now only show when all modules have detailed descriptions.

No database changes needed. Two files, minimal edits.

