

# Add "Generate Research Prompt" Button to Module Management

## What We're Building
A button on each module card in the Module Management page that generates a structured, context-rich deep research prompt. The prompt is displayed in a dialog/sheet with a one-click copy button. No edge function needed — this can be done client-side using the existing module data.

## How It Works
1. User clicks "Research Prompt" button on a module card
2. A dialog opens with a pre-built prompt that includes:
   - Program name, school, academy context
   - Course title and level (Foundation/Intermediate/Executive)
   - Module title and position in the course
   - Existing talking points (if any)
   - Structured instructions for deep research output format
3. User clicks "Copy" and pastes into their research platform

## Prompt Template Structure
```text
You are a curriculum research specialist. Conduct deep research for the following educational module:

**Academy**: Executive Academy
**School**: School of Leadership & HR  
**Program**: Project Management
**Level**: Foundation
**Course**: Introduction to Project Management (Course 1 of 5)
**Module**: Project Life Cycle: Initiation, Planning, Execution, Monitoring & Closure (Module 2 of 4)

**Talking Points**:
• [existing talking points if any]

**Research Instructions**:
Provide comprehensive, actionable research covering:
1. Key concepts, definitions, and frameworks
2. Industry best practices and standards
3. Real-world examples and case studies (preferably from Bangladesh/South Asia context)
4. Common mistakes and misconceptions
5. Tools, templates, or resources relevant to this topic
6. Assessment-worthy questions and discussion points

Format the output as structured sections with clear headings. Include citations where possible.
```

## Implementation
- **No edge function** — prompt is assembled client-side from existing data (course title, module title, description)
- **No database changes** — uses data already loaded in the Module Management page
- Add a `BookOpen` or `Search` icon button next to the existing "AI Generate Guide" button
- Dialog with `<Textarea>` (read-only) + Copy button using `navigator.clipboard`

## Also: Confirming the AI Generate Guide Button
The "AI Generate Guide" button already exists on each module card in `/content/{contentId}/modules` (the Sparkles button next to the Description label). If you haven't been able to find it, it may be because you're looking on a different page — it's specifically on the Module Management page, not the Content Edit page.

## Files to Change
1. **`src/pages/ModuleManagement.tsx`** — Add "Research Prompt" button + dialog with prompt generation logic

