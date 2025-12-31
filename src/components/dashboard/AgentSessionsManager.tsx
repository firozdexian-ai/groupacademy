import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search, RefreshCw, Eye, Bot, User, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

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
        .select(`
          *,
          talent:talents(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load agent sessions");
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
        ? Math.round(
            sessions.reduce((sum, s) => sum + ((s.messages as any[])?.length || 0), 0) /
              sessions.length
          )
        : 0,
  };

  const agentStats = sessions.reduce((acc, session) => {
    acc[session.agent_key] = (acc[session.agent_key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Chat Sessions</h2>
          <p className="text-muted-foreground">
            Monitor AI agent conversations and usage analytics
          </p>
        </div>
        <Button variant="outline" onClick={loadSessions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Bot className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="text-2xl font-bold">{stats.totalCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Messages/Session</p>
                <p className="text-2xl font-bold">{stats.avgMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Distribution */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Sessions by Agent</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(agentStats).map(([key, count]) => (
              <Badge key={key} variant="secondary" className="text-sm">
                {AGENT_LABELS[key] || key}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by talent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {Object.entries(AGENT_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Talent</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No sessions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-sm">
                      <div>
                        {format(new Date(session.created_at), "MMM d")}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{session.talent?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.talent?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {AGENT_LABELS[session.agent_key] || session.agent_key}
                      </Badge>
                    </TableCell>
                    <TableCell>{(session.messages as any[])?.length || 0}</TableCell>
                    <TableCell>{session.credits_charged || 0}</TableCell>
                    <TableCell>
                      <Badge variant={session.is_active ? "default" : "secondary"}>
                        {session.is_active ? "Active" : "Expired"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewSession(session)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Session Dialog */}
      <Dialog open={!!viewSession} onOpenChange={() => setViewSession(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Chat Session - {AGENT_LABELS[viewSession?.agent_key || ""] || viewSession?.agent_key}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>Talent: {viewSession?.talent?.full_name}</span>
              <span>
                Started:{" "}
                {viewSession?.created_at &&
                  format(new Date(viewSession.created_at), "MMM d, HH:mm")}
              </span>
              <Badge variant={viewSession?.is_active ? "default" : "secondary"}>
                {viewSession?.is_active ? "Active" : "Expired"}
              </Badge>
            </div>
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-4">
                {((viewSession?.messages as ChatMessage[]) || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="p-2 rounded-full bg-primary/10 h-fit">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="p-2 rounded-full bg-secondary/10 h-fit">
                        <User className="h-4 w-4 text-secondary" />
                      </div>
                    )}
                  </div>
                ))}
                {(!viewSession?.messages || (viewSession.messages as any[]).length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No messages in this session
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
