import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMarketingGraph } from "hooks/useMarketingGraph";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  TrendingUp,
  MousePointerClick,
  Share2,
  Briefcase,
  BookOpen,
  Activity,
  ShieldCheck,
  Zap,
  Megaphone,
  Users,
  Send,
  Building2,
  Clock,
  Target,
} from "lucide-react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AnalyticsRecord {
  source: string;
  count: number;
}
interface TopJobRecord {
  id: string;
  title: string;
  company_name: string;
  clicks: number;
}
interface AnalyticsData {
  jobClicks: AnalyticsRecord[];
  jobShares: AnalyticsRecord[];
  contentClicks: AnalyticsRecord[];
  contentShares: AnalyticsRecord[];
  topJobs: TopJobRecord[];
  totals: { jobClicks: number; jobShares: number; contentClicks: number; contentShares: number };
}

const CHART_COLORS = ["#0062ff", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];
const DATE_RANGES = [
  { label: "Temporal Frame: 7D", value: "7" },
  { label: "Temporal Frame: 30D", value: "30" },
  { label: "Temporal Frame: 90D", value: "90" },
];

export function MarketingAnalyticsTab() {
  // 1. New Phase 6 Graph
  const { marketingGraphQuery } = useMarketingGraph();
  const { data: graphData, isLoading: graphLoading } = marketingGraphQuery;

  // 2. Legacy Analytics Engine
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [activeCategory, setActiveCategory] = useState("jobs");

  useEffect(() => {
    loadExecutiveTelemetry();
  }, [dateRange]);

  const loadExecutiveTelemetry = async () => {
    setAnalyticsLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const endDate = endOfDay(new Date());

      const [jobClicksRes, jobSharesRes, contentClicksRes, contentSharesRes, topJobsDataRes] = await Promise.all([
        supabase
          .from("job_analytics")
          .select("source")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
        supabase
          .from("job_share_logs")
          .select("channel")
          .gte("shared_at", startDate.toISOString())
          .lte("shared_at", endDate.toISOString()),
        supabase
          .from("content_analytics")
          .select("source")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
        supabase
          .from("content_share_logs")
          .select("channel")
          .gte("shared_at", startDate.toISOString())
          .lte("shared_at", endDate.toISOString()),
        supabase
          .from("job_analytics")
          .select("job_id, jobs(id, title, company_name)")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
      ]);

      const aggregate = (arr: any[], field: string): AnalyticsRecord[] => {
        const counts = arr.reduce(
          (acc, item) => {
            const val = item[field] || "Direct/Organic";
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
        return Object.entries(counts)
          .map(([name, count]) => ({ source: name, count: Number(count) }))
          .sort((a, b) => b.count - a.count);
      };

      const jobPulseMap = (topJobsDataRes.data || []).reduce((acc: Record<string, TopJobRecord>, item: any) => {
        if (item.jobs) {
          const id = item.jobs.id;
          if (!acc[id]) acc[id] = { id, title: item.jobs.title, company_name: item.jobs.company_name, clicks: 0 };
          acc[id].clicks++;
        }
        return acc;
      }, {});

      const sortedTopJobs = Object.values(jobPulseMap)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      setAnalyticsData({
        jobClicks: aggregate(jobClicksRes.data || [], "source"),
        jobShares: aggregate(jobSharesRes.data || [], "channel"),
        contentClicks: aggregate(contentClicksRes.data || [], "source"),
        contentShares: aggregate(contentSharesRes.data || [], "channel"),
        topJobs: sortedTopJobs,
        totals: {
          jobClicks: jobClicksRes.data?.length || 0,
          jobShares: jobSharesRes.data?.length || 0,
          contentClicks: contentClicksRes.data?.length || 0,
          contentShares: contentSharesRes.data?.length || 0,
        },
      });
    } catch (error) {
      console.error("Telemetry Fault:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const isLoading = graphLoading || analyticsLoading;

  // Graph Derived KPIs
  const activeChannels = graphData?.channels?.length || 0;
  const totalGroups = graphData?.communityGroups?.length || 0;
  const totalTalentOutreach = graphData?.talentOutreach?.length || 0;
  const totalCompanyOutreach = graphData?.companyOutreach?.length || 0;
  const latestTalentOutreach = graphData?.talentOutreach?.slice(0, 3) || [];
  const latestCompanyOutreach = graphData?.companyOutreach?.slice(0, 3) || [];

  if (isLoading) return <DashboardLoadingSkeleton />;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Phase 6 Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-orange-500">
            <Megaphone className="h-8 w-8 text-orange-500 fill-orange-500/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Marketing Command
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Global Outbound & Community Telemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-56 h-12 rounded-xl border-2 border-orange-500/20 font-black uppercase text-[10px] tracking-widest bg-orange-500/5 text-orange-600 shadow-inner">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 shadow-2xl">
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value} className="font-bold">
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={loadExecutiveTelemetry}
            className="h-12 w-12 rounded-xl border-2 hover:bg-orange-500 hover:text-white transition-all text-orange-500 border-orange-500/20 bg-orange-500/5"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Graph KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricTile
          label="Active Channels"
          value={activeChannels}
          icon={Share2}
          color="text-orange-500"
          bg="bg-orange-500/10"
        />
        <MetricTile
          label="Community Groups"
          value={totalGroups}
          icon={Users}
          color="text-fuchsia-500"
          bg="bg-fuchsia-500/10"
        />
        <MetricTile
          label="Talent Pings"
          value={totalTalentOutreach}
          icon={Send}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <MetricTile
          label="Company Pings"
          value={totalCompanyOutreach}
          icon={Building2}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
      </div>

      {/* Legacy Deep-Dive Analytics */}
      <div className="pt-4">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="bg-muted/30 backdrop-blur-md rounded-[24px] border-2 border-border/40 p-1.5 mb-8 w-full max-w-lg">
            <TabsTrigger
              value="jobs"
              className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 py-3"
            >
              <Briefcase className="w-4 h-4" /> Recruitment
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 py-3"
            >
              <BookOpen className="w-4 h-4" /> Academy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-8 animate-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartCard title="Traffic Source" sub="Origin of job seeker engagement">
                <SourceBarChart data={analyticsData?.jobClicks || []} color="#0062ff" />
              </ChartCard>
              <ChartCard title="Social Distribution" sub="Distribution by channel">
                <SourcePieChart
                  data={analyticsData?.jobShares.map((s) => ({ name: s.source, value: s.count })) || []}
                />
              </ChartCard>
            </div>
            <SummaryBadgeRow
              totalClicks={analyticsData?.totals.jobClicks || 0}
              totalShares={analyticsData?.totals.jobShares || 0}
            />

            <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30">
              <CardHeader className="p-8 border-b border-border/10">
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-left">
                  <Zap className="h-5 w-5 text-primary" /> High-Intensity Roles
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-left">
                  Individual Job Pulse Distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {analyticsData?.topJobs.length === 0 && (
                    <p className="text-muted-foreground text-xs italic">No job-specific data for this period.</p>
                  )}
                  {analyticsData?.topJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/5"
                    >
                      <div className="text-left">
                        <p className="font-black uppercase text-sm italic">{job.title}</p>
                        <p className="text-[9px] font-bold text-muted-foreground/50 tracking-widest">
                          {job.company_name}
                        </p>
                      </div>
                      <Badge className="bg-primary/20 text-primary font-black italic">{job.clicks} CLICKS</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-8 animate-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartCard title="Course Discovery" sub="Content discovery sources">
                <SourceBarChart data={analyticsData?.contentClicks || []} color="#10b981" />
              </ChartCard>
              <ChartCard title="Social Vitality" sub="Academy content distribution">
                <SourcePieChart
                  data={analyticsData?.contentShares.map((s) => ({ name: s.source, value: s.count })) || []}
                />
              </ChartCard>
            </div>
            <SummaryBadgeRow
              totalClicks={analyticsData?.totals.contentClicks || 0}
              totalShares={analyticsData?.totals.contentShares || 0}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Graph Data Splits: Outbound Feed & System Health */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-6 border-t-2 border-border/20">
        {/* Live Outreach Feed */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">
              Live Outbound Telemetry
            </h3>
          </div>
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-rose-500 to-fuchsia-500" />
            <CardContent className="p-0">
              {latestTalentOutreach.length === 0 && latestCompanyOutreach.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-muted/10 flex items-center justify-center border-2 border-border/20">
                    <Target className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic">
                    Awaiting Outreach Signals
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/5">
                  {latestTalentOutreach.map((log) => (
                    <div
                      key={log.id}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-blue-500/[0.02] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center shadow-sm">
                          <Send className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm uppercase italic tracking-tight text-foreground/90">
                            Talent Ping
                          </h4>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Channel: <span className="text-blue-500">{log.channel}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-2">
                          Talent ID: {log.talent_id.substring(0, 8)}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(log.sent_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {latestCompanyOutreach.map((log) => (
                    <div
                      key={log.id}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-emerald-500/[0.02] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center shadow-sm">
                          <Building2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm uppercase italic tracking-tight text-foreground/90">
                            Company Ping
                          </h4>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Channel: <span className="text-emerald-500">{log.channel}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-2">
                          Org ID: {log.company_id.substring(0, 8)}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(log.sent_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform Pulse */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Activity className="h-4 w-4 text-orange-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">
              Marketing Graph Pulse
            </h3>
          </div>
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                <PulseBar
                  label="Display Banners"
                  value={graphData?.banners.length || 0}
                  max={50}
                  color="bg-orange-500"
                />
                <PulseBar
                  label="Profile Themes"
                  value={graphData?.themes.length || 0}
                  max={20}
                  color="bg-fuchsia-500"
                />
                <PulseBar
                  label="Access Codes"
                  value={graphData?.accessCodes.length || 0}
                  max={100}
                  color="bg-indigo-500"
                />
                <PulseBar label="Community Groups" value={totalGroups} max={50} color="bg-violet-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryBadgeRow({ totalClicks, totalShares }: { totalClicks: number; totalShares: number }) {
  return (
    <div className="flex flex-wrap gap-4">
      <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-6 py-3 italic gap-2 rounded-full">
        <MousePointerClick className="h-4 w-4" /> {totalClicks} PULSE CLICKS
      </Badge>
      <Badge className="bg-green-500/10 text-green-600 border-none font-black text-xs px-6 py-3 italic gap-2 rounded-full">
        <Share2 className="h-4 w-4" /> {totalShares} SOCIAL SHARES
      </Badge>
    </div>
  );
}

function ChartCard({ title, sub, children }: any) {
  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
      <CardHeader className="p-8 border-b border-border/10 bg-muted/10 text-left">
        <CardTitle className="text-lg font-black uppercase tracking-tighter italic">{title}</CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">{sub}</CardDescription>
      </CardHeader>
      <CardContent className="p-8">{children}</CardContent>
    </Card>
  );
}

function SourceBarChart({ data, color }: { data: any[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          dataKey="source"
          type="category"
          tick={{ fontSize: 10, fontWeight: 900 }}
          width={100}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--primary)/0.05)" }}
          contentStyle={{ borderRadius: "16px", border: "2px solid hsl(var(--border))", fontWeight: 800 }}
        />
        <Bar dataKey="count" fill={color} radius={[0, 8, 8, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SourcePieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: "16px", border: "2px solid hsl(var(--border))", fontWeight: 800 }} />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden hover:border-primary/30 transition-all group">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-6 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1 truncate">
            {label}
          </p>
          <p className="text-4xl font-black italic tracking-tighter leading-none text-foreground/90">
            {value?.toLocaleString() || "0"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PulseBar({ label, value, max, color }: any) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="font-mono text-[10px] text-foreground">{value} Nodes</span>
      </div>
      <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-10 animate-pulse p-8">
      <Skeleton className="h-32 w-full rounded-[40px]" />
      <Skeleton className="h-16 w-1/3 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-80 w-full rounded-[40px]" />
        <Skeleton className="h-80 w-full rounded-[40px]" />
      </div>
    </div>
  );
}

export default MarketingAnalyticsTab;
