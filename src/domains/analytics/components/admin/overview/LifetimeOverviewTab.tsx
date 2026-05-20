/**
 * Lifetime Overview — Refactored Executive HUD
 * CTO Version: May 2026
 * Fixes: F1, F3, F4, F5 | Polish: P2, P9
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Globe,
  Coins,
  RefreshCw,
  AlertCircle,
  Activity,
  Target,
  ShieldCheck,
  Briefcase,
  Zap,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { OverviewSkeleton } from "./OverviewSkeleton";
import { AgentAnomalyFeed } from "./AgentAnomalyFeed";

// Canonical exchange rate from Platform Reference
const BDT_TO_USD = 0.0084; // Approx based on 1 credit = 2 BDT logic

interface DashboardStats {
  totalTalents: number;
  registeredRate: number;
  activeEnrollments: number;
  totalRevenueBDT: number;
  commissionPayouts: number;
  assessments: { total: number };
  mockInterviews: { total: number; completed: number };
  portfolios: { total: number; pending: number };
  aiAgents: { totalSessions: number };
  credits: { totalInCirculation: number; transactionsToday: number };
  topMarket: { name: string; percentage: number };
}

const initialStats: DashboardStats = {
  totalTalents: 0,
  registeredRate: 0,
  activeEnrollments: 0,
  totalRevenueBDT: 0,
  commissionPayouts: 0,
  assessments: { total: 0 },
  mockInterviews: { total: 0, completed: 0 },
  portfolios: { total: 0, pending: 0 },
  aiAgents: { totalSessions: 0 },
  credits: { totalInCirculation: 0, transactionsToday: 0 },
  topMarket: { name: "Detecting...", percentage: 0 },
};

export function LifetimeOverviewTab() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // F3: Aggregate credit pools (talent + company; gro10x_credits not yet provisioned)
      const [
        talentCount,
        regCount,
        enrollCount,
        revRes,
        commRes,
        assessCount,
        intRes,
        portRes,
        sessionCount,
        talentCreds,
        companyCreds,
        countryStats,
        txTodayResult,
      ] = await Promise.all([
        supabase.from("talents").select("*", { count: "exact", head: true }),
        supabase.from("talents").select("*", { count: "exact", head: true }).not("user_id", "is", null),
        supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("enrollments").select("payment_amount"),
        // Real column is `transaction_type`; commission rows are negative amounts
        supabase.from("credit_transactions").select("amount").eq("transaction_type", "commission"),
        supabase.from("career_assessments").select("*", { count: "exact", head: true }),
        supabase.from("mock_interviews").select("status"),
        supabase.from("portfolio_requests").select("status"),
        supabase.from("agent_chat_sessions").select("*", { count: "exact", head: true }),
        supabase.from("talent_credits").select("balance"),
        supabase.from("company_credits").select("balance"),
        supabase.rpc("get_top_countries" as any),
        supabase
          .from("credit_transactions")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString()),
      ]);

      const talents = talentCount.count || 0;
      const registered = regCount.count || 0;

      // F5 Calculation
      const rev = ((revRes.data as any[]) || []).reduce((s, i) => s + (Number(i.payment_amount) || 0), 0);
      const comms = ((commRes.data as any[]) || []).reduce((s, i) => s + Math.abs(Number(i.amount) || 0), 0);

      // F3 Summation
      const totalTalentBalance = ((talentCreds.data as any[]) || []).reduce((s, i) => s + (Number(i.balance) || 0), 0);
      const totalCompanyBalance = ((companyCreds.data as any[]) || []).reduce((s, i) => s + (Number(i.balance) || 0), 0);

      // F4 Dynamic Country Detection
      const topCountry = (countryStats.data as any[])?.[0] || { country: "N/A", count: 0 };

      setStats({
        totalTalents: talents,
        registeredRate: talents > 0 ? Math.round((registered / talents) * 100) : 0,
        activeEnrollments: enrollCount.count || 0,
        totalRevenueBDT: rev,
        commissionPayouts: comms,
        assessments: { total: assessCount.count || 0 },
        mockInterviews: {
          total: (intRes.data as any[])?.length || 0,
          completed: (intRes.data as any[])?.filter((i) => i.status === "completed").length || 0,
        },
        portfolios: {
          total: (portRes.data as any[])?.length || 0,
          pending: (portRes.data as any[])?.filter((p) => p.status === "pending").length || 0,
        },
        aiAgents: { totalSessions: sessionCount.count || 0 },
        credits: {
          totalInCirculation: totalTalentBalance + totalCompanyBalance,
          transactionsToday: txTodayResult.count || 0,
        },
        topMarket: {
          name: topCountry.country,
          percentage: talents > 0 ? Math.round((topCountry.count / talents) * 100) : 0,
        },
      });
    } catch (err) {
      console.error(err);
      setError("Platform telemetry sync failed. Agent bypass required.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) return <OverviewSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* P2: In-tab Actions only (Header removed to dedupe Dashboard top bar) */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(true)}
          disabled={isRefreshing}
          className="rounded-xl border-2 gap-2 h-10 px-4 font-black uppercase text-[10px] tracking-widest"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Syncing..." : "Refresh HUD"}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border-2 border-destructive/20 p-4 rounded-2xl flex items-center gap-3 text-destructive font-bold uppercase text-[10px] tracking-widest">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Talent Registry"
          value={stats.totalTalents.toLocaleString()}
          icon={Users}
          trend={`${stats.registeredRate}% SYNC'D`}
          trendLabel="Registration delta"
        />
        {/* F5: Correct BDT Currency & USD Subtitle */}
        <StatsCard
          title="Gross Liquidity"
          value={`৳${stats.totalRevenueBDT.toLocaleString("en-BD")}`}
          icon={Zap}
          variant="success"
          trend={`≈ $${(stats.totalRevenueBDT * BDT_TO_USD).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD`}
          trendLabel="Current valuation"
        />
        {/* F4: Dynamic Market Detection */}
        <StatsCard
          title="Regional Index"
          value={`${stats.topMarket.percentage}%`}
          icon={Globe}
          variant="secondary"
          trend={`Primary Market: ${stats.topMarket.name}`}
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
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
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
                <div key={i} className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                    {item.label}
                  </p>
                  <div className="flex items-end gap-2">
                    <p className="text-4xl font-black italic tracking-tighter leading-none">{item.val}</p>
                    <item.icon className="h-4 w-4 text-primary/20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[40px] border-2 border-primary/20 bg-primary/5 shadow-xl">
            <CardHeader className="p-8 pb-2 border-b border-primary/10">
              <CardTitle className="text-lg font-black uppercase tracking-tighter italic text-primary">
                LMS Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
                  Active Nodes
                </p>
                <div className="flex items-center gap-4">
                  <p className="text-6xl font-black italic tracking-tighter text-primary leading-none">
                    {stats.activeEnrollments}
                  </p>
                  <TrendingUp className="h-10 w-10 text-primary/20" />
                </div>
              </div>
              <Button
                variant="default"
                className="w-full h-14 rounded-2xl justify-between shadow-lg font-black uppercase text-[10px] tracking-[0.2em] px-6"
                // F1: canonical learning-progress route
                onClick={() => navigate("/dashboard?tab=learning-progress")}
              >
                Interrogate Progress <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <AgentAnomalyFeed />
        </div>
      </div>
    </div>
  );
}
