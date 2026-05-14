## Wire `/admin/inbox` (Mission Control) into the AdminSidebar

### Why a top-level entry, not inside the AI Agents group

The AI Agents group entries call `onTabChange(item.value)` which only flips the `?tab=` query string on `/dashboard`. Mission Control lives at its **own route** `/admin/inbox` (`AdminLiveInbox.tsx`), so it cannot be expressed as a `NavItem` inside `navGroups` without breaking that pattern.

The existing **"AI Co-Pilot"** button (`AdminSidebar.tsx` lines 429–455) already solves exactly this case: it's a top-level `SidebarMenuButton` that calls `navigate("/dashboard/chat")` and uses `location.pathname` for active state. Mission Control is the operational twin of AI Co-Pilot (one is admin-talks-to-agents, the other is admin-takes-over-from-agents) and deserves the same prominence.

### Placement

Add **"Live Inbox"** as a second top-level button rendered immediately under "AI Co-Pilot", inside the same conditional block (before the `navGroups.map(...)` loop). Both stay pinned at the top of the sidebar regardless of which tab is open.

```text
SidebarContent
├── (top-level)  AI Co-Pilot      → /dashboard/chat
├── (top-level)  Live Inbox  ⟵ NEW → /admin/inbox
└── navGroups.map(...)
    ├── Executive Overview
    ├── Global CRM
    └── …
```

### Edit shape — `src/components/dashboard/AdminSidebar.tsx`

1. **Import an icon** at the top with the other `lucide-react` imports — `Inbox` (matches the "Live Inbox" semantics; falls back to `Headphones` if `Inbox` is already imported).
2. **Wrap both top-level buttons in one `SidebarGroup`** so they read as a single "command bar" block. Replace the current single-item group (lines 434–453) with a `SidebarMenu` that contains two `SidebarMenuItem`s:
   - Item 1: existing "AI Co-Pilot" button (unchanged behavior).
   - Item 2: new "Live Inbox" button:
     - `tooltip="Live Agent Inbox"`
     - `onClick={() => navigate("/admin/inbox")}`
     - `isActive={location.pathname.startsWith("/admin/inbox")}`
     - Same `h-12 … rounded-xl` styling as AI Co-Pilot so they look like siblings.
     - Active variant uses the same `bg-primary text-primary-foreground` treatment for consistency.
     - Icon: `<Inbox className="w-4 h-4" />`, label `"Live Inbox"`.
3. **Role gate**: keep the same `(userRole === "admin" || userRole === "super_admin")` guard that wraps AI Co-Pilot — Mission Control is staff-only.
4. **Collapsed state**: `SidebarMenuButton`'s `tooltip` prop already handles the icon-only collapsed sidebar; nothing extra needed.

### What does NOT change

- `navGroups` array — untouched.
- `App.tsx` — `/admin/inbox` route already exists.
- `Dashboard.tsx` `TAB_COMPONENTS` / `TAB_TITLES` — not relevant; Mission Control is its own page, not a tab.
- No new component, no styling tokens, no business logic.

### Verification after build

1. Load `/dashboard` as an admin → "Live Inbox" appears under "AI Co-Pilot" at the top of the sidebar.
2. Click it → URL becomes `/admin/inbox` and the AdminLiveInbox renders. The button shows the active (filled) treatment.
3. Navigate back to any `/dashboard?tab=…` → "Live Inbox" returns to the inactive style; AI Co-Pilot stays inactive too.
4. Collapse the sidebar → both top-level icons remain visible with hover tooltips.
5. Sign in as a non-admin (e.g. `talent_exec`) → "Live Inbox" is hidden (same role gate as AI Co-Pilot).

### Out of scope

- Unread-count badge on the Live Inbox button (would need a `useQuery` against `agent_threads` filtered by `status = 'human'` or `human_takeover_at is not null`). Worth a follow-up plan once the Inbox has real traffic.
- Wiring `/admin/workforce` and `/dashboard/messaging` (the other two orphan routes flagged in the audit) — separate decisions.
