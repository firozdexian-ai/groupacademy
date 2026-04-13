import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardTableSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTalent } from "@/hooks/useTalent";
import { useUserRole } from "@/components/ProtectedRoute";
import { toast } from "sonner";

// Lazy-load every tab component
const DashboardOverview = React.lazy(() => import("@/components/dashboard/DashboardOverview").then(m => ({ default: m.DashboardOverview })));
const WorkforceManager = React.lazy(() => import("@/components/dashboard/WorkforceManager").then(m => ({ default: m.WorkforceManager })));
const TalentPoolManager = React.lazy(() => import("@/components/dashboard/TalentPoolManager").then(m => ({ default: m.TalentPoolManager })));
const LeadHunterManager = React.lazy(() => import("@/components/dashboard/LeadHunterManager").then(m => ({ default: m.LeadHunterManager })));
const ProfessionsManager = React.lazy(() => import("@/components/dashboard/ProfessionsManager").then(m => ({ default: m.ProfessionsManager })));
const JobsKPIDashboard = React.lazy(() => import("@/components/dashboard/JobsKPIDashboard").then(m => ({ default: m.JobsKPIDashboard })));
const JobsManager = React.lazy(() => import("@/components/dashboard/JobsManager").then(m => ({ default: m.JobsManager })));
const JobApplicationsManager = React.lazy(() => import("@/components/dashboard/JobApplicationsManager").then(m => ({ default: m.JobApplicationsManager })));
const CompaniesManager = React.lazy(() => import("@/components/dashboard/CompaniesManager").then(m => ({ default: m.CompaniesManager })));
const ContactsManager = React.lazy(() => import("@/components/dashboard/ContactsManager").then(m => ({ default: m.ContactsManager })));
const CompanyAgentsManager = React.lazy(() => import("@/components/dashboard/CompanyAgentsManager").then(m => ({ default: m.CompanyAgentsManager })));
const IndustriesManager = React.lazy(() => import("@/components/dashboard/IndustriesManager").then(m => ({ default: m.IndustriesManager })));
const ContentList = React.lazy(() => import("@/components/dashboard/ContentList"));
const EnrollmentsManager = React.lazy(() => import("@/components/dashboard/EnrollmentsManager").then(m => ({ default: m.EnrollmentsManager })));
const LearnerProgressManager = React.lazy(() => import("@/components/dashboard/LearnerProgressManager").then(m => ({ default: m.LearnerProgressManager })));
const BatchContentGenerator = React.lazy(() => import("@/components/dashboard/BatchContentGenerator").then(m => ({ default: m.BatchContentGenerator })));
const MarketingAnalytics = React.lazy(() => import("@/components/dashboard/MarketingAnalytics").then(m => ({ default: m.MarketingAnalytics })));
const CVOutreachGenerator = React.lazy(() => import("@/components/dashboard/CVOutreachGenerator").then(m => ({ default: m.CVOutreachGenerator })));
const ContentOutreachManager = React.lazy(() => import("@/components/dashboard/ContentOutreachManager").then(m => ({ default: m.ContentOutreachManager })));
const ServiceOutreachManager = React.lazy(() => import("@/components/dashboard/ServiceOutreachManager").then(m => ({ default: m.ServiceOutreachManager })));
const BlogManager = React.lazy(() => import("@/components/dashboard/BlogManager").then(m => ({ default: m.BlogManager })));
const FeedPostsManager = React.lazy(() => import("@/components/dashboard/FeedPostsManager").then(m => ({ default: m.FeedPostsManager })));
const CompetitionsManager = React.lazy(() => import("@/components/dashboard/CompetitionsManager").then(m => ({ default: m.CompetitionsManager })));
const StudyAbroadManager = React.lazy(() => import("@/components/dashboard/StudyAbroadManager").then(m => ({ default: m.StudyAbroadManager })));
const IELTSResourcesManager = React.lazy(() => import("@/components/dashboard/IELTSResourcesManager").then(m => ({ default: m.IELTSResourcesManager })));
const StudyAbroadRoadmapLeadsManager = React.lazy(() => import("@/components/dashboard/StudyAbroadRoadmapLeadsManager").then(m => ({ default: m.StudyAbroadRoadmapLeadsManager })));
const AIAgentsManager = React.lazy(() => import("@/components/dashboard/AIAgentsManager").then(m => ({ default: m.AIAgentsManager })));
const AgentSessionsManager = React.lazy(() => import("@/components/dashboard/AgentSessionsManager").then(m => ({ default: m.AgentSessionsManager })));
const AssessmentLeadsManager = React.lazy(() => import("@/components/dashboard/AssessmentLeadsManager").then(m => ({ default: m.AssessmentLeadsManager })));
const MockInterviewLeadsManager = React.lazy(() => import("@/components/dashboard/MockInterviewLeadsManager").then(m => ({ default: m.MockInterviewLeadsManager })));
const SalaryAnalysisLeadsManager = React.lazy(() => import("@/components/dashboard/SalaryAnalysisLeadsManager").then(m => ({ default: m.SalaryAnalysisLeadsManager })));
const PortfolioRequestsManager = React.lazy(() => import("@/components/dashboard/PortfolioRequestsManager"));
const GigsManager = React.lazy(() => import("@/components/dashboard/GigsManager").then(m => ({ default: m.GigsManager })));
const MarketplaceGigsManager = React.lazy(() => import("@/components/dashboard/MarketplaceGigsManager").then(m => ({ default: m.MarketplaceGigsManager })));
const GigSubmissionsManager = React.lazy(() => import("@/components/dashboard/GigSubmissionsManager").then(m => ({ default: m.GigSubmissionsManager })));
const CreditsManager = React.lazy(() => import("@/components/dashboard/CreditsManager").then(m => ({ default: m.CreditsManager })));
const NotificationsManager = React.lazy(() => import("@/components/dashboard/NotificationsManager").then(m => ({ default: m.NotificationsManager })));
const IRDashboard = React.lazy(() => import("@/components/dashboard/ir/IRDashboard").then(m => ({ default: m.IRDashboard })));
const MRRTargetManager = React.lazy(() => import("@/components/dashboard/ir/MRRTargetManager").then(m => ({ default: m.MRRTargetManager })));
const VCFirmsManager = React.lazy(() => import("@/components/dashboard/ir/VCFirmsManager").then(m => ({ default: m.VCFirmsManager })));
const InvestorsManager = React.lazy(() => import("@/components/dashboard/ir/InvestorsManager").then(m => ({ default: m.InvestorsManager })));
const EmailComposer = React.lazy(() => import("@/components/dashboard/ir/EmailComposer").then(m => ({ default: m.EmailComposer })));
const SupportAssistant = React.lazy(() => import("@/components/dashboard/SupportAssistant").then(m => ({ default: m.SupportAssistant })));
const AccessCodeManager = React.lazy(() => import("@/components/AccessCodeManager").then(m => ({ default: m.AccessCodeManager })));
const BannerManager = React.lazy(() => import("@/components/dashboard/BannerManager").then(m => ({ default: m.BannerManager })));
const TeamManager = React.lazy(() => import("@/components/dashboard/TeamManager").then(m => ({ default: m.TeamManager })));
const PaymentSettingsManager = React.lazy(() => import("@/components/dashboard/PaymentSettingsManager").then(m => ({ default: m.PaymentSettingsManager })));

