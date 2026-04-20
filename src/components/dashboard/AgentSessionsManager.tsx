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
 * 2026 Standard: Executive Logic geometry with reinforced interaction analysis.
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
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-10 w-64 rounded-xl bg-muted/40" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full rounded-[32px] bg-muted/40" />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Terminal Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Intelligence Audit</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Neural Session Telemetry & Token Monitoring v2.6
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadSessions}
          className="rounded-xl h-11 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-sm hover:bg-primary/5"
        >
          <RefreshCw className="h-4 w-4 text-primary" /> Re-Sync Registry
        </Button>
      </div>

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
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500"
          >
            <CardContent className="p-8">
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                    stat.bg,
                    "border-white/5",
                  )}
                >
                  <stat.icon className={cn("h-7 w-7", stat.color)} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black tracking-tighter italic leading-none">{stat.val}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logic Class Distribution */}
      <Card className="rounded-[32px] border-2 border-border/40 bg-card/10 backdrop-blur-sm shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-border/10 pb-4">
            <Terminal className="h-4 w-4 text-primary" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic">
              Distribution Ledger
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(agentStats).map(([key, count]) => (
              <Badge
                key={key}
                variant="secondary"
                className="rounded-xl px-5 py-2 font-black uppercase text-[9px] tracking-widest bg-background border-2 border-border/40 shadow-sm"
              >
                {AGENT_LABELS[key] || key}: <span className="text-primary ml-2 italic">{count} NODES</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Query Console & Filter Node */}
      <div className="flex flex-col sm:flex-row gap-4 bg-muted/20 p-4 rounded-[28px] border-2 border-border/40 backdrop-blur-md">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Interrogate session by talent name or identifier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base"
          />
        </div>
        <div className="flex gap-3">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-48 h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
              <SelectValue placeholder="Protocol Type" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2">
              <SelectItem value="all" className="font-bold">
                ALL PROTOCOLS
              </SelectItem>
              {Object.entries(AGENT_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key} className="font-bold">
                  {label.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
              <SelectValue placeholder="Logic Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2">
              <SelectItem value="all" className="font-bold">
                GLOBAL STATUS
              </SelectItem>
              <SelectItem value="active" className="font-bold">
                ACTIVE NODES
              </SelectItem>
              <SelectItem value="expired" className="font-bold">
                ARCHIVED LOGIC
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Session Viewport */}
      <Card className="rounded-[40px] border-2 border-border/40 overflow-hidden shadow-2xl bg-card/30 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8">Sync Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Talent Identifier</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Agent Protocol</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Depth</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">
                  Consumption
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                  Interrogate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-32 text-muted-foreground/40 italic uppercase tracking-[0.2em] font-black"
                  >
                    No session artifacts detected in current query.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map((session) => (
                  <TableRow key={session.id} className="group transition-all hover:bg-primary/[0.02]">
                    <TableCell className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="font-black text-sm italic">
                          {format(new Date(session.created_at), "MMM d, yyyy")}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-black uppercase tracking-tight text-sm leading-none italic">
                          {session.talent?.full_name}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/60">{session.talent?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-lg border-2 font-black text-[9px] uppercase tracking-widest bg-background"
                      >
                        {AGENT_LABELS[session.agent_key] || session.agent_key}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-black italic">
                      {(session.messages as any[])?.length || 0}
                    </TableCell>
                    <TableCell className="text-center font-black text-amber-500">
                      <div className="flex items-center justify-center gap-1.5 italic">
                        <Zap className="h-3 w-3 fill-current" /> {session.credits_charged || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] border-none px-3 py-1",
                          session.is_active
                            ? "bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/10"
                            : "bg-muted text-muted-foreground/60",
                        )}
                      >
                        {session.is_active ? "ACTIVE_NODE" : "ARCHIVED"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-xl hover:bg-primary group-hover:text-white transition-all shadow-inner"
                        onClick={() => setViewSession(session)}
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Neural Reconstruction Viewport */}
      <Dialog open={!!viewSession} onOpenChange={() => setViewSession(null)}>
        <DialogContent className="max-w-3xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">
                    Neural Interaction Reconstruction
                  </p>
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                    {AGENT_LABELS[viewSession?.agent_key || ""] || viewSession?.agent_key} Logic Chain
                  </DialogTitle>
                </div>
                <Badge
                  className={cn(
                    "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] px-4 py-1.5",
                    viewSession?.is_active ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/60",
                  )}
                >
                  {viewSession?.is_active ? "LIVE_SYNC" : "SNAPSHOT"}
                </Badge>
              </div>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 pt-4 flex gap-6 italic">
                <span>ENTITY: {viewSession?.talent?.full_name}</span>
                <span>
                  UPLINK: {viewSession?.created_at && format(new Date(viewSession.created_at), "MMM d, HH:mm")}
                </span>
                <span>TOKENS: {viewSession?.credits_charged || 0}</span>
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[500px] rounded-[32px] border-2 border-border/40 p-8 bg-card/50 shadow-inner">
              <div className="space-y-8">
                {((viewSession?.messages as ChatMessage[]) || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn("flex items-start gap-5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform hover:scale-110 shadow-sm",
                        msg.role === "assistant"
                          ? "bg-primary text-white border-primary"
                          : "bg-muted text-muted-foreground border-border/60",
                      )}
                    >
                      {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-[24px] p-6 shadow-sm border text-sm font-medium leading-relaxed italic selection:bg-primary/20",
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
                onClick={() => setViewSession(null)}
                className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest"
              >
                Terminate Analysis
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Intelligence Registry: Secured Access Active
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Audit Protocol: Verified Executive Logic 2026.4
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
