
# Jobs Hub Redesign Implementation Plan

## Overview

Transform the Jobs Hub into a personalized, AI-powered job discovery experience based on the provided wireframes. This includes a new layout for the Jobs page with quick access filters, AI-powered recommendations, and enhanced Job Details with two new premium AI features.

---

## Part A: Jobs Hub Page Redesign (`/app/jobs` → JobsHub.tsx)

### New Layout Structure

```text
┌─────────────────────────────────────────┐
│  [Logo]           [🔔] [👤]            │  <- Already in TalentAppShell
├─────────────────────────────────────────┤
│  [ 🔍 Search Jobs                    ]  │
├─────────────────────────────────────────┤
│ [Saved Jobs] [Applied Jobs] [Preferences]│ <- NEW quick access pills
├─────────────────────────────────────────┤
│  ⭐ Top Picks for You                   │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │Job 1│ │Job 2│ │Job 3│               │
│  └─────┘ └─────┘ └─────┘               │
│        [Show All - 10 credits]          │ <- NEW AI feature
├─────────────────────────────────────────┤
│  📂 Explore Job Collections             │
│  [Full Time] [Part-Time] [Internship]   │
│  [Remote]    [NGO]       [More ▸]       │ <- Expand to show more
├─────────────────────────────────────────┤
│  🎯 More Jobs for You                   │ <- NEW personalized section
│  Based on profile, preferences,         │
│  activity (applies, searches, saves)    │
│  ┌─────────────────────────────┐        │
│  │ Job Card 1                  │        │
│  └─────────────────────────────┘        │
│  ┌─────────────────────────────┐        │
│  │ Job Card 2                  │        │
│  └─────────────────────────────┘        │
└─────────────────────────────────────────┘
```

### Technical Changes

#### 1. Add Quick Access Pills (Saved/Applied/Preferences)

Create three horizontally scrollable pill buttons below the search bar:

```typescript
// New component in JobsHub.tsx
const QuickAccessPills = () => (
  <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
    <Button variant="outline" size="sm" onClick={() => navigate('/app/saved')}>
      <Bookmark className="h-4 w-4 mr-1.5" />
      Saved Jobs ({savedJobsCount})
    </Button>
    <Button variant="outline" size="sm" onClick={() => navigate('/app/applications')}>
      <FileText className="h-4 w-4 mr-1.5" />
      Applied ({applicationsCount})
    </Button>
    <Button variant="outline" size="sm" onClick={() => setPreferencesOpen(true)}>
      <Settings className="h-4 w-4 mr-1.5" />
      Preferences
    </Button>
  </div>
);
```

#### 2. Add Job Preferences Sheet

New slide-out sheet for users to set job preferences:
- Preferred job types (Full-time, Part-time, etc.)
- Preferred locations
- Salary expectations
- Industries of interest

Store in new `job_preferences` table or JSONB field on `talents`.

#### 3. "Show All - 10 credits" AI Button

Add button under Top Picks that charges 10 credits to fetch AI-scored job recommendations:

```typescript
const handleShowAllAI = async () => {
  if (!canAfford(10)) {
    openCreditPurchase();
    return;
  }
  
  await deductCredits(10, 'SUGGESTED_JOBS', 'AI Job Recommendations');
  
  const { data } = await supabase.functions.invoke('generate-job-recommendations', {
    body: { talentId: talent.id }
  });
  
  navigate('/app/jobs/all', { state: { aiJobs: data.jobs } });
};
```

#### 4. Expand Job Collections

Add more collection types:
- NGO/Development
- Government
- Startup
- MNC (Multinational)
- Add "More" button to reveal additional categories

#### 5. "More Jobs for You" Section

New section showing personalized job recommendations based on:
- User's profession/skills from profile
- Previously applied/saved jobs
- Search history
- Profile completeness

This is fetched via simple database query (not AI) using the user's `profession_category_id` and skills matching.

---

## Part B: Job Details Page Enhancements (`/app/jobs/:id` → AppJobDetail.tsx)

### New Layout Structure

```text
┌─────────────────────────────────────────┐
│ ← Back to Jobs                          │
├─────────────────────────────────────────┤
│ [Company Logo]  Job Title               │
│                 Company Name            │
│                                   [★ Save]│ <- PROMINENT save button
├─────────────────────────────────────────┤
│ [Full Time] [Dhaka] [Entry Level]       │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 🤖 AI Insights (Premium)            │ │ <- NEW collapsible section
│ │                                     │ │
│ │ [Show Match Details - 10 credits]   │ │ <- AI Feature #1
│ │ [Job & Applicant Insight - 15 cr]   │ │ <- AI Feature #2
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│        [Apply Now] (Primary CTA)        │
├─────────────────────────────────────────┤
│ 📋 About the Role                       │
│ [Job description content...]            │
├─────────────────────────────────────────┤
│ ✅ Requirements                         │
│ • Requirement 1                         │
│ • Requirement 2                         │
├─────────────────────────────────────────┤
│ 🏢 About the Company                    │ <- NEW section
│ Industry: Technology                    │
│ Website: example.com                    │
│ LinkedIn: linkedin.com/company/...      │
│ [View Company →]                        │
├─────────────────────────────────────────┤
│ 📅 Job Overview                         │
│ Posted: Jan 15, 2026                    │
│ Deadline: Feb 15, 2026                  │
└─────────────────────────────────────────┘
```

### Technical Changes

#### 1. Prominent Save Button

Replace the small icon button with a larger, more visible button:

