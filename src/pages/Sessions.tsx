import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Plus,
  Video,
  Clock,
  User,
  GraduationCap,
  ArrowRight,
  Search,
  ShieldCheck,
  Sparkles,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryWithTimeout } from "@/hooks/useQueryWithTimeout";
import { listAllSessionsWithRelations } from "@/domains/learning/repo/learningRepo";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils";

export default function Sessions() {
  const navigate = useNavigate();

  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useQueryWithTimeout({
    queryKey: ["sessions-registry"],
    queryFn: async () => {
      return await listAllSessionsWithRelations();
    },
    timeout: TIMEOUTS.DEFAULT,
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "scheduled":
        return { label: "Scheduled", color: "text-blue-600 bg-blue-500/10 border-blue-500/20", dot: "bg-blue-500" };
      case "ongoing":
        return {
          label: "Live Node",
          color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
          dot: "bg-emerald-500 animate-pulse",
        };
      case "completed":
        return {
          label: "Archive Ready",
          color: "text-muted-foreground bg-muted border-border/40",
          dot: "bg-muted-foreground/40",
        };
      case "cancelled":
        return { label: "Terminated", color: "text-rose-600 bg-rose-500/10 border-rose-500/20", dot: "bg-rose-500" };
      default:
        return { label: status, color: "bg-muted", dot: "bg-muted" };
    }
  };

  if (isLoading)
    return (
      <div className="container max-w-5xl mx-auto py-12 px-6 space-y-10 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-32 rounded-xl" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <ErrorState
          title="Registry Sync Failed"
          description={error instanceof Error ? error.message : "Handshake Error"}
          onRetry={() => refetch()}
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/20 pb-20 selection:bg-primary/10">
      <main className="container max-w-5xl mx-auto py-12 px-6 space-y-10 animate-in fade-in duration-700">
        {/* Executive Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="rounded-full px-4 py-1 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-tight"
            >
              <Sparkles className="w-3 h-3 mr-2" /> Global Logic Ledger
            </Badge>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Sessions</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
              Curriculum Node Management & Handshake Protocols
            </p>
          </div>
          <Button
            onClick={() => navigate("/sessions/new")}
            className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Initialize Node
          </Button>
        </header>

        {!sessions || sessions.length === 0 ? (
          <Card className="rounded-2xl border-border/40 border-dashed bg-muted/30 py-24">
            <CardContent className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="h-20 w-20 rounded-2xl bg-background flex items-center justify-center shadow-xl">
                <CalendarIcon className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tighter uppercase">Nothing here yet</h3>
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest max-w-[280px]">
                  No course sessions are currently logged in the central ledger.
                </p>
              </div>
              <Button
                onClick={() => navigate("/sessions/new")}
                variant="outline"
                className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest"
              >
                <Plus className="mr-2 h-4 w-4" /> Create First Node
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {sessions.map((session) => {
              const config = getStatusConfig(session.status);
              return (
                <Card
                  key={session.id}
                  className="rounded-2xl border-border/40 shadow-sm bg-card hover:shadow-2xl hover:border-primary/20 transition-all duration-500 group cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/sessions/${session.id}/edit`)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Left: Temporal Identifier */}
                      <div className="p-8 md:w-64 bg-muted/30 border-b md:border-b-0 md:border-r border-border/10 flex flex-col justify-center items-center text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Scheduled Date
                        </p>
                        <div className="space-y-0.5">
                          <p className="text-2xl font-black tracking-tighter">
                            {format(new Date(session.scheduled_date), "dd MMM")}
                          </p>
                          <p className="text-xs font-bold text-primary">
                            {format(new Date(session.scheduled_date), "p")}
                          </p>
                        </div>
                      </div>

                      {/* Right: Logic & Info */}
                      <div className="p-8 flex-1 space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <Badge
                                className={cn(
                                  "px-3 py-0.5 rounded-full font-black uppercase text-[8px] tracking-widest border",
                                  config.color,
                                )}
                              >
                                <div className={cn("w-1.5 h-1.5 rounded-full mr-2", config.dot)} />
                                {config.label}
                              </Badge>
                              <p className="text-[9px] font-mono text-muted-foreground uppercase opacity-40">
                                UID: {session.id.slice(0, 8)}
                              </p>
                            </div>
                            <h3 className="text-2xl font-black tracking-tighter uppercase group-hover:text-primary transition-colors">
                              {session.title}
                            </h3>
                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                              <GraduationCap className="h-3 w-3" /> {session.content?.title || "Standalone Node"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all"
                          >
                            <ArrowRight className="h-5 w-5 text-primary" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-border/10">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[8px] font-black text-muted-foreground uppercase">Duration</p>
                              <p className="text-xs font-bold">{session.duration_minutes}m</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[8px] font-black text-muted-foreground uppercase">Instructor</p>
                              <p className="text-xs font-bold line-clamp-1">
                                {session.instructors?.full_name || "Unassigned"}
                              </p>
                            </div>
                          </div>
                          {session.meeting_link && (
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-emerald-500/5 flex items-center justify-center">
                                <Video className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[8px] font-black text-emerald-600 uppercase">Live Link</p>
                                <p className="text-xs font-bold text-emerald-600">Active Node</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {session.description && (
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed italic line-clamp-2 pt-2">
                            "{session.description}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <footer className="text-center pt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-background border border-border/40">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Admin Session Ledger v2.6.01
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
