# Investors & High-Value Stakeholders Restructure

Promote the existing flat "Investor Relations" group into a full stakeholder segment (mirroring Talent / Companies / Agents architecture), add a Fundraising FP&A AI agent, and a Relationship/Outreach Executive console.

## Sidebar (collapsible group, placed right after AI Agents)

`Investors & Stakeholders`
1. **IR Overview** — KPI dashboard (existing IR Dashboard wrapped + MRR/ARR target health, funnel by stage)
2. **MRR / ARR Targets** — existing `ir-targets`
3. **VC Firms** — existing `ir-vcs`
4. **Investors** — existing `ir-investors` (individual + institutional)
5. **Key Influencers** — new tab for high-value non-VC stakeholders (advisors, ecosystem leaders, press)
6. **Email Updates** — existing `ir-emails`
7. **Relationship Exec Console** — conversational outreach agent (drafts intros, follow-ups, schedules, logs interactions). Uses `mailto:` for outbound (per email strategy memory) + in-app log.
8. **Fundraising FP&A Agent** — conversational analyst that reads MRR/ARR targets, service mix, runway, and gives fundraising strategy / deck talking points / investor matching suggestions.

## Database

New tables:
- `ir_influencers` (id, name, role, org, country, tier, tags[], contact_json, notes, owner_user_id, created_at)
- `ir_outreach_log` (id, target_type [vc|investor|influencer], target_id, channel [mailto|in_app|note|call|meeting], subject, body, sentiment, status, created_by, created_at)
- `ir_fpa_conversations` (id, session_id, user_id, last_question, last_answer_summary, created_at) — telemetry for the FP&A agent

Reuse existing `ir_interactions` where possible; `ir_outreach_log` is the unified log surfaced in the Relationship Exec console.

## Edge Functions

- `admin-ir-fpa-analyst` — Lovable AI (gemini-2.5-pro for reasoning depth). Tools: `mrr_targets_read`, `service_mix_read`, `credits_revenue_summary`, `investor_pipeline_summary`, `runway_calc`. Returns fundraising strategy, narrative, target investor types.
- `admin-ir-relationship-exec` — Lovable AI (gemini-2.5-flash). Tools: `vc_list`, `investor_list`, `influencer_list`, `draft_outreach_email`, `log_interaction`, `suggest_followups`. Generates `mailto:` links and writes to `ir_outreach_log`.

Both verify JWT in code, admin-only via `has_role(uid,'admin')`.

## UI Components (new)

`src/components/dashboard/investors/`
- `IROverviewTab.tsx` — KPI cards (MRR vs target, ARR, pipeline by stage, outreach activity 7/30d)
- `KeyInfluencersTab.tsx` — CRUD list + tier filter
- `RelationshipExecConsoleTab.tsx` — `AdminAnalystShell` wrapper around `admin-ir-relationship-exec`
- `FpaAgentConsoleTab.tsx` — `AdminAnalystShell` wrapper around `admin-ir-fpa-analyst`

Existing IR pages (Dashboard, Targets, VCs, Investors, Emails) plug into the new group unchanged.

## Sidebar Changes

In `AdminSidebar.tsx`: rename group to **Investors & Stakeholders**, replace items array with the 8 entries above. Move group to sit immediately after AI Agents.

## Notes

- Outreach uses `mailto:` only (sender reputation memory) — no SMTP sends to investors from platform.
- FP&A agent telemetry starts from now, no backfill.
- Influencers are seedable later; v1 ships empty CRUD.
- All RLS: admin-only read/write on new tables; functions use `search_path = public`.

## Open suggestions (not in scope unless you confirm)

- Investor portal (read-only public link with metrics) — mention only, not building.
- Auto weekly update generator from FP&A agent → drafts into `ir-emails` queue.

Approve to implement.
