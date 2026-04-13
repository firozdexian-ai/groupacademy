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
  Plus,
  Target,
  Briefcase,
  RefreshCw,
  AlertCircle,
  Bot,
  Coins,
  Bell,
  Globe,
  TrendingUp,
  PlayCircle,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

interface DashboardStats {
  totalTalents: number;
  registeredRate: number;
  activeEnrollments: number;
  totalRevenue: number;
  commissionPayouts: number;
  assessments: { total: number };
  mockInterviews: { total: number; completed: number };
  portfolios: { total: number; pending: number };
  aiAgents: { totalSessions: number };
  credits: { totalInCirculation: number; transactionsToday: number };
  marketShare: { bdPercentage: number };
}

const initialStats: DashboardStats = {
  totalTalents: 0,
  registeredRate: 0,
  activeEnrollments: 0,
  totalRevenue: 0,
  commissionPayouts: 0,
  assessments: { total: 0 },
  mockInterviews: { total: 0, completed: 0 },
  portfolios: { total: 0, pending: 0 },
  aiAgents: { totalSessions: 0 },
  credits: { totalInCirculation: 0, transactionsToday: 0 },
  marketShare: { bdPercentage: 0 },
};

export function DashboardOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CTO REFACTOR: Fixed type recursion and promise handling
  const fetchCount = async (table: string, queryFn?: (q: any) => any): Promise<number> => {
    try {
      let query = supabase.from(table as any).select("*", { count: "exact", head: true });
      if (queryFn) query = queryFn(query);

      // withTimeout expects a Promise, so we cast the Supabase query
      const { count, error: fetchError } = await withTimeout(
        query as any,
        TIMEOUTS.DEFAULT,
        `Count ${table} timed out`,
      );

      if (fetchError) throw fetchError;
      return count || 0;
    } catch (e) {
      console.warn(`Stat error [${table}]:`, e);
      return 0;
    }
  };

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        talents,
        registered,
        enrollments,
        revenueData,
        commissions,
        assessments,
        interviews,
        portfolios,
        sessions,
        credits,
        txToday,
        bdTalents,
      ] = await Promise.all([
        fetchCount("talents"),
        fetchCount("talents", (q) => q.not("user_id", "is", null)),
        fetchCount("enrollments", (q) => q.eq("status", "active")),
        supabase.from("enrollments" as any).select("payment_amount"),
        supabase
          .from("credit_transactions" as any)
          .select("amount")
          .eq("type", "commission"),
        fetchCount("career_assessments"),
        supabase.from("mock_interviews" as any).select("status"),
        supabase.from("portfolio_requests" as any).select("status"),
        fetchCount("agent_chat_sessions"),
        supabase.from("talent_credits" as any).select("balance"),
        fetchCount("credit_transactions" as any)
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString()),
        fetchCount("talents", (q) => q.ilike("country", "Bangladesh")),
      ]);

      const rev = (revenueData.data || []).reduce(
        (sum: number, item: any) => sum + (Number(item.payment_amount) || 0),
        0,
      );
      const comms = (commissions.data || []).reduce(
        (sum: number, item: any) => sum + Math.abs(Number(item.amount) || 0),
        0,
      );
      const totalCreds = (credits.data || []).reduce((sum: number, item: any) => sum + (Number(item.balance) || 0), 0);

      setStats({
        totalTalents: talents,
        registeredRate: talents > 0 ? Math.round((registered / talents) * 100) : 0,
        activeEnrollments: enrollments,
        totalRevenue: rev,
        commissionPayouts: comms,
        assessments: { total: assessments },
        mockInterviews: {
          total: (interviews.data as any[])?.length || 0,
          completed: (interviews.data as any[])?.filter((i) => i.status === "completed").length || 0,
        },
        portfolios: {
          total: (portfolios.data as any[])?.length || 0,
          pending: (portfolios.data as any[])?.filter((p) => p.status === "pending").length || 0,
        },
        aiAgents: { totalSessions: sessions },
        credits: {
          totalInCirculation: totalCreds,
          transactionsToday: typeof txToday === "number" ? txToday : 0,
        },
        marketShare: { bdPercentage: talents > 0 ? Math.round((bdTalents / talents) * 100) : 0 },
      });
    } catch (err) {
      setError("Strategic data fetch failed. Some metrics may be stale.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) return <DashboardLoadingSkeleton />;

  return (
    <div className="space-y-6 p-1 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Executive Overview</h2>
          <p className="text-muted-foreground">Real-time platform health and monetization metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadStats} className="rounded-full">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate("/dashboard?tab=ai-content-tools")} className="shadow-md">
            <Bot className="mr-2 h-4 w-4" /> AI Content Tools
          </Button>
        </div>
      </header>

      {error && (
        <div className="bg-destructive/15 border border-destructive/30 p-3 rounded-lg flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Talent Pool"
          value={stats.totalTalents.toLocaleString()}
          icon={Users}
          trend={`${stats.registeredRate}% Activation`}
          trendLabel="Registered vs Uploaded"
        />
        <StatsCard
          title="Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
          trend={`$${stats.commissionPayouts.toLocaleString()} Payouts`}
          trendLabel="Commission kickbacks"
        />
        <StatsCard
          title="Market Focus"
          value={`${stats.marketShare.bdPercentage}%`}
          icon={Globe}
          variant="secondary"
          trend="Primary: BD"
          trendLabel="Regional concentration"
        />
        <StatsCard
          title="Credit Economy"
          value={stats.credits.totalInCirculation.toLocaleString()}
          icon={Coins}
          variant="accent"
          trend={`${stats.credits.transactionsToday} daily tx`}
          trendLabel="Total in circulation"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-md font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Service Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Assessments</p>
              <p className="text-2xl font-bold">{stats.assessments.total}</p>
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Interviews</p>
              <p className="text-2xl font-bold">{stats.mockInterviews.completed}</p>
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Portfolios</p>
              <p className="text-2xl font-bold">{stats.portfolios.pending}</p>
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">AI Chats</p>
              <p className="text-2xl font-bold">{stats.aiAgents.totalSessions}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-md font-semibold">LMS Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Learners</span>
              <span className="font-mono font-bold text-primary">{stats.activeEnrollments}</span>
            </div>
            <Button
              variant="outline"
              className="w-full justify-between group"
              onClick={() => navigate("/dashboard?tab=learner-progress")}
            >
              View Progress <BookOpen className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30 border-none">
        <CardHeader>
          <CardTitle className="text-lg">Operational Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <ShortcutButton icon={Users} label="Talent Pool" onClick={() => navigate("/dashboard?tab=talent")} />
          <ShortcutButton icon={Briefcase} label="Jobs" onClick={() => navigate("/dashboard?tab=jobs")} />
          <ShortcutButton icon={Bot} label="AI Agents" onClick={() => navigate("/dashboard?tab=ai-agents")} />
          <ShortcutButton icon={Coins} label="Credits" onClick={() => navigate("/dashboard?tab=credits")} />
          <ShortcutButton icon={Globe} label="Abroad" onClick={() => navigate("/dashboard?tab=study-abroad")} />
          <ShortcutButton icon={TrendingUp} label="IR CRM" onClick={() => navigate("/dashboard?tab=irdashboard")} />
        </CardContent>
      </Card>
    </div>
  );
}

function ShortcutButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button
      variant="secondary"
      className="h-auto py-4 flex flex-col gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
