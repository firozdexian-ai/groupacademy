
# Gro10x MVP — align with Talent app (profile, credits, activities, feed, agents)

Goal: stop building Gro10x as a separate app. Reuse the talent profile, the same `$0.02/credit` standard, the talent feed widgets, and the same agent-marketplace pattern — but repurposed for the **contact** persona inside a company workspace.

## 1. Bottom nav: 4 tabs (drop Me, drop Notifications)

```text
[ Inbox ]  [ Activities ]  [ Feed ]  [ Company ]
```

- Profile moves to a tap target on the **TopBar avatar** (top-right), opening `/gro10x/me`.
- Notifications becomes a **Concierge agent** chat thread auto-pinned in Inbox (no separate tab, no bell). Rename the topbar bell into a pill that opens `c/concierge`.
- TopBar layout: `[credits pill] · [+ new chat] · [avatar → /gro10x/me]`.

## 2. Profile (`/gro10x/me`) = Talent profile, same component

Replace the current minimal Me page with the **same `Profile` component** used at `/app/profile` (`src/pages/app/Profile.tsx`), since every contact is also a talent. Add a thin Gro10x header strip on top:

- "Workspace: {company.name} · {role}"
- Button: **Switch to Talent app** → `/app/profile` (cross-app jump).
- Reuses `useTalent()`, `ProfileCompletionMeter`, `ProfileSectionEditor` — zero new editing logic.

New file: `src/gro10x/pages/Gro10xMe.tsx` becomes a thin wrapper that renders `<Profile />` inside the Gro10x shell with the workspace strip.

## 3. Credit economy — one standard across all platforms

**Single source of truth**: `1 credit = $0.02 USD = ৳2.2` (already in `CREDIT_CONFIG`). No new pricing tables.

Three credit pools, all priced the same:

| Pool | Table | Withdrawable? | Notes |
|---|---|---|---|
| Talent personal | `talent_credits.balance` (free) + `earned_balance` | Earned only | Already exists |
| Contact bonus | **same `talent_credits` row** + new column `contact_bonus_balance numeric(12,1)` | No (future product) | One-time **+250** when user becomes a contact (joins `company_members`) |
| Company pool | `company_credits.balance` | No | Sponsored agents that talk to B2C talents |

Decision: **no separate "contact_credits" table.** It lives on `talent_credits` because the contact *is* the talent. The contact bonus is a separate column so it can be tracked & expired independently.

### Spend resolution order (for a contact taking an agent action)

1. `contact_bonus_balance` (Gro10x-issued bonus)
2. Personal `balance` (free/topped-up)
3. Personal `earned_balance` (last — protects withdrawability)
4. If the agent is **company-sponsored**, charge `company_credits.balance` instead and skip personal entirely.

### Company-admin "buy for teammate"

On `/gro10x/billing`, the POC/owner sees a **"Top up a teammate"** action that creates a Stripe checkout crediting the chosen member's `talent_credits.balance` (uses `create-checkout` with a `target_user_id` param).

### DB changes (one migration)
- `alter table talent_credits add column contact_bonus_balance numeric(12,1) not null default 0;`
- `alter table talent_credit_transactions add column source text;` (values: `personal_free`, `personal_earned`, `contact_bonus`, `company_pool`)
- Trigger `award_contact_bonus()` on `company_members` insert (status=active) → +250 to `contact_bonus_balance` once per `(user_id, company_id)`. Idempotency via a `contact_bonus_grants` table (user_id, company_id unique).
- Update `useCompanyCredits` & a new `useContactCredits` hook so the topbar pill can show **either** the company pool (for owner/admin) **or** the talent's personal+bonus (for regular contacts).

### TopBar pill logic

- Owner/Admin: show `company_credits.balance` → links to `/gro10x/billing`.
- Member: show `talent.balance + contact_bonus_balance` → links to `/app/credits` in the talent app (single billing surface).

## 4. Activities (rename **Work** → **Activities**)

Same route `/gro10x/work` keeps working (alias), but UI label = "Activities" and three sub-tabs:

```text
[ Hiring ]  [ Talents ]  [ CRM ]
```

- **Hiring** = current `Gro10xJobsList` (unchanged) — each job row has the existing "Applicants" button → `work/jobs/:jobId/applicants`.
- **Talents** = NEW. Aggregate of every talent who has ever interacted with the company:
  - Job applicants (any status) from `job_applications`
  - Gig workers from `gig_*` tables filtered by `company_id`
  - Manually shortlisted from existing `Gro10xShortlist`
  - Card uses the same compact talent-card pattern from `/app/jobs/.../applicants` — name, profession, last interaction, action menu (Message · Add to shortlist · View profile).
- **CRM** = existing `Gro10xCRM` (was a separate route, now folded in as a tab; old `/gro10x/crm` route stays for deep links).

File changes:
- `src/gro10x/pages/Gro10xWork.tsx` → rename header to "Activities", add `talents` and `crm` tabs to the existing `Tab` union.
- New: `src/gro10x/pages/work/Gro10xTalents.tsx` (queries `job_applications` + `gig_assignments` joined to `talents`).
- New: `src/gro10x/components/Gro10xTalentRow.tsx` reused across Hiring & Talents tabs.

## 5. Feed — internal/external toggle + company-POC-only company posts

Top of `/gro10x/feed`:

```text
[  Network  |  Internal  ]    ← segmented toggle
```

- **Network** (default): same query as today — public `feed_posts` from across the platform.
- **Internal**: `feed_posts` filtered by `audience='internal'` and `author_company_id = my company` (RLS already restricts via membership).

