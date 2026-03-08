import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  BookOpen,
  DollarSign,
  Video,
  Plus,
  Target,
  Briefcase,
  RefreshCw,
  AlertCircle,
  Bot,
  Coins,
  Bell,
  UserCheck,
  PlayCircle,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

interface DashboardStats {
  totalTalents: number;
  totalLearners: number;
  activeEnrollments: number;
  revenue: number;
  freeVideoViews: number;
  assessments: { total: number; thisWeek: number };
  mockInterviews: { total: number; completed: number; avgScore: number };
  salaryAnalyses: { total: number; completed: number };
  portfolios: { total: number; pending: number; inProgress: number; completed: number; freeRemaining: number };
  aiAgents: { totalSessions: number; activeSessions: number };
  credits: { totalBalance: number; transactionsToday: number };
  notifications: { sentToday: number; unread: number };
}

const initialStats: DashboardStats = {
  totalTalents: 0,
  totalLearners: 0,
  activeEnrollments: 0,
  revenue: 0,
  freeVideoViews: 0,
  assessments: { total: 0, thisWeek: 0 },
  mockInterviews: { total: 0, completed: 0, avgScore: 0 },
  salaryAnalyses: { total: 0, completed: 0 },
  portfolios: { total: 0, pending: 0, inProgress: 0, completed: 0, freeRemaining: 0 },
  aiAgents: { totalSessions: 0, activeSessions: 0 },
  credits: { totalBalance: 0, transactionsToday: 0 },
  notifications: { sentToday: 0, unread: 0 },
};

