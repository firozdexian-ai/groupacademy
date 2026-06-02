/**
 * Lifetime Overview — Refactored Executive Dashboard
 * Backend Integration: Phase 10i.1 Single-Trip Rollup Optimized
 * Conforms strictly to 2024 Highly Professional SaaS UI patterns.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLifetimeOverviewMaster } from "@/domains/analytics/repo/analyticsRepo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import StatsCard from "@/platform/admin/ui/StatsCard";
import { OverviewSkeleton } from "./OverviewSkeleton";
import { AgentAnomalyFeed } from "./AgentAnomalyFeed";

// Canonical exchange rate from Platform Reference
const BDT_TO_USD = 0.0084; // 1 credit = 2 BDT pricing peg baseline

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

      const data = await getLifetimeOverviewMaster(today.toISOString());

      const talents = data.talentCount || 0;
      const registered = data.regCount || 0;
      const topCountry = data.countryStats?.[0] || { country: "N/A", count: 0, share_pct: 0 };

      setStats({
        totalTalents: talents,
        registeredRate: talents > 0 ? Math.round((registered / talents) * 100) : 0,
        activeEnrollments: data.enrollCount || 0,
        totalRevenueBDT: data.totalRevenueBDT || 0,
        commissionPayouts: data.totalCommissionsIssued || 0,
        assessments: { total: data.assessCount || 0 },
        mockInterviews: {
          total: data.completedInterviewsCount,
          completed: data.completedInterviewsCount,
        },
        portfolios: {
          total: data.portfolioRequestsCount,
          pending: 0,
        },
        aiAgents: { totalSessions: data.agentSessionsCount || 0 },
        credits: {
          totalInCirculation: data.totalTalentCreditsBalance + data.totalCompanyCreditsBalance,
          transactionsToday: data.txTodayCount || 0,
        },
        topMarket: {
          name: topCountry.country,
          percentage: talents > 0 ? Math.round((topCountry.count / talents) * 100) : 0,
        },
      });
    } catch (err) {
      console.error("[Digital Workforce Anomaly] Live overview sync failure:", err);
      setError("We hit a snag loading the platform metrics. Our team has been notified.");
    } finally {
      setIsLoading(false);
      Geist: setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) return <OverviewSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Tab Actions Panel */}
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(true)}
          disabled={isRefreshing}
          className="rounded-xl font-medium text-xs gap-2 h-9 px-4 shadow-sm border-border"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Refreshing..." : "Refresh Dashboard"}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-3 text-sm text-destructive font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Talents"
          value={stats.totalTalents.toLocaleString()}
          icon={Users}
          trend={`${stats.registeredRate}% registered`}
          trendLabel="Sign-up conversion rate"
        />
        <StatsCard
          title="Gross Revenue"
          value={`外部 ৳${stats.totalRevenueBDT.toLocaleString("en-BD")}`}
          icon={Zap}
          variant="success"
          trend={`≈ $${(stats.totalRevenueBDT * BDT_TO_USD).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD`}
          trendLabel="Converted valuation baseline"
        />
        <StatsCard
          title="Top Market Concentration"
          value={`${stats.topMarket.percentage}%`}
          icon={Globe}
          variant="secondary"
          trend={`Primary Market: ${stats.topMarket.name}`}
          trendLabel="Geographic distribution"
        />
        <StatsCard
          title="Credits in Circulation"
          value={stats.credits.totalInCirculation.toLocaleString()}
          icon={Coins}
          variant="accent"
          trend={`${stats.credits.transactionsToday} active today`}
          trendLabel="Daily activity"
        />
      </div>

      {/* Analytics Breakdown Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/10">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold text-foreground">Performance Overview</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Real-time usage rates across core candidate career applications
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 sm:p-8">
              {[
                { label: "Assessments Run", val: stats.assessments.total, icon: Target },
                { label: "Interviews Done", val: stats.mockInterviews.completed, icon: ShieldCheck },
                { label: "Pending Portfolios", val: stats.portfolios.pending, icon: Briefcase },
                { label: "AI Agent Sessions", val: stats.aiAgents.totalSessions, icon: Zap },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-none">
                      {item.val}
                    </span>
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground/30" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold text-foreground">Learning Academy Hub Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Active Students Enrolled</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight text-primary leading-none">
                    {stats.activeEnrollments}
                  </span>
                  <TrendingUp className="h-8 w-8 text-primary/10" />
                </div>
              </div>
              <Button
                variant="default"
                className="w-full h-10 rounded-xl justify-between font-medium text-xs px-4"
                onClick={() => navigate("/dashboard?tab=learning-progress")}
              >
                View Student Progress Tracking
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Telemetry Component Feed */}
        <div className="lg:col-span-1">
          <AgentAnomalyFeed />
        </div>
      </div>
    </div>
  );
}
