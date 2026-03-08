

# GroUp Academy — Vision Progress & Course of Action

## Platform Completion Assessment

### What's Built (by domain)

| Domain | Features | Status | % |
|---|---|---|---|
| **Academy Content** | 7 Academies (Executive, Freelancing, Entrepreneurship, Influencing + 3 more), immersive course player, quizzes, flashcards, progress tracking, AI instructors | Fully built | 95% |
| **Career Services** | Career Assessment, Mock Interview, Salary Analysis, Portfolio Builder, Study Abroad Roadmap, IELTS Prep | Fully built | 90% |
| **Jobs Platform** | Job board, AI match scoring, job applications, external application prep, job market insights, employer management | Fully built | 85% |
| **AI Layer** | 29 edge functions, AI agents, general chat, career assessment AI, salary AI, mock interview AI, feed recommendations | Fully built | 90% |
| **Gig Marketplace** | Employer gig posting, freelancer bidding, contracts, deliverables, reviews, credit payments | Phase 1-3 done | 75% |
| **Credits & Monetization** | Credit system, welcome bonus, service pricing, purchase flow (WhatsApp) | Built, no real payments | 60% |
| **Feed & Engagement** | Social feed, reactions, polls, career insights, share, WhatsApp float | Built | 80% |
| **Admin Dashboard** | 40+ admin tabs, IR dashboard, MRR targets, outreach, talent pool, lead management | Fully built | 90% |
| **Auth & Onboarding** | Email auth, onboarding wizard, CV upload, profile setup | Built | 85% |
| **Global Readiness** | USD currency alignment, global instructor personas, neutral geography | Just completed | 70% |
| **Payments** | No Stripe or real payment gateway | Not started | 5% |
| **Employer Self-Service** | Employers can't self-register or post gigs | Not started | 0% |
| **In-App Messaging** | No real-time chat between users | Not started | 0% |
| **Public Discovery / SEO** | No public talent directory, limited public pages | Minimal | 15% |
| **i18n / Multi-language** | English only | Not started | 0% |
| **Mobile App (PWA)** | PWA config exists, manifest/icons present | Partial | 40% |
| **Analytics & Dashboards (User)** | No learner analytics dashboard or skill radar | Not started | 0% |
| **Certificates** | No verifiable completion certificates | Not started | 0% |
| **Notifications** | DB-based notifications, no push/email | Partial | 40% |

---

## Overall Platform Completion: ~60%

```text
BUILT (Core Product)           ████████████████████░░░░░░░░  ~70%
GLOBAL LAUNCH READY            ████████████░░░░░░░░░░░░░░░░  ~45%
MARKET LEADER READY            ████████░░░░░░░░░░░░░░░░░░░░  ~30%
```

---

## Course of Action — Prioritized Roadmap

### Phase A: Launch-Ready (Next 2-3 weeks)
The bare minimum to accept real users and real money.

1. **Stripe Payment Integration** — Replace WhatsApp purchase flow with real checkout. Credit bundles purchasable via card. This is the #1 blocker.
2. **Email Notifications** — Transactional emails for signup verification, bid accepted, contract complete, credit received. Currently zero email communication.
3. **PWA Polish** — Offline fallback, install prompt, push notification registration.
4. **Public Landing Page Refresh** — SEO-optimized homepage, service pages, course catalog. Currently the Index page is the only public entry point.

### Phase B: Trust & Retention (Weeks 3-6)
What makes users come back and employers trust the platform.

5. **Verifiable Certificates** — PDF + unique URL certificates for course/track completion. Shareable on LinkedIn.
6. **Employer Self-Service Portal** — Employers register, post gigs, review bids, manage contracts without admin.
7. **Learner Analytics Dashboard** — Skill radar, learning streak, course completion stats, credits earned/spent history.
8. **In-App Messaging** — Real-time chat threads on marketplace contracts (freelancer ↔ employer).

### Phase C: Growth & Scale (Weeks 6-12)
What makes the platform a market leader.

9. **Public Talent Directory** — Searchable, SEO-indexed profiles. Employers find freelancers by skill, rating, academy completion.
10. **Referral & Affiliate System** — Users earn credits for inviting others. Viral growth loop.
11. **Multi-Language (i18n)** — Arabic, Spanish, French, Bengali — target emerging markets.
12. **Mobile Push Notifications** — Firebase Cloud Messaging for job matches, bid updates, course reminders.
13. **Employer Dashboard & Analytics** — Hiring pipeline, applicant tracking, spend analytics.
14. **Content Marketplace** — Users sell their own courses/templates. Platform takes commission in credits.

### Phase D: Dominance (Months 3-6)
15. **AI Career Coach** — Persistent AI that knows your profile, learning history, and job goals. Proactive suggestions.
16. **Enterprise Tier** — Organizations buy bulk seats for academy access + hiring pipeline.
17. **API & Integrations** — LinkedIn import, job board syndication, ATS integrations.
18. **Community Features** — Forums, study groups, peer mentoring, leaderboards.

---

## Recommended Immediate Next Step

**Stripe Payment Integration** — it's the single highest-impact item. Without real payments, nothing else matters for launch. Shall I build it?

