

# AI Customer Support Assistant in Admin Panel

## What It Does

A new admin tool where you upload a screenshot of a customer conversation (WhatsApp, email, etc.), optionally describe the context, and the AI analyzes the image to suggest:
1. A ready-to-send reply message
2. What platform features to recommend next (Mock Interview, courses, etc.)
3. Tone and intent analysis of the customer's message

## How It Works

The AI uses **vision capabilities** (Gemini model) to read the screenshot, understand the conversation context, and generate contextual replies that reference your platform's services.

## Files to Create/Change

| File | Change |
|------|--------|
| `supabase/functions/ai-support-assistant/index.ts` | New edge function -- accepts base64 image + context text, sends to Gemini with vision, returns suggested reply + recommended actions |
| `src/components/dashboard/SupportAssistant.tsx` | New component -- image upload zone, context textarea, AI response display with copy buttons |
| `src/components/dashboard/AdminSidebar.tsx` | Add "Support Assistant" under Platform Config group |
| `src/pages/Dashboard.tsx` | Add `support-assistant` tab routing + import |

## Edge Function Design

- Model: `google/gemini-2.5-flash` (multimodal -- reads images + text)
- System prompt: "You are a customer support assistant for GroUp Academy, a career development platform offering jobs, courses, mock interviews, salary analysis, portfolio building, career assessment, AI agents, and study abroad services. Analyze the conversation screenshot and provide: 1) A professional reply, 2) Platform features to recommend, 3) Any follow-up actions."
- Input: `{ image: "data:image/...", context?: "string" }`
- Output: `{ reply: string, suggestions: string[], tone: string }`

## UI Design

- **Upload area**: Drag-and-drop or click to upload screenshot (stored only in memory, not persisted)
- **Context field**: Optional textarea for admin to add context ("This user applied for a job and is asking about mock interviews")
- **Response panel**: Card with the suggested reply (with copy button), list of recommended features/links, and a tone badge
- **History**: Not persisted -- fresh tool each time (keeps it simple)

## Sidebar Placement

Add under **Platform Config** group as "Support AI" with a `MessageSquare` or `Sparkles` icon.

