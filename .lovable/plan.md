## A5.4 — Job Detail Refinement (shipped 2026-05-22)

See `.lovable/launch-audit.md` "A5.4" block for the full ship log.

### Summary
- Rewrote `src/pages/app/AppJobDetail.tsx` (830 → ~470 lines): all "HUD LEVEL / Phase Z / Synthetic / Telemetry / Quantum" jargon stripped; semantic section labels; humanized copy for every user-visible string.
- Created `src/domains/jobs/components/JobApplyCTA.tsx`: unified apply CTA used in both `/app/jobs/:id` and public `/jobs/:id`, branching once on `application_type` (`in_app | link | email`), `existingApplication`, `deadlinePassed`, and `authMode`.
- Wired `WhyYouMatchPanel` into `AppJobDetail` (consumes `verified_match` from `score-job-match`); panel header copy humanized.
- Public `PublicJobDetail.tsx`: sticky button replaced with `<JobApplyCTA authMode="public" />`; Job interface extended with `application_type / url / email / ai_assessment_enabled`.
- Scrubbed jargon from `AppJobApplication.tsx` (`SUBMISSION_STAGES` messages, `Initialize Vetting AI Interview`, `HUD LEVEL` comments) and `ExternalApplicationPrep.tsx` (header comment + `VIEW PROTOCOL` comments).

### No DB / RPC / edge-function changes.

### Next
A6 (Gigs Hub parity) or A7 (Profile / Talent Mirror polish) — user to choose.
