import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Bot, Edit2, Save, X, MessageSquare, Users, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

      // Load session stats - Optimization: Use count instead of fetching all rows if possible
      // For now, fetching lightweight columns
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("agent_chat_sessions")
        .select("agent_key, is_active");

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
        if (session.is_active) {
          statsMap[session.agent_key].active_sessions++;
        }
      });
      setStats(statsMap);
    } catch (error: any) {
      console.error("Error loading agents:", error);
      toast.error("Failed to load AI agents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (agent: AIAgent) => {
    try {
      const { error } = await supabase.from("ai_agents").update({ is_active: !agent.is_active }).eq("id", agent.id);

      if (error) throw error;

      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, is_active: !a.is_active } : a)));
      toast.success(`${agent.name} ${!agent.is_active ? "activated" : "deactivated"}`);
    } catch (error: any) {
      console.error("Error toggling agent:", error);
      toast.error("Failed to update agent status");
    }
  };

  const handleEdit = (agent: AIAgent) => {
    setEditingAgent(agent);
    setEditedPrompt(agent.system_prompt);
    setEditedDescription(agent.description);
  };

  const handleSave = async () => {
    if (!editingAgent) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("ai_agents")
        .update({
          system_prompt: editedPrompt,
          description: editedDescription,
        })
        .eq("id", editingAgent.id);

      if (error) throw error;

      setAgents((prev) =>
        prev.map((a) =>
          a.id === editingAgent.id ? { ...a, system_prompt: editedPrompt, description: editedDescription } : a,
        ),
      );
      setEditingAgent(null);
      toast.success("Agent updated successfully");
    } catch (error: any) {
      console.error("Error saving agent:", error);
      toast.error("Failed to save agent");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalSessions = Object.values(stats).reduce((sum, s) => sum + s.total_sessions, 0);
  const activeSessions = Object.values(stats).reduce((sum, s) => sum + s.active_sessions, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Agents Manager</h2>
          <p className="text-muted-foreground">Configure system prompts and monitor agent performance</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold">{agents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-secondary/10">
              <MessageSquare className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{totalSessions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Now</p>
              <p className="text-2xl font-bold">{activeSessions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => {
          const agentStats = stats[agent.agent_key] || {
            total_sessions: 0,
            active_sessions: 0,
          };

          return (
            <Card
              key={agent.id}
              className={`transition-all hover:shadow-md ${!agent.is_active ? "opacity-75 bg-muted/30" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: agent.bg_color || "#e5e7eb" }}>
                    <Bot className="h-6 w-6" style={{ color: agent.color || "#374151" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={agent.is_active ?? true} onCheckedChange={() => handleToggleActive(agent)} />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(agent)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-1">{agent.name}</CardTitle>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">{agent.description}</p>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {agent.expertise_areas?.slice(0, 3).map((area) => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider">Sessions</span>
                      <span className="font-semibold">{agentStats.total_sessions}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider">Active</span>
                      <span className="font-semibold text-green-600">{agentStats.active_sessions}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingAgent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Description (User Facing)</label>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={2}
                placeholder="Agent description..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">System Prompt (Internal Logic)</label>
              <div className="relative">
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  rows={15}
                  placeholder="System prompt for the AI agent..."
                  className="font-mono text-sm bg-muted/30 min-h-[300px]"
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
                  {editedPrompt.length} chars
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This prompt defines the agent's personality, constraints, and knowledge base. Changes here affect live
                behavior immediately.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingAgent(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
