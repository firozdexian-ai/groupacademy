
# Course Completion Module Improvements Plan

## Summary of Issues Identified

Based on your feedback and my code exploration, I've identified **5 key issues** that need to be addressed:

| Issue | Description | Priority |
|-------|-------------|----------|
| 1. Quiz per Module | Quiz is tied to `content_id` (whole course) instead of `module_id` | CRITICAL |
| 2. AI Quiz Parser | Manual quiz entry is tedious; need paste-and-parse from AI-generated quizzes | HIGH |
| 3. PDF Display | PDFs shown in basic iframe, not optimal viewing experience | MEDIUM |
| 4. Flashcard Format | Flashcards work but may have parsing issues with inconsistent JSON | MEDIUM |
| 5. Progress Bar Accuracy | Progress calculation only counts current session, not persisted data | HIGH |

---

## Issue 1: Quiz Per Module (Database Schema Change Required)

### Current Problem
The `quiz_questions` table has `content_id` (course-level), meaning ONE quiz for the ENTIRE course. Every module shows the same quiz.

**Current Schema:**
```sql
quiz_questions:
  - content_id (FK to content) -- COURSE level
  - question_text, options, etc.
```

### Solution
Add `module_id` column to `quiz_questions` table to enable per-module quizzes.

**Changes Required:**

1. **Database Migration:**
   - Add nullable `module_id` column to `quiz_questions`
   - Add foreign key constraint to `course_modules`

2. **Update `AssessStage.tsx`:**
   - Change query from `.eq("content_id", contentId)` to `.eq("module_id", moduleId)`

3. **Update `QuizManagement.tsx`:**
   - Restructure to manage quizzes per module instead of per course
   - Change route from `/content/:contentId/quiz` to allow module selection
   - Insert questions with `module_id`

4. **Update Admin Workflow:**
   - Add quiz management access from `ModuleResourcesManager.tsx`
   - Or integrate quiz questions directly into the Stage 5 (Assess) tab

---

## Issue 2: AI Quiz Parser for Admin

### Current Problem
Manually entering quiz questions is tedious. Admins want to copy-paste AI-generated quizzes.

### Solution
Add a "Parse AI Quiz" feature that accepts various formats and extracts questions.

**Changes Required:**

1. **Create `QuizParser` component** in `QuizManagement.tsx`:
   - Text area for pasting AI-generated quiz
   - Parse common formats:
     ```text
     1. What is...?
     A) Option A
     B) Option B
     C) Option C
     D) Option D
     Correct: B
     Explanation: Because...
     ```
   - Also support JSON format for direct paste

2. **Parser Logic:**
   ```typescript
   function parseAIQuiz(text: string): Question[] {
     // Detect format (numbered list, JSON, etc.)
     // Extract questions, options, correct answers
     // Return structured Question[]
   }
   ```

3. **UI Flow:**
   - Button: "Import from AI"
   - Modal with textarea for pasting
   - Preview parsed questions
   - Confirm to add to quiz

---

## Issue 3: Better PDF Display

### Current Problem
PDFs are displayed in a basic iframe (`ResourceViewer.tsx` lines 99-120). On mobile, this is often unusable. Users have to click "Open" to view in new tab.

### Solution
Improve PDF viewing with a dedicated viewer.

**Option A: Google Docs Viewer (Simpler)**
```tsx
// Use Google Docs viewer for better PDF rendering
const pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
```

**Option B: PDF.js Integration (More Control)**
Add a proper PDF viewer with navigation controls, zoom, and page tracking.

**Recommended Changes:**

1. **Update `ResourceViewer.tsx`** for slides/PDF type:
   - Use Google Docs viewer for embedded view
   - Add full-screen modal option
   - Add page navigation (if using PDF.js)
   - Add download button

2. **UI Improvements:**
   ```tsx
   <div className="relative">
     <iframe 
       src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
       className="w-full aspect-[4/3] rounded-lg"
     />
     <div className="absolute bottom-2 right-2 flex gap-2">
       <Button size="sm" variant="secondary" onClick={openFullscreen}>
         <Maximize className="h-4 w-4" />
       </Button>
       <Button size="sm" variant="secondary" asChild>
         <a href={url} download>
           <Download className="h-4 w-4" />
         </a>
       </Button>
     </div>
   </div>
   ```

---

## Issue 4: Flashcard JSON Format Resilience

### Current Problem
Flashcards show format errors that disappear on refresh. This suggests:
1. JSON parsing issues with inconsistent formats
2. State not persisting correctly

### Solution
Add defensive parsing in `PracticeStage.tsx`:

