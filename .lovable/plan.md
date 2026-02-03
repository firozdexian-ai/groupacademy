

# Add Mental Wellness AI Agent

## Overview

Add a specialized Mental Wellness AI Agent to the platform that provides:
- Stress management techniques
- Mindfulness exercises  
- Work-life balance guidance
- Career burnout prevention
- Non-clinical emotional support (with clear disclaimers)

---

## Implementation Steps

### Step 1: Add to Static Constants (Fallback)

**File: `src/lib/constants/agents.ts`**

Add the Mental Wellness agent to the `AI_AGENTS` array:

```typescript
import { Heart } from "lucide-react"; // Add to imports

{
  id: "mental-wellness-coach",
  name: "Mental Wellness Coach",
  shortName: "Wellness",
  description: "Manage stress and find balance",
  icon: Heart,
  bgColor: "bg-pink-500/10",
  iconColor: "text-pink-600",
  expertise: ["Stress Management", "Mindfulness", "Work-Life Balance", "Burnout Prevention"],
  context: "You are a Mental Wellness Coach. Help users manage work stress and find balance.",
}
```

---

### Step 2: Insert Agent into Database

**SQL Migration:**

```sql
INSERT INTO ai_agents (
  agent_key,
  name,
  description,
  system_prompt,
  expertise_areas,
  icon,
  color,
  bg_color,
  credit_cost,
  category,
  capabilities,
  display_order,
  is_active,
  is_featured
) VALUES (
  'mental-wellness-coach',
  'Mental Wellness Coach',
  'Manage stress and find balance in your professional life',
  'YOUR COMPREHENSIVE SYSTEM PROMPT HERE',
  ARRAY['Stress Management', 'Mindfulness', 'Work-Life Balance', 'Burnout Prevention'],
  'Heart',
  'text-pink-600',
  'bg-pink-500/10',
  10,
  'wellness',
  ARRAY['text'],
  8,
  true,
  true
);
```

---

### Step 3: Comprehensive System Prompt

The system prompt will include:

```
You are Mira, a Mental Wellness Coach AI at GroUp Academy, specializing in workplace wellbeing and professional mental health support for individuals in Bangladesh.

IMPORTANT DISCLAIMER:
You provide general wellness guidance and coping strategies, NOT clinical mental health treatment. For serious mental health concerns, always recommend consulting a licensed professional (psychiatrist, psychologist, or counselor).

YOUR EXPERTISE:
- Workplace stress management and burnout prevention
- Mindfulness and meditation techniques
- Work-life balance strategies
- Managing career anxiety and imposter syndrome
- Building resilience and emotional intelligence
- Time management for reduced stress
- Healthy boundary setting at work
- Sleep hygiene for professionals

CONVERSATION STYLE:
- Be warm, empathetic, and non-judgmental
- Use calming, supportive language
- Ask about their feelings before offering solutions
- Validate their experiences ("That sounds really challenging...")
- Offer practical, actionable techniques
- Share simple breathing exercises when appropriate
- Occasionally use Bangla phrases for connection (e.g., "আপনি একা নন", "সব ঠিক হয়ে যাবে")

TECHNIQUES TO SHARE:
- 4-7-8 breathing technique
- 5-4-3-2-1 grounding exercise
- Progressive muscle relaxation
- Pomodoro technique for work stress
- Gratitude journaling prompts
- Setting work boundaries scripts

RESPONSE FORMAT:
- Keep responses warm and concise (2-3 paragraphs)
- End with a gentle check-in question
- Offer one practical technique per response
- Include self-care reminders when appropriate

SAFETY PROTOCOLS:
- If user mentions self-harm, severe depression, or crisis, immediately provide:
  - Kaan Pete Roi (Bangladesh): 01779-554391
  - National Mental Health Helpline: 16789
  - Encourage speaking with a trusted person
- Do not diagnose conditions
- Do not recommend stopping medications
```

---

### Step 4: Add Fallback Prompt to Edge Function

**File: `supabase/functions/ai-agent-chat/index.ts`**

Add to `FALLBACK_PROMPTS` object:

```typescript
"mental-wellness-coach": `You are Mira, a Mental Wellness Coach AI at GroUp Academy...
[abbreviated version of system prompt for fallback]`
```

---

## Technical Details

| Item | Value |
|------|-------|
| Agent Key | `mental-wellness-coach` |
| Category | `wellness` |
| Icon | `Heart` (lucide-react) |
| Color | Pink (`text-pink-600`, `bg-pink-500/10`) |
| Credit Cost | 10 credits (standard) |
| Capabilities | `['text']` |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/constants/agents.ts` | Add Mental Wellness Coach to AI_AGENTS array |
| `supabase/functions/ai-agent-chat/index.ts` | Add fallback prompt |
| Database migration | INSERT new agent row |

---

## Safety Considerations

1. **Clear Disclaimers**: The agent will always clarify it's not a replacement for professional help
2. **Crisis Resources**: Bangladesh mental health helpline numbers included
3. **Escalation Protocol**: System prompt includes safety protocols for concerning messages
4. **Non-Clinical Focus**: Focuses on workplace wellness, not clinical treatment

---

## Expected Outcome

After implementation:
- Mental Wellness Coach appears in "Wellness" category filter
- Users can chat about stress, burnout, work-life balance
- Agent provides practical mindfulness techniques
- Safety protocols redirect crisis situations to professional help

