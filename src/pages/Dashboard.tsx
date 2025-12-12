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
import { JobApplicationsManager } from "@/components/dashboard/JobApplicationsManager";
import { CVOutreachGenerator } from "@/components/dashboard/CVOutreachGenerator";
import { TalentPoolManager } from "@/components/dashboard/TalentPoolManager";
import { CompaniesManager } from "@/components/dashboard/CompaniesManager";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Read tab from URL or default to "overview"
  const activeTab = searchParams.get("tab") || "overview";
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    setIsLoading(false);
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

  const renderContent = () => {
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
      case "professions":
        return <ProfessionsManager />;
      case "jobs":
        return <JobsManager />;
      case "applications":
        return <JobApplicationsManager />;
      case "outreach":
        return <CVOutreachGenerator />;
      case "talent":
        return <TalentPoolManager />;
      case "companies":
        return <CompaniesManager />;
      default:
        return <DashboardOverview />;
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      overview: "Overview",
      all: "All Content",
      videos: "Free Videos",
      courses: "Recorded Courses",
      webinars: "Webinars",
      batches: "Batch Classes",
      seminars: "Seminars",
      codes: "Access Codes",
      banners: "Banners",
      leads: "Assessment Leads",
      portfolios: "Portfolio Requests",
      interviews: "Mock Interviews",
      salary: "Salary Analysis",
      professions: "Professions Manager",
      jobs: "Jobs Board",
      applications: "Job Applications",
      outreach: "CV Outreach Generator",
      talent: "Talent Pool",
      companies: "Companies",
    };
    return titles[activeTab] || "Dashboard";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4 px-6 py-3">
              <SidebarTrigger>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SidebarTrigger>
              <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
