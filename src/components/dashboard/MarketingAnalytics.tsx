import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Briefcase, BookOpen, Activity, ShieldCheck } from "lucide-react";
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

/**
 * GroUp Academy: Marketing Performance Intelligence
 * CTO Reference: Tracking conversion across jobs, content, and distribution channels.
 */

interface AnalyticsRecord {
  source: string;
  count: number;
}

interface AnalyticsData {
  jobClicks: AnalyticsRecord[];
  jobShares: AnalyticsRecord[];
  contentClicks: AnalyticsRecord[];
  contentShares: AnalyticsRecord[];
  topJobs: { id: string; title: string; company_name: string; clicks: number }[];
}

const CHART_COLORS = ["#0062ff", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

const DATE_RANGES = [
  { label: "7 Days", value: "7" },
  { label: "14 Days", value: "14" },
  { label: "30 Days", value: "30" },
  { label: "90 Days", value: "90" },
];

export function MarketingAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [activeCategory, setActiveCategory] = useState("jobs");

  useEffect(() => {
    loadExecutiveTelemetry();
  }, [dateRange]);

  const loadExecutiveTelemetry = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const endDate = endOfDay(new Date());

      const [jobClicksRes, jobSharesRes, contentClicksRes, contentSharesRes] = await Promise.all([
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
      ]);

      const aggregate = (arr: any[], field: string): AnalyticsRecord[] => {
        const counts = arr.reduce(
          (acc, item) => {
            const val = item[field] || "Direct";
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        return Object.entries(counts)
          .map(([name, count]) => ({ source: name, count: Number(count) }))
          .sort((a, b) => b.count - a.count);
      };

      setData({
        jobClicks: aggregate(jobClicksRes.data || [], "source"),
        jobShares: aggregate(jobSharesRes.data || [], "channel"),
        contentClicks: aggregate(contentClicksRes.data || [], "source"),
        contentShares: aggregate(contentSharesRes.data || [], "channel"),
        topJobs: [], // Placeholder for extended job link logic
      });
    } catch (error) {
      console.error("Telemetry Fault:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8">
        <Skeleton className="h-[400px] w-full rounded-[40px]" />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-muted/20 p-8 rounded-[32px] border border-border/40">
        <div className="text-left">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Activity className="h-6 w-6" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Market Intelligence</h2>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Platform Conversion & Social Distribution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40 h-11 rounded-xl font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadExecutiveTelemetry} className="rounded-xl h-11 w-11">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-8 h-12 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="jobs" className="rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest">
            <Briefcase className="w-4 h-4 mr-2" /> Recruitment
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest">
            <BookOpen className="w-4 h-4 mr-2" /> Academy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[32px] border-border/40">
            <CardHeader className="text-left">
              <CardTitle className="text-sm font-black uppercase italic">Traffic Attribution</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-tighter">
                Candidate origin by source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SourceBarChart data={data?.jobClicks || []} />
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border/40">
            <CardHeader className="text-left">
              <CardTitle className="text-sm font-black uppercase italic">Social Distribution</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-tighter">
                Shares by platform channel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SourcePieChart data={data?.jobShares.map((s) => ({ name: s.source, value: s.count })) || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SourceBarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888822" />
        <XAxis type="number" hide />
        <YAxis dataKey="source" type="category" tick={{ fontSize: 10, fontWeight: 700 }} width={80} />
        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontWeight: 700 }} />
        <Bar dataKey="count" fill="#0062ff" radius={[0, 4, 4, 0]} barSize={15} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SourcePieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
