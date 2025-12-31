import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Users, BookOpen, DollarSign, Video, Plus, Target, Briefcase, RefreshCw, AlertCircle } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { withTimeout } from "@/hooks/useQueryWithTimeout";

interface DashboardStats {
  totalTalents: number;
  totalLearners: number;
  activeEnrollments: number;
  revenue: number;
  freeVideoViews: number;
  assessments: {
    total: number;
    thisWeek: number;
  };
  mockInterviews: {
    total: number;
    completed: number;
    avgScore: number;
  };
  salaryAnalyses: {
    total: number;
    completed: number;
  };
  portfolios: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    freeRemaining: number;
  };
}

export function DashboardOverview() {
  const navigate = useNavigate();
const [stats, setStats] = useState<DashboardStats>({
    totalTalents: 0,
    totalLearners: 0,
    activeEnrollments: 0,
    revenue: 0,
    freeVideoViews: 0,
    assessments: {
      total: 0,
      thisWeek: 0,
    },
    mockInterviews: {
      total: 0,
      completed: 0,
      avgScore: 0,
    },
    salaryAnalyses: {
      total: 0,
      completed: 0,
    },
    portfolios: {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      freeRemaining: 0,
    },
  });
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setStatsError(null);
    setIsLoading(true);
    try {
      // Load talents count with timeout
      const { count: talentsCount, error: talentsError } = await withTimeout(
        Promise.resolve(supabase.from("talents").select("*", { count: "exact", head: true })),
        30000,
        "Loading timed out"
      );
      if (talentsError) throw talentsError;

      // Load students with enrollments (learners)
      const { count: learnersCount, error: learnersError } = await withTimeout(
        Promise.resolve(supabase.from("enrollments").select("student_id", { count: "exact", head: true })),
        15000,
        "Loading learners timed out"
      );
      if (learnersError) throw learnersError;

      // Load active enrollments with timeout
      const { count: enrollmentsCount, error: enrollmentsError } = await withTimeout(
        Promise.resolve(supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")),
        15000,
        "Loading enrollments timed out"
      );
      if (enrollmentsError) throw enrollmentsError;

      // Calculate revenue (sum of payment_amount) with timeout
      const { data: enrollments, error: revenueError } = await withTimeout(
        Promise.resolve(supabase
          .from("enrollments")
          .select("payment_amount")
          .not("payment_amount", "is", null)),
        15000,
        "Loading revenue timed out"
      );
      if (revenueError) throw revenueError;

      const totalRevenue = enrollments?.reduce((sum, e) => sum + (Number(e.payment_amount) || 0), 0) || 0;

      // Count free videos with timeout
      const { count: videoCount, error: videoError } = await withTimeout(
        Promise.resolve(supabase
          .from("content")
          .select("*", { count: "exact", head: true })
          .eq("content_type", "free_video")),
        15000,
        "Loading videos timed out"
      );
      if (videoError) throw videoError;

      // Career assessment stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { data: assessmentsData, error: assessmentsError } = await withTimeout(
        Promise.resolve(supabase
          .from("career_assessments")
          .select("created_at")),
        15000,
        "Loading assessments timed out"
      );
      if (assessmentsError) throw assessmentsError;

      const totalAssessments = assessmentsData?.length || 0;
      const thisWeekAssessments = assessmentsData?.filter(a => new Date(a.created_at) >= oneWeekAgo).length || 0;

      // Mock interview stats with timeout
      const { data: interviews, error: interviewsError } = await withTimeout(
        Promise.resolve(supabase
          .from("mock_interviews")
          .select("status, selection_percentage")),
        15000,
        "Loading interviews timed out"
      );
      if (interviewsError) throw interviewsError;

      const totalInterviews = interviews?.length || 0;
      const completedInterviews = interviews?.filter(i => i.status === "completed").length || 0;
      const completedWithScores = interviews?.filter(i => i.status === "completed" && i.selection_percentage != null) || [];
      const avgScore = completedWithScores.length > 0 
        ? Math.round(completedWithScores.reduce((sum, i) => sum + (i.selection_percentage || 0), 0) / completedWithScores.length)
        : 0;

      // Salary analysis stats
      const { data: salaryData, error: salaryError } = await withTimeout(
        Promise.resolve(supabase
          .from("salary_analyses")
          .select("status")),
        15000,
        "Loading salary analyses timed out"
      );
      if (salaryError) throw salaryError;

      const totalSalaryAnalyses = salaryData?.length || 0;
      const completedSalaryAnalyses = salaryData?.filter(s => s.status === "completed").length || 0;

      // Portfolio stats with timeout
      const { data: portfolioData, error: portfolioError } = await withTimeout(
        Promise.resolve(supabase
          .from("portfolio_requests")
          .select("status")),
        15000,
        "Loading portfolios timed out"
      );
      if (portfolioError) throw portfolioError;

      const totalPortfolios = portfolioData?.length || 0;
      const pendingPortfolios = portfolioData?.filter(p => p.status === "pending").length || 0;
      const inProgressPortfolios = portfolioData?.filter(p => p.status === "in_progress" || p.status === "contacted").length || 0;
      const completedPortfolios = portfolioData?.filter(p => p.status === "completed").length || 0;
      const FREE_LIMIT = 1000;

      setStats({
        totalTalents: talentsCount || 0,
        totalLearners: learnersCount || 0,
        activeEnrollments: enrollmentsCount || 0,
        revenue: totalRevenue,
        freeVideoViews: videoCount || 0,
        assessments: {
          total: totalAssessments,
          thisWeek: thisWeekAssessments,
        },
        mockInterviews: {
          total: totalInterviews,
          completed: completedInterviews,
          avgScore: avgScore,
        },
        salaryAnalyses: {
          total: totalSalaryAnalyses,
          completed: completedSalaryAnalyses,
        },
        portfolios: {
          total: totalPortfolios,
          pending: pendingPortfolios,
          inProgress: inProgressPortfolios,
          completed: completedPortfolios,
          freeRemaining: Math.max(0, FREE_LIMIT - totalPortfolios),
        },
      });
    } catch (error: any) {
      console.error("Error loading stats:", error);
      const errorMessage = error.message?.includes("timed out") 
        ? "Loading took too long. Please try again."
        : "Failed to load dashboard statistics";
      setStatsError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <Skeleton className="h-8 w-16 mt-2" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-36" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-muted-foreground">Welcome to the GroUp Academy Operations Portal</p>
        </div>
        <Button onClick={() => navigate("/content/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </div>

      {statsError ? (
        <Card>
          <CardContent className="py-6 text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-muted-foreground mb-3">{statsError}</p>
            <Button onClick={loadStats} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <StatsCard
            title="Total Talents"
            value={stats.totalTalents}
            icon={Users}
          />
          <StatsCard
            title="Active Enrollments"
            value={stats.activeEnrollments}
            icon={BookOpen}
            variant="secondary"
          />
          <StatsCard
            title="Revenue (Month)"
            value={`BDT ${stats.revenue.toLocaleString()}`}
            icon={DollarSign}
            variant="success"
          />
          <StatsCard
            title="Career Assessments"
            value={stats.assessments.total}
            icon={Target}
            variant="accent"
            trend={stats.assessments.thisWeek > 0 ? `${stats.assessments.thisWeek} this week` : undefined}
          />
          <StatsCard
            title="Mock Interviews"
            value={stats.mockInterviews.total}
            icon={Target}
            variant="default"
            trend={stats.mockInterviews.total > 0 ? `${Math.round((stats.mockInterviews.completed / stats.mockInterviews.total) * 100)}% completed` : undefined}
            trendLabel={stats.mockInterviews.avgScore > 0 ? `• Avg: ${stats.mockInterviews.avgScore}%` : undefined}
          />
          <StatsCard
            title="Salary Analyses"
            value={stats.salaryAnalyses.total}
            icon={DollarSign}
            variant="secondary"
            trend={stats.salaryAnalyses.total > 0 ? `${stats.salaryAnalyses.completed} completed` : undefined}
          />
          <StatsCard
            title="Portfolio Requests"
            value={stats.portfolios.total}
            icon={Briefcase}
            variant="accent"
            trend={`${stats.portfolios.freeRemaining} free slots left`}
            trendLabel={stats.portfolios.pending > 0 ? `• ${stats.portfolios.pending} pending` : undefined}
          />
          <StatsCard
            title="Free Videos"
            value={stats.freeVideoViews}
            icon={Video}
            variant="default"
          />
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate("/students")}>
              <Users className="w-4 h-4 mr-2" />
              Manage Students
            </Button>
            <Button variant="outline" onClick={() => navigate("/enrollments")}>
              <BookOpen className="w-4 h-4 mr-2" />
              View Enrollments
            </Button>
            <Button variant="outline" onClick={() => navigate("/instructors")}>
              <Users className="w-4 h-4 mr-2" />
              Instructors
            </Button>
            <Button variant="outline" onClick={() => navigate("/sessions")}>
              <Video className="w-4 h-4 mr-2" />
              Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
