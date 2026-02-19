

# Final Batch: All Remaining Sub-Pages Mobile UX Consistency

## Overview

This is the final sweep across ~17 remaining sub-pages that still use generous `py-6`, `space-y-6/8`, `mb-6/8`, and `text-2xl` patterns. After this batch, every page in the app will follow the same tight mobile layout standard.

---

## Improvements

### Group A: Learning Sub-Pages

**1. My Learning (`AppMyLearning.tsx`)**
- Reduce `py-6` to `py-4` and header `mb-6` to `mb-4`
- Reduce title from `text-2xl` to `text-xl`
- Reduce stats grid `mb-8` to `mb-5`
- Reduce Tabs `space-y-6` to `space-y-4`
- Reduce empty state `py-12` to `py-8`

**2. Course Detail (`AppCourseDetail.tsx`)**
- Reduce `py-6` to `py-4` in main and loading/error states

**3. Events (`AppEvents.tsx`)**
- Reduce `py-6` to `py-4` and header `mb-6` to `mb-4`
- Reduce title from `text-2xl` to `text-xl`
- Reduce section `mb-8` to `mb-5` (Today's Events, Upcoming, Past)
- Reduce filter tabs `mb-6` to `mb-4`

### Group B: Jobs Sub-Pages

**4. Job Detail (`AppJobDetail.tsx`)**
- Already has `pb-28` sticky CTA -- good
- Reduce `py-6` to `py-4` in main and loading/error states
- Reduce content `space-y-6` to `space-y-4`
- Reduce header `mb-6` to `mb-4`

**5. Job Application (`AppJobApplication.tsx`)**
- Reduce `py-6` to `py-4` in all states (main, loading, submitted, error)
- Reduce header `mb-6` to `mb-4`
- Reduce card gaps `mb-6` to `mb-4` between sections (Job Info, CV, Form)

**6. Job Assessment (`JobAssessment.tsx`)**
- Reduce `py-6` to `py-4` in all states
- Reduce header `mb-6` to `mb-4`

**7. Job Assessment Results (`JobAssessmentResults.tsx`)**
- Reduce `py-6` to `py-4` in all states
- Reduce processing state `space-y-8` to `space-y-5`
- Reduce results `space-y-6` to `space-y-4`

### Group C: Services Sub-Pages

**8. Mock Interview Setup (`AppMockInterviewSetup.tsx`)**
- Reduce `py-6` to `py-4`
- Reduce form `space-y-6` to `space-y-4` inside CardContent

**9. Career Assessment (`AppCareerAssessment.tsx`)**
- Reduce `py-6` to `py-4`
- Reduce progress bar `mb-6` to `mb-4`
- Reduce intro `space-y-8` to `space-y-5`

**10. Salary Analysis Setup (`AppSalaryAnalysisSetup.tsx`)**
- Reduce `py-6` to `py-4`

**11. Portfolio Request (`AppPortfolioRequest.tsx`)**
- Reduce `py-6` to `py-4` if present

### Group D: Explore Sub-Pages

**12. Professions Listing (`AppProfessions.tsx`)**
- Reduce `py-6` to `py-4` if present

**13. Profession Detail (`AppProfessionDetail.tsx`)**
- Reduce `py-6` to `py-4` in all states

### Group E: AI & Chat Sub-Pages

**14. AI Agents (`AIAgents.tsx`)**
- Reduce `py-6` to `py-4` if present

**15. Agent Chat (`AgentChat.tsx`)**
- Reduce `py-6` to `py-4` if present

### Group F: Results & Roadmap Sub-Pages

**16. My Results (`MyResults.tsx`)**
- Already uses `py-6` and `text-xl` -- reduce `py-6` to `py-4`

**17. Study Abroad Roadmap Results (`StudyAbroadRoadmapResults.tsx`)**
- Reduce `py-6` to `py-4` in all states
- Reduce `space-y-6` to `space-y-4`
- Reduce processing state `mb-8` to `mb-5`

---

## Technical Summary

| File | Key Changes |
|------|-------------|
| `src/pages/app/AppMyLearning.tsx` | `py-4`, title `text-xl`, stats `mb-5`, tabs `space-y-4`, empty `py-8` |
| `src/pages/app/AppCourseDetail.tsx` | `py-4` on all states |
| `src/pages/app/AppEvents.tsx` | `py-4`, title `text-xl`, sections `mb-5`, tabs `mb-4` |
| `src/pages/app/AppJobDetail.tsx` | `py-4`, content `space-y-4`, header `mb-4` |
| `src/pages/app/AppJobApplication.tsx` | `py-4` all states, card gaps `mb-4` |
| `src/pages/app/JobAssessment.tsx` | `py-4`, header `mb-4` |
| `src/pages/app/JobAssessmentResults.tsx` | `py-4`, processing `space-y-5`, results `space-y-4` |
| `src/pages/app/AppMockInterviewSetup.tsx` | `py-4`, form `space-y-4` |
| `src/pages/app/AppCareerAssessment.tsx` | `py-4`, progress `mb-4`, intro `space-y-5` |
| `src/pages/app/AppSalaryAnalysisSetup.tsx` | `py-4` |
| `src/pages/app/AppPortfolioRequest.tsx` | `py-4` |
| `src/pages/app/AppProfessions.tsx` | `py-4` |
| `src/pages/app/AppProfessionDetail.tsx` | `py-4` all states |
| `src/pages/app/AIAgents.tsx` | `py-4` |
| `src/pages/app/AgentChat.tsx` | `py-4` |
| `src/pages/app/MyResults.tsx` | `py-4` |
| `src/pages/app/StudyAbroadRoadmapResults.tsx` | `py-4`, `space-y-4`, processing `mb-5` |

---

## What stays the same

- All existing functionality (enrollment, job applications, assessments, AI chat, roadmaps)
- Sticky CTAs already in place (Job Detail, etc.)
- Color palette and theme
- No database changes
- Data fetching and navigation logic unchanged