```typescript
<Button 
  variant={isSaved ? "default" : "outline"} 
  size="lg"
  className={cn(
    "gap-2 min-w-[120px]",
    isSaved && "bg-primary text-primary-foreground"
  )}
  onClick={handleSaveToggle}
>
  <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
  {isSaved ? "Saved" : "Save Job"}
</Button>
```

#### 2. AI Feature #1: Show Match Details (10 credits)

New premium feature that analyzes user's profile against job requirements:

**Output:**
```json
{
  "overall_match": 78,
  "skills_match": {
    "matched": ["React", "TypeScript", "Node.js"],
    "missing": ["AWS", "Docker"],
    "percentage": 65
  },
  "experience_fit": 85,
  "education_fit": 90,
  "recommendation": "Strong candidate for this role",
  "tips_to_improve": [
    "Add AWS certification to your profile",
    "Highlight Docker experience in your CV"
  ]
}
```

**Implementation:**
- Create new edge function `score-job-match`
- Reuse logic from existing `score-talent-match` function
- Display results in an expandable card

#### 3. AI Feature #2: Job & Applicant Insight (15 credits)

Premium market intelligence feature:

**Output:**
```json
{
  "applicant_count_estimate": "50-100",
  "competition_level": "Medium",
  "salary_insight": {
    "market_range": "BDT 80,000 - 120,000",
    "posted_salary_assessment": "Below market average"
  },
  "company_reputation": "Well-reviewed employer",
  "similar_jobs_count": 12,
  "hiring_timeline_estimate": "2-4 weeks",
  "success_tips": [
    "Apply early - this job type fills quickly",
    "Highlight specific framework experience"
  ]
}
```

**Implementation:**
- Create new edge function `analyze-job-market`
- Uses job applications count, similar jobs, company data
- Display in expandable insight card

#### 4. About the Company Section

Fetch company details using the `company_id` foreign key:

```typescript
// In loadJobAndApplication function
if (jobData.company_id) {
  const { data: companyData } = await supabase
    .from('companies')
    .select('name, industry, website, linkedin_url, address, notes, logo_url')
    .eq('id', jobData.company_id)
    .single();
  
  setCompany(companyData);
}
```

Display section:
```tsx
{company && (
  <Card>
    <CardContent className="p-6">
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5" /> About {company.name}
      </h3>
      <div className="space-y-3 text-sm">
        {company.industry && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Industry</span>
            <span className="font-medium">{company.industry}</span>
          </div>
        )}
        {company.website && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Website</span>
            <a href={company.website} target="_blank" className="text-primary hover:underline">
              Visit Website →
            </a>
          </div>
        )}
        {company.linkedin_url && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">LinkedIn</span>
            <a href={company.linkedin_url} target="_blank" className="text-primary hover:underline">
              View Profile →
            </a>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

---

## Part C: New Edge Functions

### 1. `score-job-match` Edge Function

Compares user profile to job requirements (10 credits):

```typescript
// supabase/functions/score-job-match/index.ts
// Uses Lovable AI (google/gemini-2.5-flash)
// Input: { jobId, talentId }
// Output: Match score, skills analysis, recommendations
```

### 2. `analyze-job-market` Edge Function

Provides market intelligence for a job (15 credits):

```typescript
// supabase/functions/analyze-job-market/index.ts
// Uses database aggregations + AI analysis
// Input: { jobId }
// Output: Competition level, salary insights, hiring tips
```

---

## Part D: Database Changes

### Option 1: Add job_preferences to talents table (simpler)

```sql
ALTER TABLE talents 
ADD COLUMN job_preferences JSONB DEFAULT '{}'::jsonb;
```

**Structure:**
```json
{
  "preferred_job_types": ["full_time", "remote"],
  "preferred_locations": ["Dhaka", "Remote"],
  "salary_min": 50000,
  "salary_max": 100000,
  "industries": ["Technology", "Finance"]
}
```

### Option 2: New job_preferences table (more flexible)

```sql
CREATE TABLE job_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES talents(id) ON DELETE CASCADE UNIQUE,
  preferred_job_types TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  preferred_industries TEXT[] DEFAULT '{}',
  remote_preference TEXT CHECK (remote_preference IN ('yes', 'no', 'hybrid', 'no_preference')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Part E: Credit System Updates

### Add New Service Types to creditPricing.ts

```typescript
SERVICES: {
  // ... existing services
  
  JOB_MATCH_SCORE: {
    name: 'Job Match Analysis',
    cost: 10,
    description: 'See how well you match this job'
  },
  JOB_MARKET_INSIGHT: {
    name: 'Job & Applicant Insight',
    cost: 15,
    description: 'Market intelligence and competition analysis'
  },
  // Keep existing SUGGESTED_JOBS for "Show All" feature
}
```

---

## Summary of Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/app/JobsHub.tsx` | Modify | Add quick access pills, preferences sheet, personalized section |
| `src/pages/app/AppJobDetail.tsx` | Modify | Prominent save, AI insights section, About Company |
| `src/lib/creditPricing.ts` | Modify | Add new service types |
| `supabase/functions/score-job-match/index.ts` | Create | AI match scoring |
| `supabase/functions/analyze-job-market/index.ts` | Create | Market insights |
| Database migration | Create | Add job_preferences column to talents |

---

## Implementation Order

1. **Phase 1**: UI changes (no backend) - Prominent save button, About Company section
2. **Phase 2**: Quick access pills and preferences sheet
3. **Phase 3**: Database migration for preferences
4. **Phase 4**: Edge functions for AI features
5. **Phase 5**: Wire up AI features with credit system
6. **Phase 6**: "More Jobs for You" personalized section
