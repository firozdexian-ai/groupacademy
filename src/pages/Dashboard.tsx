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
  workforce: React.lazy(() =>
    import("@/components/dashboard/WorkforceManager").then((m) => ({ default: m.WorkforceManager })),
  ),
  talent: React.lazy(() =>
    import("@/components/dashboard/TalentPoolManager").then((m) => ({ default: m.TalentPoolManager })),
  ),
  "talent-overview": React.lazy(() =>
    import("@/components/dashboard/talent/TalentOverviewTab").then((m) => ({ default: m.TalentOverviewTab })),
  ),
  "talent-aisha": React.lazy(() =>
    import("@/components/dashboard/talent/AishaConsoleTab").then((m) => ({ default: m.AishaConsoleTab })),
  ),
  "talent-ai-general": React.lazy(() =>
    import("@/components/dashboard/talent/AIGeneralConsoleTab").then((m) => ({ default: m.AIGeneralConsoleTab })),
  ),
  "talent-upload": React.lazy(() =>
    import("@/components/dashboard/talent/TalentUploadTab").then((m) => ({ default: m.TalentUploadTab })),
  ),
  "talent-outreach": React.lazy(() =>
    import("@/components/dashboard/talent/TalentOutreachConsoleTab").then((m) => ({
      default: m.TalentOutreachConsoleTab,
    })),
  ),
  "talent-creator-economy": React.lazy(() =>
    import("@/components/dashboard/talent/CreatorEconomyTab").then((m) => ({ default: m.CreatorEconomyTab })),
  ),
  "lead-hunter": React.lazy(() =>
    import("@/components/dashboard/LeadHunterManager").then((m) => ({ default: m.LeadHunterManager })),
  ),
  professions: React.lazy(() =>
    import("@/components/dashboard/ProfessionsManager").then((m) => ({ default: m.ProfessionsManager })),
  ),
  "jobs-kpis": React.lazy(() =>
    import("@/components/dashboard/JobsKPIDashboard").then((m) => ({ default: m.JobsKPIDashboard })),
  ),
  jobs: React.lazy(() => import("@/components/dashboard/JobsManager").then((m) => ({ default: m.JobsManager }))),
  "jobs-hub": React.lazy(() => import("@/components/dashboard/jobs-hub/JobsHub").then((m) => ({ default: m.JobsHub }))),
  applications: React.lazy(() =>
    import("@/components/dashboard/JobApplicationsManager").then((m) => ({ default: m.JobApplicationsManager })),
  ),
  "applications-pipeline": React.lazy(() =>
    import("@/components/dashboard/AdminApplicationsPipeline").then((m) => ({
      default: m.AdminApplicationsPipeline,
    })),
  ),
  "sourcing-admin": React.lazy(() =>
    import("@/components/dashboard/AdminTalentSourcing").then((m) => ({
      default: m.AdminTalentSourcing,
    })),
  ),
  "sourcing-pipeline": React.lazy(() =>
    import("@/components/dashboard/AdminSourcingPipeline").then((m) => ({
      default: m.AdminSourcingPipeline,
    })),
  ),
  companies: React.lazy(() =>
    import("@/components/dashboard/CompaniesManager").then((m) => ({ default: m.CompaniesManager })),
  ),
  contacts: React.lazy(() =>
    import("@/components/dashboard/ContactsManager").then((m) => ({ default: m.ContactsManager })),
  ),
  "company-agents": React.lazy(() =>
    import("@/components/dashboard/CompanyAgentsManager").then((m) => ({ default: m.CompanyAgentsManager })),
  ),
  industries: React.lazy(() =>
    import("@/components/dashboard/IndustriesManager").then((m) => ({ default: m.IndustriesManager })),
  ),
  "companies-overview": React.lazy(() =>
    import("@/components/dashboard/companies/CompaniesOverviewTab").then((m) => ({ default: m.CompaniesOverviewTab })),
  ),
  "companies-riya": React.lazy(() =>
    import("@/components/dashboard/companies/RiyaConsoleTab").then((m) => ({ default: m.RiyaConsoleTab })),
  ),
  "companies-ai-general": React.lazy(() =>
    import("@/components/dashboard/companies/CompanyAIGeneralTab").then((m) => ({ default: m.CompanyAIGeneralTab })),
  ),
  "companies-outreach": React.lazy(() =>
    import("@/components/dashboard/companies/CompanyOutreachConsoleTab").then((m) => ({
      default: m.CompanyOutreachConsoleTab,
    })),
  ),
  all: React.lazy(() => import("@/components/dashboard/ContentList")),
  videos: React.lazy(() => import("@/components/dashboard/ContentList")),
  courses: React.lazy(() => import("@/components/dashboard/ContentList")),
  webinars: React.lazy(() => import("@/components/dashboard/ContentList")),
  enrollments: React.lazy(() =>
    import("@/components/dashboard/EnrollmentsManager").then((m) => ({ default: m.EnrollmentsManager })),
  ),
  "learner-progress": React.lazy(() =>
    import("@/components/dashboard/LearnerProgressManager").then((m) => ({ default: m.LearnerProgressManager })),
  ),
  "ai-content-tools": React.lazy(() =>
    import("@/components/dashboard/BatchContentGenerator").then((m) => ({ default: m.BatchContentGenerator })),
  ),
  analytics: React.lazy(() =>
    import("@/components/dashboard/MarketingAnalytics").then((m) => ({ default: m.MarketingAnalytics })),
  ),
  outreach: React.lazy(() =>
    import("@/components/dashboard/CVOutreachGenerator").then((m) => ({ default: m.CVOutreachGenerator })),
  ),
  "content-outreach": React.lazy(() =>
    import("@/components/dashboard/ContentOutreachManager").then((m) => ({ default: m.ContentOutreachManager })),
  ),
  "service-outreach": React.lazy(() =>
    import("@/components/dashboard/ServiceOutreachManager").then((m) => ({ default: m.ServiceOutreachManager })),
  ),
  blog: React.lazy(() => import("@/components/dashboard/BlogManager").then((m) => ({ default: m.BlogManager }))),
  "feed-posts": React.lazy(() =>
    import("@/components/dashboard/FeedPostsManager").then((m) => ({ default: m.FeedPostsManager })),
  ),
  competitions: React.lazy(() =>
    import("@/components/dashboard/CompetitionsManager").then((m) => ({ default: m.CompetitionsManager })),
  ),
  "study-abroad": React.lazy(() =>
    import("@/components/dashboard/StudyAbroadManager").then((m) => ({ default: m.StudyAbroadManager })),
  ),
  ielts: React.lazy(() =>
    import("@/components/dashboard/IELTSResourcesManager").then((m) => ({ default: m.IELTSResourcesManager })),
  ),
  "roadmap-leads": React.lazy(() =>
    import("@/components/dashboard/StudyAbroadRoadmapLeadsManager").then((m) => ({
      default: m.StudyAbroadRoadmapLeadsManager,
    })),
  ),
  "ai-agents": React.lazy(() =>
    import("@/components/dashboard/AIAgentsManager").then((m) => ({ default: m.AIAgentsManager })),
  ),
  "agent-studio": React.lazy(() =>
    import("@/components/dashboard/AgentStudio").then((m) => ({ default: m.AgentStudio })),
  ),
  "agent-triggers": React.lazy(() =>
    import("@/components/dashboard/AgentTriggers").then((m) => ({ default: m.AgentTriggers })),
  ),
  "agent-marketplace": React.lazy(() =>
    import("@/components/dashboard/AgentMarketplaceReview").then((m) => ({ default: m.AgentMarketplaceReview })),
  ),
  "agent-sessions": React.lazy(() =>
    import("@/components/dashboard/AgentSessionsManager").then((m) => ({ default: m.AgentSessionsManager })),
  ),
  "agent-insights": React.lazy(() =>
    import("@/components/dashboard/AgentInsights").then((m) => ({ default: m.AgentInsights })),
  ),
  "agent-payouts": React.lazy(() =>
    import("@/components/dashboard/AgentPayoutsManager").then((m) => ({ default: m.AgentPayoutsManager })),
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
    import("@/components/dashboard/AgentStudio").then((m) => ({ default: m.AgentStudio })),
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
    import("@/components/dashboard/AgentMarketplaceReview").then((m) => ({ default: m.AgentMarketplaceReview })),
  ),
  "agents-payouts": React.lazy(() =>
    import("@/components/dashboard/AgentPayoutsManager").then((m) => ({ default: m.AgentPayoutsManager })),
  ),
  "agents-manager": React.lazy(() =>
    import("@/components/dashboard/agents/AgentManagerConsoleTab").then((m) => ({ default: m.AgentManagerConsoleTab })),
  ),
  "agents-sessions": React.lazy(() =>
    import("@/components/dashboard/AgentSessionsManager").then((m) => ({ default: m.AgentSessionsManager })),
  ),
  "agents-insights": React.lazy(() =>
    import("@/components/dashboard/AgentInsights").then((m) => ({ default: m.AgentInsights })),
  ),
  leads: React.lazy(() =>
    import("@/components/dashboard/AssessmentLeadsManager").then((m) => ({ default: m.AssessmentLeadsManager })),
  ),
  interviews: React.lazy(() =>
    import("@/components/dashboard/MockInterviewLeadsManager").then((m) => ({ default: m.MockInterviewLeadsManager })),
  ),
  salary: React.lazy(() =>
    import("@/components/dashboard/SalaryAnalysisLeadsManager").then((m) => ({
      default: m.SalaryAnalysisLeadsManager,
    })),
  ),
  portfolios: React.lazy(() => import("@/components/dashboard/PortfolioRequestsManager")),
  gigs: React.lazy(() => import("@/components/dashboard/GigsManager").then((m) => ({ default: m.GigsManager }))),
  "course-projects": React.lazy(() =>
    import("@/components/dashboard/CourseProjectsManager").then((m) => ({ default: m.CourseProjectsManager })),
  ),
  "marketplace-gigs": React.lazy(() =>
    import("@/components/dashboard/MarketplaceGigsManager").then((m) => ({ default: m.MarketplaceGigsManager })),
  ),
  "gig-submissions": React.lazy(() =>
    import("@/components/dashboard/GigSubmissionsManager").then((m) => ({ default: m.GigSubmissionsManager })),
  ),
  credits: React.lazy(() =>
    import("@/components/dashboard/CreditsManager").then((m) => ({ default: m.CreditsManager })),
  ),
  withdrawals: React.lazy(() =>
    import("@/components/dashboard/WithdrawalsPanel").then((m) => ({ default: m.WithdrawalsPanel })),
  ),
  notifications: React.lazy(() =>
    import("@/components/dashboard/NotificationsManager").then((m) => ({ default: m.NotificationsManager })),
  ),
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
  "ir-emails": React.lazy(() =>
    import("@/components/dashboard/ir/EmailComposer").then((m) => ({ default: m.EmailComposer })),
  ),
  "ir-overview": React.lazy(() => import("@/components/dashboard/investors/IROverviewTab")),
  "ir-influencers": React.lazy(() => import("@/components/dashboard/investors/KeyInfluencersTab")),
  "ir-relationship-exec": React.lazy(() => import("@/components/dashboard/investors/RelationshipExecConsoleTab")),
  "ir-fpa-agent": React.lazy(() => import("@/components/dashboard/investors/FpaAgentConsoleTab")),
  "support-assistant": React.lazy(() =>
    import("@/components/dashboard/SupportAssistant").then((m) => ({ default: m.SupportAssistant })),
  ),
  codes: React.lazy(() => import("@/components/AccessCodeManager").then((m) => ({ default: m.AccessCodeManager }))),
  banners: React.lazy(() => import("@/components/dashboard/BannerManager").then((m) => ({ default: m.BannerManager }))),
  "profile-card-themes": React.lazy(() => import("@/components/dashboard/ProfileCardThemeManager").then((m) => ({ default: m.ProfileCardThemeManager }))),
  team: React.lazy(() => import("@/components/dashboard/TeamManager").then((m) => ({ default: m.TeamManager }))),
  "payments-legacy": React.lazy(() =>
    import("@/components/dashboard/PaymentSettingsManager").then((m) => ({ default: m.PaymentSettingsManager })),
  ),
  invoices: React.lazy(() =>
    import("@/components/dashboard/payments/InvoiceManager").then((m) => ({ default: m.InvoiceManager })),
  ),
  institutions: React.lazy(() =>
    import("@/components/dashboard/StakeholderRegistry").then((m) => ({ default: m.InstitutionsManager })),
  ),
  "partner-orgs": React.lazy(() =>
    import("@/components/dashboard/StakeholderRegistry").then((m) => ({ default: m.PartnerOrgsManager })),
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
  "inst-outreach": React.lazy(() => import("@/components/dashboard/institutions/InstOutreachTab")),
  "inst-analyst": React.lazy(() => import("@/components/dashboard/institutions/InstAnalystTab")),
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
    import("@/components/dashboard/hr/HrSimpleTabs").then((m) => ({ default: m.HrTargetsTab })),
  ),
  "hr-onboarding": React.lazy(() =>
    import("@/components/dashboard/hr/HrSimpleTabs").then((m) => ({ default: m.HrOnboardingTab })),
  ),
  "hr-payroll": React.lazy(() =>
    import("@/components/dashboard/hr/HrSimpleTabs").then((m) => ({ default: m.HrPayrollTab })),
  ),
  "gtm-overview": React.lazy(() =>
    import("@/components/dashboard/gtm/GtmTabs").then((m) => ({ default: m.GtmOverviewTab })),
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
  "ugc-overview": React.lazy(() => import("@/components/dashboard/ugc/UgcOverviewTab")),
  "jobs-overview": React.lazy(() => import("@/components/dashboard/jobs/JobsOverviewTab")),
  "jobs-upload": React.lazy(() => import("@/components/dashboard/jobs/JobsUploadApprovalTab")),
  "jobs-assessments": React.lazy(() => import("@/components/dashboard/jobs/JobsAssessmentsTab")),
  "learn-overview": React.lazy(() => import("@/components/dashboard/learn/LearnOverviewTab")),
  academies: React.lazy(() =>
    import("@/components/dashboard/learn/LearnSimpleTabs").then((m) => ({ default: m.AcademiesTab })),
  ),
  schools: React.lazy(() =>
    import("@/components/dashboard/learn/LearnSimpleTabs").then((m) => ({ default: m.SchoolsTab })),
  ),
  "professional-lives": React.lazy(() =>
    import("@/components/dashboard/learn/LearnSimpleTabs").then((m) => ({ default: m.ProfessionalLivesTab })),
  ),
  "career-tracks": React.lazy(() => import("@/components/dashboard/ContentList")),
  graduates: React.lazy(() => import("@/components/dashboard/learn/GraduatesTab")),
  "b2b-courses": React.lazy(() => import("@/components/dashboard/learn/B2BCoursesTab")),
  "course-briefs": React.lazy(() => import("@/components/dashboard/learn/CourseBriefsTab")),
  "cohorts": React.lazy(() => import("@/components/dashboard/learn/CohortsTab")),
  "gig-overview": React.lazy(() => import("@/components/dashboard/gig/GigOverviewTab")),
  "quick-action-gigs": React.lazy(() => import("@/components/dashboard/gig/QuickActionGigsTab")),
  "client-projects": React.lazy(() => import("@/components/dashboard/gig/ClientProjectsTab")),
  "gig-workers-wallet": React.lazy(() => import("@/components/dashboard/gig/GigWorkersWalletTab")),
  "abroad-overview": React.lazy(() => import("@/components/dashboard/abroad/AbroadOverviewTab")),
  "mkt-channels": React.lazy(() =>
    import("@/components/dashboard/marketing/MktSimpleTabs").then((m) => ({ default: m.ChannelsTab })),
  ),
  "mkt-community": React.lazy(() =>
    import("@/components/dashboard/marketing/MktSimpleTabs").then((m) => ({ default: m.CommunityTab })),
  ),
  "mkt-admins-reps": React.lazy(() => import("@/components/dashboard/marketing/AdminsRepsTab")),
  "leads-activities": React.lazy(() => import("@/components/dashboard/marketing/LeadsActivitiesTab")),
  "fin-overview": React.lazy(() => import("@/components/dashboard/finance/FinOverviewTab")),
  "gro10x-credits": React.lazy(() =>
    import("@/components/dashboard/finance/CreditsTabs").then((m) => ({ default: m.Gro10xCreditsTab })),
  ),
  "company-credits": React.lazy(() =>
    import("@/components/dashboard/finance/CreditsTabs").then((m) => ({ default: m.CompanyCreditsTab })),
  ),
  transactions: React.lazy(() =>
    import("@/components/dashboard/finance/CreditsTabs").then((m) => ({ default: m.TransactionsTab })),
  ),
  payments: React.lazy(() => import("@/components/dashboard/finance/PaymentInfraTab")),
  modules: React.lazy(() => import("@/components/dashboard/ModulePickerPanel")),
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
  talent: "Talent Intel",
  "talent-upload": "Talent Upload",
  "talent-outreach": "Talent Outreach",
  "lead-hunter": "Lead Acquisition",
  professions: "Taxonomies",
  "jobs-kpis": "Growth Analytics",
  jobs: "Job Pipeline",
  "jobs-hub": "Jobs Hub",
  applications: "Candidate Flow",
  companies: "Employer CRM",
  contacts: "B2B Contacts",
  "company-agents": "Internal Agents",
  industries: "Verticals",
  "companies-overview": "Companies Overview",
  "companies-riya": "Riya Console",
  "companies-ai-general": "Company AI General",
  "companies-outreach": "Company Outreach",
  all: "Catalog Architecture",
  videos: "Digital Library",
  courses: "Academy Courses",
  webinars: "Live Syncs",
  enrollments: "Student Ingestion",
  "learner-progress": "Academic Velocity",
  "ai-content-tools": "Generative Suite",
  analytics: "Conversion Intel",
  outreach: "CV Intelligence",
  "content-outreach": "Campaign Hub",
  "service-outreach": "Service Sync",
  blog: "Thought Leadership",
  "feed-posts": "Network Stream",
  competitions: "Gamification",
  "study-abroad": "International Ed",
  ielts: "Linguistic Prep",
  "roadmap-leads": "Global Pipeline",
  "ai-agents": "Neural Workforce",
  "agent-studio": "Agent Studio",
  "agent-triggers": "Channel Triggers",
  "agent-marketplace": "Marketplace Review",
  "agent-sessions": "Session Logs",
  "agent-insights": "Agent Insights",
  "agent-payouts": "Agent Payouts",
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
  "agents-manager": "Agent Manager",
  "agents-sessions": "Sessions Log",
  "agents-insights": "Agent Insights",
  leads: "Scorecard Intel",
  interviews: "Mock Calibration",
  salary: "Market Valuation",
  portfolios: "Creative Assets",
  gigs: "Micro-Earning",
  "course-projects": "Course Projects",
  "course-briefs": "Course Briefs",
  "marketplace-gigs": "Project Gigs",
  "gig-submissions": "Work Evidence",
  credits: "Financial Ledger",
  withdrawals: "Withdrawals",
  notifications: "System Alerts",
  "ir-dashboard": "Investor Nexus",
  "ir-targets": "MRR Projections",
  "ir-vcs": "VC Portfolio",
  "ir-investors": "Shareholders", // CTO FIX: Corrected from ir_investors to map properly
  "ir-emails": "Executive Updates",
  "ir-overview": "IR Overview",
  "ir-influencers": "Key Influencers",
  "ir-relationship-exec": "Relationship Exec",
  "ir-fpa-agent": "Fundraising FP&A",
  "support-assistant": "Helpdesk AI",
  codes: "Priority Codes",
  banners: "Display Layer",
  "profile-card-themes": "Profile Card Themes",
  team: "Human Capital",
  payments: "Gateway Logic",
  invoices: "Invoice Manager",
  institutions: "Institutions Registry",
  "partner-orgs": "Partner Organizations",
  "inst-overview": "Institutions Dashboard",
  "inst-types": "Institution Types",
  "inst-clubs": "Clubs & Departments",
  "inst-reps": "Representatives",
  "inst-events": "Events & Competitions",
  "inst-outreach": "Institutions Outreach",
  "inst-analyst": "Organizations Analyst",
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

  const defaultTab = useMemo(() => (role === "talent_exec" ? "talent" : "overview"), [role]);
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
                    props.onBack = () => handleTabChange("courses");
                  }

                  const filters: Record<string, string> = {
                    videos: "free_video",
                    courses: "recorded_course",
                    webinars: "live_webinar",
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
