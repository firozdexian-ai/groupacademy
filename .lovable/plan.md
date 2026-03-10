

# Restructure: Move Companies & Contacts to New "Companies" Group + Audit Applications Tab

## Navigation Change

Move "Companies" and "Contacts" out of Recruitment into a new **"Companies & Contacts"** group positioned after Recruitment. Recruitment will contain only: Jobs KPIs, Manage Jobs, Applications.

The `industry` field already exists on the `companies` table as free text. No dedicated industries table or manager exists yet — we will not add one now, but the new group structure makes it easy to add later.

### Changes in AdminSidebar.tsx

**Recruitment group** (trimmed):
- Jobs KPIs
- Manage Jobs
- Applications

**New "Companies & Contacts" group** (after Recruitment):
- Companies
- Contacts

Icon: `Building2`. Roles: `["admin", "talent_exec"]`.

### Changes in Dashboard.tsx

Update `tabAccessMap` comments to reflect the new grouping. No functional change needed — tab values and access roles stay the same.

---

## Next: Applications Manager Audit

The Applications tab (`JobApplicationsManager.tsx`, 908 lines) needs its own mobile/UX audit before implementation. This will be the next development analysis pass covering:
- Table-to-card conversion for mobile
- Filter bar responsiveness
- Dialog sizing
- Any bugs or performance issues

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/AdminSidebar.tsx` | Split Recruitment group — remove Companies & Contacts, create new "Companies & Contacts" group |
| `src/pages/Dashboard.tsx` | Update `tabAccessMap` comments only |

No database changes.

