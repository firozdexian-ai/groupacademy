import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Target,
  Users,
  FileCheck,
  TrendingUp,
  Calendar,
  Edit,
  Save,
  X,
  Loader2,
  Signal,
  MousePointerClick,
  RefreshCw,
  Percent,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, differenceInDays, eachDayOfInterval, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import CircularProgress from "./CircularProgress";
import { useIsMobile } from "@/hooks/use-mobile";
import { COUNTRIES } from "@/lib/constants/countries";

interface KPIData {
  totalAllTimeJobs: number;
  jobsThisMonth: number;
  jobsLastMonth: number;
  jobsToday: number;
  totalVacancies: number;
  totalApplications: number;
  applicationsLastMonth: number;
  uniqueApplicants: number;
  avgApplicationsPerJob: number;
  jobsBySource: { name: string; value: number }[];
  dailyJobsData: { date: string; jobs: number }[];
  jobsExpiringThisWeek: number;
  liveJobs: number;
  totalApplyClicks: number;
  totalShares: number;
  conversionRate: number;
  countryDistribution: { name: string; flag: string; count: number }[];
}

const COUNTRY_COLORS = [
  "hsl(var(--primary))",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#6b7280",
];

const COUNTRY_ALIASES: Record<string, string[]> = {
  Bangladesh: ["BD", "Bangladesh", "Dhaka", "Chattogram"],
  "United Arab Emirates": ["UAE", "United Arab Emirates", "Dubai", "Abu Dhabi"],
  "United Kingdom": ["UK", "United Kingdom", "London"],
  "United States": ["USA", "United States", "US", "NY", "California"],
};

