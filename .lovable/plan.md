

# Company Agents — Rebuild Plan

## Current State
667 lines. Basic CRUD for linking AI agents to companies with sponsorship settings (full/partial/branded), monthly budgets, and credit tracking. Has the same mobile issues as other tabs: 7-column table, non-responsive dialog grids, no AlertDialog for delete, oversized KPI cards.

## Vision: Company Agents as a B2B Revenue Channel

Company agents should serve as **lead generation machines** and **service resale channels** for partner companies. When a user chats with a company-sponsored agent, the agent can:
1. **Collect leads** — capture name, email, phone, interest during conversation
2. **Promote company services** — the agent acts as a branded sales rep
3. **Track ROI** — companies see conversations, leads captured, and budget usage

## What We Will Build

### A. Mobile & UX Fixes (same pattern as Companies/Contacts)
1. **Table to card layout** on mobile — each agent as a compact card with company logo, agent name, sponsorship badge, budget bar, and toggle
2. **Dialog form**: `grid-cols-1 sm:grid-cols-2` for all field pairs
3. **AlertDialog** for delete instead of raw click-to-delete
4. **KPI cards**: compact `p-3` style matching Companies/Contacts tabs
5. **Header buttons**: icon-only on mobile
6. **Pagination**: not needed currently (no server-side pagination) but future-proofed

### B. Lead Collection Configuration
Add a "Lead Capture" section to the create/edit dialog:
- **Enable Lead Capture** toggle — when on, the agent will prompt users for contact info
- **Lead Fields** multi-select — Name, Email, Phone, Company, Interest (checkboxes)
- **Lead Notification Email** — where captured leads get sent (company contact email)

These settings will be stored as JSON in a new `lead_config` column on `company_agents`.

### C. Leads Dashboard Sub-Tab
Add a two-tab layout within the Company Agents manager:
- **Agents** tab (existing agent list, improved)
- **Leads** tab — shows leads captured by company agents, with:
  - Filter by company/agent
  - Lead cards: name, email, phone, agent that captured, timestamp
  - Export to CSV button
  - Lead count in KPI cards

Leads will be stored in a new `company_agent_leads` table.

### D. Service Resale Tracking
Enhance the agent card/row to show:
- **Conversations** count (from `ai_agents.total_conversations`)
- **Leads captured** count
- **Budget utilization** progress bar (already exists, will improve)

## Database Changes

### New column on `company_agents`:
```sql
ALTER TABLE company_agents ADD COLUMN lead_config jsonb DEFAULT '{"enabled": false, "fields": ["name", "email"], "notification_email": null}'::jsonb;
```

### New table `company_agent_leads`:
```sql
CREATE TABLE company_agent_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_agent_id uuid REFERENCES company_agents(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE SET NULL,
  talent_id uuid REFERENCES talents(id) ON DELETE SET NULL,
  lead_name text,
  lead_email text,
  lead_phone text,
  lead_company text,
  lead_interest text,
  session_id uuid REFERENCES agent_sessions(id) ON DELETE SET NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE company_agent_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leads"
ON company_agent_leads FOR ALL TO authenticated
USING (public.has_any_admin_role(auth.uid()));
```

## Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/CompanyAgentsManager.tsx` | Full rebuild: mobile cards, compact KPIs, AlertDialog, two-tab layout (Agents + Leads), lead config in dialog, responsive grids |
| Database migration | Add `lead_config` column + `company_agent_leads` table |

## Implementation Order
1. Database migration (lead_config column + leads table)
2. Rebuild CompanyAgentsManager with all mobile fixes + new tabs

