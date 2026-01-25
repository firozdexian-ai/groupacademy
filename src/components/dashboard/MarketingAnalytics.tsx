import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, MousePointerClick, Share2, Briefcase, BookOpen, Wrench } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

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

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

const DATE_RANGES = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 14 days", value: "14" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

export function MarketingAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");
  const [activeCategory, setActiveCategory] = useState("jobs");

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const endDate = endOfDay(new Date());

      // Fetch all analytics data in parallel
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
        // Job clicks by source
        supabase
          .from("job_analytics")
          .select("source")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
        // Job shares by channel
        supabase
          .from("job_share_logs")
          .select("channel")
          .gte("shared_at", startDate.toISOString())
          .lte("shared_at", endDate.toISOString()),
        // Content clicks by source
        supabase
          .from("content_analytics")
          .select("source")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
        // Content shares by channel
        supabase
          .from("content_share_logs")
          .select("channel")
          .gte("shared_at", startDate.toISOString())
          .lte("shared_at", endDate.toISOString()),
        // Service clicks
        supabase
          .from("service_analytics")
          .select("service_slug, source")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
        // Service shares
        supabase
          .from("service_share_logs")
          .select("service_slug, channel")
          .gte("shared_at", startDate.toISOString())
          .lte("shared_at", endDate.toISOString()),
        // Top jobs by clicks
        supabase
          .from("job_analytics")
          .select("job_id, jobs(id, title, company_name)")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
        // Top content by clicks
        supabase
          .from("content_analytics")
          .select("content_id, content(id, title)")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
      ]);

      // Process job clicks by source
      const jobClicksBySource = aggregateByField<{ source: string; count: number }>(jobClicksRes.data || [], "source");

      // Process job shares by channel
      const jobSharesByChannel = aggregateByField<{ channel: string; count: number }>(jobSharesRes.data || [], "channel");

      // Process content clicks by source
      const contentClicksBySource = aggregateByField<{ source: string; count: number }>(contentClicksRes.data || [], "source");

      // Process content shares by channel
      const contentSharesByChannel = aggregateByField<{ channel: string; count: number }>(contentSharesRes.data || [], "channel");

      // Process service clicks
      const serviceClicksData = (serviceClicksRes.data || []).reduce(
        (acc, item) => {
          const key = `${item.service_slug}-${item.source}`;
          if (!acc[key]) {
            acc[key] = { service_slug: item.service_slug, source: item.source, count: 0 };
          }
          acc[key].count++;
          return acc;
        },
        {} as Record<string, { service_slug: string; source: string; count: number }>
      );

      // Process service shares
      const serviceSharesData = (serviceSharesRes.data || []).reduce(
        (acc, item) => {
          const key = `${item.service_slug}-${item.channel}`;
          if (!acc[key]) {
            acc[key] = { service_slug: item.service_slug, channel: item.channel, count: 0 };
          }
          acc[key].count++;
          return acc;
        },
        {} as Record<string, { service_slug: string; channel: string; count: number }>
      );

      // Process top jobs
      const jobClickCounts = (topJobsRes.data || []).reduce(
        (acc, item: any) => {
          if (item.jobs) {
            const id = item.jobs.id;
            if (!acc[id]) {
              acc[id] = { id, title: item.jobs.title, company_name: item.jobs.company_name, clicks: 0 };
            }
            acc[id].clicks++;
          }
          return acc;
        },
        {} as Record<string, { id: string; title: string; company_name: string; clicks: number }>
      );

      // Process top content
      const contentClickCounts = (topContentRes.data || []).reduce(
        (acc, item: any) => {
          if (item.content) {
            const id = item.content.id;
            if (!acc[id]) {
              acc[id] = { id, title: item.content.title, clicks: 0 };
            }
            acc[id].clicks++;
          }
          return acc;
        },
        {} as Record<string, { id: string; title: string; clicks: number }>
      );

      setData({
        jobClicks: jobClicksBySource,
        jobShares: jobSharesByChannel,
        contentClicks: contentClicksBySource,
        contentShares: contentSharesByChannel,
        serviceClicks: Object.values(serviceClicksData),
        serviceShares: Object.values(serviceSharesData),
        topJobs: Object.values(jobClickCounts)
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 5),
        topContent: Object.values(contentClickCounts)
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 5),
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
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateByField = <T extends Record<string, any>>(data: any[], field: string): T[] => {
    const counts = data.reduce(
      (acc, item) => {
        const value = item[field] || "unknown";
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(counts)
      .map(([key, count]) => ({ [field]: key, count: count as number } as unknown as T))
      .sort((a, b) => (b as any).count - (a as any).count);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Marketing Analytics</h2>
          <p className="text-muted-foreground">Track performance across all marketing channels</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard
          title="Job Clicks"
          value={data?.totals.jobClicks || 0}
          icon={<MousePointerClick className="h-4 w-4" />}
          color="text-blue-500"
        />
        <SummaryCard
          title="Job Shares"
          value={data?.totals.jobShares || 0}
          icon={<Share2 className="h-4 w-4" />}
          color="text-green-500"
        />
        <SummaryCard
          title="Content Clicks"
          value={data?.totals.contentClicks || 0}
          icon={<MousePointerClick className="h-4 w-4" />}
          color="text-purple-500"
        />
        <SummaryCard
          title="Content Shares"
          value={data?.totals.contentShares || 0}
          icon={<Share2 className="h-4 w-4" />}
          color="text-orange-500"
        />
        <SummaryCard
          title="Service Clicks"
          value={data?.totals.serviceClicks || 0}
          icon={<MousePointerClick className="h-4 w-4" />}
          color="text-cyan-500"
        />
        <SummaryCard
          title="Service Shares"
          value={data?.totals.serviceShares || 0}
          icon={<Share2 className="h-4 w-4" />}
          color="text-pink-500"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="jobs" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Wrench className="h-4 w-4" />
            Services
          </TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clicks by Source</CardTitle>
                <CardDescription>Where job traffic comes from</CardDescription>
              </CardHeader>
              <CardContent>
                <SourceBarChart data={data?.jobClicks || []} dataKey="source" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shares by Channel</CardTitle>
                <CardDescription>Team sharing activity</CardDescription>
              </CardHeader>
              <CardContent>
                <SourcePieChart data={data?.jobShares?.map((s) => ({ name: s.channel, value: s.count })) || []} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performing Jobs</CardTitle>
              <CardDescription>Jobs with most clicks</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.topJobs && data.topJobs.length > 0 ? (
                <div className="space-y-3">
                  {data.topJobs.map((job, index) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-muted-foreground">{job.company_name}</p>
                        </div>
                      </div>
                      <Badge className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {job.clicks} clicks
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No job clicks recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clicks by Source</CardTitle>
                <CardDescription>Where content traffic comes from</CardDescription>
              </CardHeader>
              <CardContent>
                <SourceBarChart data={data?.contentClicks || []} dataKey="source" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shares by Channel</CardTitle>
                <CardDescription>Team sharing activity</CardDescription>
              </CardHeader>
              <CardContent>
                <SourcePieChart data={data?.contentShares?.map((s) => ({ name: s.channel, value: s.count })) || []} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performing Content</CardTitle>
              <CardDescription>Content with most clicks</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.topContent && data.topContent.length > 0 ? (
                <div className="space-y-3">
                  {data.topContent.map((content, index) => (
                    <div key={content.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          #{index + 1}
                        </Badge>
                        <p className="font-medium">{content.title}</p>
                      </div>
                      <Badge className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {content.clicks} clicks
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No content clicks recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Clicks by Source</CardTitle>
                <CardDescription>Traffic sources for each service</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.serviceClicks && data.serviceClicks.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(
                      data.serviceClicks.reduce(
                        (acc, item) => {
                          if (!acc[item.service_slug]) acc[item.service_slug] = [];
                          acc[item.service_slug].push({ source: item.source, count: item.count });
                          return acc;
                        },
                        {} as Record<string, { source: string; count: number }[]>
                      )
                    ).map(([slug, sources]) => (
                      <div key={slug} className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium capitalize mb-2">{slug.replace(/-/g, " ")}</p>
                        <div className="flex flex-wrap gap-2">
                          {sources.map((s) => (
                            <Badge key={s.source} variant="secondary">
                              {s.source}: {s.count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No service clicks recorded yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Shares by Channel</CardTitle>
                <CardDescription>Team sharing by service</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.serviceShares && data.serviceShares.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(
                      data.serviceShares.reduce(
                        (acc, item) => {
                          if (!acc[item.service_slug]) acc[item.service_slug] = [];
                          acc[item.service_slug].push({ channel: item.channel, count: item.count });
                          return acc;
                        },
                        {} as Record<string, { channel: string; count: number }[]>
                      )
                    ).map(([slug, channels]) => (
                      <div key={slug} className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium capitalize mb-2">{slug.replace(/-/g, " ")}</p>
                        <div className="flex flex-wrap gap-2">
                          {channels.map((c) => (
                            <Badge key={c.channel} variant="secondary">
                              {c.channel}: {c.count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No service shares recorded yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={color}>{icon}</span>
          <span className="text-xs text-muted-foreground font-medium">{title}</span>
        </div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

// Bar Chart Component
function SourceBarChart({ data, dataKey }: { data: any[]; dataKey: string }) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No data available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" className="text-xs" />
        <YAxis dataKey={dataKey} type="category" className="text-xs" width={70} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Pie Chart Component
function SourcePieChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No data available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
