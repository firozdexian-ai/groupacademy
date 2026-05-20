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

/**
 * Phase 7 — Dashboard is now a thin shell.
 * The 146-route lazy registry + title map live in `src/shells/admin/routes/`,
 * split per-domain. This file owns RBAC, search-param sync, and render chrome only.
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
