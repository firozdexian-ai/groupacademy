
# Global CRM — Re-Audit (Round 4)

Re-checked all 9 `crm-*` tabs after the latest fixes. Almost everything from previous rounds has landed. **One trivial cleanup remains.**

---

## Verified fixed since last audit

| ID | Item | Evidence |
|----|------|----------|
| P2a | `TalentOverviewTab` adopts `get_global_crm_overview` | line 35: `supabase.rpc("get_global_crm_overview")` — replaces ~9 client queries |
| P2b | `CreatorEconomyTab` adopts `get_creator_economy_leaderboard` | line 39: `supabase.rpc("get_creator_economy_leaderboard", { window_days: 30 })` |
| P3 | `TalentPoolTab` outreach badge counts lifetime | line 72 embeds `outreach_count:outreach_messages(count)`, rendered at line 189 — no longer page-bound |
| P4 | `NotificationsTab` talents picker refreshes | lines 63–71: re-fetches `talents` each time the broadcast dialog opens in `single` mode |
| N1/N2 | `TalentUploadTab` Badge import + `gigs-submissions` nav | confirmed in file |

## Red — none
No runtime crashes, no PostgREST column errors, no dead buttons.

## Amber — 1 remaining

**P1. `src/components/dashboard/talent/hooks/useGlobalCRMGraph.ts` is still orphan dead code.**
- `rg useGlobalCRMGraph src/` returns only the file itself (82 lines, never imported).
- Reads from `talent_outreach_log` while the rest of CRM uses `outreach_messages` — keeping it invites future drift.
- **Fix:** delete the file. Drop the `hooks/` directory if it becomes empty.

## Deferred (cosmetic, flagged earlier)
- **A4** — hardcoded color classes (`text-indigo-500`, `bg-fuchsia-500/10`, etc.) across the 9 tabs. Violates the design-token rule but cosmetic only.
- **A5** — Jobs `jobs-talent-crm` ("Talent CRM") collides with sidebar "Global CRM". Suggest renaming Jobs → "Hiring CRM" in a separate UX pass.

## Green — verified OK
- All 9 `crm-*` keys present in both `TAB_COMPONENTS` and `TAB_TITLES`.
- `TalentMessagingChannelTab` (17-line wrapper) and `SupportAITab` are self-contained.
- `ProfessionsTab` Schools + Professions CRUD is complete.
- `TalentOutreachConsoleTab` selects only real `talents` columns.
- No orphans in `src/components/dashboard/talent/` other than P1.

---

## Proposed action

```text
1. Delete src/components/dashboard/talent/hooks/useGlobalCRMGraph.ts        (P1)
   — and remove the empty hooks/ folder if nothing else lives there.
```

That's the only Global-CRM cleanup left. Once you approve, this audit closes out the tab. The two deferred items (A4 design tokens, A5 Jobs rename) are good candidates to bundle into the next tab's pass rather than handle in isolation.
