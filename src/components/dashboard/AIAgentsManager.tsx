import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Bot,
  Edit2,
  Save,
  MessageSquare,
  Zap,
  ShieldCheck,
  Activity,
  Terminal,
  Settings2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Neural Command Center (AI Agents Manager)
 * High-fidelity orchestrator for system prompt calibration and agent performance audit.
 * 2024 Standard: Executive Logic geometry with real-time session telemetry.
 */

interface AIAgent {
  id: string;
  agent_key: string;
  name: string;
  description: string;
  system_prompt: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  expertise_areas: string[] | null;
  is_active: boolean | null;
  display_order: number | null;
}

interface AgentStats {
  agent_key: string;
  total_sessions: number;
  active_sessions: number;
}

export function AIAgentsManager() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [stats, setStats] = useState<Record<string, AgentStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const { data: agentsData, error: agentsError } = await supabase
        .from("ai_agents")
        .select("*")
        .order("display_order", { ascending: true });

      if (agentsError) throw agentsError;
      setAgents(agentsData || []);

      // CTO FIX: Added .limit(10000) to prevent the silent 1,000 row truncation bug
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("agent_chat_sessions")
        .select("agent_key, is_active")
        .limit(10000);

      if (sessionsError) throw sessionsError;

      const statsMap: Record<string, AgentStats> = {};
      (sessionsData || []).forEach((session) => {
        if (!statsMap[session.agent_key]) {
          statsMap[session.agent_key] = {
            agent_key: session.agent_key,
            total_sessions: 0,
            active_sessions: 0,
          };
        }
        statsMap[session.agent_key].total_sessions++;
        if (session.is_active) statsMap[session.agent_key].active_sessions++;
      });
      setStats(statsMap);
    } catch (error: any) {
      toast.error("Transmission Error: Neural registry sync failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (agent: AIAgent) => {
    try {
      const { error } = await supabase.from("ai_agents").update({ is_active: !agent.is_active }).eq("id", agent.id);
      if (error) throw error;
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, is_active: !a.is_active } : a)));
      toast.success(`Node ${agent.name} status updated.`);
    } catch (error: any) {
      toast.error("Handshake Failed: Logic state immutable.");
    }
  };

  const handleEdit = (agent: AIAgent) => {
    setEditingAgent(agent);
    setEditedPrompt(agent.system_prompt || "");
    setEditedDescription(agent.description || "");
  };

  const handleSave = async () => {
    if (!editingAgent) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ai_agents")
        .update({ system_prompt: editedPrompt, description: editedDescription })
        .eq("id", editingAgent.id);

      if (error) throw error;
      setAgents((prev) =>
        prev.map((a) =>
          a.id === editingAgent.id ? { ...a, system_prompt: editedPrompt, description: editedDescription } : a,
        ),
      );
      setEditingAgent(null);
      toast.success("Artifact Calibrated: Logic chain updated.");
    } catch (error: any) {
      toast.error("Logic Fault: Prompt injection rejected.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-6">
        <Skeleton className="h-10 w-64 rounded-xl bg-muted/40" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-[32px] bg-muted/40" />
          ))}
        </div>
      </div>
    );

  const totalSessions = Object.values(stats).reduce((sum, s) => sum + s.total_sessions, 0);
  const activeSessions = Object.values(stats).reduce((sum, s) => sum + s.active_sessions, 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Activity className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Neural Hub</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Core Logic Management & Performance Auditing v2.6
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadAgents}
          className="rounded-xl h-11 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-sm hover:bg-primary/5 bg-background/50"
        >
          <RefreshCw className="h-4 w-4 text-primary" /> Re-Sync Registry
        </Button>
      </div>

      {/* Logic Telemetry HUD */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Total Artifacts", val: agents.length, icon: Bot, color: "text-blue-500", bg: "bg-blue-500/10" },
          {
            label: "Global Sessions",
            val: totalSessions,
            icon: MessageSquare,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
          },
          { label: "Active Nodes", val: activeSessions, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
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

      {/* Agent Registry Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => {
          const agentStats = stats[agent.agent_key] || { total_sessions: 0, active_sessions: 0 };
          const isActive = agent.is_active;

          return (
            <Card
              key={agent.id}
              className={cn(
                "group rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:shadow-2xl overflow-hidden flex flex-col shadow-lg",
                !isActive && "opacity-60 grayscale-[0.5] border-dashed",
              )}
            >
              {/* CTO Phase 6 Addition: Top Gradient Accent */}
              <div
                className="h-2 w-full shrink-0"
                style={{ background: `linear-gradient(to right, ${agent.color || "var(--primary)"}, transparent)` }}
              />
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="h-14 w-14 rounded-2xl border-2 border-white/5 flex items-center justify-center transition-transform duration-500 group-hover:rotate-6 shadow-inner shrink-0"
                    style={{ backgroundColor: agent.bg_color || "rgba(var(--primary-rgb), 0.1)" }}
                  >
                    <Bot className="h-7 w-7" style={{ color: agent.color || "var(--primary)" }} />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Switch
                      checked={isActive ?? true}
                      onCheckedChange={() => handleToggleActive(agent)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl hover:bg-primary hover:text-white transition-all shadow-inner"
                      onClick={() => handleEdit(agent)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none group-hover:text-primary transition-colors truncate">
                  {agent.name}
                </CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1.5 italic truncate">
                  Protocol: {agent.agent_key}
                </p>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex-1 flex flex-col justify-between">
                <p className="text-sm font-medium leading-relaxed text-muted-foreground italic mb-6 line-clamp-2 min-h-[40px] tracking-tight">
                  "{agent.description}"
                </p>

                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {agent.expertise_areas?.slice(0, 3).map((area) => (
                      <Badge
                        key={area}
                        className="rounded-lg bg-primary/5 text-primary border-none text-[8px] font-black uppercase px-2.5 py-1 tracking-widest"
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-border/10 grid grid-cols-2 gap-6">
                    <div>
                      <span className="text-muted-foreground/40 block text-[8px] font-black uppercase tracking-widest mb-1 italic">
                        Dimensions
                      </span>
                      <span className="text-lg font-black italic tracking-tighter">
                        {agentStats.total_sessions} NODES
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground/40 block text-[8px] font-black uppercase tracking-widest mb-1 italic">
                        Uplink Status
                      </span>
                      <span
                        className={cn(
                          "text-lg font-black italic tracking-tighter",
                          agentStats.active_sessions > 0 ? "text-emerald-500" : "text-muted-foreground/30",
                        )}
                      >
                        {agentStats.active_sessions} LIVE
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Logic Injection Node (Edit Dialog) */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent className="max-w-4xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4">
                <Settings2 className="h-8 w-8 text-primary" />
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">
                    Neural Recalibration Node
                  </p>
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                    Calibration: {editingAgent?.name}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">
                  External Briefing (User Facing)
                </label>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="rounded-2xl border-2 bg-card/50 p-6 italic font-medium leading-relaxed resize-none focus:border-primary/40 transition-all"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary">
                    System Logic Payload (Internal)
                  </label>
                  <Badge variant="outline" className="font-mono text-[9px] border-primary/20 text-primary">
                    {editedPrompt.length} BITS
                  </Badge>
                </div>
                <div className="relative group">
                  <Terminal className="absolute top-4 left-4 h-5 w-5 text-primary opacity-20 group-focus-within:opacity-100 transition-opacity" />
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    className="font-mono text-sm bg-black/90 text-emerald-500 rounded-3xl min-h-[400px] p-10 pl-14 border-2 border-border/40 focus:border-emerald-500/50 transition-all selection:bg-emerald-500/20"
                  />
                </div>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic mt-2 px-2 leading-relaxed">
                  Warning: Logic modification affects live agent behavior in real-time. Unauthorized prompt injection
                  may corrupt user experience protocols.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-border/10">
                <Button
                  variant="outline"
                  onClick={() => setEditingAgent(null)}
                  className="h-14 px-8 font-black uppercase text-[10px] tracking-widest rounded-xl border-2"
                >
                  Terminate
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-14 px-10 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                    {isSaving ? "Syncing..." : "Authorize Update"}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Neural Network Registry: Authorized Access Active
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Core Logic: Verified Executive v2.6.4
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