export function JobsKPIDashboard({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [targets, setTargets] = useState<any[]>([]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [
        totalJobs,
        thisMonthJobs,
        lastMonthJobs,
        activeJobs,
        expiringJobs,
        totalApps,
        lastMonthApps,
        applyClicks,
        shareLogs,
        targetsRes,
        activeLocations,
        thisMonthJobDetails,
      ] = await Promise.all([
        supabase.from("jobs" as any).select("*", { count: "exact", head: true }),
        supabase
          .from("jobs" as any)
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString()),
        supabase
          .from("jobs" as any)
          .select("*", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
        supabase
          .from("jobs" as any)
          .select("vacancies, location, source_platform, created_at")
          .eq("is_active", true),
        supabase
          .from("jobs" as any)
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)
          .lte("deadline", new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
          .gte("deadline", now.toISOString()),
        supabase.from("job_applications" as any).select("*", { count: "exact", head: true }),
        supabase
          .from("job_applications" as any)
          .select("*", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
        supabase.from("job_apply_clicks" as any).select("*", { count: "exact", head: true }),
        supabase.from("gig_share_logs" as any).select("*", { count: "exact", head: true }),
        supabase.from("kpi_targets" as any).select("*"),
        supabase
          .from("jobs" as any)
          .select("location")
          .eq("is_active", true),
        supabase
          .from("jobs" as any)
          .select("created_at, source_platform")
          .gte("created_at", monthStart.toISOString()),
      ]);

      const activeJobsList = activeJobs.data || [];
      const totalVacancies = activeJobsList.reduce((sum, j) => sum + (j.vacancies || 1), 0);

      const daysArray = eachDayOfInterval({ start: monthStart, end: now });
      const dailyJobsData = daysArray.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const count = (thisMonthJobDetails.data || []).filter(
          (j) => format(new Date(j.created_at), "yyyy-MM-dd") === dayStr,
        ).length;
        return { date: format(day, "MMM d"), jobs: count };
      });

      const sourceCount: Record<string, number> = {};
      (thisMonthJobDetails.data || []).forEach((j) => {
        const src = j.source_platform || "Direct";
        sourceCount[src] = (sourceCount[src] || 0) + 1;
      });

      const countryCounts: Record<string, number> = {};
      (activeLocations.data || []).forEach((row) => {
        const loc = row.location || "";
        Object.entries(COUNTRY_ALIASES).forEach(([official, aliases]) => {
          if (aliases.some((a) => loc.toLowerCase().includes(a.toLowerCase()))) {
            countryCounts[official] = (countryCounts[official] || 0) + 1;
          }
        });
      });

      // CTO FIX: Wrapped number in new Date() to fix TS2365
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

      setKpiData({
        totalAllTimeJobs: totalJobs.count || 0,
        jobsThisMonth: thisMonthJobs.count || 0,
        jobsLastMonth: lastMonthJobs.count || 0,
        jobsToday: (thisMonthJobDetails.data || []).filter((j) => new Date(j.created_at) >= todayStart).length,
        totalVacancies,
        totalApplications: totalApps.count || 0,
        applicationsLastMonth: lastMonthApps.count || 0,
        uniqueApplicants: 0,
        avgApplicationsPerJob: totalJobs.count ? parseFloat(((totalApps.count || 0) / totalJobs.count).toFixed(1)) : 0,
        jobsBySource: Object.entries(sourceCount).map(([name, value]) => ({ name, value })),
        dailyJobsData,
        jobsExpiringThisWeek: expiringJobs.count || 0,
        liveJobs: activeJobsList.length,
        totalApplyClicks: applyClicks.count || 0,
        totalShares: shareLogs.count || 0,
        conversionRate: applyClicks.count
          ? parseFloat((((totalApps.count || 0) / applyClicks.count) * 100).toFixed(1))
          : 0,
        countryDistribution: Object.entries(countryCounts)
          .map(([name, count]) => ({
            name,
            count,
            flag: COUNTRIES.find((c) => c.name === name)?.flag || "🌍",
          }))
          .sort((a, b) => b.count - a.count),
      });
      setTargets(targetsRes.data || []);
    } catch (err) {
      toast.error("Data fetch failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [monthStart, lastMonthStart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !kpiData) return <DashboardSkeleton />;

  const jobsTarget = targets.find((t) => t.metric_name === "jobs_posted")?.target_value || 500;
  const jobsProgress = (kpiData.jobsThisMonth / jobsTarget) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recruitment Intelligence</h2>
          <p className="text-muted-foreground text-sm">Monitoring conversion, market reach, and pipeline growth.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Sync Data
        </Button>
      </div>

      <Card className="border-primary/20 shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Target className="w-24 h-24" />
        </div>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <CircularProgress value={Math.min(jobsProgress, 100)} current={kpiData.jobsThisMonth} target={jobsTarget} />
            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-lg font-bold">Monthly Posting Goal</h3>
                  <p className="text-sm text-muted-foreground">{format(now, "MMMM yyyy")} Status.</p>
                </div>
                {/* CTO FIX: Used standard variant and custom bg-color to fix TS2322 */}
                <Badge
                  variant={jobsProgress >= 100 ? "default" : "secondary"}
                  className={jobsProgress >= 100 ? "bg-emerald-500 hover:bg-emerald-600 mb-1" : "mb-1"}
                >
                  {Math.round(jobsProgress)}% Achieved
                </Badge>
              </div>
              <Progress value={jobsProgress} className="h-3 shadow-inner" />
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Today</p>
                  <p className="text-xl font-bold">{kpiData.jobsToday}</p>
                </div>
                <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                  <p className="text-xs font-medium text-primary uppercase">Run Rate</p>
                  <p className="text-xl font-bold">
                    {Math.ceil((jobsTarget - kpiData.jobsThisMonth) / Math.max(1, differenceInDays(monthEnd, now)))}/day
                  </p>
                </div>
                <div className="bg-muted/50 p-3 rounded-xl border border-border/50 text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Target</p>
                  <p className="text-xl font-bold">{jobsTarget}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPIMiniCard
          icon={Signal}
          label="Active"
          value={kpiData.liveJobs}
          subLabel="Live jobs"
          color="text-emerald-500"
        />
        <KPIMiniCard
          icon={FileCheck}
          label="Apps"
          value={kpiData.totalApplications}
          subLabel="Submissions"
          color="text-blue-500"
        />
        <KPIMiniCard
          icon={MousePointerClick}
          label="Clicks"
          value={kpiData.totalApplyClicks}
          subLabel="Intent"
          color="text-orange-500"
        />
        <KPIMiniCard
          icon={Percent}
          label="Conv."
          value={`${kpiData.conversionRate}%`}
          subLabel="Rate"
          color="text-indigo-500"
        />
        <KPIMiniCard
          icon={Calendar}
          label="Expiring"
          value={kpiData.jobsExpiringThisWeek}
          subLabel="Next 7d"
          color="text-red-500"
          clickable
          onClick={() => onNavigateToTab?.("jobs")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Daily Velocity
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpiData.dailyJobsData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "hsl(var(--primary)/0.05)" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="jobs" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={isMobile ? 12 : 24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Market Reach
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpiData.countryDistribution.slice(0, 6)} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={100}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20}>
                  {kpiData.countryDistribution.map((_, i) => (
                    <Cell key={i} fill={COUNTRY_COLORS[i % COUNTRY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPIMiniCard({ icon: Icon, label, value, subLabel, color, clickable, onClick }: any) {
  return (
    <Card
      className={`${clickable ? "hover:border-primary transition-all cursor-pointer shadow-sm" : "shadow-sm"}`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col gap-1">
        <div className={`p-2 w-fit rounded-lg bg-muted/50 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
          <p className="text-[11px] font-bold text-muted-foreground uppercase">{label}</p>
          <p className="text-[10px] text-muted-foreground/70">{subLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
