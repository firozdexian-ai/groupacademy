import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardTableSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * CTO NOTE: Every module is lazy-loaded to optimize LCP (Largest Contentful Paint).
 * This ensures the admin interface remains snappy regardless of module count.
 */
const TAB_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  overview: React.lazy(() =>
    import("@/components/dashboard/DashboardOverview").then((m) => ({ default: m.DashboardOverview })),
  ),
  workforce: React.lazy(() =>
    import("@/components/dashboard/WorkforceManager").then((m) => ({ default: m.WorkforceManager })),
  ),
  talent: React.lazy(() =>
    import("@/components/dashboard/TalentPoolManager").then((m) => ({ default: m.TalentPoolManager })),
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
  "jobs-hub": React.lazy(() =>
    import("@/components/dashboard/jobs-hub/JobsHub").then((m) => ({ default: m.JobsHub })),
  ),
  applications: React.lazy(() =>
    import("@/components/dashboard/JobApplicationsManager").then((m) => ({ default: m.JobApplicationsManager })),
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
  "agent-sessions": React.lazy(() =>
    import("@/components/dashboard/AgentSessionsManager").then((m) => ({ default: m.AgentSessionsManager })),
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
  "marketplace-gigs": React.lazy(() =>
    import("@/components/dashboard/MarketplaceGigsManager").then((m) => ({ default: m.MarketplaceGigsManager })),
  ),
  "gig-submissions": React.lazy(() =>
    import("@/components/dashboard/GigSubmissionsManager").then((m) => ({ default: m.GigSubmissionsManager })),
  ),
  credits: React.lazy(() =>
    import("@/components/dashboard/CreditsManager").then((m) => ({ default: m.CreditsManager })),
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
  "support-assistant": React.lazy(() =>
    import("@/components/dashboard/SupportAssistant").then((m) => ({ default: m.SupportAssistant })),
  ),
  codes: React.lazy(() => import("@/components/AccessCodeManager").then((m) => ({ default: m.AccessCodeManager }))),
  banners: React.lazy(() => import("@/components/dashboard/BannerManager").then((m) => ({ default: m.BannerManager }))),
  team: React.lazy(() => import("@/components/dashboard/TeamManager").then((m) => ({ default: m.TeamManager }))),
  payments: React.lazy(() =>
    import("@/components/dashboard/PaymentSettingsManager").then((m) => ({ default: m.PaymentSettingsManager })),
  ),
  invoices: React.lazy(() =>
    import("@/components/dashboard/payments/InvoiceManager").then((m) => ({ default: m.InvoiceManager })),
  ),
};

const TAB_TITLES: Record<string, string> = {
  overview: "Control Center",
  workforce: "Workforce",
  talent: "Talent Intel",
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
  "agent-sessions": "Session Logs",
  leads: "Scorecard Intel",
  interviews: "Mock Calibration",
  salary: "Market Valuation",
  portfolios: "Creative Assets",
  gigs: "Micro-Earning",
  "marketplace-gigs": "Project Gigs",
  "gig-submissions": "Work Evidence",
  credits: "Financial Ledger",
  notifications: "System Alerts",
  "ir-dashboard": "Investor Nexus",
  "ir-targets": "MRR Projections",
  "ir-vcs": "VC Portfolio",
  ir_investors: "Shareholders",
  "ir-emails": "Executive Updates",
  "support-assistant": "Helpdesk AI",
  codes: "Priority Codes",
  banners: "Display Layer",
  team: "Human Capital",
  payments: "Gateway Logic",
  invoices: "Invoice Manager",
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

  // CTO Security Guard: Prevents unauthorized logic execution
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (role !== "admin" && role !== "talent_exec") {
        toast.error("Shields Active: Restricted Access.");
        navigate("/app/feed");
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (authLoading || roleLoading)
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
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} userRole={role} />

        <main className="flex-1 overflow-y-auto relative bg-background/50">
          {/* Executive Glassmorphism Header */}
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
                  // Module Routing Injections
                  if (activeTab === "jobs-kpis") props.onNavigateToTab = handleTabChange;
                  if (activeTab === "ir-dashboard") props.onNavigate = handleTabChange;
                  if (activeTab === "ir-emails") props.onClose = () => handleTabChange("ir-dashboard");

                  // Shared Content Filters
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
                  <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
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
