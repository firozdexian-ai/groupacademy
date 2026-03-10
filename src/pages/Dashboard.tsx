import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import ContentList from "@/components/dashboard/ContentList";
import { AccessCodeManager } from "@/components/AccessCodeManager";
import { BannerManager } from "@/components/dashboard/BannerManager";
import { AssessmentLeadsManager } from "@/components/dashboard/AssessmentLeadsManager";
import PortfolioRequestsManager from "@/components/dashboard/PortfolioRequestsManager";
import { MockInterviewLeadsManager } from "@/components/dashboard/MockInterviewLeadsManager";
import { ProfessionsManager } from "@/components/dashboard/ProfessionsManager";
import { SalaryAnalysisLeadsManager } from "@/components/dashboard/SalaryAnalysisLeadsManager";
import { JobsManager } from "@/components/dashboard/JobsManager";
import { JobsKPIDashboard } from "@/components/dashboard/JobsKPIDashboard";
import { JobApplicationsManager } from "@/components/dashboard/JobApplicationsManager";
import { CVOutreachGenerator } from "@/components/dashboard/CVOutreachGenerator";
import { TalentPoolManager } from "@/components/dashboard/TalentPoolManager";
import { CompaniesManager } from "@/components/dashboard/CompaniesManager";
import { TeamManager } from "@/components/dashboard/TeamManager";
import { AIAgentsManager } from "@/components/dashboard/AIAgentsManager";
import { CreditsManager } from "@/components/dashboard/CreditsManager";
import { NotificationsManager } from "@/components/dashboard/NotificationsManager";
import { AgentSessionsManager } from "@/components/dashboard/AgentSessionsManager";
import { CompanyAgentsManager } from "@/components/dashboard/CompanyAgentsManager";
import { IndustriesManager } from "@/components/dashboard/IndustriesManager";
import { EnrollmentsManager } from "@/components/dashboard/EnrollmentsManager";
import { LearnerProgressManager } from "@/components/dashboard/LearnerProgressManager"; // 👈 Added Import
import { StudyAbroadManager } from "@/components/dashboard/StudyAbroadManager";
import { IELTSResourcesManager } from "@/components/dashboard/IELTSResourcesManager";
import { StudyAbroadRoadmapLeadsManager } from "@/components/dashboard/StudyAbroadRoadmapLeadsManager";
import { CompetitionsManager } from "@/components/dashboard/CompetitionsManager";
import { BlogManager } from "@/components/dashboard/BlogManager";
import { LeadHunterManager } from "@/components/dashboard/LeadHunterManager";
import { ContactsManager } from "@/components/dashboard/ContactsManager";
import { ContentOutreachManager } from "@/components/dashboard/ContentOutreachManager";
import { ServiceOutreachManager } from "@/components/dashboard/ServiceOutreachManager";
import { MarketingAnalytics } from "@/components/dashboard/MarketingAnalytics";
import { FeedPostsManager } from "@/components/dashboard/FeedPostsManager";
import { GigsManager } from "@/components/dashboard/GigsManager";
import { GigSubmissionsManager } from "@/components/dashboard/GigSubmissionsManager";
import { MarketplaceGigsManager } from "@/components/dashboard/MarketplaceGigsManager";
import { IRDashboard } from "@/components/dashboard/ir/IRDashboard";
import { MRRTargetManager } from "@/components/dashboard/ir/MRRTargetManager";
import { BatchContentGenerator } from "@/components/dashboard/BatchContentGenerator";
import { VCFirmsManager } from "@/components/dashboard/ir/VCFirmsManager";
import { InvestorsManager } from "@/components/dashboard/ir/InvestorsManager";
import { EmailComposer } from "@/components/dashboard/ir/EmailComposer";
import { PaymentSettingsManager } from "@/components/dashboard/PaymentSettingsManager";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

