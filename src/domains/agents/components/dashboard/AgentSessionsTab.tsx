import { useEffect, useState } from "react";
import { listRecentAgentChatSessions } from "@/domains/agents/repo/agentsRepo";
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
import { trackError } from "@/lib/errorTracking";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Career Guidance System: Intelligence Audit Terminal (Agent Sessions)
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/command-center?tab=sessions (Operator Conversation Audit Workspace)
 * Operations Mode: Automated Efficiency layout rendering tracking historical student assistant interactions.
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
    let active = true;
    if (active) {
      loadSessions();
    }
    return () => {
      active = false;
    };
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await listRecentAgentChatSessions(200);
      setSessions(data);
    } catch (error: any) {
      trackError("agent-sessions-manager-fetch-failure", { error: error.message });
      toast.error("Failed to synchronize student conversation registry indexes.");
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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6 text-left">
        <Skeleton className="h-10 w-48 rounded-xl bg-muted/30" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-muted/30" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl bg-muted/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Central Command Control Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/40 p-6 rounded-2xl border border-border/40 backdrop-blur-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-primary">
            <Activity className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Session Activity Audit</h2>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Track student user conversations, monitor messaging depth metrics, and evaluate compute token credit billing
            rates.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadSessions}
          className="rounded-xl h-10 px-4 border border-border font-semibold text-xs text-foreground bg-background hover:bg-muted gap-2 shadow-sm shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5 text-primary" /> Refresh Sessions Index
        </Button>
      </header>

      {/* Summary Operational Performance KPI Widgets */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <KpiNode
          icon={MessageSquare}
          label="Total Sessions Mapped"
          val={stats.total}
          color="text-blue-600"
          bg="bg-blue-500/10"
        />
        <KpiNode
          icon={Clock}
          label="Active Conversations"
          val={stats.active}
          color="text-emerald-600"
          bg="bg-emerald-500/10"
        />
        <KpiNode
          icon={Database}
          label="Credits Spent"
          val={stats.totalCredits.toLocaleString()}
          color="text-amber-600"
          bg="bg-amber-500/10"
        />
        <KpiNode
          icon={Activity}
          label="Average Message Depth"
          val={stats.avgMessages}
          color="text-purple-600"
          bg="bg-purple-500/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Process Summaries Data Viewport Grid */}
        <Card className="xl:col-span-2 rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card flex flex-col">
          <div className="h-1 w-full bg-primary" />

          <CardHeader className="p-4 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80 shrink-0">
              <Terminal className="h-4 w-4 text-primary" /> Conversation Summaries
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:max-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  placeholder="Search user profile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-xl border border-border text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary bg-background/80"
                />
              </div>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-full sm:w-[130px] h-9 rounded-xl border border-border text-xs font-semibold tracking-wide bg-background/80">
                  <SelectValue placeholder="Assistant Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="all" className="font-medium text-xs">
                    All Assistant Types
                  </SelectItem>
                  {Object.entries(AGENT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="font-medium text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[120px] h-9 rounded-xl border border-border text-xs font-semibold tracking-wide bg-background/80">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="all" className="font-medium text-xs">
                    All Status
                  </SelectItem>
                  <SelectItem value="active" className="font-medium text-xs">
                    Active
                  </SelectItem>
                  <SelectItem value="expired" className="font-medium text-xs">
                    Archived
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0 bg-background/50">
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-muted/10 border border-dashed border-border/60 m-4 rounded-xl space-y-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
                  <Activity className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-muted-foreground text-center">
                  No active guidance log records matched the requested filters matrix criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-b border-border/60">
                      <TableHead className="text-xs font-bold text-foreground py-3.5 px-5">Uplink Started</TableHead>
                      <TableHead className="text-xs font-bold text-foreground">Talent Student</TableHead>
                      <TableHead className="text-xs font-bold text-foreground">Assistant Assigned</TableHead>
                      <TableHead className="text-center text-xs font-bold text-foreground">Message Depth</TableHead>
                      <TableHead className="text-center text-xs font-bold text-foreground">Credits Mapped</TableHead>
                      <TableHead className="text-center text-xs font-bold text-foreground">Routing State</TableHead>
                      <TableHead className="text-right text-xs font-bold text-foreground px-5">View Log</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow
                        key={session.id}
                        className="hover:bg-primary/[0.01] border-b border-border/40 last:border-none group"
                      >
                        <TableCell className="px-5 py-3 whitespace-nowrap text-xs font-semibold font-mono text-muted-foreground/80 tabular-nums">
                          {format(new Date(session.created_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-none">
                            {session.talent?.full_name || "Unknown Profile"}
                          </div>
                          <div
                            className="text-[11px] font-medium text-muted-foreground mt-1 truncate max-w-[140px]"
                            title={session.talent?.email}
                          >
                            {session.talent?.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-semibold text-xs bg-background border-border rounded text-muted-foreground px-2 py-0"
                          >
                            {AGENT_LABELS[session.agent_key] || session.agent_key}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-semibold text-foreground/90 tabular-nums">
                          {(session.messages as any[])?.length || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-700 bg-amber-500/10 px-2 rounded-full border border-transparent">
                            <Zap className="h-3 w-3 fill-current text-amber-500 shrink-0" />{" "}
                            {(session.credits_charged || 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "rounded-full font-bold text-[10px] uppercase tracking-wide px-2.5 py-0.5 border-none",
                              session.is_active
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-muted text-muted-foreground/60",
                            )}
                          >
                            {session.is_active ? "Active" : "Archived"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-5 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="View history stream transcript"
                            className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors border border-transparent"
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

        {/* Volume Metric Distribution List Sidebar */}
        <div className="xl:col-span-1">
          <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card sticky top-6">
            <div className="h-1 w-full bg-primary" />
            <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
                <Database className="h-4 w-4 text-purple-500" /> System Allocation Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-background/50">
              <div className="flex flex-col gap-2">
                {Object.entries(agentStats)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, count]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/20 transition-all"
                    >
                      <span className="font-bold text-xs text-foreground truncate max-w-[150px]">
                        {AGENT_LABELS[key] || key}
                      </span>
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs font-bold bg-background border border-border/40 text-foreground px-2 rounded"
                      >
                        {count} channels
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Narrative Dialogue History Playback Overlay Shell */}
      <Dialog open={!!viewSession} onOpenChange={() => setViewSession(null)}>
        <DialogContent className="max-w-2xl border border-border bg-background p-0 overflow-hidden shadow-xl rounded-2xl">
          <div className="h-1 w-full bg-primary" />
          <div className="p-5 md:p-6">
            <DialogHeader className="mb-4 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Transcript Review Window
                  </p>
                  <DialogTitle className="text-lg font-bold text-foreground leading-none tracking-tight">
                    {AGENT_LABELS[viewSession?.agent_key || ""] || viewSession?.agent_key} Activity Ledger
                  </DialogTitle>
                </div>
                <Badge
                  className={cn(
                    "w-fit rounded-full font-bold text-[10px] uppercase tracking-wide px-2.5 py-0.5 border-none",
                    viewSession?.is_active
                      ? "bg-emerald-500/10 text-emerald-700 animate-pulse"
                      : "bg-muted text-muted-foreground/60",
                  )}
                >
                  {viewSession?.is_active ? "Active Connection" : "Archived Record"}
                </Badge>
              </div>
              <DialogDescription className="text-xs font-medium text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                <span>
                  Student: <strong className="text-foreground font-semibold">{viewSession?.talent?.full_name}</strong>
                </span>
                <span>
                  Started: {viewSession?.created_at && format(new Date(viewSession.created_at), "MMM d, HH:mm")}
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <Zap className="h-3 w-3 fill-current text-amber-500" /> {viewSession?.credits_charged || 0} Credits
                </span>
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[360px] md:h-[420px] rounded-xl border border-border p-4 bg-muted/10 shadow-inner">
              <div className="space-y-4">
                {((viewSession?.messages as ChatMessage[]) || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn("flex items-start gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 shadow-sm",
                        msg.role === "assistant"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border/80 text-muted-foreground",
                      )}
                    >
                      {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-xl px-3.5 py-2 text-sm leading-relaxed shadow-sm border",
                        msg.role === "user"
                          ? "bg-background border-border text-foreground font-medium"
                          : "bg-card border-border/60 text-muted-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {(!viewSession?.messages || (viewSession.messages as any[]).length === 0) && (
                  <div className="py-16 text-center space-y-2 opacity-50">
                    <Database className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p className="text-xs font-medium text-muted-foreground">
                      No conversation history synced for this validation key slot.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-end pt-4 border-t border-border/40 mt-4">
              <Button
                variant="outline"
                onClick={() => setViewSession(null)}
                className="rounded-xl h-10 px-5 font-semibold text-xs text-muted-foreground border-border hover:bg-muted"
              >
                Close Review Viewport
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  val: number | string;
  color: string;
  bg: string;
}

function KpiNode({ icon: Icon, label, val, color, bg }: KpiCardProps) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm hover:border-primary/20 transition-all group overflow-hidden">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center border border-transparent transition-transform group-hover:scale-102 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-muted-foreground/70 mb-0.5 tracking-tight line-clamp-1">{label}</p>
          <p className="text-xl font-bold text-foreground leading-none tracking-tight truncate">{val}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AgentSessionsManager;
