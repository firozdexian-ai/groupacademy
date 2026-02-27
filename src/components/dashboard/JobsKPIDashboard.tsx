import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Briefcase, Target, Users, FileCheck, TrendingUp, Calendar, 
  Building2, Edit, Save, X, ChevronRight, Loader2, Signal, MousePointerClick
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, differenceInDays, eachDayOfInterval, isToday } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface KPIData {
  jobsThisMonth: number;
  jobsToday: number;
  totalVacancies: number;
  totalApplications: number;
  uniqueApplicants: number;
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
}

interface KPITarget {
  id: string;
  metric_name: string;
  target_value: number;
  period_type: string;
}

const SOURCE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"];

export function JobsKPIDashboard() {
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Auto-deactivate expired jobs first
      await supabase.rpc("auto_deactivate_expired_jobs");

      // Fetch KPI targets
      const { data: targetsData } = await supabase
        .from("kpi_targets")
        .select("*");
      setTargets(targetsData || []);

      // Fetch jobs this month
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, title, company_name, vacancies, source_platform, created_at, deadline, is_active")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      const jobs = jobsData || [];
      
      // Fetch today's jobs
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const jobsToday = jobs.filter(j => new Date(j.created_at) >= todayStart).length;

      // Total vacancies (sum of vacancies for active jobs)
      const { data: allActiveJobs } = await supabase
        .from("jobs")
        .select("vacancies")
        .eq("is_active", true);
      
      const totalVacancies = (allActiveJobs || []).reduce((sum, j) => sum + (j.vacancies || 1), 0);

      // Fetch applications
      const { data: applicationsData } = await supabase
        .from("job_applications")
        .select("id, talent_id, job_id")
        .gte("created_at", monthStart.toISOString());

      const applications = applicationsData || [];
      const uniqueTalentIds = new Set(applications.map(a => a.talent_id).filter(Boolean));
      
      // Count applications per job for avg calculation
      const jobsWithApps = new Set(applications.map(a => a.job_id));
      const avgAppsPerJob = jobsWithApps.size > 0 
        ? (applications.length / jobsWithApps.size).toFixed(1) 
        : "0";

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

      // Daily jobs data for the month
      const daysArray = eachDayOfInterval({ start: monthStart, end: now });
      const dailyJobsData = daysArray.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const count = jobs.filter(j => format(new Date(j.created_at), "yyyy-MM-dd") === dayStr).length;
        return {
          date: format(day, "MMM d"),
          jobs: count
        };
      });

      // Recent jobs with application counts
      const { data: recentJobsData } = await supabase
        .from("jobs")
        .select(`
          id, title, company_name, vacancies, created_at,
          job_applications(count)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      const recentJobs = (recentJobsData || []).map(job => ({
        id: job.id,
        title: job.title,
        company_name: job.company_name,
        vacancies: job.vacancies || 1,
        created_at: job.created_at,
        applications_count: (job.job_applications as any)?.[0]?.count || 0
      }));

      // Jobs expiring this week
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const { data: expiringJobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("is_active", true)
        .not("deadline", "is", null)
        .lte("deadline", weekFromNow.toISOString())
        .gte("deadline", now.toISOString());

      // Live jobs count
      const { count: liveJobsCount } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      // Total apply clicks (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: applyClicksCount } = await supabase
        .from("job_apply_clicks")
        .select("id", { count: "exact", head: true })
        .gte("clicked_at", thirtyDaysAgo.toISOString());

      setKpiData({
        jobsThisMonth: jobs.length,
        jobsToday,
        totalVacancies,
        totalApplications: applications.length,
        uniqueApplicants: uniqueTalentIds.size,
        avgApplicationsPerJob: parseFloat(avgAppsPerJob),
        jobsBySource,
        dailyJobsData,
        recentJobs,
        jobsExpiringThisWeek: expiringJobs?.length || 0,
        liveJobs: liveJobsCount || 0,
        totalApplyClicks: applyClicksCount || 0,
      });
    } catch (error) {
      console.error("Error loading KPI data:", error);
      toast.error("Failed to load KPI data");
    } finally {
      setLoading(false);
    }
  };

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
        await supabase
          .from("kpi_targets")
          .update({ target_value: editValue })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("kpi_targets")
          .insert({ metric_name: editingTarget, target_value: editValue, period_type: "monthly" });
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
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

  return (
    <div className="space-y-6">
      {/* Hero Progress Section */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Circular Progress */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * Math.min(jobsProgress, 100)) / 100}
                  className="text-primary transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{kpiData.jobsThisMonth}</span>
                <span className="text-sm text-muted-foreground">of {jobsTarget}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Monthly Jobs Target</h2>
                  <p className="text-muted-foreground">
                    {format(monthStart, "MMMM yyyy")} • {daysPassed} days passed, {daysRemaining} remaining
                  </p>
                </div>
                {editingTarget === "jobs_posted" ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Button size="sm" onClick={handleSaveTarget} disabled={savingTarget}>
                      {savingTarget ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingTarget(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleEditTarget("jobs_posted")}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Target
                  </Button>
                )}
              </div>
              
              <Progress value={Math.min(jobsProgress, 100)} className="h-3" />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-2xl font-bold text-primary">{kpiData.jobsToday}</p>
                  <p className="text-xs text-muted-foreground">Posted Today</p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-2xl font-bold text-amber-500">{dailyRunRate}</p>
                  <p className="text-xs text-muted-foreground">Daily Run Rate Needed</p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-2xl font-bold text-emerald-500">{Math.round(jobsProgress)}%</p>
                  <p className="text-xs text-muted-foreground">Target Achieved</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Signal className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{kpiData.liveJobs}</p>
                <p className="text-xs text-muted-foreground">Live Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiData.totalVacancies}</p>
                <p className="text-xs text-muted-foreground">Total Vacancies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiData.totalApplications}</p>
                <p className="text-xs text-muted-foreground">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiData.uniqueApplicants}</p>
                <p className="text-xs text-muted-foreground">Unique Applicants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiData.avgApplicationsPerJob}</p>
                <p className="text-xs text-muted-foreground">Avg Apps/Job</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiData.jobsExpiringThisWeek}</p>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <MousePointerClick className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-600">{kpiData.totalApplyClicks}</p>
                <p className="text-xs text-muted-foreground">Apply Clicks (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Jobs Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Daily Jobs Posted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiData.dailyJobsData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
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
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {kpiData.recentJobs.map((job) => (
              <div 
                key={job.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.company_name}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{job.vacancies}</p>
                    <p className="text-xs text-muted-foreground">Vacancies</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{job.applications_count}</p>
                    <p className="text-xs text-muted-foreground">Applications</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {format(new Date(job.created_at), "MMM d")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