**Changes Required:**

1. **Normalize Flashcard Data:**
   ```typescript
   function normalizeFlashcards(resourceData: any): Flashcard[] {
     // Handle multiple possible formats
     if (!resourceData) return [];
     
     // Format 1: { cards: [...] }
     if (resourceData.cards && Array.isArray(resourceData.cards)) {
       return resourceData.cards.map(normalizeCard);
     }
     
     // Format 2: Direct array
     if (Array.isArray(resourceData)) {
       return resourceData.map(normalizeCard);
     }
     
     return [];
   }
   
   function normalizeCard(card: any, index: number): Flashcard {
     return {
       id: card.id || `card-${index}`,
       front: card.front || card.question || card.term || '',
       back: card.back || card.answer || card.definition || '',
       hint: card.hint || undefined
     };
   }
   ```

2. **Add Loading/Error States:**
   - Show skeleton while parsing
   - Show helpful error if parsing fails

---

## Issue 5: Accurate Progress Bar

### Current Problem
Progress calculation in `ImmersiveCoursePlayer.tsx` (lines 225-230) uses:
- `moduleProgress` (local state for current session)
- `completedStages` (from `useStageProgress` hook)

But `moduleProgress` resets on page refresh, so progress appears incorrect.

### Solution
Load persisted progress for ALL modules on initial load.

**Changes Required:**

1. **Update `ImmersiveCoursePlayer.tsx`:**
   ```typescript
   // Fetch all module progress from database
   const { data: allModuleProgress } = useQuery({
     queryKey: ["all-module-progress", enrollment?.id],
     queryFn: async () => {
       const { data } = await supabase
         .from("enrollment_stage_progress")
         .select("module_id, completed_stages")
         .eq("enrollment_id", enrollment.id);
       return data || [];
     },
     enabled: !!enrollment?.id
   });
   
   // Calculate accurate progress
   const totalCompletedStages = allModuleProgress?.reduce((sum, mp) => 
     sum + (mp.completed_stages?.length || 0), 0
   ) || 0;
   
   const overallProgress = (totalCompletedStages / (modules.length * 6)) * 100;
   ```

2. **Also sync with `enrollments.progress` field:**
   - The `useStageProgress` hook already updates this, but verify it's being read correctly

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Quiz + Progress)
1. **Database Migration:** Add `module_id` to `quiz_questions` table
2. **Update `AssessStage.tsx`:** Query by `module_id` instead of `content_id`
3. **Update `QuizManagement.tsx`:** Select module, save with `module_id`
4. **Fix progress bar:** Load all module progress from database

### Phase 2: Admin UX (Quiz Parser)
1. **Create quiz parser utility:** `src/lib/quizParser.ts`
2. **Add "Import from AI" button** in quiz management
3. **Parse modal** with preview

### Phase 3: Learning UX (PDF + Flashcards)
1. **Improve PDF viewer** with Google Docs or PDF.js
2. **Add defensive flashcard parsing** to handle format variations
3. **Add fullscreen modal** for PDF viewing

---

## Database Migration SQL

```sql
-- Add module_id column to quiz_questions
ALTER TABLE quiz_questions 
ADD COLUMN module_id uuid REFERENCES course_modules(id) ON DELETE CASCADE;

-- Create index for efficient lookups
CREATE INDEX idx_quiz_questions_module_id ON quiz_questions(module_id);

-- Note: Existing questions with NULL module_id will continue to work
-- They can be migrated to specific modules via admin UI
```

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| Database | Migration | Add `module_id` column to `quiz_questions` |
| `src/components/player/stages/AssessStage.tsx` | Modify | Query by `module_id` |
| `src/pages/QuizManagement.tsx` | Modify | Add module selector, save with `module_id` |
| `src/pages/ImmersiveCoursePlayer.tsx` | Modify | Load all module progress for accurate bar |
| `src/lib/quizParser.ts` | Create | AI quiz text parser utility |
| `src/components/player/ResourceViewer.tsx` | Modify | Improve PDF display |
| `src/components/player/stages/PracticeStage.tsx` | Modify | Add defensive flashcard parsing |

---

## Expected Outcomes

1. **Quiz per Module:** Each module has its own quiz with 3-5 questions
2. **AI Quiz Import:** Admins can paste AI-generated quizzes and have them parsed automatically
3. **Better PDF Viewing:** PDFs render properly on mobile with fullscreen option
4. **Reliable Flashcards:** Flashcards work consistently regardless of minor JSON format variations
5. **Accurate Progress:** Progress bar reflects true completion across all modules
