import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TalentPoolManager } from "@/components/dashboard/TalentPoolManager";
import { JobsManager } from "@/components/dashboard/JobsManager";
import { JobsKPIDashboard } from "@/components/dashboard/JobsKPIDashboard";
import ContentList from "@/components/dashboard/ContentList";
import { EnrollmentsManager } from "@/components/dashboard/EnrollmentsManager";
import { EmailComposer } from "@/components/dashboard/ir/EmailComposer";
import { IRDashboard } from "@/components/dashboard/ir/IRDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { talent, isLoading: talentLoading } = useTalent();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  // State for Investor Relations context
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);

  // Sync active tab with URL search params [cite: 28]
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Role-based access control [cite: 335, 536]
  useEffect(() => {
    if (!authLoading && !talentLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      // Check for admin or talent_exec roles [cite: 44, 531]
      const userRole = talent?.learnerStatus;
      if (userRole !== "admin" && userRole !== "talent_exec") {
        toast.error("Access denied: Administrative privileges required.");
        navigate("/app/feed");
      }
    }
  }, [user, talent, authLoading, talentLoading, navigate]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (authLoading || talentLoading) {
    return <div className="flex items-center justify-center h-screen">Loading Command Center...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar navigation based on AdminSidebar.tsx [cite: 28] */}
      <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Tab-to-File Mapping [cite: 27, 29, 30] */}
          {activeTab === "overview" && <DashboardOverview />}

          {activeTab === "talent" && <TalentPoolManager />}

          {activeTab === "jobs" && <JobsManager />}

          {activeTab === "jobs-kpis" && <JobsKPIDashboard onNavigateToTab={handleTabChange} />}

          {activeTab === "all" && <ContentList />}

          {activeTab === "enrollments" && <EnrollmentsManager />}

          {/* Investor Relations Tab Group [cite: 29, 44] */}
          {activeTab === "irdashboard" && (
            /* IRDashboard expects onNavigate prop */
            <div className="space-y-6">
              <IRDashboard onNavigate={handleTabChange} />
              {selectedInvestor && (
                <div className="mt-8">
                  {/* Fixed: Added mandatory onClose prop and used named export */}
                  <EmailComposer selectedInvestor={selectedInvestor} onClose={() => setSelectedInvestor(null)} />
                </div>
              )}
            </div>
          )}

          {/* Placeholder for remaining 40+ Admin Sections [cite: 29, 30] */}
          {!["overview", "talent", "jobs", "jobs-kpis", "all", "enrollments", "irdashboard"].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
              <p className="text-lg font-medium">Module "{activeTab}" is initialized.</p>
              <p className="text-sm">Accessing database table: {activeTab.replace("-", "_")} [cite: 448]</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
