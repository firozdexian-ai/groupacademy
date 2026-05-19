import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Eye,
  Bot,
  User,
  Clock,
  Zap,
  ShieldCheck,
  Activity,
  Terminal,
  Database,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Intelligence Audit Terminal (Agent Sessions)
 * High-fidelity monitor for AI-driven career handshakes and token telemetry.
 * 2024 Standard: Executive Logic geometry with reinforced interaction analysis.
 */

interface AgentSession {
  id: string;
  talent_id: string;
  agent_key: string;
  messages: unknown;
  is_active: boolean | null;
  credits_charged: number | null;
  session_started_at: string | null;
  session_expires_at: string | null;
  created_at: string;
  talent?: {
    full_name: string;
    email: string;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AGENT_LABELS: Record<string, string> = {
  career_coach: "Career Coach",
  cv_expert: "CV Expert",
  interview_prep: "Interview Prep",
  salary_negotiator: "Salary Negotiator",
  skill_advisor: "Skill Advisor",
  job_search: "Job Search",
};

export function AgentSessionsManager() {
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewSession, setViewSession] = useState<AgentSession | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("agent_chat_sessions")
        .select(`*, talent:talents(full_name, email)`)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast.error("Transmission Error: Session registry sync failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.talent?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.talent?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAgent = agentFilter === "all" || session.agent_key === agentFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && session.is_active) ||
      (statusFilter === "expired" && !session.is_active);
    return matchesSearch && matchesAgent && matchesStatus;
  });