// Define which tabs are accessible by which roles
const tabAccessMap: Record<string, AppRole[]> = {
  // Admin only - Overview
  overview: ["admin"],
  
  // Learning - Admin only
  all: ["admin"],
  videos: ["admin"],
  courses: ["admin"],
  webinars: ["admin"],
  enrollments: ["admin"],
  "learner-progress": ["admin"],
  
  
  // Talent & Leads - Both roles
  talent: ["admin", "talent_exec"],
  "lead-hunter": ["admin", "talent_exec"],
  professions: ["admin", "talent_exec"],
  
  // Recruitment - Both roles
  "jobs-kpis": ["admin", "talent_exec"],
  jobs: ["admin", "talent_exec"],
  applications: ["admin", "talent_exec"],
  companies: ["admin", "talent_exec"],
  contacts: ["admin", "talent_exec"],
  industries: ["admin", "talent_exec"],
  
  // Marketing & Outreach - Both roles
  analytics: ["admin", "talent_exec"],
  outreach: ["admin", "talent_exec"],
  "content-outreach": ["admin", "talent_exec"],
  "service-outreach": ["admin", "talent_exec"],
  blog: ["admin", "talent_exec"],
  "feed-posts": ["admin", "talent_exec"],
  competitions: ["admin", "talent_exec"],
  
  // Career Abroad - Admin only
  "study-abroad": ["admin"],
  ielts: ["admin"],
  "roadmap-leads": ["admin"],
  
  // AI & Monetization - Admin only
  "ai-agents": ["admin"],
  "company-agents": ["admin"],
  "agent-sessions": ["admin"],
  leads: ["admin"],
  interviews: ["admin"],
  salary: ["admin"],
  portfolios: ["admin"],
  gigs: ["admin"],
  "marketplace-gigs": ["admin"],
  "gig-submissions": ["admin"],
  credits: ["admin"],
  notifications: ["admin"],
  
  // Investor Relations - Admin only
  "ir-dashboard": ["admin"],
  "ir-targets": ["admin"],
  "ir-vcs": ["admin"],
  "ir-investors": ["admin"],
  "ir-emails": ["admin"],
  
  // Platform Config - Admin only
  // Platform Config - Admin only
  codes: ["admin"],
  banners: ["admin"],
  team: ["admin"],
  payments: ["admin"],
};
const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Read tab from URL or default based on role
  const activeTab = searchParams.get("tab") || (userRole === "talent_exec" ? "outreach" : "overview");

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Validate tab access when role changes
  useEffect(() => {
    if (!userRole || isLoading) return;

    const currentTab = searchParams.get("tab");
    if (currentTab) {
      const allowedRoles = tabAccessMap[currentTab];
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to allowed tab
        const defaultTab = userRole === "talent_exec" ? "outreach" : "overview";
        setSearchParams({ tab: defaultTab });
        toast.error("You don't have access to that section");
      }
    }
  }, [userRole, isLoading, searchParams]);

  const checkAuth = async () => {
    setAuthError(null);
    try {
      const {
        data: { user },
      } = await withTimeout(supabase.auth.getUser(), TIMEOUTS.AUTH, "Authentication check timed out");
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      // Fetch user role with timeout
      const result = await withTimeout(
        (async () => {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .in("role", ["admin", "talent_exec"]);
          return { data, error };
        })(),
        TIMEOUTS.DEFAULT,
        "Failed to load user permissions",
      );

      const { data: roleData } = result;

      if (!roleData || roleData.length === 0) {
        toast.error("Dashboard access required");
        navigate("/my-learning");
        return;
      }

      // Set the highest role (admin takes precedence)
      const hasAdmin = roleData.some((r) => r.role === "admin");
      setUserRole(hasAdmin ? "admin" : "talent_exec");

      setIsLoading(false);
    } catch (error: any) {
      console.error("Auth check error:", error);
      const errorMessage = error.message?.includes("timed out")
        ? "Loading took too long. Please try again."
        : "Failed to verify access. Please try again.";
      setAuthError(errorMessage);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorState type="server" title="Failed to Load Dashboard" description={authError} onRetry={checkAuth} />
      </div>
    );
  }

  const renderContent = () => {
    // Check access before rendering
    const allowedRoles = tabAccessMap[activeTab];
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have access to this section.</p>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return <DashboardOverview />;
      case "all":
        return <ContentList />;
      case "videos":
        return <ContentList filter="free_video" />;
      case "courses":
        return <ContentList filter="recorded_course" />;
      case "webinars":
        return <ContentList filter="live_webinar" />;
      case "batches":
        return <ContentList filter="batch_class" />;
      case "seminars":
        return <ContentList filter="offline_seminar" />;
      case "codes":
        return <AccessCodeManager />;
      case "banners":
        return <BannerManager />;
      case "leads":
        return <AssessmentLeadsManager />;
      case "portfolios":
        return <PortfolioRequestsManager />;
      case "interviews":
        return <MockInterviewLeadsManager />;
      case "salary":
        return <SalaryAnalysisLeadsManager />;
      case "enrollments":
        return <EnrollmentsManager />;
      case "learner-progress":
        return <LearnerProgressManager />;
      case "ai-content-tools":
        return <BatchContentGenerator />;
      case "professions":
        return <ProfessionsManager />;
      case "jobs-kpis":
        return <JobsKPIDashboard onNavigateToTab={setActiveTab} />;
      case "jobs":
        return <JobsManager />;
      case "applications":
        return <JobApplicationsManager />;
      case "outreach":
        return <CVOutreachGenerator />;
      case "talent":
        return <TalentPoolManager />;
      case "lead-hunter":
        return <LeadHunterManager />;
      case "companies":
        return <CompaniesManager />;
      case "contacts":
        return <ContactsManager />;
      case "industries":
        return <IndustriesManager />;
      case "team":
        return <TeamManager />;
      case "ai-agents":
        return <AIAgentsManager />;
      case "company-agents":
        return <CompanyAgentsManager />;
      case "agent-sessions":
        return <AgentSessionsManager />;
      case "gigs":
        return <GigsManager />;
      case "marketplace-gigs":
        return <MarketplaceGigsManager />;
      case "gig-submissions":
        return <GigSubmissionsManager />;
      case "credits":
        return <CreditsManager />;
      case "notifications":
        return <NotificationsManager />;
      case "study-abroad":
        return <StudyAbroadManager />;
      case "ielts":
        return <IELTSResourcesManager />;
      case "roadmap-leads":
        return <StudyAbroadRoadmapLeadsManager />;
      case "competitions":
        return <CompetitionsManager />;
      case "blog":
        return <BlogManager />;
      case "feed-posts":
        return <FeedPostsManager />;
      case "content-outreach":
        return <ContentOutreachManager />;
      case "service-outreach":
        return <ServiceOutreachManager />;
      case "analytics":
        return <MarketingAnalytics />;
      case "ir-dashboard":
        return <IRDashboard onNavigate={setActiveTab} />;
      case "ir-targets":
        return <MRRTargetManager />;
      case "ir-vcs":
        return <VCFirmsManager />;
      case "ir-investors":
        return <InvestorsManager />;
      case "ir-emails":
        return <EmailComposer />;
      case "payments":
        return <PaymentSettingsManager />;
      default:
        return userRole === "talent_exec" ? <CVOutreachGenerator /> : <DashboardOverview />;
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      overview: "Overview",
      all: "All Content",
      videos: "Free Videos",
      courses: "Recorded Courses",
      webinars: "Live Sessions",
      codes: "Access Codes",
      banners: "Banners",
      leads: "Assessment Leads",
      portfolios: "Portfolio Requests",
      interviews: "Mock Interview Leads",
      salary: "Salary Analysis Leads",
      professions: "Professions Manager",
      "lead-hunter": "Lead Hunter",
      "jobs-kpis": "Jobs KPIs",
      jobs: "Jobs Board",
      applications: "Job Applications",
      outreach: "CV Outreach",
      talent: "Talent Pool",
      companies: "Companies",
      contacts: "Contacts",
      industries: "Industries",
      team: "Team Members",
      "ai-agents": "AI Agents",
      "company-agents": "Company Agents",
      "agent-sessions": "Agent Sessions",
      gigs: "Manage Gigs",
      "marketplace-gigs": "Marketplace Gigs",
      "gig-submissions": "Gig Submissions",
      credits: "Credits Manager",
      notifications: "Notifications",
      "study-abroad": "Study Abroad Programs",
      ielts: "IELTS Resources",
      "roadmap-leads": "Roadmap Leads",
      competitions: "Competitions",
      blog: "Blog Posts",
      "feed-posts": "Feed Posts",
      "content-outreach": "Content Outreach",
      "service-outreach": "Service Outreach",
      "learner-progress": "Learner Progress",
      "ai-content-tools": "AI Content Tools",
      enrollments: "Enrollments",
      analytics: "Marketing Analytics",
      "ir-dashboard": "Investor Relations",
      "ir-targets": "MRR Targets",
      "ir-vcs": "VC Firms",
      "ir-investors": "Investors",
      "ir-emails": "Email Updates",
      payments: "Payment Settings",
    };
    return titles[activeTab] || "Dashboard";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} userRole={userRole} />
        <SidebarInset className="flex-1 overflow-x-hidden">
          {/* Header */}
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4 px-3 sm:px-6 py-3">
              <SidebarTrigger>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SidebarTrigger>
              <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-3 sm:p-6">{renderContent()}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
