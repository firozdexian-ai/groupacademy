

# AI Pre-Population Opportunities — Complete Audit

## Current State (What Exists vs What's Empty)

```text
Content Type                    Total    Populated   Empty     % Empty
──────────────────────────────  ───────  ──────────  ────────  ───────
Module Descriptions (guides)    4,821    640         4,181     87%
Course Descriptions             1,095    424         671       61%
Course Learning Objectives      1,095    17          1,078     98%
Course Estimated Hours          1,095    157         938       86%
Quiz Questions (per module)     4,821    ~10 (1 mod) 4,811     99%+
Flashcards (per module)         4,821    1           4,820     99%+
AI Scenarios (per module)       4,821    0           4,821     100%
Blog Posts                      —        6           —         need more
Feed Posts (seed content)       —        9           —         need more
```

## Batch AI Generators We Can Build

### LEARNING SECTION (Highest Impact)

**1. Batch Quiz Generator** — ~4,800 modules need quizzes
- Input: module title + description (talking points) + course/program context
- Output: 5 MCQ questions per module (question_text, option_a-d, correct_answer, explanation)
- Schema: `quiz_questions` table already supports `module_id`, `content_id`
- Approach: Same batch pattern as descriptions — school-by-school, 5-8 modules per AI call
- **Estimated volume: ~24,000 questions to generate**

**2. Batch Flashcard Generator** — ~4,800 modules need flashcards
- Input: module title + description (talking points)
- Output: 8-12 flashcard pairs per module as JSON `{ cards: [{ front, back }] }`
- Schema: `module_resources` table, `resource_type = 'flashcards'`, `resource_data` = JSON
- Needs module descriptions first (run batch descriptions before this)
- **Estimated volume: ~48,000 flashcards**

**3. Batch AI Scenario Generator** — ~4,800 modules need scenarios
- Input: module title + description + program context
- Output: JSON scenario `{ scenario, context, options: [{text, feedback, score}] }`
- Schema: `module_resources` table, `resource_type = 'ai_scenario'`, `resource_data` = JSON
- **Estimated volume: ~4,800 scenarios**

**4. Batch Course Description Generator** — 671 courses need descriptions
- Input: course title + program name + level + module titles list
- Output: 150-300 word course overview
- Schema: `content.description` field
- Much smaller volume, could do 10-15 per batch

**5. Batch Learning Objectives Generator** — 1,078 courses need objectives
- Input: course title + module titles + program context
- Output: JSON array of 4-6 learning outcomes (e.g., "Analyze market trends...")
- Schema: `content.learning_objectives` (JSONB array)
- Can combine with course descriptions in same batch

**6. Batch Estimated Hours Calculator** — 938 courses need hours
- Input: number of modules, course level, content type
- Output: estimated hours number
- Schema: `content.estimated_hours`
- Simple calculation — may not even need AI (formula: modules × 2-4 hours based on level)

### CONTENT & MARKETING

**7. Batch Blog Post Generator** — Currently only 6 posts
- Input: program names, course topics, career domains
- Output: SEO-optimized blog posts (title, slug, excerpt, content in markdown, tags, category)
- Schema: `blog_posts` table
- Generate 50-100 career advice / industry insight posts across all academy domains
- **High SEO value**

**8. Batch Feed Seed Posts** — Currently only 9 posts
- Input: course launches, career tips, industry news angles
- Output: Short-form feed posts with tags
- Schema: `feed_posts` table
- Generate 50-100 seed posts to make the feed feel alive at launch

## Implementation Plan

### Phase 1: Complete Module Descriptions (existing tool)
- Run the existing `BatchDescriptionGenerator` for remaining 4,181 modules
- This is a prerequisite for Phases 2-3

### Phase 2: Build Quiz + Flashcard Batch Generators
- **Edge function**: `batch-generate-quizzes` — processes N modules per call, generates 5 MCQs each, inserts into `quiz_questions`
- **Edge function**: `batch-generate-flashcards` — processes N modules per call, generates flashcard JSON, inserts into `module_resources`
- **Admin UI**: Add "Generate Quizzes" and "Generate Flashcards" buttons to the existing BatchDescriptionGenerator pattern (school selector + progress tracker)

### Phase 3: Build Scenario + Course Metadata Generators
- **Edge function**: `batch-generate-scenarios` — AI scenarios for Practice stage
- **Edge function**: `batch-generate-course-metadata` — descriptions + learning objectives + estimated hours for courses
- **Admin UI**: Extend batch tools panel

### Phase 4: Content Marketing Generators
- **Edge function**: `batch-generate-blog-posts` — SEO blog content
- **Edge function**: `batch-generate-feed-posts` — seed community content
- **Admin UI**: "Generate Blog Posts" in Blog Manager, "Seed Feed" in Feed Manager

## Technical Approach
All generators follow the same proven pattern:
1. Admin selects school → edge function fetches modules/courses in that school
2. Processes in small batches (5-8 items per AI call) using tool-calling for structured output
3. Progress tracking with remaining count
4. Rate-limit handling (429/402 retry logic)
5. Uses `google/gemini-3-flash-preview` for speed/cost balance

## Priority Order
1. **Module Descriptions** (4,181 remaining) — run existing tool
2. **Quiz Questions** (4,800+ modules) — biggest learner impact
3. **Flashcards** (4,800+ modules) — Practice stage content
4. **Course Descriptions + Objectives** (1,078 courses) — catalog quality
5. **AI Scenarios** (4,800 modules) — enrichment
6. **Blog Posts** (50-100) — SEO/marketing
7. **Feed Posts** (50-100) — community seeding
8. **Estimated Hours** (938 courses) — simple formula, may not need AI

