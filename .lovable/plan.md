

# Dashboard Stabilization Plan

## Problems Identified

1. **Most tabs show placeholder text** — `Dashboard.tsx` only maps 7 tab values to actual components (`overview`, `talent`, `jobs`, `jobs-kpis`, `all`, `enrollments`, `irdashboard`). The sidebar defines ~40 tab values. All unmapped ones fall through to the generic "Module X is initialized" message.

2. **Sidebar IR tab mismatch** — Sidebar uses `ir-dashboard` but Dashboard checks for `irdashboard`. The IR Dashboard tab never renders.

3. **Email from Talent tab** — The `TalentDetailDialog` invite button relies on `emailNotifications.talentInvite()` which requires the `send-transactional-email` Edge Function to be deployed and working. Need to verify the function is deployed.

## Fix: Wire All 40+ Tabs to Their Components

Every manager component already exists in `src/components/dashboard/`. The only missing piece is the tab-to-component mapping in `Dashboard.tsx`.

### Complete Tab Mapping

| Sidebar Value | Component | Import From |
|---|---|---|
| `overview` | `DashboardOverview` | Already imported |
| `workforce` | `WorkforceManager` | `./WorkforceManager` |
| `talent` | `TalentPoolManager` | Already imported |
| `lead-hunter` | `LeadHunterManager` | `./LeadHunterManager` |
| `professions` | `ProfessionsManager` | `./ProfessionsManager` |
| `jobs-kpis` | `JobsKPIDashboard` | Already imported |
| `jobs` | `JobsManager` | Already imported |
| `applications` | `JobApplicationsManager` | `./JobApplicationsManager` |
| `companies` | `CompaniesManager` | `./CompaniesManager` |
| `contacts` | `ContactsManager` | `./ContactsManager` |
| `company-agents` | `CompanyAgentsManager` | `./CompanyAgentsManager` |
| `industries` | `IndustriesManager` | `./IndustriesManager` |
| `all` | `ContentList` | Already imported |
| `enrollments` | `EnrollmentsManager` | Already imported |
| `learner-progress` | `LearnerProgressManager` | `./LearnerProgressManager` |
| `ai-content-tools` | `BatchContentGenerator` | `./BatchContentGenerator` |
| `analytics` | `MarketingAnalytics` | `./MarketingAnalytics` |
| `outreach` | `CVOutreachGenerator` | `./CVOutreachGenerator` |
| `content-outreach` | `ContentOutreachManager` | `./ContentOutreachManager` |
| `service-outreach` | `ServiceOutreachManager` | `./ServiceOutreachManager` |
| `blog` | `BlogManager` | `./BlogManager` |
| `feed-posts` | `FeedPostsManager` | `./FeedPostsManager` |
| `competitions` | `CompetitionsManager` | `./CompetitionsManager` |
| `study-abroad` | `StudyAbroadManager` | `./StudyAbroadManager` |
| `ielts` | `IELTSResourcesManager` | `./IELTSResourcesManager` |
| `roadmap-leads` | `StudyAbroadRoadmapLeadsManager` | `./StudyAbroadRoadmapLeadsManager` |
| `ai-agents` | `AIAgentsManager` | `./AIAgentsManager` |
| `agent-sessions` | `AgentSessionsManager` | `./AgentSessionsManager` |
| `leads` | `AssessmentLeadsManager` | `./AssessmentLeadsManager` |
| `interviews` | `MockInterviewLeadsManager` | `./MockInterviewLeadsManager` |
| `salary` | `SalaryAnalysisLeadsManager` | `./SalaryAnalysisLeadsManager` |
| `portfolios` | `PortfolioRequestsManager` | `./PortfolioRequestsManager` |
| `gigs` | `GigsManager` | `./GigsManager` |
| `marketplace-gigs` | `MarketplaceGigsManager` | `./MarketplaceGigsManager` |
| `gig-submissions` | `GigSubmissionsManager` | `./GigSubmissionsManager` |
| `credits` | `CreditsManager` | `./CreditsManager` |
| `notifications` | `NotificationsManager` | `./NotificationsManager` |
| `ir-dashboard` | `IRDashboard` | `./ir/IRDashboard` |
| `ir-targets` | `MRRTargetManager` | `./ir/MRRTargetManager` |
| `ir-vcs` | `VCFirmsManager` | `./ir/VCFirmsManager` |
| `ir-investors` | `InvestorsManager` | `./ir/InvestorsManager` |
| `ir-emails` | `EmailComposer` | `./ir/EmailComposer` |
| `support-assistant` | `SupportAssistant` | `./SupportAssistant` |
| `codes` | `AccessCodeManager` | `../AccessCodeManager` |
| `banners` | `BannerManager` | `./BannerManager` |
| `team` | `TeamManager` | `./TeamManager` |
| `payments` | `PaymentSettingsManager` | `./PaymentSettingsManager` |

### Implementation Steps

**Step 1: Rewrite Dashboard.tsx tab rendering**
- Use React.lazy() for all tab components to avoid a massive upfront bundle
- Replace the hardcoded if/else chain with a `tabComponents` map
- Fix the `irdashboard` → `ir-dashboard` mismatch
- Remove the fallback placeholder (every tab will have a component)
- Add a Suspense fallback for lazy-loaded components

**Step 2: Verify email Edge Function deployment**
- Check `send-transactional-email` Edge Function logs
- Ensure the function is deployed and responding correctly
- Test the talent invite flow works end-to-end

**Step 3: Add clipboard fallback to CompaniesManager and ContactsManager**
- Add a "Copy Email" button alongside the existing mailto links
- This was committed to in the email migration plan (Option B for B2B outreach)

### Technical Approach

```typescript
// Dashboard.tsx — lazy loading pattern
const CompaniesManager = React.lazy(() => import("@/components/dashboard/CompaniesManager").then(m => ({ default: m.CompaniesManager })));
// ... repeat for all ~40 components

const TAB_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  "companies": CompaniesManager,
  "contacts": ContactsManager,
  // ... all 40+ mappings
};

// In render:
const TabComponent = TAB_COMPONENTS[activeTab];
return TabComponent ? (
  <Suspense fallback={<DashboardSkeleton />}>
    <TabComponent onNavigateToTab={handleTabChange} />
  </Suspense>
) : null;
```

This single file change (`Dashboard.tsx`) fixes the primary issue — all tabs rendering as placeholders. No other files need structural changes.

