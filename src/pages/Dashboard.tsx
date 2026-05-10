import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { ImpersonationBanner } from "@/components/dashboard/ImpersonationBanner";
import { useAdminScope } from "@/hooks/useAdminScope";
import { DashboardTableSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * CTO NOTE: Registry updated to include curriculum and certification management.
 * PATH OVERRIDE: Using /pages/ directory for ModuleManagement due to environment restrictions.
 * Lazy loading enforced for all 62+ admin routes to protect mobile PWA memory limits.
 * All dead 10 legacy *ConsoleTab redirect stubs removed to force use of /dashboard/chat.
 */
const TAB_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  overview: React.lazy(() =>
    import("@/components/dashboard/overview/LifetimeOverviewTab").then((m) => ({ default: m.LifetimeOverviewTab })),
  ),
  "overview-lifetime": React.lazy(() =>
    import("@/components/dashboard/overview/LifetimeOverviewTab").then((m) => ({ default: m.LifetimeOverviewTab })),
  ),
  "overview-month": React.lazy(() =>
    import("@/components/dashboard/overview/PeriodOverviewTab").then((m) => ({
      default: () => {
        const C = m.PeriodOverviewTab;
        return <C mode="month" />;
      },
    })),
  ),
  "overview-quarter": React.lazy(() =>
    import("@/components/dashboard/overview/PeriodOverviewTab").then((m) => ({
      default: () => {
        const C = m.PeriodOverviewTab;
        return <C mode="quarter" />;
      },
    })),
  ),
  "overview-analyst": React.lazy(() =>
    import("@/components/dashboard/overview/AnalystChatTab").then((m) => ({ default: m.AnalystChatTab })),
  ),
  "overview-reports": React.lazy(() =>
    import("@/components/dashboard/overview/ReportsBuilderTab").then((m) => ({ default: m.ReportsBuilderTab })),
  ),
  "hr-workforce": React.lazy(() =>
    import("@/components/dashboard/hr/WorkforceTab").then((m) => ({ default: m.WorkforceManager })),
  ),
  "crm-overview": React.lazy(() => import("@/components/dashboard/talent/TalentOverviewTab").then((m: any) => ({ default: m.TalentOverviewTab ?? m.default }))),
  "crm-talent-pool": React.lazy(() => import("@/components/dashboard/talent/TalentPoolTab").then((m: any) => ({ default: m.TalentPoolTab ?? m.TalentPoolManager ?? m.default }))),
  "crm-professions": React.lazy(() => import("@/components/dashboard/talent/ProfessionsTab").then((m: any) => ({ default: m.ProfessionsTab ?? m.ProfessionsManager ?? m.default }))),
  "crm-upload": React.lazy(() => import("@/components/dashboard/talent/TalentUploadTab").then((m: any) => ({ default: m.TalentUploadTab ?? m.default }))),
  "crm-outreach": React.lazy(() => import("@/components/dashboard/talent/TalentOutreachConsoleTab").then((m: any) => ({ default: m.TalentOutreachConsoleTab ?? m.default }))),
  "crm-wa-channel": React.lazy(() => import("@/components/dashboard/talent/TalentMessagingChannelTab").then((m: any) => ({ default: m.TalentMessagingChannelTab ?? m.default }))),
  "crm-creator-economy": React.lazy(() => import("@/components/dashboard/talent/CreatorEconomyTab").then((m: any) => ({ default: m.CreatorEconomyTab ?? m.default }))),
  "crm-notifications": React.lazy(() => import("@/components/dashboard/talent/NotificationsTab").then((m: any) => ({ default: m.NotificationsTab ?? m.NotificationsManager ?? m.default }))),
  "crm-support-ai": React.lazy(() => import("@/components/dashboard/talent/SupportAITab").then((m: any) => ({ default: m.SupportAITab ?? m.SupportAssistant ?? m.default }))),
  // Jobs / ATS routes consolidated below (search "jobs-overview").
  companies: React.lazy(() =>
    import("@/components/dashboard/companies/CompaniesTab").then((m: any) => ({ default: m.CompaniesTab ?? m.CompaniesManager ?? m.default })),
  ),
  contacts: React.lazy(() =>
    import("@/components/dashboard/talent/ContactsTab").then((m: any) => ({ default: m.ContactsTab ?? m.ContactsManager ?? m.default })),
  ),
  "company-agents": React.lazy(() =>
    import("@/components/dashboard/companies/CompanyAgentsTab").then((m: any) => ({ default: m.CompanyAgentsTab ?? m.CompanyAgentsManager ?? m.default })),
  ),
  industries: React.lazy(() =>
    import("@/components/dashboard/companies/IndustriesTab").then((m: any) => ({ default: m.IndustriesTab ?? m.IndustriesManager ?? m.default })),
  ),
  "companies-overview": React.lazy(() =>
    import("@/components/dashboard/companies/CompaniesOverviewTab").then((m) => ({ default: m.CompaniesOverviewTab })),
  ),
  "companies-unlocks": React.lazy(() =>
    import("@/components/dashboard/companies/ContactUnlocksTab").then((m) => ({ default: m.ContactUnlocksTab })),
  ),
  all: React.lazy(() => import("@/components/dashboard/ugc/UgcVideosTab")),
  "ugc-videos": React.lazy(() => import("@/components/dashboard/ugc/UgcVideosTab")),
  // Legacy "ai-content-tools" route removed — generative suite now lives in learning module.
  // Marketing legacy keys removed — see "marketing-*" block below.
  "ugc-blog": React.lazy(() => import("@/components/dashboard/ugc/UgcBlogTab").then((m) => ({ default: m.UgcBlogTab }))),
  "ugc-feed": React.lazy(() =>
    import("@/components/dashboard/ugc/UgcFeedTab").then((m) => ({ default: m.UgcFeedTab })),
  ),
  "ugc-competitions": React.lazy(() =>
    import("@/components/dashboard/ugc/UgcCompetitionsTab").then((m) => ({ default: m.UgcCompetitionsTab })),
  ),
  "agent-outreach": React.lazy(() =>
    import("@/components/dashboard/agents/AgentOutreachTab").then((m: any) => ({ default: m.AgentOutreachTab ?? m.AgentOutreachManager ?? m.default })),
  ),
  "agents-overview": React.lazy(() =>
    import("@/components/dashboard/agents/AgentsOverviewTab").then((m) => ({ default: m.AgentsOverviewTab })),
  ),
  "agents-channels": React.lazy(() =>
    import("@/components/dashboard/agents/AgentChannelsTab").then((m) => ({ default: m.AgentChannelsTab })),
  ),
  "agents-tools": React.lazy(() =>
    import("@/components/dashboard/agents/AgentToolsTab").then((m) => ({ default: m.AgentToolsTab })),
  ),
  "agents-studio": React.lazy(() =>
    import("@/components/dashboard/agents/AgentStudioTab").then((m: any) => ({ default: m.AgentStudioTab ?? m.AgentStudio ?? m.default })),
  ),
  "agents-b2c": React.lazy(() =>
    import("@/components/dashboard/agents/AgentTypeTabs").then((m) => ({ default: m.AgentsB2CTab })),
  ),
  "agents-platform": React.lazy(() =>
    import("@/components/dashboard/agents/AgentTypeTabs").then((m) => ({ default: m.AgentsPlatformTab })),
  ),
  "agents-b2b": React.lazy(() =>
    import("@/components/dashboard/agents/AgentTypeTabs").then((m) => ({ default: m.AgentsB2BTab })),
  ),
  "agents-ugc": React.lazy(() =>
    import("@/components/dashboard/agents/AgentTypeTabs").then((m) => ({ default: m.AgentsUGCTab })),
  ),
  "agents-marketplace": React.lazy(() =>
    import("@/components/dashboard/agents/AgentMarketplaceTab").then((m: any) => ({ default: m.AgentMarketplaceTab ?? m.AgentMarketplaceReview ?? m.default })),
  ),
  "agents-payouts": React.lazy(() =>
    import("@/components/dashboard/agents/AgentPayoutsTab").then((m: any) => ({ default: m.AgentPayoutsTab ?? m.AgentPayoutsManager ?? m.default })),
  ),
  "agents-sessions": React.lazy(() =>
    import("@/components/dashboard/agents/AgentSessionsTab").then((m: any) => ({ default: m.AgentSessionsTab ?? m.AgentSessionsManager ?? m.default })),
  ),
  "agents-insights": React.lazy(() =>
    import("@/components/dashboard/agents/AgentInsightsTab").then((m: any) => ({ default: m.AgentInsightsTab ?? m.AgentInsights ?? m.default })),
  ),
  leads: React.lazy(() =>
    import("@/components/dashboard/jobs/JobsAssessmentLeadsTab").then((m) => ({ default: m.JobsAssessmentLeadsTab })),
  ),
  interviews: React.lazy(() =>
    import("@/components/dashboard/marketing/leads/MockInterviewLeadsManager").then((m) => ({ default: m.MockInterviewLeadsManager })),
  ),
  salary: React.lazy(() =>
    import("@/components/dashboard/marketing/leads/SalaryAnalysisLeadsManager").then((m) => ({
      default: m.SalaryAnalysisLeadsManager,
    })),
  ),
  portfolios: React.lazy(() => import("@/components/dashboard/talent/PortfolioRequestsTab").then((m: any) => ({ default: m.PortfolioRequestsTab ?? m.default ?? m.PortfolioRequestsManager }))),
  // Gig Economy routes consolidated below (search "gigs-overview").

  "ir-dashboard": React.lazy(() =>
    import("@/components/dashboard/ir/IRDashboard").then((m) => ({ default: m.IRDashboard })),
  ),
  "ir-targets": React.lazy(() =>
    import("@/components/dashboard/ir/MRRTargetManager").then((m) => ({ default: m.MRRTargetManager })),
  ),
  "ir-vcs": React.lazy(() =>
    import("@/components/dashboard/ir/VCFirmsManager").then((m) => ({ default: m.VCFirmsManager })),
  ),
  "ir-investors": React.lazy(() =>
    import("@/components/dashboard/ir/InvestorsManager").then((m) => ({ default: m.InvestorsManager })),
  ),
  "ir-pipeline": React.lazy(() =>
    import("@/components/dashboard/ir/IRPipelineBoard").then((m) => ({ default: m.IRPipelineBoard })),
  ),
  "ir-emails": React.lazy(() =>
    import("@/components/dashboard/ir/EmailComposer").then((m) => ({ default: m.EmailComposer })),
  ),
  "ir-dataroom": React.lazy(() =>
    import("@/components/dashboard/ir/dataroom/DataRoomManager").then((m) => ({ default: m.DataRoomManager })),
  ),
  "ir-economics": React.lazy(() =>
    import("@/components/dashboard/ir/economics/UnitEconomics").then((m) => ({ default: m.UnitEconomics })),
  ),
  "ir-overview": React.lazy(() => import("@/components/dashboard/investors/IROverviewTab")),
  "ir-influencers": React.lazy(() => import("@/components/dashboard/investors/KeyInfluencersTab")),
  // Marketing banners/themes/access-codes legacy keys removed — see "marketing-*" block below.
  // Legacy "hr-team" route removed — superseded by "hr-teams".
  // Legacy "payments-legacy" + "invoices" keys removed — replaced by "finops-*" block below.
  institutions: React.lazy(() =>
    import("@/components/dashboard/institutions/StakeholderRegistry").then((m) => ({ default: m.InstitutionsManager })),
  ),
  "partner-orgs": React.lazy(() =>
    import("@/components/dashboard/institutions/StakeholderRegistry").then((m) => ({ default: m.PartnerOrgsManager })),
  ),
  "inst-overview": React.lazy(() => import("@/components/dashboard/institutions/InstitutionsOverviewTab")),
  "inst-types": React.lazy(() => import("@/components/dashboard/institutions/InstitutionTypesManager")),
  "inst-clubs": React.lazy(() =>
    import("@/components/dashboard/institutions/InstitutionChildRegistry").then((m) => ({ default: m.ClubsManager })),
  ),
  "inst-reps": React.lazy(() =>
    import("@/components/dashboard/institutions/InstitutionChildRegistry").then((m) => ({
      default: m.RepresentativesManager,
    })),
  ),
  "inst-events": React.lazy(() =>
    import("@/components/dashboard/institutions/InstitutionChildRegistry").then((m) => ({
      default: m.OrgEventsManager,
    })),
  ),
  "hr-overview": React.lazy(() => import("@/components/dashboard/hr/HrOverviewTab")),
  "hr-grades": React.lazy(() =>
    import("@/components/dashboard/hr/HrSimpleTabs").then((m) => ({ default: m.HrGradesTab })),
  ),
  "hr-verticals": React.lazy(() =>
    import("@/components/dashboard/hr/HrSimpleTabs").then((m) => ({ default: m.HrVerticalsTab })),
  ),
  "hr-functions": React.lazy(() =>
    import("@/components/dashboard/hr/HrSimpleTabs").then((m) => ({ default: m.HrFunctionsTab })),
  ),
  "hr-teams": React.lazy(() =>
    import("@/components/dashboard/hr/HrSimpleTabs").then((m) => ({ default: m.HrTeamsTab })),
  ),
  "hr-targets": React.lazy(() =>
    import("@/components/dashboard/hr/HrTargetsTab").then((m) => ({ default: m.HrTargetsTab })),
  ),
  "hr-onboarding": React.lazy(() =>
    import("@/components/dashboard/hr/HrOnboardingTab").then((m) => ({ default: m.HrOnboardingTab })),
  ),
  "hr-payroll": React.lazy(() =>
    import("@/components/dashboard/hr/HrPayrollTab").then((m) => ({ default: m.HrPayrollTab })),
  ),
  "gtm-overview": React.lazy(() =>
    import("@/components/dashboard/gtm/GtmOverviewTab").then((m) => ({ default: m.GtmOverviewTab })),
  ),
  "gtm-countries": React.lazy(() =>
    import("@/components/dashboard/gtm/GtmTabs").then((m) => ({ default: m.GtmCountriesTab })),
  ),
  "gtm-states": React.lazy(() =>
    import("@/components/dashboard/gtm/GtmTabs").then((m) => ({ default: m.GtmStatesTab })),
  ),
  "gtm-cities": React.lazy(() =>
    import("@/components/dashboard/gtm/GtmTabs").then((m) => ({ default: m.GtmCitiesTab })),
  ),
  "gtm-clusters": React.lazy(() =>
    import("@/components/dashboard/gtm/GtmTabs").then((m) => ({ default: m.GtmClustersTab })),
  ),
  "gtm-knowledge": React.lazy(() =>
    import("@/components/dashboard/gtm/GtmKnowledgeTab").then((m) => ({ default: m.GtmKnowledgeTab })),
  ),
  "ugc-overview": React.lazy(() => import("@/components/dashboard/ugc/UgcOverviewTab")),
  "jobs-overview": React.lazy(() => import("@/components/dashboard/jobs/JobsOverviewTab")),
  "jobs-upload": React.lazy(() => import("@/components/dashboard/jobs/JobsUploadApprovalTab")),
  "jobs-hub": React.lazy(() => import("@/components/dashboard/jobs/hub/JobsHub").then(m => ({ default: m.JobsHub }))),
  "jobs-applications": React.lazy(() => import("@/components/dashboard/jobs/JobsApplicationsTab").then(m => ({ default: m.JobsApplicationsTab }))),
  "jobs-pipeline": React.lazy(() => import("@/components/dashboard/jobs/JobsKanbanPipelineTab").then(m => ({ default: m.JobsKanbanPipelineTab }))),
  "jobs-sourcing": React.lazy(() => import("@/components/dashboard/jobs/JobsSourcingTab").then(m => ({ default: m.JobsSourcingTab }))),
  "jobs-talent-crm": React.lazy(() => import("@/components/dashboard/jobs/JobsTalentCrmTab").then(m => ({ default: m.JobsTalentCrmTab }))),
  "jobs-assessments": React.lazy(() => import("@/components/dashboard/jobs/JobsAssessmentsTab")),
  "jobs-kpis": React.lazy(() => import("@/components/dashboard/jobs/JobsKpiTab").then(m => ({ default: m.JobsKpiTab }))),
  "learning-overview": React.lazy(() => import("@/components/dashboard/learning/LearningOverviewTab").then(m => ({ default: m.LearningOverviewTab }))),
  "learning-academies": React.lazy(() => import("@/components/dashboard/learning/LearningSimpleTabs").then(m => ({ default: m.AcademiesTab }))),
  "learning-schools": React.lazy(() => import("@/components/dashboard/learning/LearningSimpleTabs").then(m => ({ default: m.SchoolsTab }))),
  "learning-pro-lives": React.lazy(() => import("@/components/dashboard/learning/LearningSimpleTabs").then(m => ({ default: m.ProfessionalLivesTab }))),
  "learning-career-tracks": React.lazy(() => import("@/components/dashboard/learning/LearningCareerTracksTab").then(m => ({ default: m.LearningCareerTracksTab }))),
  "learning-courses": React.lazy(() => import("@/components/dashboard/learning/LearningCoursesTab").then(m => ({ default: m.LearningCoursesTab }))),
  "learning-webinars": React.lazy(() => import("@/components/dashboard/learning/LearningWebinarsTab").then(m => ({ default: m.LearningWebinarsTab }))),
  "learning-enrollments": React.lazy(() => import("@/components/dashboard/learning/LearningEnrollmentsTab").then(m => ({ default: m.LearningEnrollmentsTab }))),
  "learning-progress": React.lazy(() => import("@/components/dashboard/learning/LearningProgressTab").then(m => ({ default: m.LearningProgressTab }))),
  "learning-graduates": React.lazy(() => import("@/components/dashboard/learning/LearningGraduatesTab").then(m => ({ default: m.LearningGraduatesTab }))),
  "learning-b2b-courses": React.lazy(() => import("@/components/dashboard/learning/LearningB2BCoursesTab").then(m => ({ default: m.LearningB2BCoursesTab }))),
  "learning-course-briefs": React.lazy(() => import("@/components/dashboard/learning/LearningCourseBriefsTab").then(m => ({ default: m.LearningCourseBriefsTab }))),
  "learning-cohorts": React.lazy(() => import("@/components/dashboard/learning/LearningCohortsTab").then(m => ({ default: m.LearningCohortsTab }))),
  "learning-moderation": React.lazy(() => import("@/components/dashboard/learning/LearningModerationTab").then(m => ({ default: m.LearningModerationTab }))),
  "learning-b2b-engagements": React.lazy(() => import("@/components/dashboard/learning/LearningB2BEngagementsTab").then(m => ({ default: m.LearningB2BEngagementsTab }))),
  "learning-payouts": React.lazy(() => import("@/components/dashboard/learning/LearningPayoutsTab").then(m => ({ default: m.LearningPayoutsTab }))),
  "learning-json-importer": React.lazy(() => import("@/components/dashboard/learning/CourseJSONImporter").then(m => ({ default: m.CourseJSONImporter }))),
  "gigs-overview": React.lazy(() => import("@/components/dashboard/gigs/GigOverviewTab").then(m => ({ default: m.GigOverviewTab }))),
  "gigs-scoper": React.lazy(() => import("@/components/dashboard/gigs/GigOverviewTab").then(m => ({ default: m.GigOverviewTab }))),
  "gigs-quick-actions": React.lazy(() => import("@/components/dashboard/gigs/GigsQuickActionsTab").then(m => ({ default: m.GigsQuickActionsTab }))),
  "gigs-marketplace": React.lazy(() => import("@/components/dashboard/gigs/GigsMarketplaceTab").then(m => ({ default: m.GigsMarketplaceTab }))),
  "gigs-course-projects": React.lazy(() => import("@/components/dashboard/gigs/GigsCourseProjectsTab").then(m => ({ default: m.GigsCourseProjectsTab }))),
  "gigs-client-projects": React.lazy(() => import("@/components/dashboard/gigs/ClientProjectsTab").then(m => ({ default: m.ClientProjectsTab }))),
  "gigs-managed-projects": React.lazy(() => import("@/components/dashboard/gigs/ManagedProjectsTab").then(m => ({ default: m.ManagedProjectsTab }))),
  "gigs-submissions": React.lazy(() => import("@/components/dashboard/gigs/GigsSubmissionsTab").then(m => ({ default: m.GigsSubmissionsTab }))),
  "gigs-verification": React.lazy(() => import("@/components/dashboard/gigs/GigVerificationQueueTab").then(m => ({ default: m.GigVerificationQueueTab }))),
  "gigs-reviewers": React.lazy(() => import("@/components/dashboard/gigs/ReviewerProgramTab").then(m => ({ default: m.ReviewerProgramTab }))),
  "gigs-matchmaker": React.lazy(() => import("@/components/dashboard/gigs/GigMatchmakerTab").then(m => ({ default: m.GigMatchmakerTab }))),
  "gigs-workers-wallet": React.lazy(() => import("@/components/dashboard/gigs/GigWorkersWalletTab").then(m => ({ default: m.GigWorkersWalletTab }))),
  "abroad-overview": React.lazy(() => import("@/components/dashboard/abroad/AbroadOverviewTab").then(m => ({ default: (m as any).AbroadOverviewTab ?? m.default }))),
  "abroad-destinations": React.lazy(() => import("@/components/dashboard/abroad/AbroadDestinationsTab").then(m => ({ default: (m as any).AbroadDestinationsTab ?? m.default }))),
  "abroad-applications": React.lazy(() => import("@/components/dashboard/abroad/AbroadApplicationsTab").then(m => ({ default: (m as any).AbroadApplicationsTab ?? m.default }))),
  "abroad-programs": React.lazy(() => import("@/components/dashboard/abroad/AbroadProgramsTab").then(m => ({ default: (m as any).AbroadProgramsTab ?? m.default }))),
  "abroad-ielts-prompts": React.lazy(() => import("@/components/dashboard/abroad/AbroadIELTSPromptsTab").then(m => ({ default: (m as any).AbroadIELTSPromptsTab ?? m.default }))),
  "abroad-ielts-resources": React.lazy(() => import("@/components/dashboard/abroad/AbroadIELTSResourcesTab").then(m => ({ default: (m as any).AbroadIELTSResourcesTab ?? m.default }))),
  "abroad-language-lab": React.lazy(() => import("@/components/dashboard/abroad/AbroadLanguageLabTab").then(m => ({ default: (m as any).AbroadLanguageLabTab ?? m.default }))),
  "abroad-roadmap-leads": React.lazy(() => import("@/components/dashboard/abroad/AbroadRoadmapLeadsTab").then(m => ({ default: (m as any).AbroadRoadmapLeadsTab ?? m.default }))),
  // ===== Marketing (Phase 6 standardized "marketing-*" keys) =====
  "marketing-analytics": React.lazy(() => import("@/components/dashboard/marketing/MarketingAnalyticsTab").then(m => ({ default: (m as any).MarketingAnalyticsTab ?? (m as any).default }))),
  "marketing-channels": React.lazy(() => import("@/components/dashboard/marketing/MktSimpleTabs").then(m => ({ default: (m as any).ChannelsTab ?? (m as any).default }))),
  "marketing-community-wa": React.lazy(() => import("@/components/dashboard/marketing/CommunityMessagingChannelTab").then(m => ({ default: (m as any).CommunityMessagingChannelTab ?? (m as any).default }))),
  "marketing-community-groups": React.lazy(() => import("@/components/dashboard/marketing/MktSimpleTabs").then(m => ({ default: (m as any).CommunityGroupsTab ?? (m as any).default }))),
  "marketing-admins-reps": React.lazy(() => import("@/components/dashboard/marketing/AdminsRepsTab").then(m => ({ default: (m as any).AdminsRepsTab ?? (m as any).default }))),
  "marketing-talent-outreach": React.lazy(() => import("@/components/dashboard/marketing/TalentOutreachTab").then(m => ({ default: (m as any).TalentOutreachTab ?? (m as any).default }))),
  "marketing-content-outreach": React.lazy(() => import("@/components/dashboard/marketing/ContentOutreachTab").then(m => ({ default: (m as any).ContentOutreachTab ?? (m as any).default }))),
  "marketing-service-outreach": React.lazy(() => import("@/components/dashboard/marketing/ServiceOutreachTab").then(m => ({ default: (m as any).ServiceOutreachTab ?? (m as any).default }))),
  "marketing-leads": React.lazy(() => import("@/components/dashboard/marketing/LeadsActivitiesTab").then(m => ({ default: (m as any).LeadsActivitiesTab ?? (m as any).default }))),
  "marketing-banners": React.lazy(() => import("@/components/dashboard/marketing/BannersTab").then(m => ({ default: (m as any).BannersTab ?? (m as any).default }))),
  "marketing-themes": React.lazy(() => import("@/components/dashboard/marketing/ThemesTab").then(m => ({ default: (m as any).ThemesTab ?? (m as any).default }))),
  "marketing-access-codes": React.lazy(() => import("@/components/dashboard/marketing/AccessCodesTab").then(m => ({ default: (m as any).AccessCodesTab ?? (m as any).default }))),
  "companies-wa-channel": React.lazy(() =>
    import("@/components/dashboard/companies/EmployerMessagingChannelTab").then((m) => ({
      default: m.EmployerMessagingChannelTab,
    })),
  ),
  // ===== FinOps (Phase 6 standardized "finops-*" keys) =====
  "finops-overview": React.lazy(() => import("@/components/dashboard/finance/FinOverviewTab").then((m: any) => ({ default: m.FinOverviewTab ?? m.default }))),
  "finops-talent-credits": React.lazy(() => import("@/components/dashboard/finance/TalentCreditsTab").then((m: any) => ({ default: m.TalentCreditsTab ?? m.default }))),
  "finops-gro10x-credits": React.lazy(() => import("@/components/dashboard/finance/Gro10xCreditsTab").then((m: any) => ({ default: m.Gro10xCreditsTab ?? m.default }))),
  "finops-company-credits": React.lazy(() => import("@/components/dashboard/finance/CompanyCreditsTab").then((m: any) => ({ default: m.CompanyCreditsTab ?? m.default }))),
  "finops-transactions": React.lazy(() => import("@/components/dashboard/finance/TransactionsTab").then((m: any) => ({ default: m.TransactionsTab ?? m.default }))),
  "finops-pay-infra": React.lazy(() => import("@/components/dashboard/finance/PaymentInfraTab").then((m: any) => ({ default: m.PaymentInfraTab ?? m.default }))),
  "finops-invoices": React.lazy(() => import("@/components/dashboard/finance/InvoicesTab").then((m: any) => ({ default: m.InvoicesTab ?? m.default }))),
  "finops-withdrawals": React.lazy(() => import("@/components/dashboard/finance/WithdrawalsTab").then((m: any) => ({ default: m.WithdrawalsTab ?? m.default }))),
  modules: React.lazy(() => import("@/components/dashboard/learning/modules/ModulePickerPanel")),
  "quiz-manage": React.lazy(() => import("@/pages/QuizManagement")),
};

