import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Briefcase, Target, Users, FileCheck, TrendingUp, Calendar, 
  Building2, Edit, Save, X, ChevronRight, Loader2, Signal, MousePointerClick,
  RefreshCw, Share2, Percent
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, differenceInDays, eachDayOfInterval, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import CircularProgress from "./CircularProgress";
import { useIsMobile } from "@/hooks/use-mobile";

interface KPIData {
  jobsThisMonth: number;
  jobsLastMonth: number;
  jobsToday: number;
  totalVacancies: number;
  totalApplications: number;
  applicationsLastMonth: number;
  uniqueApplicants: number;
  uniqueApplicantsLastMonth: number;
  avgApplicationsPerJob: number;
  jobsBySource: { name: string; value: number }[];
  dailyJobsData: { date: string; jobs: number }[];
  recentJobs: {
    id: string;
    title: string;
    company_name: string;
    applications_count: number;
    vacancies: number;
    created_at: string;
  }[];
  jobsExpiringThisWeek: number;
  liveJobs: number;
  totalApplyClicks: number;
  totalShares: number;
  conversionRate: number;
}

interface KPITarget {
  id: string;
  metric_name: string;
  target_value: number;
  period_type: string;
}

interface JobsKPIDashboardProps {
  onNavigateToTab?: (tab: string) => void;
}

const SOURCE_COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"];

function getMoMTrend(current: number, previous: number): string | undefined {
  if (previous === 0) return current > 0 ? "+100%" : undefined;
  const change = ((current - previous) / previous) * 100;
  if (change === 0) return undefined;
  return `${change > 0 ? "+" : ""}${Math.round(change)}%`;
}

