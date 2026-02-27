

# Transactions Page -- Credit Ledger with Monthly Statements

## Overview

Create a new `/app/transactions` page with two tabs: **Transaction History** (scrollable ledger) and **Monthly Statement** (summary view). Follows the bKash-style wireframe with wallet summary at top and detailed transaction list below.

## Layout

```text
Tab 1: Transaction History
+---------------------------------------+
| <-  Transaction History    [Settings] |
+---------------------------------------+
| Wallet Summary Card                   |
| Total: 250 | Earned: 90 | Free: 160  |
+---------------------------------------+
| Statement Request              >      |
+---------------------------------------+
| Transactions from last 90 days        |
+---------------------------------------+
| [icon] Job Application       -25      |
|        Job #xyz              Feb 25   |
|        10:30 AM        [Details >]    |
+---------------------------------------+
| [icon] AI Agent Chat         -10      |
|        Career Coach          Feb 24   |
|        2:15 PM         [Details >]    |
+---------------------------------------+
| [icon] Welcome Bonus         +250     |
|        Sign-up reward        Feb 20   |
|        9:00 AM          [Details >]   |
+---------------------------------------+

Tab 2: Monthly Statement
+---------------------------------------+
| <-  Transaction History    [Settings] |
+---------------------------------------+
| Wallet Summary Card                   |
+---------------------------------------+
| [Month Picker: < February 2026 >]    |
+---------------------------------------+
| Last update: 10:30 AM, Feb 27        |
+---------------------------------------+
| Start Balance    |    End Balance     |
|     500          |       250          |
+---------------------------------------+
| Service-wise Breakdown                |
+---------------------------------------+
| Job Application          -150         |
| AI Agent Chat             -60         |
| Job Share (earned)        +90         |
| Welcome Bonus            +250         |
+---------------------------------------+
| Net Change: +130                      |
+---------------------------------------+
```

## No Database Changes Required

All data comes from the existing `credit_transactions` table which already has: `amount`, `service_type`, `transaction_type`, `balance_after`, `created_at`, `description`, `is_earned`.

## File Changes

### 1. New File: `src/pages/app/Transactions.tsx`

The main page with two tabs:

**Tab 1 -- History:**
- Wallet summary card at top (reuses CreditBalance `full` variant)
- "Statement Request" link (switches to Tab 2)
- Fetches last 90 days of transactions from `credit_transactions` ordered by `created_at desc`
- Each row shows: service icon (mapped from `service_type`), service label, description/source, signed amount (+/-) color-coded (green for positive, red for negative), date, time
- "Details" expand button per row showing: balance after, reference ID, transaction type
- Pagination or infinite scroll (load 20, then "Load more")

**Tab 2 -- Monthly Statement:**
- Month picker (previous/next arrows with month-year label)
- "Last update" timestamp from most recent transaction in that month
- Start Balance (balance_after of last transaction from previous month) and End Balance (balance_after of last transaction in selected month)
- Service-wise breakdown: group transactions by `service_type`, sum amounts per type
- Net change for the month

**Service icon mapping** (reuses existing icon patterns):
- `JOB_APPLICATION` -> Briefcase
- `AI_AGENT_CHAT` -> Bot
- `CAREER_ASSESSMENT` -> ClipboardCheck
- `MOCK_INTERVIEW` -> Mic
- `SALARY_ANALYSIS` -> DollarSign
- `welcome_bonus` / `purchase` -> Gift / CreditCard
- `IELTS_MOCK` -> BookOpen
- Default -> Coins

### 2. Update: `src/lib/routes.ts`

Add the transactions route:
```
transactions: '/app/transactions',
```

### 3. Update: `src/App.tsx`

Add route entry for `/app/transactions` -> `Transactions` page (lazy loaded).

### 4. Update: `src/layouts/TalentAppShell.tsx`

Change the sidebar "Transactions" link from `/app/profile` to `/app/transactions`.

## Technical Notes

- Transaction history query fetches from `credit_transactions` with `talent_id` filter, last 90 days default, ordered by `created_at desc`
- Monthly statement aggregates using JS grouping (no new DB functions needed) -- group by `service_type` and sum `amount`
- Start/End balance calculation: query first and last transaction of the month for `balance_after`
- Color coding: positive amounts in green (`text-emerald-600`), negative in red (`text-destructive`)
- Follows mobile-first compact design with `space-y-2` and `gap-2` patterns per existing standards

