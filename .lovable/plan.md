# Audit of recent builds + proposed next steps

## What we shipped (last 5 batches)

1. **Companies stakeholder group** — moved to position 3 in sidebar; 8-tab area.
2. **AI Agents group (Agent OS)** — 13 tabs: Overview, Channels & Types, Tools/Skills/Connectors, Studio, B2C, Platform, B2B, UGC, Marketplace, Payouts, Manager, Sessions, Insights. New `admin-agent-manager` edge function + tables.
3. **Investors & Stakeholders group** — 9 tabs incl. IR Overview KPIs, Influencer CRM, FP&A Agent (`admin-ir-fpa-analyst`), Relationship Exec (`admin-ir-relationship-exec`). Tables: `ir_influencers`, `ir_outreach_log`, `ir_fpa_conversations`.
4. **Agentic Dashboard `/dashboard/chat`** — WhatsApp-style messenger. Tables `admin_chat_threads`, `admin_chat_messages`. Agent registry in `src/lib/adminAgents.ts`. 10 agents wired in.
5. **File attachments in chat** — paperclip composer, private `admin-chat-attachments` bucket with admin-only RLS, inline image previews, signed URLs passed to agents.

## Bugs / issues found in the audit

### Critical — two chat agents are broken
`src/lib/adminAgents.ts` points two agents at edge functions that don't exist:

| Agent in registry | `functionName` referenced | Actual deployed function |
|---|---|---|
| Aisha (Talent) | `ai-talent-analyst` | `admin-aisha-analyst` |
| AI General (Talent) | `ai-general-analyst` | `admin-ai-general-analyst` |

Sending a message to either agent in `/dashboard/chat` will fail with a function-not-found error.

### High — old Console tabs not deprecated
The original plan promised redirects from the old `*ConsoleTab.tsx` shells to `/dashboard/chat?agent=<key>`. They are still mounted as full duplicates in `src/pages/Dashboard.tsx` (Aisha, AI General, Talent Outreach, Riya, Company Outreach, Agent Manager, FP&A, Relationship Exec). This means there are two places to chat with each agent, and edits drift.

### High — attachments aren't actually used by any agent
Frontend uploads files and signs URLs, but no edge function reads `body.attachments` or fetches the file. They are appended as plain-text bullets in the prompt, so:
- Images are not sent as vision content parts (Gemini/GPT-5 won't "see" them).
- PDFs / docs aren't parsed — the model only sees a filename and a URL it can't fetch.

### Medium — agent registry is missing the Report Builder
`admin-report-builder` exists as a deployed function and has its own tab, but isn't surfaced in the chat rail.

### Medium — chat UX gaps
- `useAdminChatThread` doesn't subscribe to realtime, so a second device/tab won't see new messages.
- `AgentRail` shows a `last_message_at` timestamp but no unread indicator.
- Mobile rail/thread switch uses `window.innerWidth` evaluated once at render — doesn't react to rotation/resize.
- "Clear conversation" deletes messages but leaves any uploaded files orphaned in storage.

### Low — polish
- Sending only an attachment with empty text still falls through some early-returns in older builds; verify after agent fix.
- No global error toast for `supabase.functions.invoke` failures (errors land inside the bubble as italics, easy to miss).
- No "copy message" / "regenerate" actions on assistant bubbles.

## Proposed next batch (this plan)

### Phase 1 — Fix the bugs (must-do)

1. **Repoint the two broken agents** in `src/lib/adminAgents.ts`:
   - `talent-aisha` → `admin-aisha-analyst`
   - `talent-ai-general` → `admin-ai-general-analyst`
2. **Add Report Builder** to the registry (`admin-report-builder`) with the BarChart icon and report-oriented suggestions.
3. **Soft-deprecate old Console tabs** — replace each of the 8 `*ConsoleTab.tsx` files with a thin redirect component that `navigate("/dashboard/chat?agent=<key>", { replace: true })` and shows a one-line "Moved to Agentic Dashboard" notice. Keep the sidebar entries so deep links work; we remove them in a later cleanup pass.
4. **Orphan-file cleanup on Clear** — when clearing a thread, also list and delete objects under `<uid>/<thread>/` in the bucket.

### Phase 2 — Make attachments actually useful

Update the `_shared` agent helper (and the 10 functions that use it) to:
- Read `body.attachments: [{ name, path, mime, size }]`.
- For images (`mime` starts with `image/`): generate a fresh signed URL server-side and inject as a `content: [{ type: "image_url", image_url: { url } }]` part for vision-capable models (Gemini 2.5, GPT-5).
- For PDFs / docs / text: download via the service-role client, run a lightweight extractor (PDF text via `pdfjs-dist` ESM, plain text directly), truncate to a token-safe length, and inject as a system note `[Attached file: name]\n<text>`.
- Cap total injected attachment payload (e.g. 200 KB of text + max 4 images) to protect cost.

### Phase 3 — Chat UX polish

1. Subscribe `admin_chat_messages` via Supabase Realtime in `useAdminChatThread`, scoped to `thread_id`.
2. Add an `unread_count` (or `last_read_at` on `admin_chat_threads`) and surface a dot in `AgentRail`.
3. Replace one-shot `window.innerWidth` with `useMediaQuery("(min-width: 768px)")`.
4. Toast on invoke errors via `sonner` in addition to inline bubble.
5. Add per-message actions: copy, regenerate (re-runs from previous user turn).

### Phase 4 — Cross-agent handoff (foundation only)

Add an optional `handoff_to` column on `admin_chat_messages` and a helper in the shared agent module so agents can suggest "Hand this off to Relationship Exec" and the UI offers a one-click switch carrying context. No agent prompts wired yet — just the schema + UI affordance, so we can iterate without another migration.

## Technical notes

- All migrations in Phase 2/3 stay in the `public` schema and follow our `search_path = public` rule. No changes to `auth`, `storage` schemas.
- New shared helper: `supabase/functions/_shared/attachments.ts` exporting `loadAttachmentsForPrompt(supabase, attachments)` returning `{ imageParts, textBlocks }` for the 10 agent functions to spread into their messages.
- `admin-chat-attachments` bucket already restricts both upload and read to `has_role(admin)`, so service role read in edge functions is fine; signed URLs we mint server-side are valid for 1h.
- Redirect stubs preserve the existing lazy-import keys in `src/pages/Dashboard.tsx`, so we don't need to touch the role/scope wiring.

## Files touched (preview)

**Edit**
- `src/lib/adminAgents.ts` (fix function names, add Report Builder)
- `src/hooks/useAdminChatThread.ts` (realtime, last_read, orphan cleanup)
- `src/components/dashboard/chat/AgentRail.tsx` (unread dot)
- `src/components/dashboard/chat/ChatThread.tsx` (toasts, message actions, media query)
- 8 × `*ConsoleTab.tsx` → redirect stubs
- 10 × agent edge functions → consume `attachments`

**New**
- `supabase/functions/_shared/attachments.ts`
- `src/hooks/useMediaQuery.ts` (if not already present)
- One migration: `last_read_at` on `admin_chat_threads`, `handoff_to` on `admin_chat_messages`

## Open question

Phase 4 (handoff) — build now or defer? It adds ~20 mins of schema work but no visible feature. Recommend including it so the schema lands once.
