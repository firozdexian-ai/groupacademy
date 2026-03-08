

# Fix Batch Description Generator — Rich Content Guides

## Problem
The AI generates short 100-200 char descriptions that never clear the 200-char "pending" threshold, so counts never decrease. Additionally, you want much richer descriptions — multi-bullet content guides like the example you shared (5-7 detailed bullet points, ~800-1500 chars each).

## Solution: Overhaul the Format Entirely

### 1. Edge Function (`batch-generate-descriptions/index.ts`)

**New prompt**: Instead of "200-300 character descriptions," instruct the AI to generate **5-7 bullet-point content guides** per module (matching your example format). Each bullet should be 1-2 sentences covering a specific concept, framework, or skill.

**New threshold**: Change the "pending" filter from `< 200` chars to `< 500` chars — this ensures only modules without rich guides get re-processed.

**Validation gate**: Before saving, reject any description under 500 chars to prevent the infinite loop.

**Reduce batch size**: Since each description is now much larger, process **3 modules per batch** instead of 5 to stay within token limits.

**Upgrade model**: Switch from `gemini-2.5-flash-lite` to `gemini-3-flash-preview` for higher quality output on longer-form content.

### 2. Frontend (`BatchDescriptionGenerator.tsx`)

- Update the pending threshold from `< 200` to `< 500` to match
- Show skipped count in logs when descriptions fail validation
- Add option to "regenerate all" (treat all existing as pending) via a toggle

### 3. ContentReadinessBadge + ContentList

- Update the 200-char threshold references to 500 chars for consistency

### Files to Edit
- `supabase/functions/batch-generate-descriptions/index.ts` — new prompt, threshold, validation, model
- `src/components/dashboard/BatchDescriptionGenerator.tsx` — threshold + UI updates
- `src/components/dashboard/ContentReadinessBadge.tsx` — threshold update

This will generate descriptions matching your ideal format and fix the "numbers not reducing" bug.

