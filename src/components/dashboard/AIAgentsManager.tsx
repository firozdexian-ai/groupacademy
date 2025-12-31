import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Bot, Edit2, Save, X, MessageSquare, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

      // Load session stats for each agent
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
      const { error } = await supabase
        .from("ai_agents")
        .update({ is_active: !agent.is_active })
        .eq("id", agent.id);

      if (error) throw error;

      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id ? { ...a, is_active: !a.is_active } : a
        )
      );
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
          a.id === editingAgent.id
            ? { ...a, system_prompt: editedPrompt, description: editedDescription }
            : a
        )
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
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Agents Manager</h2>
          <p className="text-muted-foreground">
            Manage AI agent prompts, settings, and view usage statistics
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{agents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <MessageSquare className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">
                  {Object.values(stats).reduce((sum, s) => sum + s.total_sessions, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">
                  {Object.values(stats).reduce((sum, s) => sum + s.active_sessions, 0)}
                </p>
              </div>
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
            <Card key={agent.id} className={!agent.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: agent.bg_color || "#e5e7eb" }}
                  >
                    <Bot
                      className="h-6 w-6"
                      style={{ color: agent.color || "#374151" }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={agent.is_active ?? true}
                      onCheckedChange={() => handleToggleActive(agent)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(agent)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-1">{agent.name}</CardTitle>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {agent.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {agent.expertise_areas?.slice(0, 3).map((area) => (
                    <Badge key={area} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{agentStats.total_sessions} sessions</span>
                  <span>{agentStats.active_sessions} active</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingAgent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={2}
                placeholder="Agent description..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">System Prompt</label>
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={12}
                placeholder="System prompt for the AI agent..."
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
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
