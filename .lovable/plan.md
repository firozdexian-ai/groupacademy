# Conversational AI Authentication Agent

## What It Does

Replaces the traditional form-based `/auth` page with a **chat-based AI agent** that handles signup, login, and password reset through natural conversation. The agent acts as the platform's "gatekeeper" — welcoming users, collecting credentials conversationally, performing a quick human-verification quiz, and completing authentication behind the scenes.

Also give the Agent a name and personality.

## User Journey

```text
User lands on /auth
        |
        v
  Chat UI with AI welcome message
  "Welcome to GroUp Academy! I'm here to help you join or sign back in."
        |
        v
  AI asks for email
        |
        +---> Email exists in talents table (with user_id) --> LOGIN FLOW
        |     AI: "Welcome back! Please enter your password."
        |     -> Authenticates via supabase.auth.signInWithPassword
        |     -> "Forgot password?" handled conversationally
        |
        +---> Email exists in talents table (no user_id) --> CLAIM ACCOUNT
        |     AI: "We have your profile! Let's set up your login."
        |     -> Collects password, verifies name/phone
        |     -> Signs up and links to existing talent record
        |
        +---> Email not found --> SIGNUP FLOW
              AI: "Let's create your account!"
              -> Collects: name, phone, password (step by step)
              -> Quick human verification (simple quiz question)
              -> Creates account via supabase.auth.signUp
        |
        v
  "You're all set! Enter the platform."
  [Enter Platform] button appears
```

## Architecture

This is **not** a typical AI edge function chat. The AI generates conversational UI responses, but **authentication actions happen client-side** using the existing `useAuth` hook. The edge function only generates the conversational text and determines what step comes next.

### Why hybrid (AI text + client-side auth)?

- Supabase auth tokens must be set client-side (browser cookies/localStorage)
- Password must never be sent to a custom edge function
- The AI agent handles conversation flow, tone, and the human quiz — not actual auth operations

## Technical Design

### New Edge Function: `ai-auth-agent`

Receives conversation context (NOT passwords) and returns:

```json
{
  "reply": "Great! Now tell me your full name.",
  "action": "collect_name",
  "quiz": null
}
```

Actions the client interprets: `collect_email`, `collect_password`, `collect_name`, `collect_phone`, `verify_human`, `do_signin`, `do_signup`, `do_reset`, `complete`

For the human verification step, the function generates a simple quiz:

```json
{
  "reply": "Quick check! What is 7 + 5?",
  "action": "verify_human",
  "quiz": { "answer": "12" }
}
```

### New Page Component: `AuthChat.tsx`

Replaces or sits alongside the current Auth page. A full-screen conversational UI:

- Chat bubbles (AI left, user right)
- Dynamic input area that changes based on `action`:
  - `collect_email` → email input
  - `collect_password` → password input (never sent to AI)
  - `collect_phone` → phone input with country code
  - `verify_human` → text input for quiz answer
  - `complete` → "Enter Platform" button
- Passwords are captured locally and used directly with `supabase.auth.signUp/signInWithPassword`
- The AI never sees passwords — only the flow state

### New Hook: `useAuthChat.ts`

Manages the conversational auth state machine:

- Tracks current step, collected data (email, name, phone — NOT password)
- Calls edge function for AI responses
- Executes auth operations client-side when ready
- Handles email lookup (existing user detection) client-side

## Files to Create/Change


| File                                        | Action                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `supabase/functions/ai-auth-agent/index.ts` | New — generates conversational responses and quiz questions, determines flow step |
| `src/pages/AuthChat.tsx`                    | New — conversational auth UI with chat bubbles and dynamic inputs                 |
| `src/hooks/useAuthChat.ts`                  | New — auth chat state machine, bridges AI conversation with real auth             |
| `src/App.tsx`                               | Update `/auth` route to use `AuthChat` instead of `Auth`                          |
| `src/pages/Auth.tsx`                        | Keep as `AuthClassic.tsx` fallback (rename, not delete)                           |


## Security Constraints

- Passwords never leave the client — they go directly to Supabase Auth API
- The edge function receives only: email, name, phone, quiz answers, and flow state
- Edge function does NOT perform any auth operations
- Human quiz is simple math/logic — not CAPTCHA (no external dependency)
- Rate limiting via existing `check_rate_limit` function

## UI Design

- Full-screen chat on mobile (no sidebar)
- GroUp Academy branding at top
- Typing indicator while AI responds
- Smooth auto-scroll
- Input types change contextually (email keyboard, phone keyboard, password field)
- "Enter Platform" button appears with confetti/celebration after completion