export function JobsKPIDashboard({ onNavigateToTab }: JobsKPIDashboardProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [savingTarget, setSavingTarget] = useState(false);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const daysPassed = differenceInDays(now, monthStart) + 1;
  const daysRemaining = daysInMonth - daysPassed;

  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    const isRefresh = !loading;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Auto-deactivate expired jobs first
      await supabase.rpc("auto_deactivate_expired_jobs");

      // Parallelize all independent queries
      const [
        targetsRes,
        jobsRes,
        lastMonthJobsRes,
        activeJobsRes,
        appsRes,
        lastMonthAppsRes,
        recentJobsRes,
        expiringRes,
        liveRes,
        clicksRes,
        sharesRes,
      ] = await Promise.all([
        supabase.from("kpi_targets").select("*"),
        supabase.from("jobs")
          .select("id, title, company_name, vacancies, source_platform, created_at, deadline, is_active")
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString()),
        supabase.from("jobs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
        supabase.from("jobs")
          .select("vacancies")
          .eq("is_active", true),
        supabase.from("job_applications")
          .select("id, talent_id, job_id")
          .gte("created_at", monthStart.toISOString()),
        supabase.from("job_applications")
          .select("id, talent_id", { count: "exact", head: false })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
        supabase.from("jobs")
          .select(`id, title, company_name, vacancies, created_at, job_applications(count)`)
          .order("created_at", { ascending: false })
          .limit(10),
        (() => {
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return supabase.from("jobs")
            .select("id")
            .eq("is_active", true)
            .not("deadline", "is", null)
            .lte("deadline", weekFromNow.toISOString())
            .gte("deadline", now.toISOString());
        })(),
        supabase.from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        (() => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return supabase.from("job_apply_clicks")
            .select("id", { count: "exact", head: true })
            .gte("clicked_at", thirtyDaysAgo.toISOString());
        })(),
        supabase.from("gig_share_logs")
          .select("id", { count: "exact", head: true }),
      ]);

      setTargets(targetsRes.data || []);

      const jobs = jobsRes.data || [];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const jobsToday = jobs.filter(j => new Date(j.created_at) >= todayStart).length;

      const totalVacancies = (activeJobsRes.data || []).reduce((sum, j) => sum + (j.vacancies || 1), 0);

      const applications = appsRes.data || [];
      const uniqueTalentIds = new Set(applications.map(a => a.talent_id).filter(Boolean));
      const jobsWithApps = new Set(applications.map(a => a.job_id));
      const avgAppsPerJob = jobsWithApps.size > 0
        ? parseFloat((applications.length / jobsWithApps.size).toFixed(1))
        : 0;

      // Last month comparisons
      const lastMonthApps = lastMonthAppsRes.data || [];
      const lastMonthUniqueApplicants = new Set(lastMonthApps.map(a => a.talent_id).filter(Boolean)).size;

      // Jobs by source
      const sourceCount: Record<string, number> = {};
      jobs.forEach(job => {
        const source = job.source_platform || "other";
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });
      const jobsBySource = Object.entries(sourceCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

      // Daily jobs data
      const daysArray = eachDayOfInterval({ start: monthStart, end: now });
      const dailyJobsData = daysArray.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const count = jobs.filter(j => format(new Date(j.created_at), "yyyy-MM-dd") === dayStr).length;
        return { date: format(day, "MMM d"), jobs: count };
      });

      // Recent jobs
      const recentJobs = (recentJobsRes.data || []).map(job => ({
        id: job.id,
        title: job.title,
        company_name: job.company_name,
        vacancies: job.vacancies || 1,
        created_at: job.created_at,
        applications_count: (job.job_applications as any)?.[0]?.count || 0
      }));

      const totalApplyClicks = clicksRes.count || 0;
      const totalApps = applications.length;
      const conversionRate = totalApplyClicks > 0 
        ? parseFloat(((totalApps / totalApplyClicks) * 100).toFixed(1))
        : 0;

      setKpiData({
        jobsThisMonth: jobs.length,
        jobsLastMonth: lastMonthJobsRes.count || 0,
        jobsToday,
        totalVacancies,
        totalApplications: totalApps,
        applicationsLastMonth: lastMonthApps.length,
        uniqueApplicants: uniqueTalentIds.size,
        uniqueApplicantsLastMonth: lastMonthUniqueApplicants,
        avgApplicationsPerJob: avgAppsPerJob,
        jobsBySource,
        dailyJobsData,
        recentJobs,
        jobsExpiringThisWeek: expiringRes.data?.length || 0,
        liveJobs: liveRes.count || 0,
        totalApplyClicks,
        totalShares: sharesRes.count || 0,
        conversionRate,
      });
    } catch (error) {
      console.error("Error loading KPI data:", error);
      toast.error("Failed to load KPI data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getTarget = (metricName: string): number => {
    const target = targets.find(t => t.metric_name === metricName);
    return target?.target_value || 0;
  };

  const handleEditTarget = (metricName: string) => {
    setEditingTarget(metricName);
    setEditValue(getTarget(metricName));
  };

  const handleSaveTarget = async () => {
    if (!editingTarget) return;
    
    setSavingTarget(true);
    try {
      const existing = targets.find(t => t.metric_name === editingTarget);
      
      if (existing) {
        const { error } = await supabase
          .from("kpi_targets")
          .update({ target_value: editValue })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("kpi_targets")
          .insert({ metric_name: editingTarget, target_value: editValue, period_type: "monthly" });
        if (error) throw error;
      }

      toast.success("Target updated!");
      setEditingTarget(null);
      loadData();
    } catch (error) {
      console.error("Error saving target:", error);
      toast.error("Failed to save target");
    } finally {
      setSavingTarget(false);
    }
  };

  const jobsTarget = getTarget("jobs_posted");
  const jobsProgress = jobsTarget > 0 ? (kpiData?.jobsThisMonth || 0) / jobsTarget * 100 : 0;
  const dailyRunRate = daysRemaining > 0 
    ? Math.ceil((jobsTarget - (kpiData?.jobsThisMonth || 0)) / daysRemaining) 
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!kpiData) return null;

  const jobsMoM = getMoMTrend(kpiData.jobsThisMonth, kpiData.jobsLastMonth);
  const appsMoM = getMoMTrend(kpiData.totalApplications, kpiData.applicationsLastMonth);
  const applicantsMoM = getMoMTrend(kpiData.uniqueApplicants, kpiData.uniqueApplicantsLastMonth);

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Jobs Analytics</h2>
        <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Hero Progress Section */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-row items-center gap-4 sm:gap-6 lg:gap-8">
            {/* Circular Progress - compact on mobile */}
            <CircularProgress 
              value={Math.min(jobsProgress, 100)} 
              current={kpiData.jobsThisMonth} 
              target={jobsTarget} 
            />

            {/* Stats */}
            <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl lg:text-2xl font-bold truncate">Monthly Jobs Target</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {format(monthStart, "MMM yyyy")} • {daysPassed}d passed, {daysRemaining}d left
                  </p>
                </div>
                {editingTarget === "jobs_posted" ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                      className="w-16 sm:w-24 h-8"
                    />
                    <Button size="sm" className="h-8 w-8 p-0" onClick={handleSaveTarget} disabled={savingTarget}>
                      {savingTarget ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingTarget(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleEditTarget("jobs_posted")}>
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              <Progress value={Math.min(jobsProgress, 100)} className="h-2 sm:h-3" />
              
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-background rounded-lg border text-center">
                  <p className="text-base sm:text-2xl font-bold text-primary">{kpiData.jobsToday}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Today</p>
                </div>
                <div className="p-2 sm:p-3 bg-background rounded-lg border text-center">
                  <p className="text-base sm:text-2xl font-bold text-amber-500">{dailyRunRate}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Run Rate</p>
                </div>
                <div className="p-2 sm:p-3 bg-background rounded-lg border text-center">
                  <p className="text-base sm:text-2xl font-bold text-emerald-500">{Math.round(jobsProgress)}%</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Achieved</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid - 2 rows of 4 on large, 2 cols on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatMiniCard icon={Signal} label="Live Jobs" value={kpiData.liveJobs} color="text-green-500" bgColor="bg-green-500/10" />
        <StatMiniCard icon={Briefcase} label="Vacancies" value={kpiData.totalVacancies} color="text-blue-500" bgColor="bg-blue-500/10" />
        <StatMiniCard icon={FileCheck} label="Applications" value={kpiData.totalApplications} color="text-green-500" bgColor="bg-green-500/10" trend={appsMoM} />
        <StatMiniCard icon={Users} label="Unique Applicants" value={kpiData.uniqueApplicants} color="text-purple-500" bgColor="bg-purple-500/10" trend={applicantsMoM} />
        <StatMiniCard icon={TrendingUp} label="Avg Apps/Job" value={kpiData.avgApplicationsPerJob} color="text-amber-500" bgColor="bg-amber-500/10" />
        <StatMiniCard 
          icon={Calendar} 
          label="Expiring Soon" 
          value={kpiData.jobsExpiringThisWeek} 
          color="text-red-500" 
          bgColor="bg-red-500/10" 
          onClick={onNavigateToTab ? () => onNavigateToTab("jobs") : undefined}
          clickable
        />
        <StatMiniCard icon={MousePointerClick} label="Apply Clicks" value={kpiData.totalApplyClicks} color="text-cyan-500" bgColor="bg-cyan-500/10" />
        <StatMiniCard icon={Percent} label="Conversion" value={`${kpiData.conversionRate}%`} color="text-emerald-500" bgColor="bg-emerald-500/10" />
        {kpiData.totalShares > 0 && (
          <StatMiniCard icon={Share2} label="Total Shares" value={kpiData.totalShares} color="text-indigo-500" bgColor="bg-indigo-500/10" />
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Jobs Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Daily Jobs Posted
              {jobsMoM && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {jobsMoM} vs last month
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiData.dailyJobsData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    interval={isMobile ? 4 : "preserveStartEnd"}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="jobs" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Jobs by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Jobs by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {kpiData.jobsBySource.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kpiData.jobsBySource}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={false}
                    >
                      {kpiData.jobsBySource.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No jobs posted yet this month
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Job Posts</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground"
            onClick={() => onNavigateToTab?.("jobs")}
          >
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {kpiData.recentJobs.map((job) => (
              <div 
                key={job.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.company_name}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-xs sm:text-sm">{job.vacancies}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Vac.</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-xs sm:text-sm">{job.applications_count}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Apps</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                    {format(new Date(job.created_at), "MMM d")}
                  </Badge>
                </div>
              </div>
            ))}
            {kpiData.recentJobs.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No jobs posted yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Compact stat card used in the grid ── */
interface StatMiniCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  trend?: string;
  onClick?: () => void;
  clickable?: boolean;
}

function StatMiniCard({ icon: Icon, label, value, color, bgColor, trend, onClick, clickable }: StatMiniCardProps) {
  return (
    <Card 
      className={`${clickable ? "cursor-pointer hover:border-primary/40" : ""}`}
      onClick={onClick}
    >
      <CardContent className="pt-3 pb-2 px-3 sm:pt-4 sm:pb-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`p-1.5 sm:p-2 rounded-lg ${bgColor}`}>
            <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold leading-tight">{value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</p>
            {trend && (
              <p className={`text-[10px] sm:text-xs font-medium ${trend.startsWith("+") ? "text-emerald-500" : "text-red-500"}`}>
                {trend} vs last mo
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