Authoring rules:
- Composer always posts as the **user** by default.
- If the user is `owner` (the POC), an extra toggle **"Post as {company name}"** appears → sets `author_type='company'`. Other roles (admin/member) can never post as the company. (Current code allowed admin too — tighten to owner only.)
- Reuse the talent app's **ComposePost** widgets to bring **polls, image upload, hashtags** into Gro10x. Concretely: replace the inline `<textarea>` in `Gro10xFeed.tsx` with `<ComposePost mode="gro10x" companyId={...} canPostAsCompany={isOwner} />` — adds a `mode` prop to `src/components/feed/ComposePost.tsx` so dark theme + Gro10x submit handler work.

DB:
- `alter table feed_posts add column audience text not null default 'network' check (audience in ('network','internal'));`
- RLS: internal posts visible only to active members of `author_company_id`.
- Drafts/approval flow stays as-is.

## 6. Company tab — directory + LinkedIn-style page

Keep `/gro10x/page` but expand it. Add sections (in this order):

1. **Banner + header card** (existing) — edit limited to **owner only** (not admin).
2. **About** (existing).
3. **Team directory** — full list (not capped at 9), grid → tap a member → opens their `/app/profile/:userId` (read-only public talent profile).
4. **Open roles** (existing) — already there, keep.
5. **NEW: Services we offer** — pulls from `services` (or `marketplace_services`) where `company_id = …`. Owner can add/edit.
6. **NEW: Recent posts** — last 3 company-authored `feed_posts` for this company.
7. **Public link**: `/c/{slug}` (already shown).

Edit gating:
- **Only owner** can edit company info, post as company, and manage Services. Admins can manage hiring/CRM but not the public face.
- Members get read-only company tab.

## 7. Inbox + Agent Network

- Rename `/gro10x/agents` UI label from "Agent Marketplace" → **"Agent Network"**, same route.
- Inbox `+` button: tooltip + label "Browse Agent Network" so it's discoverable.
- Bring agents to **the same standard** as the talent agent marketplace (`src/pages/app/AgentMarketplace.tsx`):
  - Each Gro10x agent gets a **profile page** `/gro10x/agents/:agentKey` with description, **connection fee** (one-time pin cost), per-message cost, sample prompts, ratings — mirrors `AgentProfile`.
  - Charge logic: pinning an agent debits a connection fee from the appropriate pool (same resolution order as §3); per-message cost continues to debit on each chat reply. Pricing is stored in `ai_agents.message_credit_cost` + new `ai_agents.connection_credit_cost` (already present per types? — verify in migration).
- Rename **Concierge** in copy: "**Atlas** — your Gro10x concierge" (mirrors how Talent app has "Aisha"/AI General as system controller). One key change in `GRO10X_AGENTS`.

## 8. File-level work summary

```text
NEW
  src/gro10x/pages/work/Gro10xTalents.tsx
  src/gro10x/components/Gro10xTalentRow.tsx
  src/gro10x/pages/Gro10xAgentProfile.tsx
  src/gro10x/hooks/useContactCredits.ts
  supabase/migrations/<ts>_credit_unification_and_feed_audience.sql

EDIT
  src/gro10x/components/Gro10xBottomNav.tsx        — drop Me; rename Work→Activities
  src/gro10x/components/Gro10xTopBar.tsx           — add avatar → /gro10x/me; remove bell, replace with concierge shortcut; member vs owner pill
  src/gro10x/pages/Gro10xMe.tsx                    — wrap <Profile/> from talent app + workspace strip
  src/gro10x/pages/Gro10xWork.tsx                  — header "Activities", add tabs talents+crm
  src/gro10x/pages/Gro10xFeed.tsx                  — Network/Internal toggle, use ComposePost, owner-only "Post as company"
  src/gro10x/pages/Gro10xCompanyPage.tsx           — owner-only edit; add Services + Recent posts; full team list
  src/gro10x/pages/Gro10xAgentMarketplace.tsx      — rename to "Agent Network", connection-fee UI, link to profile pages
  src/gro10x/Gro10xRoutes.tsx                      — add /agents/:agentKey, drop /notifications from nav (route can stay as concierge alias)
  src/gro10x/lib/agents.ts                         — rename concierge → "Atlas"
  src/components/feed/ComposePost.tsx              — add mode='gro10x' prop (dark variant + companyId target)

DROP
  bottom-nav entries for Me & Notifications
```

## 9. Migration sketch (reference only)

```sql
-- contact bonus pool, lives on talent_credits
alter table talent_credits add column contact_bonus_balance numeric(12,1) not null default 0;
alter table talent_credit_transactions add column source text;

create table contact_bonus_grants (
  user_id uuid not null,
  company_id uuid not null references companies(id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

-- award +250 once when a member becomes active in a company
create or replace function award_contact_bonus() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' and new.user_id is not null then
    insert into contact_bonus_grants(user_id, company_id)
    values (new.user_id, new.company_id)
    on conflict do nothing;
    if found then
      update talent_credits set contact_bonus_balance = contact_bonus_balance + 250
        where talent_id = (select id from talents where user_id = new.user_id);
    end if;
  end if;
  return new;
end $$;
create trigger trg_award_contact_bonus after insert or update on company_members
for each row execute function award_contact_bonus();

-- internal feed audience
alter table feed_posts add column audience text not null default 'network'
  check (audience in ('network','internal'));
-- RLS: internal posts → only members of author_company_id can SELECT.
```

## 10. Out of scope for this pass

- Withdrawals from contact_bonus / company pool (future product).
- Office-Admin / industry-specific agents (will be added later per your "agents come last" direction).
- Cross-app SSO niceties beyond a button — same Supabase user already works on both apps.

---

After approval I'll execute this in two PRs: **(a)** credit unification migration + topbar/profile refactor; **(b)** Activities/Feed/Company/Agent-Network UI changes.
