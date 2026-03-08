

# GroUp Academy — Vision Progress Report

## Completed Since Last Check

- **Public Blog System**: `/blog` index with search, category filters, JSON-LD Blog schema; `/blog/:slug` posts with Article JSON-LD and dynamic OG meta tags.
- **Course OpenGraph**: Dynamic `og:title`, `og:image`, `twitter:card` meta tags on `/courses/:slug` pages with Course JSON-LD structured data.
- **Public Courses SEO**: `/courses` listing with JSON-LD ItemList schema.

## Current Completion

| Domain | % | Change |
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
| Notifications (email/push) | 78% | — |
| **Public Discovery / SEO** | **80%** | **↑25** (blog + OG + course pages) |
| PWA Polish | 65% | — |
| Certificates | 80% | — |
| Employer Self-Service | 0% | — |
| In-App Messaging | 0% | — |
| Learner Analytics Dashboard | 0% | — |
| i18n / Multi-language | 0% | — |

```text
Overall Platform:          ███████████████████████░░░░░  ~75%  (was ~73%)
Launch-Ready:              ███████████████████░░░░░░░░░  ~66%  (was ~63%)
Market Leader:             ██████████░░░░░░░░░░░░░░░░░░  ~37%
```

## Course of Action — Priority Order

### Phase A: Launch-Ready (immediate)

| # | Item | Status | Impact |
|---|------|--------|--------|
| 1 | **Stripe Payment** — Provide API key, flip toggle | Blocked on key | Critical |
| 2 | **PWA: Push notifications** — Web push registration + delivery | Not started | Medium |
| 3 | **Public SEO: Service landing OG tags** — OpenGraph meta for `/service/:slug` pages | Not started | Low |

### Phase B: Trust & Retention

| # | Item | Status |
|---|------|--------|
| 4 | Certificates: Email notification on issuance | Not started |
| 5 | Employer Self-Service Portal | Not started |
| 6 | Learner Analytics Dashboard | Not started |
| 7 | In-App Messaging | Not started |

### Phase C: Growth & Scale

| # | Item |
|---|------|
| 8 | Public Talent Directory |
| 9 | Referral & Affiliate System |
| 10 | Multi-Language (i18n) |
| 11 | Mobile Push Notifications |
| 12 | Employer Dashboard & Analytics |

### Phase D: Dominance

| # | Item |
|---|------|
| 13 | AI Career Coach (persistent) |
| 14 | Enterprise Tier |
| 15 | API & Integrations |
| 16 | Community Features |

## Recommended Next Step

**Item #2 — PWA Push Notifications** is the next high-impact buildable item. Adding web push registration and delivery would close the engagement loop — users get notified about new courses, job matches, and certificate completions even when not on the platform. This pairs well with the existing email notification system. Alternatively, **Item #6 — Learner Analytics Dashboard** would give students visibility into their progress across courses, assessments, and certificates. Stripe remains blocked on your API key.