  const stats = {
    total: sessions.length,
    active: sessions.filter((s) => s.is_active).length,
    totalCredits: sessions.reduce((sum, s) => sum + (s.credits_charged || 0), 0),
    avgMessages:
      sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + ((s.messages as any[])?.length || 0), 0) / sessions.length)
        : 0,
  };

  const agentStats = sessions.reduce(
    (acc, session) => {
      acc[session.agent_key] = (acc[session.agent_key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (isLoading)
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-8">
        <Skeleton className="h-10 w-64 rounded-xl bg-muted/40" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full rounded-[40px] bg-muted/40" />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-8">
      {/* Terminal Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Activity className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Intelligence Audit</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Neural Session Telemetry & Token Monitoring
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadSessions}
          className="rounded-xl h-11 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-sm bg-background/50 hover:bg-primary/5"
        >
          <RefreshCw className="h-4 w-4 text-primary" /> Re-Sync Registry
        </Button>
      </header>

      {/* Summary Telemetry HUD */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          {
            label: "Total Sessions",
            val: stats.total,
            icon: MessageSquare,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          { label: "Active Nodes", val: stats.active, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          {
            label: "Token Consumption",
            val: stats.totalCredits,
            icon: Database,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "Logic Depth (Avg)",
            val: stats.avgMessages,
            icon: Activity,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
          >
            <CardContent className="p-8">
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner shrink-0",
                    stat.bg,
                    "border-white/5",
                  )}
                >
                  <stat.icon className={cn("h-7 w-7", stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1 truncate">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black tracking-tighter italic leading-none truncate">{stat.val}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Session Viewport */}
        <Card className="xl:col-span-2 rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />

          <CardHeader className="p-6 border-b border-border/10 bg-muted/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70 shrink-0">
              <Terminal className="h-4 w-4 text-primary" /> Session Artifacts
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:max-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Query talent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl border-2 bg-background/50 font-medium text-xs w-full"
                />
              </div>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest bg-background/50">
                  <SelectValue placeholder="Protocol" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="all" className="font-bold text-[9px] uppercase">
                    All Protocols
                  </SelectItem>
                  {Object.entries(AGENT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="font-bold text-[9px] uppercase">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px] h-10 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest bg-background/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="all" className="font-bold text-[9px] uppercase">
                    All Status
                  </SelectItem>
                  <SelectItem value="active" className="font-bold text-[9px] uppercase">
                    Active Nodes
                  </SelectItem>
                  <SelectItem value="expired" className="font-bold text-[9px] uppercase">
                    Archived
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border-2 border-dashed border-border/20 m-6 rounded-3xl">
                <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                  No session artifacts detected in current query.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 border-b-2 border-border/20">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 px-6">
                        Timestamp
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Entity</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Protocol</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">
                        Depth
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">
                        Cost
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">
                        Status
                      </TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-6">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y-2 divide-border/5">
                    {filteredSessions.map((session) => (
                      <TableRow key={session.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <TableCell className="px-6 py-4">
                          <div className="font-black text-[11px] uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">
                            {format(new Date(session.created_at), "MMM d, HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-black text-xs italic group-hover:text-primary transition-colors whitespace-nowrap">
                            {session.talent?.full_name}
                          </div>
                          <div className="text-[9px] font-bold text-muted-foreground/60 truncate max-w-[120px] mt-0.5">
                            {session.talent?.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="rounded-lg border-2 font-black text-[8px] uppercase tracking-widest bg-background whitespace-nowrap"
                          >
                            {AGENT_LABELS[session.agent_key] || session.agent_key}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-muted-foreground/80">
                          {(session.messages as any[])?.length || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            <Zap className="h-3 w-3 fill-current" /> {session.credits_charged || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "rounded-lg font-black text-[8px] uppercase tracking-widest border-none px-2 py-0.5",
                              session.is_active
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-muted text-muted-foreground/60",
                            )}
                          >
                            {session.is_active ? "LIVE" : "ARCHIVED"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
                            onClick={() => setViewSession(session)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logic Class Distribution */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="rounded-[40px] border-2 border-border/40 shadow-xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col sticky top-6">
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-400 to-indigo-500" />
            <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
                <Database className="h-4 w-4 text-purple-500" /> Protocol Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                {Object.entries(agentStats)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, count]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/20 hover:border-primary/20 transition-colors"
                    >
                      <span className="font-black text-[10px] uppercase tracking-widest truncate max-w-[150px]">
                        {AGENT_LABELS[key] || key}
                      </span>
                      <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                        {count}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Neural Reconstruction Viewport */}
      <Dialog open={!!viewSession} onOpenChange={() => setViewSession(null)}>
        <DialogContent className="max-w-3xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-8 md:p-10">
            <DialogHeader className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">
                    Neural Reconstruction
                  </p>
                  <DialogTitle className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic leading-none">
                    {AGENT_LABELS[viewSession?.agent_key || ""] || viewSession?.agent_key} Chain
                  </DialogTitle>
                </div>
                <Badge
                  className={cn(
                    "w-fit rounded-lg font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1",
                    viewSession?.is_active ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/60",
                  )}
                >
                  {viewSession?.is_active ? "LIVE_SYNC" : "SNAPSHOT"}
                </Badge>
              </div>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-4 flex flex-wrap gap-4 md:gap-6 italic">
                <span>ENTITY: {viewSession?.talent?.full_name}</span>
                <span>
                  UPLINK: {viewSession?.created_at && format(new Date(viewSession.created_at), "MMM d, HH:mm")}
                </span>
                <span className="flex items-center gap-1 text-amber-500">
                  <Zap className="h-3 w-3 fill-current" /> {viewSession?.credits_charged || 0}
                </span>
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[400px] md:h-[500px] rounded-[32px] border-2 border-border/40 p-6 md:p-8 bg-card/50 shadow-inner">
              <div className="space-y-8">
                {((viewSession?.messages as ChatMessage[]) || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-4 md:gap-5",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center border shrink-0 shadow-sm",
                        msg.role === "assistant"
                          ? "bg-primary text-white border-primary"
                          : "bg-muted text-muted-foreground border-border/60",
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <Bot className="h-4 w-4 md:h-5 md:w-5" />
                      ) : (
                        <User className="h-4 w-4 md:h-5 md:w-5" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[85%] md:max-w-[80%] rounded-[24px] p-5 md:p-6 shadow-sm border text-sm font-medium leading-relaxed italic selection:bg-primary/20",
                        msg.role === "user"
                          ? "bg-primary/5 border-primary/20 text-foreground"
                          : "bg-muted/40 border-border/40 text-muted-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {(!viewSession?.messages || (viewSession.messages as any[]).length === 0) && (
                  <div className="py-20 text-center space-y-4 opacity-20">
                    <Database className="h-12 w-12 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic">
                      Logic chain null: No interaction data synced.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-end pt-8">
              <Button
                variant="outline"
                onClick={() => setViewSession(null)}
                className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2"
              >
                Terminate Analysis
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Operational Trace Footer */}
      <footer className="mt-12 pt-8 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Agent OS: Session Telemetry</p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-6 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}

export default AgentSessionsManager;
