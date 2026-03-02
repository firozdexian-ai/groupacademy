
# Fix AI Instructor Chat + School of Business Audit

## School of Business: COMPLETE

All 5 programs are fully built out:
- Sales & Distribution: 14 courses, 60 modules, AI Instructor (Sarah Rahman)
- Banking & Finance: 14 courses, 61 modules, AI Instructor (Farhan Ahmed)
- Marketing & Brand Management: 14 courses, 60 modules, AI Instructor (Nadia Chowdhury)
- Operations & Supply Chain: 14 courses, 62 modules, AI Instructor (Rafiq Hasan)
- Healthcare & Pharma: 14 courses, 62 modules, AI Instructor (Dr. Fahmida Akter)

No missing programs, courses, or instructors.

## AI Instructor Chat Fix (3 bugs)

### Bug 1: Variable scoping error in edge function
In `supabase/functions/ai-instructor-chat/index.ts`, the `instructor` variable is declared inside the `if (professionLineId)` block (line 64) but the curriculum knowledge base code on line 113 references `instructor` outside that block. This causes a ReferenceError at runtime.

**Fix:** Move `instructor` declaration outside the `if` block so it remains accessible to the curriculum KB loader.

### Bug 2: Auth token not passed explicitly
On line 36, `getUser()` is called without the token. Per the project's edge function auth pattern, stateless functions must call `getUser(token)` with the explicit token extracted from the Authorization header.

**Fix:** Extract the token from the auth header and pass it to `getUser(token)`.

### Bug 3: AIChatPanel sends anon key instead of user session token
In `src/components/ai-instructor/AIChatPanel.tsx` (line 71), the Authorization header uses `VITE_SUPABASE_PUBLISHABLE_KEY` (the anon key) instead of the logged-in user's access token. This is what causes the "invalid claim: missing sub claim" error seen in the logs.

**Fix:** Get the user's session via `supabase.auth.getSession()` and use the actual access token in the Authorization header, similar to how `useAIGeneralChat.ts` does it.

### Files to change
1. `supabase/functions/ai-instructor-chat/index.ts` -- fix instructor scoping + auth token passing
2. `src/components/ai-instructor/AIChatPanel.tsx` -- use user session token instead of anon key
