

# Improved AI Content Tools: Completion Status + Approval Workflow

## Problem 1: No Completion Status in BatchContentGenerator

The `BatchDescriptionGenerator` shows per-school completion with pending counts, progress bars, and done/pending badges. The `BatchContentGenerator` (quizzes, flashcards, scenarios, course-metadata) has **none of this** — just a flat school list with no indication of what's done.

## Problem 2: Blog & Feed Posts Auto-Publish Without Review

Both generators insert content directly as `status: "published"`. No way to preview, edit, or reject AI-generated content before it goes live.

---

## Plan

### Part 1: Add School Completion Status to All Learning Generators

**What changes**: Enhance `BatchContentGenerator.tsx` to fetch per-school completion stats for each generator type, matching the `BatchDescriptionGenerator` pattern.

For each school, query:
- **Quizzes**: Count modules with vs without rows in `quiz_questions`
- **Flashcards**: Count modules with vs without `module_resources` where `resource_type = 'flashcards'`
- **Scenarios**: Same but `resource_type = 'ai_scenario'`
- **Course Metadata**: Count courses with vs without `description`, `learning_objectives`, `estimated_hours`

Display:
- Summary cards at top (total pending, schools complete)
- School dropdown shows "X pending" or "Done" badge per school
- School status list at bottom with progress bars (same as BatchDescriptionGenerator)
- "Regenerate All" toggle per generator type

### Part 2: Blog & Feed Post Approval Workflow

**What changes**: Blog and feed generators insert with `status: "draft"` instead of `"published"`. Add a review UI inside the BatchContentGenerator where admins can preview, edit, approve, or reject each generated item.

**Edge function changes**:
- `batch-generate-blog-posts`: Insert as `status: "draft"`, accept `category`, `topic`, and `context` parameters from the UI
- `batch-generate-feed-posts`: Insert as `status: "draft"` and `is_active: false`, accept `topic` and `context` parameters

**UI additions to Blog & Feed tabs**:
- **Generation controls**: Category dropdown, topic input field, and optional context textarea so admins can guide the AI ("Write about remote work trends in tech", "Focus on interview preparation for fresh graduates")
- **Pending Review section**: Shows draft posts in expandable cards with:
  - Full preview (markdown rendered for blog, plain text for feed)
  - "Approve" button (sets `status: "published"`)
  - "Reject" button (deletes the draft)
  - "Edit" button (inline edit before approving)
  - Bulk "Approve All" / "Reject All" actions

### Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/BatchContentGenerator.tsx` | Major rewrite: add completion stats fetching, school status display, regenerate toggle, blog/feed generation controls (category/topic/context), pending review section |
| `supabase/functions/batch-generate-blog-posts/index.ts` | Insert as `draft`, accept `topic` and `context` params, use them in prompt |
| `supabase/functions/batch-generate-feed-posts/index.ts` | Insert as `draft` + `is_active: false`, accept `topic` and `context` params |

### No database changes needed
Both `blog_posts.status` and `feed_posts.is_active` / `feed_posts.status` columns already exist and support draft states.

