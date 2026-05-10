import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useUgcGraph } from "hooks/useUgcGraph";
import { Radio, Video, FileText, MessageSquare, Trophy, ShieldAlert, Activity, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function UgcOverviewTab() {
  const { ugcGraphQuery } = useUgcGraph();
  const { data, isLoading } = ugcGraphQuery;

  const pendingReports = data?.reports.filter((r) => r.status === "pending") || [];

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Content Command</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Social Graph Telemetry &amp; Moderation Queue
          </p>
        </div>
        {pendingReports.length > 0 && (
          <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-xs font-bold uppercase">
            <ShieldAlert className="h-3.5 w-3.5" />
            {pendingReports.length} Pending Reports
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricTile
              label="Free Videos"
              value={data.videos.length}
              icon={Video}
              color="text-primary"
              bg="bg-primary/10"
            />
            <MetricTile
              label="Blog Posts"
              value={data.blogs.length}
              icon={FileText}
              color="text-emerald-600"
              bg="bg-emerald-500/10"
            />
            <MetricTile
              label="Feed Posts"
              value={data.feedPosts.length}
              icon={MessageSquare}
              color="text-blue-600"
              bg="bg-blue-500/10"
            />
            <MetricTile
              label="Competitions"
              value={data.competitions.length}
              icon={Trophy}
              color="text-amber-600"
              bg="bg-amber-500/10"
            />
          </div>

          {/* Data Splits: Moderation & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Moderation Queue (Left 2 Columns) */}
            <Card className="lg:col-span-2 border-2">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Priority Moderation Queue
                </h3>
              </CardHeader>
              <CardContent>
                {pendingReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                      <ShieldAlert className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase">
                      Zero Active Threats Detected
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingReports.slice(0, 5).map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-destructive/5 hover:bg-destructive/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-md bg-destructive/15 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold capitalize truncate">
                              Reported {report.scope?.replace("_", " ")}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              Reason: {report.reason}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <code className="text-[10px] text-muted-foreground font-mono">
                            ID: {report.scope_id?.substring(0, 8)}...
                          </code>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">
                            Awaiting Review
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Pulse (Right Column) */}
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-wide">Platform Pulse</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PulseBar
                    label="Videos"
                    value={data.videos.length}
                    max={500}
                    color="bg-primary"
                  />
                  <PulseBar
                    label="Blogs"
                    value={data.blogs.length}
                    max={500}
                    color="bg-emerald-500"
                  />
                  <PulseBar
                    label="Feed"
                    value={data.feedPosts.length}
                    max={500}
                    color="bg-blue-500"
                  />
                  <PulseBar
                    label="Competitions"
                    value={data.competitions.length}
                    max={100}
                    color="bg-amber-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-2">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", bg)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="text-2xl font-black tabular-nums leading-tight">
            {value?.toLocaleString() || "0"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PulseBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-bold uppercase tracking-wide">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value} Nodes</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default UgcOverviewTab;