const TAB_TITLES: Record<string, string> = {
  overview: "Lifetime Overview",
  "overview-lifetime": "Lifetime Overview",
  "overview-month": "Monthly Overview",
  "overview-quarter": "Quarterly Overview",
  "overview-analyst": "Business Analyst",
  "overview-reports": "Report Builder",
  workforce: "Workforce",
  "companies-wa-channel": "Employer WhatsApp Line",
  "community-wa-channel": "Community WhatsApp Line",
  "crm-overview": "CRM Overview",
  "crm-talent-pool": "Talent Pool",
  "crm-professions": "Professions & Roles",
  "crm-upload": "Talent Upload",
  "crm-outreach": "Outreach Log",
  "crm-wa-channel": "WhatsApp Line",
  "crm-creator-economy": "Creator Economy",
  "crm-notifications": "Notifications",
  "crm-support-ai": "Support AI",
  "jobs-kpis": "Growth Analytics",
  "jobs-hub": "Jobs Hub",
  "jobs-applications": "Candidate Flow",
  "jobs-pipeline": "Kanban Pipeline",
  "jobs-sourcing": "Sourcing",
  "jobs-talent-crm": "Talent CRM",
  companies: "Employer CRM",
  contacts: "B2B Contacts",
  "company-agents": "Internal Agents",
  industries: "Verticals",
  "companies-overview": "Companies Overview",
  "companies-unlocks": "Contact Unlocks",
  all: "Catalog Architecture",
  "ugc-videos": "Digital Library",
  "learning-overview": "Learning Overview",
  "learning-academies": "Academies",
  "learning-schools": "Schools",
  "learning-pro-lives": "Pro Lives",
  "learning-career-tracks": "AI Career Tracks",
  "learning-courses": "Recorded Courses",
  "learning-webinars": "Webinars",
  "learning-enrollments": "Student Ingestion",
  "learning-progress": "Academic Velocity",
  "learning-graduates": "Graduates",
  "learning-b2b-courses": "B2B Courses",
  "learning-course-briefs": "Course Briefs",
  "learning-cohorts": "Cohorts",
  "learning-moderation": "Moderation Queue",
  "learning-b2b-engagements": "B2B Engagements",
  "learning-payouts": "Instructor Payouts",
  "learning-json-importer": "Bulk Course Importer",
  
  "marketing-analytics": "Conversion Intel",
  "marketing-channels": "Marketing Channels",
  "marketing-community-wa": "Community WhatsApp Line",
  "marketing-community-groups": "Community Groups",
  "marketing-admins-reps": "Admins & Reps",
  "marketing-talent-outreach": "Talent Outreach (CV Intelligence)",
  "marketing-content-outreach": "Content Outreach",
  "marketing-service-outreach": "Service Outreach",
  "marketing-leads": "Leads & Activities",
  "marketing-banners": "Banners",
  "marketing-themes": "Profile Card Themes",
  "marketing-access-codes": "Access Codes",
  "ugc-blog": "Thought Leadership",
  "ugc-feed": "Network Stream",
  "ugc-competitions": "Gamification",
  "abroad-overview": "Career Abroad Overview",
  "abroad-destinations": "Destination Agents",
  "abroad-applications": "Application Pipeline",
  "abroad-programs": "Uni Programs",
  "abroad-ielts-prompts": "IELTS Prompt Bank",
  "abroad-ielts-resources": "IELTS Resources",
  "abroad-language-lab": "Language Lab",
  "abroad-roadmap-leads": "Roadmap Leads",
  "agent-outreach": "Proactive Engine",
  "agents-overview": "Agent OS Overview",
  "agents-channels": "Channels & Triggers",
  "agents-tools": "Tools, Skills & Connectors",
  "agents-studio": "Agent Studio",
  "agents-b2c": "Gro10x B2C Agents",
  "agents-platform": "Platform Tool-Agents",
  "agents-b2b": "Company / B2B Agents",
  "agents-ugc": "User-Generated Agents",
  "agents-marketplace": "Marketplace Review",
  "agents-payouts": "Agent Payouts",
  "agents-sessions": "Sessions Log",
  "agents-insights": "Agent Insights",
  leads: "Scorecard Intel",
  interviews: "Mock Calibration",
  salary: "Market Valuation",
  portfolios: "Creative Assets",
  gigs: "Micro-Earning",
  "course-projects": "Course Projects",
  "marketplace-gigs": "Project Gigs",
  "gig-submissions": "Work Evidence",
  "finops-overview": "FinOps Dashboard",
  "finops-talent-credits": "Talent Credits",
  "finops-gro10x-credits": "Gro10x Credits",
  "finops-company-credits": "Company Credits",
  "finops-transactions": "Transactions",
  "finops-pay-infra": "Payment Infrastructure",
  "finops-invoices": "Invoices",
  "finops-withdrawals": "Withdrawals",
  
  "ir-dashboard": "Investor Nexus",
  "ir-targets": "MRR Projections",
  "ir-vcs": "VC Portfolio",
  "ir-investors": "Shareholders",
  "ir-pipeline": "Investor Pipeline",
  "ir-emails": "Executive Updates",
  "ir-dataroom": "Data Room",
  "ir-economics": "Unit Economics",
  "ir-overview": "IR Overview",
  "ir-influencers": "Key Influencers",
  
  // Marketing labels moved to "marketing-*" block above.
  team: "Human Capital",
  // FinOps labels moved to "finops-*" block above.
  institutions: "Institutions Registry",
  "partner-orgs": "Partner Organizations",
  "inst-overview": "Institutions Dashboard",
  "inst-types": "Institution Types",
  "inst-clubs": "Clubs & Departments",
  "inst-reps": "Representatives",
  "inst-events": "Events & Competitions",
  "hr-overview": "Team & Workforce",
  "hr-grades": "Grades & Levels",
  "hr-verticals": "Verticals",
  "hr-functions": "Functions",
  "hr-teams": "Teams",
  "hr-targets": "Targets & Incentives",
  "hr-onboarding": "Onboarding",
  "hr-payroll": "Rewards & Payroll",
  "gtm-overview": "GTM (Geography)",
  "gtm-countries": "Countries",
  "gtm-states": "States / Regions",
  "gtm-cities": "Cities",
  "gtm-clusters": "Clusters",
  "gtm-knowledge": "Knowledge Packs",
  "ugc-overview": "UGC & Contents",
  "jobs-overview": "Jobs Overview",
  "jobs-upload": "Jobs Upload & Approval",
  "jobs-assessments": "Jobs Assessments",
  modules: "Module Architecture",
  "quiz-manage": "Certification Logic",
};

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();

  const defaultTab = useMemo(() => (role === "talent_exec" ? "crm-talent-pool" : "overview"), [role]);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || defaultTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    } else if (!roleLoading) {
      setActiveTab(defaultTab);
    }
  }, [searchParams, defaultTab, roleLoading]);

  const { scope: adminScope, isLoading: scopeLoading } = useAdminScope();

  useEffect(() => {
    if (!authLoading && !roleLoading && !scopeLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      // Allow staff roles OR company-admin scope (owner/admin of a company).
      const allowedByRole = role === "admin" || role === "talent_exec";
      const allowedByCompanyScope = adminScope === "company";
      if (!allowedByRole && !allowedByCompanyScope) {
        toast.error("Shields Active: Restricted Access.");
        navigate("/app/feed");
      }
    }
  }, [user, role, adminScope, authLoading, roleLoading, scopeLoading, navigate]);

  const handleTabChange = (tab: string, additionalParams: Record<string, string> = {}) => {
    setActiveTab(tab);
    setSearchParams({ tab, ...additionalParams });
  };

  if (authLoading || roleLoading || scopeLoading)
    return (
      <div className="h-screen bg-muted/30 p-10 space-y-8 animate-pulse">
        <Skeleton className="h-10 w-48 rounded-full" />
        <DashboardTableSkeleton />
      </div>
    );

  const TabComponent = TAB_COMPONENTS[activeTab];
  const pageTitle = TAB_TITLES[activeTab] ?? "Nexus Console";

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-muted/20 overflow-hidden w-full selection:bg-primary/10">
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} userRole={role} adminScope={adminScope} />

        <main className="flex-1 overflow-y-auto relative bg-background/50">
          <ImpersonationBanner />
          <header className="h-16 flex items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 sticky top-0 z-50">
            <SidebarTrigger className="hover:bg-primary/5 rounded-xl transition-all" />
            <div className="h-4 w-px bg-border" />
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80 truncate">{pageTitle}</h1>
          </header>

          <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Suspense
              fallback={
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full rounded-[32px]" />
                  <DashboardTableSkeleton />
                </div>
              }
            >
              {TabComponent ? (
                (() => {
                  const props: Record<string, any> = {};
                  if (activeTab === "jobs-kpis") props.onNavigateToTab = handleTabChange;
                  if (activeTab === "ir-dashboard") props.onNavigate = handleTabChange;
                  if (activeTab === "ir-emails") props.onClose = () => handleTabChange("ir-dashboard");

                  // PROP INJECTION FOR CURRICULUM TOOLS
                  if (activeTab === "quiz-manage") {
                    props.contentId = searchParams.get("id");
                    props.onBack = () => handleTabChange("learning-courses");
                  }

                  const filters: Record<string, string> = {
                    videos: "free_video",
                    "learning-courses": "recorded_course",
                    "learning-webinars": "live_webinar",
                  };
                  if (filters[activeTab]) props.filter = filters[activeTab];

                  return <TabComponent key={activeTab} {...props} />;
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Module Decryption Failed: "{activeTab}"
                  </p>
                </div>
              )}
            </Suspense>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
