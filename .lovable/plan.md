## Phase 5.9 — `finance` domain vertical slice

Mixed phase: admin finance ops + the cross-app credits/payments surface (talent-facing wallet UI + hooks consumed by ~25 importers across the talent shell). Two-part scope, single migration.

### Scope

**Admin UI → `src/domains/finance/components/admin/` (+ barrels at `src/components/dashboard/finance/*`)** — 9 files
- `FinOverviewTab`, `InvoicesTab`, `TransactionsTab`, `WithdrawalsTab`
- `PaymentInfraTab`, `PaymentSettingsTab`
- `CompanyCreditsTab`, `Gro10xCreditsTab`, `TalentCreditsTab`

**Admin hook → `src/domains/finance/components/admin/hooks/` (+ barrel at `src/components/dashboard/finance/hooks/useFinOpsGraph.ts`)** — 1 file

**Talent credits UI → `src/domains/finance/components/talent/` (+ barrels at `src/components/credits/*`)** — 6 files
- `CreditBalance`, `CreditGateModal`, `CreditPurchaseSheet`
- `MyInvoicesList`, `ServiceHistoryCard`, `ServiceUsageBadge`

**Talent hooks → `src/domains/finance/hooks/` (+ barrels at `src/hooks/*`)** — 3 files
- `useCredits`, `useCreditPurchase`, `usePaymentConfig`

**Edge contract → `src/edge/contracts/finance.ts`**
- `UpdateStripeSecretRequest`: discriminated union on `action`: `"check"` | `"save-key"` (+ `stripeSecretKey`) | `"save-webhook"` (+ `stripeWebhookSecret`)
- `UpdateStripeSecretResponse`: `{ hasSecretKey?: boolean; hasWebhookSecret?: boolean; saved?: boolean; error?: string }`
- `ProcessWithdrawalRequest`: `{ withdrawal_id: string; action: string; admin_notes: string | null }`
- `ProcessWithdrawalResponse`: `Record<string, unknown>` (permissive — UI reads `data?.error`)
- `CreateCheckoutRequest`/`Response`: permissive `Record<string, unknown>` (talent purchase flow — used in `CreditPurchaseSheet`)

**API manifest → `src/domains/finance/api/manifest.ts`**
- `financeApi.updateStripeSecret(body)`
- `financeApi.processWithdrawal(body)`
- `financeApi.createCheckout(body)`

**Domain index → `src/domains/finance/index.ts`**
- Re-export admin + talent components, hooks, `financeApi`.

**F3 sweep**
- `PaymentSettingsTab`: 3 `supabase.functions.invoke("update-stripe-secret", …)` → `financeApi.updateStripeSecret(…)`.
- `WithdrawalsTab`: 1 `supabase.functions.invoke("process-withdrawal", …)` → `financeApi.processWithdrawal(…)`.
- `CreditPurchaseSheet`: 1 `supabase.functions.invoke("create-checkout", …)` → `financeApi.createCheckout(…)`.

### Importers that keep working via barrels
- `src/pages/Dashboard.tsx` — all admin tabs.
- `src/layouts/TalentAppShell.tsx`, 20+ talent pages, `domains/abroad`, `domains/jobs`, `domains/feed` — all consume `useCredits`/`useCreditPurchase`/`usePaymentConfig` via `@/hooks/*` barrels (no churn).
- `CreditBalance`/`CreditPurchaseSheet`/`CreditGateModal` consumers continue importing from `@/components/credits/*`.

### Verification
- Type-check passes.
- `/dashboard` Finance group tabs (Overview / Invoices / Transactions / Withdrawals / Payment Infra / Payment Settings / Talent Credits / Company Credits / Gro10x Credits) mount.
- Talent wallet: balance badge renders, purchase sheet opens, checkout edge call fires.
- Admin actions: Stripe key check/save and withdrawal approve/reject still work.
- `rg "functions.invoke" src/domains/finance/` → only the 3 wrappers in `api/manifest.ts`.

### Out of scope
- Stripe/Paddle adapter code in edge functions (server-side).
- `useCreditPurchase` internal helpers (kept as-is).
- Notification ledger (Phase 6).
- Phases 6–9.

### Risk
- Medium. 19 files, 3 edge fns, broad cross-shell consumption. The barrels keep all consumers working; risk is concentrated in the F3 swaps (small surgical edits).

### Progress after 5.9
~62%. Next: 5.10 institutions.

### Roadmap remainder
```text
5.10 institutions
5.11 workforce
5.12 ugc
5.13 dashboard residuals (jobs admin, agents admin, etc.)
Phase 6  platform/ extraction (notifications, etc.)
Phase 7  shells/*/routes.tsx + React.lazy
Phase 8  retire barrel re-exports
Phase 9  edge/contracts/ for every domain
```


## Phase 5.9 finance — DONE
- 9 admin tabs + 1 admin hook + 6 talent components + 3 talent hooks migrated to src/domains/finance/
- Edge contracts: update-stripe-secret, process-withdrawal, create-checkout
- F3 swaps: PaymentSettingsTab (3), WithdrawalsTab (1), CreditPurchaseSheet (1)
- All originals replaced with barrels
- Progress ~62
## Phase 5.9 finance - DONE
- 9 admin tabs + 1 admin hook + 6 talent components + 3 talent hooks migrated to src/domains/finance/
- Edge contracts: update-stripe-secret, process-withdrawal, create-checkout
- F3 swaps: PaymentSettingsTab (3), WithdrawalsTab (1), CreditPurchaseSheet (1)
- Progress ~62%. Next: 5.10 institutions.
