import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAbroadGraph } from "./hooks/useAbroadGraph";
import { trackError } from "@/lib/errorTracking";
import {
  Globe,
  GraduationCap,
  ClipboardList,
  Map,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle2,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Career Abroad Management Dashboard: Overview Tab
 * Version: Phase 10i.2 Hardened (Production Candidate Edition)
 * Surface: /dashboard?tab=overview (Admin Command Center Cockpit)[cite: 2, 4]
 * Operations Mode: Real-time macro aggregator managing international admissions workflows[cite: 2, 4].
 */

export function AbroadOverviewTab() {
  const { abroadGraphQuery } = useAbroadGraph();
  const { data, isLoading, isError, error } = abroadGraphQuery;

  // Track database graph exceptions directly to the Admin console subsystem
  if (isError && error) {
    trackError("abroad-overview-tab-rendering-anomaly", {
      message: error instanceof Error ? error.message : "Graph query failure",
    });
  }

  // Pure data computation models preserved completely[cite: 4]
  const activePrograms = useMemo(() => {
    return data?.programs?.filter((p) => p.status === "active") || [];
  }, [data?.programs]);

  const pendingApps = useMemo(() => {
    return data?.applications?.filter((a) => a.status === "pending" || a.status === "reviewing") || [];
  }, [data?.applications]);

  const pendingRoadmaps = useMemo(() => {
    return data?.roadmaps?.filter((r) => r.status === "pending" || r.status === "new") || [];
  }, [data?.roadmaps]);

  const totalIelts = data?.ieltsAttempts?.length || 0;
  const totalPendingActions = pendingApps.length + pendingRoadmaps.length;

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500 text-left">
      {/* Executive Command Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-6 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Globe className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Abroad Command Console</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Global Admissions Intake, Language Labs, & Regional Placements[cite: 2, 4]
          </p>
        </div>
        {totalPendingActions > 0 && (
          <Badge
            variant="secondary"
            className="h-9 px-4 rounded-xl font-bold text-xs uppercase tracking-wider gap-2 bg-primary/10 text-primary border-none animate-pulse"
          >
            <AlertCircle className="h-4 w-4" /> {totalPendingActions} Pending Actions
          </Badge>
        )}
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Main Metric KPIs Framework Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricTile
              label="Active University Programs"
              value={activePrograms.length}
              icon={GraduationCap}
              color="text-primary"
              bg="bg-primary/10"
            />
            <MetricTile
              label="Total Matriculations"
              value={data.applications.length}
              icon={ClipboardList}
              color="text-blue-600"
              bg="bg-blue-500/10"
            />
            <MetricTile
              label="Active Roadmap Leads"
              value={data.roadmaps.length}
              icon={Map}
              color="text-emerald-600"
              bg="bg-emerald-500/10"
            />
            <MetricTile
              label="Logged IELTS Assessments"
              value={totalIelts}
              icon={Mic}
              color="text-indigo-600"
              bg="bg-indigo-500/10"
            />
          </div>

          {/* Transaction-Isolated Pipeline Feeds */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Priority Admissions Routing Channel Panel */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Priority Admissions Queue
                </h3>
              </div>

              <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-600" />
                <CardContent className="p-0">
                  {pendingApps.length === 0 && pendingRoadmaps.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground/60 italic">
                        All admissions updates have been fully processed.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {/* Render top 3 Applications */}
                      {pendingApps.slice(0, 3).map((app) => (
                        <div
                          key={app.id}
                          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                              <ClipboardList className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-foreground">University Application Entry</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Program ID Reference:{" "}
                                <span className="font-mono font-bold text-primary">
                                  {app.program_id.substring(0, 8)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] bg-background text-muted-foreground border-border/60"
                            >
                              Talent: {app.talent_user_id.substring(0, 8)}
                            </Badge>
                            <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 border-none font-bold uppercase text-[9px] tracking-wider px-2.5 py-0.5 rounded-full">
                              Awaiting Review
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {/* Render top 3 Roadmaps */}
                      {pendingRoadmaps.slice(0, 3).map((roadmap) => (
                        <div
                          key={roadmap.id}
                          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                              <Map className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-foreground">Career Abroad Roadmap Lead</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Target Destination Region:{" "}
                                <span className="font-semibold text-foreground">{roadmap.destination}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] bg-background text-muted-foreground border-border/60"
                            >
                              Talent: {roadmap.talent_id.substring(0, 8)}
                            </Badge>
                            <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[9px] tracking-wider px-2.5 py-0.5 rounded-full">
                              Action Required
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pipeline Resource Allocation Map Side Panel */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pipeline Distribution
                </h3>
              </div>

              <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-5">
                    <PulseBar
                      label="Live Partner Curriculums"
                      value={activePrograms.length}
                      max={200}
                      color="bg-primary"
                    />
                    <PulseBar
                      label="Total Active Applications"
                      value={data.applications.length}
                      max={500}
                      color="bg-blue-600"
                    />
                    <PulseBar
                      label="Escalated Roadmap Leads"
                      value={data.roadmaps.length}
                      max={500}
                      color="bg-emerald-600"
                    />
                    <PulseBar
                      label="Processed IELTS Grader Metrics"
                      value={totalIelts}
                      max={1000}
                      color="bg-indigo-600"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

function MetricTile({ label, value, icon: Icon, color, bg }: MetricTileProps) {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm shadow-sm overflow-hidden hover:border-primary/30 transition-all group">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center border border-white/5 transition-transform group-hover:scale-105 shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs font-semibold text-muted-foreground mb-0.5 truncate">{label}</p>
          <p className="text-3xl font-bold tracking-tight leading-none text-foreground">
            {value?.toLocaleString() || "0"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface PulseBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function PulseBar({ label, value, max, color }: PulseBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-[11px] font-bold text-foreground">{value} Elements</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default AbroadOverviewTab;
