import { useJobsGraph } from "./hooks/useJobsGraph";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanSquare, Users, Briefcase, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function JobsKanbanPipelineTab() {
  const { jobsGraphQuery } = useJobsGraph();
  const { data, isLoading } = jobsGraphQuery;

  const stages = [
    {
      id: "pending",
      label: "Inbox",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      id: "in_review",
      label: "Reviewing",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      id: "interviewing",
      label: "Interview",
      icon: Briefcase,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      id: "hired",
      label: "Hired",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      id: "rejected",
      label: "Archived",
      icon: XCircle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6 h-[calc(100vh-100px)] flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md shrink-0">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-cyan-500">
            <KanbanSquare className="h-8 w-8 text-cyan-500 fill-cyan-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Active Pipeline
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Visual Application Flow
          </p>
        </div>
        <Badge
          variant="outline"
          className="h-12 px-6 rounded-xl font-black uppercase text-xs tracking-widest gap-2 border-cyan-500/50 text-cyan-600 bg-cyan-500/10"
        >
          {data?.applications?.length || 0} Total Nodes
        </Badge>
      </header>

      {isLoading ? (
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="min-w-[300px] rounded-[32px] bg-muted/40 h-full" />
          ))}
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start snap-x">
          {stages.map((stage) => {
            const columnApps = data?.applications?.filter((a) => a.status === stage.id) || [];
            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="min-w-[320px] max-w-[320px] flex flex-col gap-4 snap-center h-full">
                {/* Column Header */}
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border-2 backdrop-blur-md",
                    stage.bg,
                    stage.border,
                  )}
                >
                  <div className="flex items-center gap-2">
                    <StageIcon className={cn("h-5 w-5", stage.color)} />
                    <h3 className={cn("font-black uppercase tracking-widest text-xs", stage.color)}>{stage.label}</h3>
                  </div>
                  <Badge className={cn("font-mono font-black", stage.color, stage.bg, "border-none")}>
                    {columnApps.length}
                  </Badge>
                </div>

                {/* Cards Container */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
                  {columnApps.length === 0 ? (
                    <div className="p-10 text-center border-2 border-dashed border-border/40 rounded-3xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                        Empty Stage
                      </p>
                    </div>
                  ) : (
                    columnApps.map((app) => (
                      <Card
                        key={app.id}
                        className="rounded-3xl border-2 border-border/40 bg-card/50 hover:bg-card hover:border-primary/30 transition-all shadow-lg hover:shadow-xl cursor-pointer group"
                      >
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <Badge
                              variant="outline"
                              className="font-mono text-[9px] uppercase tracking-widest bg-background/50"
                            >
                              {app.job_id.substring(0, 8)}
                            </Badge>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                              {new Date(app.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-primary italic mb-1">
                              Talent ID
                            </p>
                            <p className="font-mono text-sm text-foreground/80">{app.talent_id.substring(0, 12)}...</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default JobsKanbanPipelineTab;