// Tab → Component map (keys match AdminSidebar nav item values exactly)
const TAB_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  overview: DashboardOverview,
  workforce: WorkforceManager,
  talent: TalentPoolManager,
  "lead-hunter": LeadHunterManager,
  professions: ProfessionsManager,
  "jobs-kpis": JobsKPIDashboard,
  jobs: JobsManager,
  applications: JobApplicationsManager,
  companies: CompaniesManager,
  contacts: ContactsManager,
  "company-agents": CompanyAgentsManager,
  industries: IndustriesManager,
  all: ContentList,
  enrollments: EnrollmentsManager,
  "learner-progress": LearnerProgressManager,
  "ai-content-tools": BatchContentGenerator,
  analytics: MarketingAnalytics,
  outreach: CVOutreachGenerator,
  "content-outreach": ContentOutreachManager,
  "service-outreach": ServiceOutreachManager,
  blog: BlogManager,
  "feed-posts": FeedPostsManager,
  competitions: CompetitionsManager,
  "study-abroad": StudyAbroadManager,
  ielts: IELTSResourcesManager,
  "roadmap-leads": StudyAbroadRoadmapLeadsManager,
  "ai-agents": AIAgentsManager,
  "agent-sessions": AgentSessionsManager,
  leads: AssessmentLeadsManager,
  interviews: MockInterviewLeadsManager,
  salary: SalaryAnalysisLeadsManager,
  portfolios: PortfolioRequestsManager,
  gigs: GigsManager,
  "marketplace-gigs": MarketplaceGigsManager,
  "gig-submissions": GigSubmissionsManager,
  credits: CreditsManager,
  notifications: NotificationsManager,
  "ir-dashboard": IRDashboard,
  "ir-targets": MRRTargetManager,
  "ir-vcs": VCFirmsManager,
  "ir-investors": InvestorsManager,
  "ir-emails": EmailComposer,
  "support-assistant": SupportAssistant,
  codes: AccessCodeManager,
  banners: BannerManager,
  team: TeamManager,
  payments: PaymentSettingsManager,
};

// Some components accept an onNavigateToTab or onNavigate prop
const TABS_WITH_NAVIGATE = new Set(["jobs-kpis", "ir-dashboard"]);

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (role !== "admin" && role !== "talent_exec") {
        toast.error("Access denied: Administrative privileges required.");
        navigate("/app/feed");
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (authLoading || roleLoading) {
    return <div className="flex items-center justify-center h-screen">Loading Command Center...</div>;
  }

  const TabComponent = TAB_COMPONENTS[activeTab];

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-muted overflow-hidden w-full">
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        <main className="flex-1 overflow-y-auto">
          <header className="h-12 flex items-center border-b bg-background px-4 sticky top-0 z-10">
            <SidebarTrigger />
          </header>

          <div className="p-6 max-w-7xl mx-auto">
            <Suspense fallback={<DashboardTableSkeleton />}>
              {TabComponent ? (
                (() => {
                  const props: Record<string, any> = {};
                  if (activeTab === "jobs-kpis") props.onNavigateToTab = handleTabChange;
                  if (activeTab === "ir-dashboard") props.onNavigate = handleTabChange;
                  if (activeTab === "ir-emails") props.onClose = () => handleTabChange("ir-dashboard");
                  return <TabComponent {...props} />;
                })()
              
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                  <p className="text-lg font-medium">Module "{activeTab}" not found.</p>
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
