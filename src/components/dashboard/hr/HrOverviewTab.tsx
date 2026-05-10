import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useHrGraph } from "./hooks/useHrGraph";
import { Network, Users, Briefcase, Building2, Layers, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function HrOverviewTab() {
  const { hrGraphQuery } = useHrGraph();
  const { data, isLoading } = hrGraphQuery;

  const getFunctionHeadcount = (functionId: string) => {
    if (!data) return 0;
    const teams = data.teams.filter((t) => t.function_id === functionId);
    return teams.reduce((sum, t) => sum + (data.headcountByTeam[t.id] || 0), 0);
  };

  const getVerticalHeadcount = (verticalId: string) => {
    if (!data) return 0;
    const funcs = data.functions.filter((f) => f.vertical_id === verticalId);
    return funcs.reduce((sum, f) => sum + getFunctionHeadcount(f.id), 0);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Org Hierarchy</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Internal Graph & Real-Time Headcount Telemetry
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Top KPI Nodes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricTile
              label="Active Headcount"
              value={data.totalActiveHeadcount}
              icon={Users}
              color="text-primary"
              bg="bg-primary/10"
            />
            <MetricTile
              label="Verticals"
              value={data.verticals.length}
              icon={Building2}
              color="text-cyan-500"
              bg="bg-cyan-500/10"
            />
            <MetricTile
              label="Functions"
              value={data.functions.length}
              icon={Briefcase}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <MetricTile
              label="Teams"
              value={data.teams.length}
              icon={Network}
              color="text-amber-500"
              bg="bg-amber-500/10"
            />
          </div>

          {/* Organizational Map & Grade Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Hierarchy (Left 2 Columns) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest">
                  Vertical Deployment Tree
                </h3>
              </div>

              {data.verticals.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-10 text-center">
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Zero Verticals Detected.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                data.verticals.map((vertical) => {
                  const funcs = data.functions.filter((f) => f.vertical_id === vertical.id);
                  const vHeadcount = getVerticalHeadcount(vertical.id);

                  return (
                    <Card key={vertical.id} className="border-2 overflow-hidden">
                      {/* Vertical Header */}
                      <CardHeader className="bg-muted/30 border-b-2 flex-row items-start justify-between gap-3 space-y-0">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2 text-base font-black uppercase tracking-tight">
                            <Building2 className="h-4 w-4 text-primary" />
                            {vertical.name}
                          </CardTitle>
                          {vertical.description && (
                            <p className="text-xs text-muted-foreground">{vertical.description}</p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="font-black text-base px-3 py-1 rounded-lg shrink-0"
                        >
                          <Users className="h-3.5 w-3.5 mr-1" />
                          {vHeadcount}
                        </Badge>
                      </CardHeader>

                      {/* Functions & Teams */}
                      <CardContent className="p-4">
                        {funcs.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            No functions assigned
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {funcs.map((func) => {
                              const teams = data.teams.filter((t) => t.function_id === func.id);
                              const fHeadcount = getFunctionHeadcount(func.id);

                              return (
                                <div
                                  key={func.id}
                                  className="rounded-xl border-2 border-dashed bg-background p-3 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="h-3.5 w-3.5 text-cyan-500" />
                                      <span className="font-bold text-sm">{func.name}</span>
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[10px]">
                                      {fHeadcount} FTE
                                    </Badge>
                                  </div>

                                  <div className="pl-5 space-y-1">
                                    {teams.length === 0 ? (
                                      <p className="text-[11px] text-muted-foreground italic">
                                        Zero teams
                                      </p>
                                    ) : (
                                      teams.map((team) => (
                                        <div
                                          key={team.id}
                                          className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-md hover:bg-muted/40 transition-colors"
                                        >
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <span className="truncate">{team.name}</span>
                                          </div>
                                          <span className="font-mono text-[11px] font-bold text-muted-foreground shrink-0">
                                            {data.headcountByTeam[team.id] || 0}
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Grade Distribution Sidebar (Right Column) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest">
                  Grade Distribution
                </h3>
              </div>

              <Card className="border-2">
                <CardContent className="p-4">
                  {data.grades.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No grades defined</p>
                  ) : (
                    <div className="space-y-4">
                      {data.grades.map((grade) => {
                        const count = data.headcountByGrade[grade.id] || 0;
                        const percentage =
                          data.totalActiveHeadcount > 0
                            ? Math.round((count / data.totalActiveHeadcount) * 100)
                            : 0;

                        return (
                          <div key={grade.id} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[10px] font-black shrink-0"
                                >
                                  L{grade.level}
                                </Badge>
                                <span className="text-xs font-bold truncate">{grade.name}</span>
                              </div>
                              <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  "h-full bg-gradient-to-r from-primary to-cyan-500 transition-all",
                                )}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
        <div className={cn("h-10 w-10 rounded-xl grid place-items-center", bg)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-black tabular-nums">{value?.toLocaleString() || "0"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default HrOverviewTab;
