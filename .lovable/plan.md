# Closed-Loop WhatsApp Sales & Invoice System

## Goal
Keep every credit sale traceable end-to-end inside the admin panel — even when the actual payment happens off-platform on WhatsApp. Today, when a user clicks "Purchase on WhatsApp" we just open `wa.me` with a prefilled message and nothing is recorded. We will fix that by writing an **invoice request row** the moment the user confirms a bundle, and giving admins a full management UI to approve, disburse credits, attach proof, and close it out.

## Current state (what's already built)
- `CreditPurchaseSheet` shows bundles and either opens WhatsApp (`getCreditPurchaseMessage`) or starts Stripe checkout. WhatsApp path leaves **no DB trace**.
- `talent_credits`, `credit_transactions`, `add_credits()` RPC, `platform_settings` for WhatsApp toggle/Stripe — all exist.
- Admin sidebar has a "Payments" group (currently Stripe gateway config only). No invoice management UI exists.

## What we'll build

### 1. Database — new `credit_invoices` table
```text
credit_invoices
├── id (uuid, pk)
├── invoice_number (text, unique, auto: INV-YYYYMM-NNNN)
├── talent_id (fk → talents)
├── bundle_credits (int)        -- e.g. 500
├── bundle_price_usd (numeric)  -- e.g. 9.00
├── bundle_price_local (numeric)-- BDT equivalent for context
├── currency (text, default 'USD')
├── status (text)               -- 'pending' | 'awaiting_payment' | 'paid' | 'cancelled' | 'refunded'
├── channel (text)              -- 'whatsapp' (extensible)
├── whatsapp_message_sent (bool)
├── payment_method (text, null) -- 'bkash' | 'nagad' | 'bank' | 'card' | 'other'
├── payment_reference (text)    -- TXN id / last-4
├── payment_proof_url (text)    -- file in storage
├── admin_notes (text)
├── credits_disbursed (bool, default false)
├── credit_transaction_id (fk → credit_transactions, null)
├── created_at, updated_at, paid_at, approved_by (uuid → auth.users)
```
- New private storage bucket: **`payment-proofs`** (admins write, talent reads own).
- RLS: talent can `SELECT` own rows + `INSERT` (status forced to `pending`); only admins can `UPDATE`.
- Trigger to auto-generate `invoice_number` and bump `updated_at`.
- New RPC `approve_invoice_and_disburse(invoice_id, payment_method, payment_reference, proof_url, notes)` → admin-only, writes a `credit_transactions` row via existing pattern, flips invoice to `paid`, links the txn id. Atomic.
- New RPC `cancel_invoice(invoice_id, reason)` for admin.

### 2. User flow (CreditPurchaseSheet)
1. User picks bundle → instead of opening WhatsApp directly, we:
   - Call new RPC `create_credit_invoice(bundle_credits, bundle_price_usd)` that inserts a `pending` row and returns `{invoice_id, invoice_number}`.
   - Show a quick confirmation step ("Invoice #INV-202604-0042 created — opening WhatsApp…").
   - Open `wa.me` with a richer prefilled message that **includes the invoice number** so admins can match conversations to invoices instantly.
   - Mark `whatsapp_message_sent = true`.
2. New page **`/app/transactions` → "My Invoices" tab** (or section on existing Transactions page) so users can see status: Pending → Awaiting payment → Paid (with proof). They can also re-open the WhatsApp link from any pending invoice.

### 3. Admin panel — new "Invoices" tab inside Payments group
Component: `src/components/dashboard/payments/InvoiceManager.tsx`, registered in `Dashboard.tsx`, lazy-loaded.

Features:
- **List view** with filters: status, date range, talent search, channel.
- KPI strip: Pending count, Awaiting payment value, Paid this month (USD + credits).
- **Row actions / detail drawer**:
  - View talent profile + WhatsApp deep link (preserves invoice number in message).
  - **Edit** bundle/price (in case user negotiated a custom amount).
  - **Mark "Awaiting payment"** (sent quote on WA).
  - **Approve & Disburse** → modal asks for payment method, reference, optional proof upload (image/pdf to `payment-proofs` bucket), notes. Calls `approve_invoice_and_disburse`. Credits land in talent wallet, transaction row created with `transaction_type='whatsapp_purchase'` and `reference_id = invoice_id`.
  - **Cancel** with reason.
- Audit trail: `approved_by`, `paid_at`, link to `credit_transactions` row.
- CSV export (matches existing Transactions export pattern).

### 4. WhatsApp channel reinforcement (always-push)
- Centralize the message builder in `src/lib/constants/support.ts` so every entry point uses the same template (now including invoice number, talent name, balance).
- Add a "Pay on WhatsApp" button on every pending invoice in the user's invoice list — and a notification (existing `notifications` table) when admin marks it `awaiting_payment` or `paid`.
- Admin invoice drawer always shows a one-click WhatsApp button with status-appropriate prefilled text (e.g. "Hi {name}, we received your payment for INV-… — credits added 🎉").
- Optional: nightly reminder via existing `enqueue_email` for invoices stuck in `pending` > 24h, with a WhatsApp CTA in the email body (uses already-configured native email infra).

### 5. Backwards compatibility
- Existing Stripe path is untouched. When Stripe webhook lands a payment we can also auto-create a `paid` invoice row for unified reporting (small addition to `stripe-webhook` function).

## Technical notes
- All DB changes via migration; use validation triggers (not CHECK constraints) for status transitions per platform memory rules.
- Edge-function-free where possible: invoice creation and approval go through RPCs (security-definer, `search_path=public`) — no new edge functions needed.
- File uploads use signed URLs (consistent with `talent-cvs` security pattern).
- Admin checks via existing `has_any_admin_role(auth.uid())`.
- No payment integration required for v1; Stripe stays optional and the system works fully on WhatsApp + manual disbursement.

## Out of scope (can follow up later)
- Auto-reconciling bKash/Nagad payouts via API.
- Multi-currency invoicing beyond USD/BDT display.
- Customer-facing PDF invoice download (easy add once schema lands).

## Deliverables
1. Migration: `credit_invoices` table, `payment-proofs` bucket + RLS, `create_credit_invoice` / `approve_invoice_and_disburse` / `cancel_invoice` RPCs, invoice-number trigger.
2. Updated `CreditPurchaseSheet.tsx` — invoice-first WhatsApp flow.
3. New user-facing "My Invoices" section in `Transactions.tsx`.
4. New admin `InvoiceManager.tsx` + drawer + approval modal, wired into Dashboard's Payments group.
5. Notification + WhatsApp message helpers updated to carry invoice numbers.
