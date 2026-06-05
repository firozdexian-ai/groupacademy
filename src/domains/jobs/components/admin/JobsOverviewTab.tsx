import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useJobsGraph } from "./hooks/useJobsGraph";
import { Briefcase, Users, UserPlus, ClipboardList, Activity, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function JobsOverviewTab() {
  const { jobsGraphQuery } = useJobsGraph();
  const { data, isLoading } = jobsGraphQuery;

  // Calculate KPIs
  const activeJobs = data?.jobs?.filter((j) => j.status === "active") || [];
  const pendingApps = data?.applications?.filter((a) => a.status === "pending" || a.status === "in_review") || [];
  const pendingAssessments = data?.assessments?.filter((a) => a.status === "pending") || [];
  const crmVolume = data?.crmRecords?.length || 0;

  const totalPendingActions = pendingApps.length + pendingAssessments.length;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-accent">
            <Briefcase className="h-8 w-8 text-accent fill-accent/20" />
            <h2 className="text-4xl font-semibold uppercase tracking-tight italic leading-none text-foreground">
              ATS Command
            </h2>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Recruitment activity & pipeline
          </p>
        </div>
        {totalPendingActions > 0 && (
          <Badge
            variant="outline"
            className="h-12 px-6 rounded-xl font-semibold uppercase text-xs tracking-widest gap-2 border-accent/50 text-accent bg-accent/10 animate-pulse"
          >
            <AlertCircle className="h-4 w-4" /> {totalPendingActions} Pending Actions
          </Badge>
        )}
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricTile
              label="Active Roles"
              value={activeJobs.length}
              icon={Briefcase}
              color="text-accent"
              bg="bg-accent/10"
            />
            <MetricTile
              label="Pending Applications"
              value={pendingApps.length}
              icon={Users}
              color="text-primary"
              bg="bg-primary/10"
            />
            <MetricTile
              label="Sourced Candidates"
              value={crmVolume}
              icon={UserPlus}
              color="text-success"
              bg="bg-success/10"
            />
            <MetricTile
              label="Active Assessments"
              value={data.assessments.length}
              icon={ClipboardList}
              color="text-accent"
              bg="bg-accent/10"
            />
          </div>

          {/* Data Splits: Escalations & System Health */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Priority Action Queue (Left 2 Columns) */}
            <div className="xl:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Clock className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-semibold text-muted-foreground italic">
                  Priority Recruitment Queue
                </h3>
              </div>

              <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-accent via-primary to-accent" />
                <CardContent className="p-0">
                  {pendingApps.length === 0 && pendingAssessments.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center border-2 border-success/20">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                      </div>
                      <p className="text-[10px] font-semibold text-muted-foreground/50 italic">
                        Inbox Zero Achieved
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/5">
                      {/* Render top 3 Applications */}
                      {pendingApps.slice(0, 3).map((app) => (
                        <div
                          key={app.id}
                          className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-primary/[0.02] transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-sm">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm uppercase italic tracking-tight text-foreground/90">
                                Job Application
                              </h4>
                              <p className="text-[10px] font-bold text-muted-foreground mt-1">
                                Submitted:{" "}
                                <span className="text-primary">{new Date(app.created_at).toLocaleDateString()}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="font-mono text-[9px] border-2"
                            >
                              Talent ID: {app.talent_id.substring(0, 8)}
                            </Badge>
                            <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[9px] tracking-widest">
                              Awaiting Review
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {/* Render top 3 Assessments */}
                      {pendingAssessments.slice(0, 3).map((assess) => (
                        <div
                          key={assess.id}
                          className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-accent/[0.02] transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-accent/10 border-2 border-accent/20 flex items-center justify-center shadow-sm">
                              <ClipboardList className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm uppercase italic tracking-tight text-foreground/90">
                                Skill Assessment
                              </h4>
                              <p className="text-[10px] font-bold text-muted-foreground mt-1">
                                Pending Evaluation
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="font-mono text-[9px] border-2"
                            >
                              Talent ID: {assess.talent_id.substring(0, 8)}
                            </Badge>
                            <Badge className="bg-accent/10 text-accent border-none font-bold uppercase text-[9px] tracking-widest">
                              Requires Grading
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Platform Pulse (Right Column) */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Activity className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-semibold text-muted-foreground italic">
                  Pipeline Distribution
                </h3>
              </div>

              <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <PulseBar label="Live Job Postings" value={activeJobs.length} max={100} color="bg-accent" />
                    <PulseBar
                      label="Total Applications"
                      value={data.applications.length}
                      max={1000}
                      color="bg-primary"
                    />
                    <PulseBar label="CRM Pipeline" value={crmVolume} max={500} color="bg-success" />
                    <PulseBar
                      label="Sent Invitations"
                      value={data.invitations.length}
                      max={200}
                      color="bg-accent"
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

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm shadow-xl overflow-hidden hover:border-primary/30 transition-all group">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-background/5 transition-transform group-hover:rotate-6 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground italic mb-1 truncate">
            {label}
          </p>
          <p className="text-4xl font-semibold tracking-tight leading-none text-foreground/90">
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
        <span className="text-muted-foreground">{label}</span>
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

export default JobsOverviewTab;
