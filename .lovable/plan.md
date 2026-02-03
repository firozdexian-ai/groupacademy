

# IR Dashboard Enhancement Plan

## Issues Identified

### 1. Credit Usage Not Displaying Correctly
The dashboard only queries `transaction_type = 'service_usage'` but historical data also uses `transaction_type = 'usage'`. This inconsistency means the dashboard shows incomplete data.

**Current query (missing data):**
```typescript
.eq("transaction_type", "service_usage")
```

**Actual data in DB:**
| transaction_type | service_type | credits |
|------------------|--------------|---------|
| service_usage | JOB_APPLICATION | 1,650 |
| usage | JOB_APPLICATION | 925 |
| service_usage | SUGGESTED_JOBS | 340 |
| usage | SUGGESTED_JOBS | 230 |

### 2. No Monthly Snapshots Being Saved
The `ir_metrics_snapshots` table exists but is empty. There's no mechanism to save end-of-month data.

### 3. Missing Key Metrics
- **Total Talents**: 269 registered (not shown)
- **Monthly Active Talents**: Users who used at least 1 credit (not tracked)
- **MoM Growth**: Cannot calculate without historical snapshots

### 4. No Historical Target vs Actual Tracking
When a month ends, we lose the ability to compare targets vs actual results.

---

## Proposed Solution

### Schema Enhancement

Add `actual_mrr_usd` and `actual_credits_consumed` columns to `ir_monthly_targets` to store final results when month closes:

```sql
ALTER TABLE ir_monthly_targets ADD COLUMN IF NOT EXISTS actual_mrr_usd DECIMAL(12,2);
ALTER TABLE ir_monthly_targets ADD COLUMN IF NOT EXISTS actual_credits_consumed INTEGER;
ALTER TABLE ir_monthly_targets ADD COLUMN IF NOT EXISTS total_talents INTEGER;
ALTER TABLE ir_monthly_targets ADD COLUMN IF NOT EXISTS active_talents INTEGER;
ALTER TABLE ir_monthly_targets ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false;
ALTER TABLE ir_monthly_targets ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
```

### Dashboard Enhancements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INVESTOR RELATIONS DASHBOARD                              [Set Targets]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ MRR Target  │ │ Current MRR │ │ Total       │ │ Monthly     │           │
│  │ $2,000      │ │ $45         │ │ Talents     │ │ Active      │           │
│  │ 64% to goal │ │ 2,225 cr    │ │ 269         │ │ 12 talents  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Credits     │ │ Active VCs  │ │ Investors   │ │ MoM Growth  │           │
│  │ Used        │ │ 12          │ │ 28          │ │ +15%        │           │
│  │ 2,225       │ │             │ │             │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  SERVICE-WISE BREAKDOWN (Actual vs Target)                          │  │
│  │                                                                      │  │
│  │  AI Agent Chat    70 / 3,000 cr   ██░░░░░░░░░░░░░  2.3%             │  │
│  │  Job Application  2,575 / 15,000  ██████████░░░░░  17.2%            │  │
│  │  Job Match Score  50 / 1,500 cr   █░░░░░░░░░░░░░░  3.3%             │  │
│  │  Salary Analysis  100 / 800 cr    ████░░░░░░░░░░░  12.5%            │  │
│  │  ...                                                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  HISTORICAL PERFORMANCE (Last 6 Months)                             │  │
│  │                                                                      │  │
│  │  Month      Target   Actual   Achievement   Growth                  │  │
│  │  Jan 2026   $2,000   $1,200   60%           -                       │  │
│  │  Feb 2026   $2,500   -        In Progress   -                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [📊 Close Month & Save Snapshot]                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Fix Credit Query (Both transaction types)
Update dashboard to include both `service_usage` and `usage` transaction types:

```typescript
const { data, error } = await supabase
  .from("credit_transactions")
  .select("amount, service_type, talent_id")
  .in("transaction_type", ["service_usage", "usage"])
  .gte("created_at", startOfMonth.toISOString());
```

### 2. Add Talent Metrics Queries
```typescript
// Total talents
const { count: totalTalents } = await supabase
  .from("talents")
  .select("*", { count: "exact", head: true });

// Monthly active talents (distinct users who used credits this month)
const { data: activeData } = await supabase
  .from("credit_transactions")
  .select("talent_id")
  .in("transaction_type", ["service_usage", "usage"])
  .gte("created_at", startOfMonth.toISOString());

const monthlyActiveTalents = new Set(activeData?.map(d => d.talent_id)).size;
```

### 3. Close Month Function
Add a "Close Month" button that:
1. Saves current metrics to `ir_monthly_targets` (actual_mrr_usd, actual_credits_consumed, etc.)
2. Creates a snapshot in `ir_metrics_snapshots`
3. Marks the month as closed (is_closed = true)

### 4. Historical Performance Table
Show past months with target vs actual comparison:
- Fetches all `ir_monthly_targets` with `is_closed = true`
- Calculates achievement percentage
- Shows MoM growth

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add new columns to ir_monthly_targets |
| `src/components/dashboard/ir/IRDashboard.tsx` | Fix credit query, add talent metrics, add historical table |
| `src/components/dashboard/ir/MRRTargetManager.tsx` | Add "Close Month" functionality |
| `src/lib/irConfig.ts` | Add helper for calculating MoM growth |

---

## Technical Implementation

### Database Migration
```sql
-- Add actuals tracking to monthly targets
ALTER TABLE ir_monthly_targets 
ADD COLUMN IF NOT EXISTS actual_mrr_usd DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS actual_credits_consumed INTEGER,
ADD COLUMN IF NOT EXISTS total_talents INTEGER,
ADD COLUMN IF NOT EXISTS active_talents INTEGER,
ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS service_actuals JSONB;
```

### New Dashboard Cards
1. **Total Talents** - Count from talents table
2. **Monthly Active Talents** - Distinct talent_ids from credit_transactions this month
3. **MoM Growth** - Compare current vs last month's closed data

### Service Breakdown Enhancement
Show actual usage vs target for each service:
- Pull actual from credit_transactions (both transaction types)
- Compare against service_mix targets
- Show progress bar and percentage

### Historical Table Component
New section showing past months:
```typescript
interface MonthlyResult {
  month: string;
  mrrTarget: number;
  actualMrr: number;
  achievement: number; // percentage
  growth: number; // vs previous month
}
```

---

## Summary

This enhancement will:

1. **Fix data accuracy** - Query both transaction types for complete picture
2. **Add user metrics** - Total Talents & Monthly Active Talents
3. **Enable historical tracking** - Close months and save actuals
4. **Show growth trends** - MoM comparison with previous periods
5. **Service-level insights** - Actual vs target breakdown per service