export function DashboardOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch count safely
  const fetchCount = async (table: string, query?: (q: any) => any) => {
    try {
      let q = (supabase.from as any)(table).select("*", { count: "exact", head: true });
      if (query) q = query(q);
      const { count, error } = await withTimeout(Promise.resolve(q), TIMEOUTS.DEFAULT, `Count ${table} timed out`);
      if (error) throw error;
      return count || 0;
    } catch (e) {
      console.warn(`Failed to fetch count for ${table}`, e);
      return 0;
    }
  };

  const loadStats = useCallback(async () => {
    setStatsError(null);
    setIsLoading(true);

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // PARALLEL EXECUTION: Run all independent queries at once
      const [
        talentsCount,
        learnersCount,
        activeEnrollmentsCount,
        revenueResult,
        videoCount,
        assessmentsData,
        interviewsData,
        salaryData,
        portfolioData,
        agentSessionsCount,
        activeAgentSessionsCount,
        creditsData,
        transactionsTodayCount,
        notificationsTodayCount,
        unreadNotificationsCount,
      ] = await Promise.all([
        // 1. Talents
        fetchCount("talents"),
        // 2. Learners (Unique students in enrollments - approx via enrollments for now or distinct RPC)
        fetchCount("enrollments"),
        // 3. Active Enrollments
        fetchCount("enrollments", (q: any) => q.eq("status", "active")),
        // 4. Revenue (Sum)
        supabase.from("enrollments").select("payment_amount").not("payment_amount", "is", null),
        // 5. Free Videos
        fetchCount("content", (q: any) => q.eq("content_type", "free_video")),
        // 6. Assessments
        supabase.from("career_assessments").select("created_at"),
        // 7. Mock Interviews
        supabase.from("mock_interviews").select("status, selection_percentage"),
        // 8. Salary Analyses
        supabase.from("salary_analyses").select("status"),
        // 9. Portfolios
        supabase.from("portfolio_requests").select("status"),
        // 10. AI Agent Sessions
        fetchCount("agent_chat_sessions"),
        // 11. Active AI Sessions
        fetchCount("agent_chat_sessions", (q: any) => q.eq("is_active", true)),
        // 12. Credits
        supabase.from("talent_credits").select("balance"),
        // 13. Credit Tx Today
        fetchCount("credit_transactions", (q: any) => q.gte("created_at", todayStart.toISOString())),
        // 14. Notifications Today
        fetchCount("notifications", (q: any) => q.gte("created_at", todayStart.toISOString())),
        // 15. Unread Notifications
        fetchCount("notifications", (q: any) => q.eq("is_read", false)),
      ]);

      // --- Process Results ---

      // Revenue
      const totalRevenue = revenueResult.data?.reduce((sum, e) => sum + (Number(e.payment_amount) || 0), 0) || 0;

      // Assessments
      const totalAssessments = assessmentsData.data?.length || 0;
      const thisWeekAssessments =
        assessmentsData.data?.filter((a: any) => new Date(a.created_at) >= oneWeekAgo).length || 0;

      // Interviews
      const interviews = interviewsData.data || [];
      const completedInterviews = interviews.filter((i: any) => i.status === "completed").length;
      const completedWithScores = interviews.filter(
        (i: any) => i.status === "completed" && i.selection_percentage != null,
      );
      const avgScore =
        completedWithScores.length > 0
          ? Math.round(
              completedWithScores.reduce((sum: number, i: any) => sum + (i.selection_percentage || 0), 0) /
                completedWithScores.length,
            )
          : 0;

      // Salary
      const salaryAnalyses = salaryData.data || [];
      const completedSalary = salaryAnalyses.filter((s: any) => s.status === "completed").length;

      // Portfolios
      const portfolios = portfolioData.data || [];
      const pendingPortfolios = portfolios.filter((p: any) => p.status === "pending").length;
      const inProgressPortfolios = portfolios.filter((p: any) =>
        ["in_progress", "contacted"].includes(p.status),
      ).length;
      const completedPortfolios = portfolios.filter((p: any) => p.status === "completed").length;
      const FREE_LIMIT = 1000;

      // Credits
      const totalCreditsBalance = creditsData.data?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0;

      setStats({
        totalTalents: talentsCount,
        totalLearners: learnersCount, // Approximation based on total enrollments for now
        activeEnrollments: activeEnrollmentsCount,
        revenue: totalRevenue,
        freeVideoViews: videoCount,
        assessments: { total: totalAssessments, thisWeek: thisWeekAssessments },
        mockInterviews: { total: interviews.length, completed: completedInterviews, avgScore },
        salaryAnalyses: { total: salaryAnalyses.length, completed: completedSalary },
        portfolios: {
          total: portfolios.length,
          pending: pendingPortfolios,
          inProgress: inProgressPortfolios,
          completed: completedPortfolios,
          freeRemaining: Math.max(0, FREE_LIMIT - portfolios.length),
        },
        aiAgents: { totalSessions: agentSessionsCount, activeSessions: activeAgentSessionsCount },
        credits: { totalBalance: totalCreditsBalance, transactionsToday: transactionsTodayCount },
        notifications: { sentToday: notificationsTodayCount, unread: unreadNotificationsCount },
      });
    } catch (error: any) {
      console.error("Error loading stats:", error);
      setStatsError("Failed to load some dashboard statistics. Retrying might help.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between mb-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">Operational metrics and key performance indicators.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadStats} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => navigate("/content/new")}>
            <Plus className="mr-2 h-4 w-4" /> Add Content
          </Button>
        </div>
      </div>

      {statsError && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-4 flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{statsError}</p>
          </CardContent>
        </Card>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Talents" value={stats.totalTalents} icon={Users} trendLabel="Registered users" />
        <StatsCard
          title="Total Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
          trendLabel="Lifetime revenue"
        />
        <StatsCard
          title="Active Enrollments"
          value={stats.activeEnrollments}
          icon={BookOpen}
          variant="secondary"
          trendLabel="Current learners"
        />
        <StatsCard
          title="Credits Balance"
          value={stats.credits.totalBalance.toLocaleString()}
          icon={Coins}
          variant="accent"
          trend={`${stats.credits.transactionsToday} tx today`}
        />
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Career Assessments"
          value={stats.assessments.total}
          icon={Target}
          trend={`${stats.assessments.thisWeek} this week`}
        />
        <StatsCard
          title="Mock Interviews"
          value={stats.mockInterviews.total}
          icon={Bot}
          trend={`${stats.mockInterviews.completed} completed`}
          trendLabel={`Avg Score: ${stats.mockInterviews.avgScore}%`}
        />
        <StatsCard
          title="Portfolio Requests"
          value={stats.portfolios.total}
          icon={Briefcase}
          variant="secondary"
          trend={`${stats.portfolios.pending} pending`}
          trendLabel={`${stats.portfolios.freeRemaining} free slots`}
        />
        <StatsCard
          title="Salary Analyses"
          value={stats.salaryAnalyses.total}
          icon={DollarSign}
          trend={`${stats.salaryAnalyses.completed} completed`}
        />
        <StatsCard
          title="AI Agent Sessions"
          value={stats.aiAgents.totalSessions}
          icon={Bot}
          trend={`${stats.aiAgents.activeSessions} active now`}
        />
        <StatsCard
          title="Notifications"
          value={stats.notifications.sentToday}
          icon={Bell}
          trend={`${stats.notifications.unread} unread`}
          trendLabel="Sent today"
        />
      </div>

      {/* Quick Actions Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/dashboard?tab=talent")}
          >
            <Users className="h-5 w-5" />
            <span>Manage Talent</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/dashboard?tab=enrollments")}
          >
            <BookOpen className="h-5 w-5" />
            <span>Enrollments</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/dashboard?tab=jobs")}>
            <Briefcase className="h-5 w-5" />
            <span>Post Job</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/dashboard?tab=companies")}
          >
            <UserCheck className="h-5 w-5" />
            <span>Verify Company</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/content/new")}
          >
            <Video className="h-5 w-5" />
            <span>Upload Video</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/sessions")}
          >
            <PlayCircle className="h-5 w-5" />
            <span>Live Sessions</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
