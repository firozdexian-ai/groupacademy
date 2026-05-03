# Module Management — Final Polish

## Confirmed scope
You're happy with the **outer "Manage Modules" → Manage Resources** flow (Dashboard → Modules tab). We won't touch that. Three remaining items to fix:

1. The **"Manage Resources" button inside ContentEdit** (the one that doesn't work).
2. Add an **AI "Generate Research Prompt"** action to each module in admin (so admins, not just gig workers, can use it).
3. Bring **Quiz Manager** and **AI Content Studio (batch generator)** into the Module Management screen so admins can create resources individually right next to a module — without leaving the page.

---

## 1. Fix the broken Manage Resources button in ContentEdit

In `src/pages/ContentEdit.tsx` the right-hand sidebar only has **Manage Modules** and **Manage Quiz**. There's no resources button there today, but inside `ModuleManagement` the per-module **Manage Resources** button calls `navigate('/content/${id}/modules/${moduleId}/resources')` which works only if the route is registered and the user has the page chrome.

Fix:
- Verify `App.tsx` route `/content/:contentId/modules/:moduleId/resources` points to `ModuleResourcesManager` (it does); ensure the link includes `?fromTab=1` whenever the user came from the dashboard so Back returns to the dashboard Modules tab instead of the standalone page.
- Inside `ContentEdit`, replace the dead Manage Resources affordance (if user is referring to it) by routing to `/dashboard?tab=modules&id=<contentId>` — the same destination as the working outer button — so both entry points land in one place.
- Delete any stale duplicate "Manage Resources" buttons from older versions of the sidebar.

## 2. AI Research Prompt available to admins per module

`ResearchPromptDialog` already exists and is great, but it's currently only surfaced through the gig flow. Wire it into `ModuleManagement.tsx`:

- Add a small **"Research Prompt"** button on each module card (next to Manage Resources).
- Open `ResearchPromptDialog` populated with the module + course context the admin already has loaded.
- Provide both **Copy Prompt** (existing behaviour) and a new **Generate with AI** action that calls a new edge function `generate-module-research` which posts the prompt to Lovable AI Gateway (`google/gemini-2.5-flash` for cost / `gpt-5-mini` for depth — default flash) and streams the result back into a textarea the admin can save into the module's `description` or attach as a new `module_resources` row of type `report`.
- Edge function uses `LOVABLE_API_KEY`, validates JWT + admin role, returns SSE.

## 3. Inline Quiz + AI Content Studio inside Module Management

Right now admins must leave the Modules tab and go to **Certification Logic** (`tab=quiz-manage`) or **Generative Suite** (`tab=ai-content-tools`) to bulk-create. Bring those tools to the module level:

- **Per-module Quick Tools row** in `ModuleManagement.tsx` showing 3 buttons:
  - `Open Quiz Builder` → opens `QuizManagement` in a side sheet pre-scoped to that module/course.
  - `AI Content Studio` → opens `BatchContentGenerator` in a side sheet pre-filled with this module's id and stage scaffolding so generated artifacts auto-attach to `module_resources`.
  - `Add Single Resource` → opens `ModuleResourcesManager` in a slide-over for that module without leaving the page.
- Use the existing shadcn `Sheet` component for slide-overs (no route change → no navigation loss).
- After save in the sheet, refetch `module_resources` counts on the module card so the readiness badge updates instantly.

## Technical notes
- New edge function `supabase/functions/generate-module-research/index.ts` (CORS, JWT verify, admin-role check via `has_role`, calls AI Gateway with system prompt = curriculum researcher).
- Reuse `ResearchPromptDialog`'s `buildResearchProtocol` as the user message.
- No DB migration needed; we already have `module_resources` and `course_modules`.
- Keep the working outer **Manage Modules → Manage Resources** untouched.

## Files touched
- `src/pages/ContentEdit.tsx` — fix/redirect the broken inner Manage Resources affordance.
- `src/pages/ModuleManagement.tsx` — add Research Prompt + Quiz + Studio + Resources buttons per module, mount slide-over sheets.
- `src/components/modules/ResearchPromptDialog.tsx` — add **Generate with AI** action streaming from new edge function.
- `src/components/dashboard/BatchContentGenerator.tsx` — accept optional `moduleId`/`courseId` props for sheet mode.
- `src/pages/QuizManagement.tsx` — accept optional `contentId`/`moduleId` props for sheet mode (keeps standalone route).
- `src/pages/ModuleResourcesManager.tsx` — accept optional props so it can render inside a sheet.
- `supabase/functions/generate-module-research/index.ts` — NEW: streamed AI research generation, admin-only.

## Out of scope
- Outer Modules tab navigation (already working).
- Job AI Assessment regression (shipped previously; reverify after this).