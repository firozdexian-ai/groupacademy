import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar, ImpersonationBanner, DashboardTableSkeleton } from "@/platform/admin";
import { useAdminScope } from "@/hooks/useAdminScope";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { TAB_COMPONENTS, TAB_TITLES } from "@/shells/admin/routes";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

/**
 * Phase 7 — Dashboard Thin Shell Frame
 * Refactored for clean 2024 professional SaaS styling.
 * Manages central RBAC, query token routing synchronization, and agent error captures.
 */
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
      const allowedByRole = role === "admin" || role === "super_admin" || role === "talent_exec";
      const allowedByCompanyScope = adminScope === "company";
      if (!allowedByRole && !allowedByCompanyScope) {
        toast.error("You don't have permission to access the administrative command hub.");
        navigate("/app/feed");
      }
    }
  }, [user, role, adminScope, authLoading, roleLoading, scopeLoading, navigate]);

  const handleTabChange = (tab: string, additionalParams: Record<string, string> = {}) => {
    setActiveTab(tab);
    setSearchParams({ tab, ...additionalParams });
  };

  if (authLoading || roleLoading || scopeLoading) {
    return (
      <div className="h-screen bg-muted/30 p-10 space-y-8 animate-pulse">
        <Skeleton className="h-10 w-48 rounded-full" />
        <DashboardTableSkeleton />
      </div>
    );
  }

  const TabComponent = TAB_COMPONENTS[activeTab];
  const pageTitle = TAB_TITLES[activeTab] ?? "Command Center";

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-muted/20 overflow-hidden w-full selection:bg-primary/10">
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} userRole={role} adminScope={adminScope} />

        <main className="flex-1 overflow-y-auto relative bg-background/50">
          <ImpersonationBanner />
          <header className="h-16 flex items-center gap-4 border-b bg-background/80 px-6 sticky top-0 z-50 backdrop-blur-md">
            <SidebarTrigger className="hover:bg-primary/5 rounded-xl transition-all" />
            <div className="h-4 w-px bg-border" />
            <h1 className="text-sm font-semibold tracking-tight text-foreground uppercase tracking-wider">{pageTitle}</h1>
          </header>

          <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-top-2 duration-500">
            <RouteErrorBoundary>
            <Suspense
              fallback={
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <DashboardTableSkeleton />
                </div>
              }
            >
              {TabComponent ? (
                (() => {
                  const props: Record<string, any> = {};
                  
                  // Connect domain navigation routing properties across core dashboard views
                  if (activeTab === "jobs-kpis") props.onNavigateToTab = handleTabChange;
                  if (activeTab === "companies" || activeTab === "companies-overview") props.onNavigateToTab = handleTabChange;
                  if (activeTab === "ir-dashboard") props.onNavigate = handleTabChange;
                  if (activeTab === "ir-emails") props.onClose = () => handleTabChange("ir-dashboard");

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
                (() => {
                  // Digital Workforce Rule: Log layout exceptions immediately to central log registers
                  console.error("Dashboard shell intercepted an unregistered tab parameter route:", {
                    activeTab,
                    userId: user?.id
                  });

                  return (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                      <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 mb-2">
                        <Terminal className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground italic">
                        The requested workspace layout link ("{activeTab}") could not be loaded.
                      </p>
                      <button
                        onClick={() => handleTabChange(defaultTab)}
                        className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        Return to Overview Dashboard
                      </button>
                    </div>
                  );
                })()
              )}
            </Suspense>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

// Inline icon element fallback for unmapped states
const Terminal = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

export default Dashboard;