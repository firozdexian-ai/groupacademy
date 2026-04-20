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
  Target,
  Briefcase,
  RefreshCw,
  AlertCircle,
  Bot,
  Coins,
  Globe,
  TrendingUp,
  ShieldCheck,
  Activity,
  Zap,
  LayoutDashboard,
  ArrowUpRight,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Executive Command Center (Dashboard Overview)
 * High-fidelity orchestrator for real-time platform health and monetization telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced parallel ingestion.
 */

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

  const fetchCount = async (table: string, filter?: (q: any) => any): Promise<number> => {
    try {
      let query = supabase.from(table as any).select("*", { count: "exact", head: true });
      if (filter) query = filter(query);
      const result = await withTimeout(query as any, TIMEOUTS.DEFAULT, `Count ${table} timeout`);
      return (result as any).count || 0;
    } catch (e) {
      return 0;
    }
  };

  const loadExecutiveTelemetry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // PERFORM PARALLEL HANDSHAKE
      const [
        talents,
        registered,
        enrollments,
        revData,
        commsData,
        assessments,
        interviews,
        portfolios,
        sessions,
        creditsData,
        bdTalents,
        txTodayResult,
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
        fetchCount("talents", (q) => q.ilike("country", "Bangladesh")),
        supabase
          .from("credit_transactions" as any)
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString()),
      ]);

      const rev = (revData.data || []).reduce((sum: number, i: any) => sum + (Number(i.payment_amount) || 0), 0);
      const comms = (commsData.data || []).reduce((sum: number, i: any) => sum + Math.abs(Number(i.amount) || 0), 0);
      const totalCreds = (creditsData.data || []).reduce((sum: number, i: any) => sum + (Number(i.balance) || 0), 0);

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
        credits: { totalInCirculation: totalCreds, transactionsToday: (txTodayResult as any).count || 0 },
        marketShare: { bdPercentage: talents > 0 ? Math.round((bdTalents / talents) * 100) : 0 },
      });
    } catch (err) {
      setError("Strategic data fetch partially failed. Registry sync active.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExecutiveTelemetry();
  }, [loadExecutiveTelemetry]);

  if (isLoading) return <DashboardLoadingSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive HUD Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <LayoutDashboard className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Executive HUD</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Real-time Platform Health & Monetization Registry
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={loadExecutiveTelemetry}
            className="rounded-xl h-12 w-12 border-2 hover:rotate-180 transition-transform duration-700"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => navigate("/dashboard?tab=ai-content-tools")}
            className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 group"
          >
            <Bot className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" /> AI Content Protocols
          </Button>
        </div>
      </header>

      {error && (
        <div className="bg-destructive/10 border-2 border-destructive/20 p-4 rounded-2xl flex items-center gap-3 text-destructive font-bold uppercase text-[10px] tracking-widest animate-bounce">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      {/* KPI Artifact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Talent Registry"
          value={stats.totalTalents.toLocaleString()}
          icon={Users}
          trend={`${stats.registeredRate}% SYNC'D`}
          trendLabel="Registration delta"
        />
        <StatsCard
          title="Gross Liquidity"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
          trend={`$${stats.commissionPayouts.toLocaleString()} COMM`}
          trendLabel="Payout protocols"
        />
        <StatsCard
          title="Regional Index"
          value={`${stats.marketShare.bdPercentage}%`}
          icon={Globe}
          variant="secondary"
          trend="Primary Market: BD"
          trendLabel="Geo concentration"
        />
        <StatsCard
          title="Token Economy"
          value={stats.credits.totalInCirculation.toLocaleString()}
          icon={Coins}
          variant="accent"
          trend={`${stats.credits.transactionsToday} DAILY TX`}
          trendLabel="Registry delta"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Performance Cluster */}
        <Card className="lg:col-span-2 rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden group">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <CardHeader className="p-8 pb-2 border-b border-border/10 bg-muted/10">
            <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" /> Performance Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-8 p-10">
            {[
              { label: "Assessments", val: stats.assessments.total, icon: Target },
              { label: "Interviews", val: stats.mockInterviews.completed, icon: ShieldCheck },
              { label: "Portfolios", val: stats.portfolios.pending, icon: Briefcase },
              { label: "AI Sessions", val: stats.aiAgents.totalSessions, icon: Zap },
            ].map((item, i) => (
              <div key={i} className="space-y-2 group/item">
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest group-hover/item:text-primary transition-colors">
                  {item.label}
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black italic tracking-tighter leading-none">{item.val}</p>
                  <item.icon className="h-4 w-4 text-primary/20 group-hover/item:text-primary transition-all group-hover/item:-translate-y-1" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* LMS Pulse Node */}
        <Card className="rounded-[40px] border-2 border-primary/20 bg-primary/5 shadow-xl flex flex-col justify-between overflow-hidden">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="text-lg font-black uppercase tracking-tighter italic">LMS Deployment Pulse</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
                  Active Nodes
                </p>
                <p className="text-5xl font-black italic tracking-tighter text-primary leading-none">
                  {stats.activeEnrollments}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-primary opacity-20" />
            </div>
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl justify-between group border-primary/30 hover:bg-primary hover:text-white font-black uppercase text-[10px] tracking-[0.2em] px-6 transition-all"
              onClick={() => navigate("/dashboard?tab=learner-progress")}
            >
              Interrogate Progress{" "}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Operational Protocol Shortcuts */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/10 shadow-inner overflow-hidden">
        <CardHeader className="p-8 border-b border-border/10">
          <CardTitle className="text-lg font-black uppercase tracking-tighter italic">Operational Protocols</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-8">
          {[
            { icon: Users, label: "Talent Pool", tab: "talent" },
            { icon: Briefcase, label: "Job Registry", tab: "jobs" },
            { icon: Bot, label: "AI Agents", tab: "ai-agents" },
            { icon: Coins, label: "Fiscal Ledger", tab: "credits" },
            { icon: Globe, label: "Abroad Log", tab: "study-abroad" },
            { icon: TrendingUp, label: "IR Terminal", tab: "irdashboard" },
          ].map((btn, i) => (
            <ShortcutButton
              key={i}
              icon={btn.icon}
              label={btn.label}
              onClick={() => navigate(`/dashboard?tab=${btn.tab}`)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ShortcutButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className="h-auto py-8 flex flex-col gap-4 bg-background/50 hover:bg-primary hover:text-white transition-all duration-500 rounded-3xl border-2 shadow-sm group"
      onClick={onClick}
    >
      <Icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </Button>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <Skeleton className="h-32 w-full rounded-[40px]" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-[32px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-56 lg:col-span-2 rounded-[40px]" />
        <Skeleton className="h-56 rounded-[40px]" />
      </div>
      <Skeleton className="h-40 w-full rounded-[40px]" />
    </div>
  );
}
