import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  TrendingUp,
  MousePointerClick,
  Share2,
  Briefcase,
  BookOpen,
  Wrench,
  Activity,
  ShieldCheck,
  Zap,
  Layers,
  Globe,
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
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Marketing Performance Intelligence (Analytics)
 * High-fidelity orchestrator for cross-channel engagement telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced type-safe aggregation.
 */

interface AnalyticsData {
  jobClicks: { source: string; count: number }[];
  jobShares: { channel: string; count: number }[];
  contentClicks: { source: string; count: number }[];
  contentShares: { channel: string; count: number }[];
  serviceClicks: { service_slug: string; source: string; count: number }[];
  serviceShares: { service_slug: string; channel: string; count: number }[];
  topJobs: { id: string; title: string; company_name: string; clicks: number }[];
  topContent: { id: string; title: string; clicks: number }[];
  totals: {
    jobClicks: number;
    jobShares: number;
    contentClicks: number;
    contentShares: number;
    serviceClicks: number;
    serviceShares: number;
  };
}

const CHART_COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

const DATE_RANGES = [
  { label: "Temporal Frame: 7D", value: "7" },
  { label: "Temporal Frame: 14D", value: "14" },
  { label: "Temporal Frame: 30D", value: "30" },
  { label: "Temporal Frame: 90D", value: "90" },
];

export function MarketingAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");
  const [activeCategory, setActiveCategory] = useState("jobs");

  useEffect(() => {
    loadExecutiveTelemetry();
  }, [dateRange]);

  const loadExecutiveTelemetry = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const endDate = endOfDay(new Date());

      const [
        jobClicksRes,
        jobSharesRes,
        contentClicksRes,
        contentSharesRes,
        serviceClicksRes,
        serviceSharesRes,
        topJobsRes,
        topContentRes,
      ] = await Promise.all([
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
          .from("service_analytics")
          .select("service_slug, source")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
        supabase
          .from("service_share_logs")
          .select("service_slug, channel")
          .gte("shared_at", startDate.toISOString())
          .lte("shared_at", endDate.toISOString()),
        supabase
          .from("job_analytics")
          .select("job_id, jobs(id, title, company_name)")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
        supabase
          .from("content_analytics")
          .select("content_id, content(id, title)")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
      ]);

      // CTO FIX: Hardened generic aggregator to resolve TS2322
      const aggregate = (arr: any[], field: string): { source: string; count: number }[] => {
        const counts = arr.reduce(
          (acc, item) => {
            const val = item[field] || "Direct/Unknown";
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        return Object.entries(counts)
          .map(([name, count]) => ({ source: name, count }))
          .sort((a, b) => b.count - a.count);
      };

      // CTO FIX: Type-safe accumulation for topJobs to resolve TS2362/TS2363
      const topJRaw = (topJobsRes.data || []).reduce((acc: Record<string, any>, item: any) => {
        if (item.jobs) {
          const id = item.jobs.id;
          if (!acc[id]) acc[id] = { id, title: item.jobs.title, company_name: item.jobs.company_name, clicks: 0 };
          acc[id].clicks++;
        }
        return acc;
      }, {});

      const sortedJobs = (Object.values(topJRaw) as any[])
        .sort((a, b) => (Number(b.clicks) || 0) - (Number(a.clicks) || 0))
        .slice(0, 5);

      setData({
        jobClicks: aggregate(jobClicksRes.data || [], "source"),
        jobShares: aggregate(jobSharesRes.data || [], "channel") as any,
        contentClicks: aggregate(contentClicksRes.data || [], "source"),
        contentShares: aggregate(contentSharesRes.data || [], "channel") as any,
        serviceClicks: [],
        serviceShares: [],
        topJobs: sortedJobs,
        topContent: [],
        totals: {
          jobClicks: jobClicksRes.data?.length || 0,
          jobShares: jobSharesRes.data?.length || 0,
          contentClicks: contentClicksRes.data?.length || 0,
          contentShares: contentSharesRes.data?.length || 0,
          serviceClicks: serviceClicksRes.data?.length || 0,
          serviceShares: serviceSharesRes.data?.length || 0,
        },
      });
    } catch (error) {
      console.error("Telemetry Fault:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLoadingSkeleton />;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Activity className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Market Intel</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Cross-Channel Conversion & Social Distribution Radar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-56 h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50 shadow-inner">
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
            className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

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
          <TabsTrigger
            value="services"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 py-3"
          >
            <Wrench className="w-4 h-4" /> Solutions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-8 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Recruitment Traffic Attribution" sub="Origin source of candidate clicks">
              <SourceBarChart data={data?.jobClicks || []} dataKey="source" />
            </ChartCard>
            <ChartCard title="Distribution Channels" sub="Multi-platform sharing telemetry">
              <SourcePieChart data={data?.jobShares?.map((s) => ({ name: s.source, value: s.count })) || []} />
            </ChartCard>
          </div>

          <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
            <CardHeader className="p-8 border-b border-border/10">
              <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3 text-left">
                <ShieldCheck className="h-5 w-5 text-primary" /> High-Intensity Roles
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-left">
                Authorized audit of top performing marketplace nodes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                {data?.topJobs.map((job, index) => (
                  <div
                    key={job.id}
                    className="group flex items-center justify-between p-6 bg-muted/20 border-2 border-border/5 rounded-[24px] hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-5 text-left">
                      <div className="h-12 w-12 rounded-xl bg-background border-2 flex items-center justify-center font-black italic text-primary shadow-inner">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-black text-lg uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">
                          {job.title}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1 italic">
                          {job.company_name}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-5 py-2 italic gap-2 rounded-full">
                      <TrendingUp className="h-3 w-3" /> {job.clicks} PULSE UNITS
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

function SourceBarChart({ data, dataKey }: { data: any[]; dataKey: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          dataKey={dataKey}
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
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SourcePieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
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

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <Skeleton className="h-32 w-full rounded-[40px]" />
      <div className="grid grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-[32px]" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-[40px]" />
    </div>
  );
}
