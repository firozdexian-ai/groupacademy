## Companies Tab — Re-audit (Phase Z1)

### Scope
7 sub-tabs under the admin Companies group:
`companies-overview` · `companies` (CRM) · `companies-unlocks` · `companies-agents` · `industries` · `contacts` · `companies-wa-channel`

---

### Verdict per file

| File | Lines | Status | Notes |
|---|---|---|---|
| `CompaniesOverviewTab.tsx` | 237 | ✅ Lock-ready | Single-RPC (`get_companies_overview`), all icons imported, `unknown` cast applied. |
| `CompaniesTab.tsx` (CRM) | 574 | ✅ Lock-ready | Search/industry filters wired, RPC KPIs, full edit dialog, outreach Select w/ template, delete AlertDialog, pagination correct. |
| `IndustriesTab.tsx` | 413 | ✅ Lock-ready | `get_industry_rollup` + `merge_industries` RPCs, rename + unassigned KPI restored. |
| `ContactUnlocksTab.tsx` | 223 | ✅ Lock-ready | `get_contact_unlocks_summary` RPC, `Button` imported, stats cast applied. |
| `CompanyAgentsTab.tsx` | 927 | ✅ Lock-ready | Already react-query + bounded queries (verified prior audit, untouched since). |
| `EmployerMessagingChannelTab.tsx` | 17 | 🟡 1-line cleanup | Title still hard-codes `01708459008` (S3 from prior audit). |
| `talent/ContactsTab.tsx` (mounted as `contacts`) | — | 🟡 Misplaced | Owned by Companies group but lives in `talent/`. Cosmetic only — works as-is. |

No 🔴 runtime crashes remain. No regressions vs the pre-Z0 feature set.

---

### Two cleanup items before lock

**C1 — Strip hard-coded phone from Employer WA tab title**
```tsx
// EmployerMessagingChannelTab.tsx line 10
title="Employer WhatsApp Line"
```

**C2 — Move `ContactsTab.tsx` into the companies folder**
- `git mv src/components/dashboard/talent/ContactsTab.tsx src/components/dashboard/companies/ContactsTab.tsx`
- Update lazy import in `src/pages/Dashboard.tsx:66` to `@/components/dashboard/companies/ContactsTab`.
- No behavior change; pure re-org so the file lives with its group owner.

---

### After C1 + C2 → "Lock" the tab

Locking means:
1. Mark all 7 sub-tabs as audited & frozen at this revision in `mem://admin/companies-stakeholder-structure`.
2. Add a Phase Z1 entry: *Companies group hardened (RPC-backed KPIs, restored CRM depth, no scan storms, no 🔴 crashes).*
3. Future edits to these files require a fresh audit pass before merging.

This is documentation-only — no runtime gating. If you want a stronger lock (e.g. eslint rule or a CODEOWNERS entry), say the word and I'll add it.

---

### Out of scope (deferred, not blockers)
- **S2:** `CompaniesTab.tsx` is 574 lines with 4 responsibilities (registry, edit dialog, outreach, batch upload). Splitting into 4 files is a refactor, not a fix — defer unless you want it now.

---

### Proposed execution
One small batch:
1. Edit `EmployerMessagingChannelTab.tsx` title (C1)
2. Move `ContactsTab.tsx` + update Dashboard import (C2)
3. Update memory `mem://admin/companies-stakeholder-structure` with Phase Z1 lock note

Approve and I'll ship all three in one pass.