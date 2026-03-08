

# GroUp Academy — Vision Progress Report

## Current Completion

| Domain | % | Notes |
|---|---|---|
| Academy Content (7 Academies) | 95% | — |
| Career Services (6 services) | 90% | — |
| Jobs Platform | 85% | — |
| AI Layer (29+ edge functions) | 90% | — |
| Gig Marketplace | 75% | — |
| Credits & Monetization | 70% | — |
| Feed & Engagement | 80% | — |
| Admin Dashboard | 92% | — |
| Auth & Onboarding | 85% | — |
| Global Readiness | 85% | — |
| Payments (Stripe) | 15% | Blocked on API key |
| Notifications (email/push) | 80% | Email triggers done |
| Public Discovery / SEO | 85% | Blog + OG + Service pages done |
| PWA Polish | 65% | — |
| Certificates | 85% | PDF + verify + email done |
| Employer Self-Service | 0% | — |
| In-App Messaging | 0% | — |
| Learner Analytics Dashboard | 0% | — |
| i18n / Multi-language | 0% | — |

```text
Overall Platform:          ███████████████████████░░░░░  ~76%
Launch-Ready:              ████████████████████░░░░░░░░  ~67%
Market Leader:             ██████████░░░░░░░░░░░░░░░░░░  ~37%
```

## Course of Action — Priority Order

### Phase A: Launch-Ready (immediate)

| # | Item | Status | Impact |
|---|------|--------|--------|
| 1 | **Stripe Payment** — Provide API key, flip toggle | Blocked on key | Critical |
| 2 | **Stripe Admin Infrastructure** — Settings UI to input keys from dashboard | Ready to build | High |
| 3 | **PWA: Push notifications** — Web push registration + delivery | Not started | Medium |

### Phase B: Trust & Retention

| # | Item | Status |
|---|------|--------|
| 4 | Employer Self-Service Portal | Not started |
| 5 | Learner Analytics Dashboard | Not started |
| 6 | In-App Messaging | Not started |

### Phase C: Growth & Scale

| # | Item |
|---|------|
| 7 | Public Talent Directory |
| 8 | Referral & Affiliate System |
| 9 | Multi-Language (i18n) |
| 10 | Mobile Push Notifications |
| 11 | Employer Dashboard & Analytics |

### Phase D: Dominance

| # | Item |
|---|------|
| 12 | AI Career Coach (persistent) |
| 13 | Enterprise Tier |
| 14 | API & Integrations |
| 15 | Community Features |

## Recommended Next Step

**Item #2 — Stripe Admin Infrastructure** is the highest-impact buildable item right now. The `PaymentSettingsManager` and `usePaymentConfig` hook already exist but the Stripe secret key needs a secure input flow via the admin panel (storing in `platform_settings` + wiring to the checkout edge function). This unblocks Stripe the moment you obtain your API key. Alternatively, **Item #3 — PWA Push Notifications** would close the engagement loop for course completions and job matches.

