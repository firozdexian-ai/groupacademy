

# GroUp Academy — Vision Progress Report (Updated)

## What's Been Completed Since Last Check

Since the last assessment, two major items were executed:
- **BDT/Taka → USD cleanup**: ~35 files refactored. Only 2 minor legacy references remain (a deprecated helper in `irConfig.ts` and BDT as a currency option in PaymentSettingsManager — both intentional).
- **Payment Settings Admin Infrastructure**: `platform_settings` table, admin panel, `usePaymentConfig` hook, and dynamic purchase flow all live.

## Current Completion

| Domain | % | Change |
|---|---|---|
| Academy Content (7 Academies) | 95% | — |
| Career Services (6 services) | 90% | — |
| Jobs Platform | 85% | — |
| AI Layer (29 edge functions) | 90% | — |
| Gig Marketplace | 75% | — |
| **Credits & Monetization** | **70%** | **↑10** (payment infra built, awaiting Stripe key) |
| Feed & Engagement | 80% | — |
| Admin Dashboard | 92% | ↑2 (payments tab added) |
| Auth & Onboarding | 85% | — |
| **Global Readiness** | **85%** | **↑15** (USD cleanup complete) |
| Payments (Stripe) | 15% | ↑10 (infra ready, no key yet) |
| Employer Self-Service | 0% | — |
| In-App Messaging | 0% | — |
| Public Discovery / SEO | 15% | — |
| i18n / Multi-language | 0% | — |
| PWA Polish | 40% | — |
| Learner Analytics Dashboard | 0% | — |
| Certificates | 0% | — |
| Notifications (email/push) | 40% | — |

```text
Overall Platform:          ████████████████████░░░░░░░░  ~62%  (was ~60%)
Launch-Ready:              ██████████████░░░░░░░░░░░░░░  ~50%  (was ~45%)
Market Leader:             ████████░░░░░░░░░░░░░░░░░░░░  ~30%
```

## Course of Action — What's Next

### Phase A: Launch-Ready (immediate priority)

| # | Item | Status | Impact |
|---|------|--------|--------|
| 1 | **Stripe Payment** — Provide API key, flip toggle in admin | Blocked on key | Critical |
| 2 | **Email Notifications** — Transactional emails (signup, bid accepted, credits) | Not started | High |
| 3 | **PWA Polish** — Offline fallback, install prompt, push registration | Partial | Medium |
| 4 | **Public Landing Pages** — SEO homepage, service pages, course catalog | Not started | High |

### Phase B: Trust & Retention

| # | Item | Status |
|---|------|--------|
| 5 | Verifiable Certificates (PDF + URL) | Not started |
| 6 | Employer Self-Service Portal | Not started |
| 7 | Learner Analytics Dashboard | Not started |
| 8 | In-App Messaging | Not started |

### Phase C: Growth & Scale

| # | Item |
|---|------|
| 9 | Public Talent Directory |
| 10 | Referral & Affiliate System |
| 11 | Multi-Language (i18n) |
| 12 | Mobile Push Notifications |
| 13 | Employer Dashboard & Analytics |
| 14 | Content Marketplace |

### Phase D: Dominance

| # | Item |
|---|------|
| 15 | AI Career Coach (persistent) |
| 16 | Enterprise Tier |
| 17 | API & Integrations |
| 18 | Community Features |

## Recommended Next Step

**Item #2 — Email Notifications** is the next buildable item (Stripe is blocked on your API key). Transactional emails for signup confirmation, service completions, and credit purchases would significantly improve user trust and retention.

