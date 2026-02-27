

# Add Progress Animation for Job Match & Market Insight

## Problem
When users click "Show Match Details" (10 credits) or "Job & Applicant Insight" (15 credits), they see generic skeleton placeholders with no progress feedback. These AI calls take 10-20 seconds, leaving users uncertain about what's happening.

## Solution
Replace the skeleton loading states in `AIJobInsights` with inline progress animations using the same `ProcessingCard` component pattern -- a spinning percentage circle, a progress bar, and stage-based messages.

## Changes (single file: `src/components/jobs/AIJobInsights.tsx`)

### 1. Import ProcessingCard
Import `ProcessingCard` and `ProcessingStage` from `@/components/ui/processing-card`.

### 2. Define stage messages for each feature

**Match Details stages:**
- 0%: "Analyzing your profile..."
- 25%: "Comparing skills and experience..."
- 55%: "Evaluating education fit..."
- 80%: "Generating recommendations..."

**Market Insight stages:**
- 0%: "Gathering market data..."
- 25%: "Estimating competition level..."
- 55%: "Analyzing salary benchmarks..."
- 80%: "Compiling insights..."

### 3. Replace skeleton loading blocks
Replace the two `animate-pulse` skeleton `<div>` blocks (lines 137-154 for match, lines 258-271 for market) with `ProcessingCard` components configured with:
- Relevant title ("Analyzing Match" / "Analyzing Market")
- Stage arrays defined above
- Duration of ~18 seconds (typical edge function response time for these)
- No outer Card wrapper needed -- just drop the ProcessingCard inline

### 4. Remove Loader2 import
The `Loader2` icon import is no longer needed since we're replacing all loading states.

## Result
Users will see a smooth animated progress bar with contextual messages like "Comparing skills and experience..." while waiting for AI results, matching the same pattern used in the Jobs Hub recommendations flow.

