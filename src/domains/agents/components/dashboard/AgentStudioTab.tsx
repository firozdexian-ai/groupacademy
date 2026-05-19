import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bot,
  Sparkles,
  Plus,
  Save,
  Trash2,
  BookOpen,
  Wrench,
  Coins,
  Loader2,
  Database as DbIcon,
  Link as LinkIcon,
  FileText,
  TerminalSquare,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentBrainPanel } from "@/components/dashboard/agents/AgentBrainPanel";

/**
 * Agent Studio: No-code builder for the unified Agent OS.
 * Manages agent metadata, tool allowlists, fees, and knowledge base ingestion.
 * 2024 Standard: Executive Logic geometry with reinforced interaction analysis.
 */

interface AgentRow {
  id: string;
  agent_key: string;
  name: string;
  description: string | null;
  system_prompt: string | null;
  is_active: boolean | null;
  audience: string | null;
  agent_level: number | null;
  connection_fee: number | null;
  message_credit_cost: number | null;
  allowed_tools: string[] | null;
  canvas_mode: string | null;
  owner_kind: string | null;
  owner_id: string | null;
}

interface ToolRow {
  id: string;
  tool_key: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface KnowledgeSource {
  id: string;
  agent_id: string;
  source_type: string;
  title: string | null;
  uri: string | null;
  status: string | null;
  created_at: string;
}

const AUDIENCES = ["talent", "company", "internal", "public"];
const LEVELS = [
  { v: 1, label: "L1 — Free / General" },
  { v: 2, label: "L2 — Specialist (Paid)" },
  { v: 3, label: "L3 — Expert / Operator" },
];
const CANVAS_MODES = ["chat", "split", "fullscreen"];

export function AgentStudio() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AgentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: t }] = await Promise.all([
      supabase.from("ai_agents").select("*").order("display_order", { ascending: true }),
      supabase.from("agent_tools").select("*").order("category"),
    ]);
    setAgents((a as any) ?? []);
    setTools((t as any) ?? []);
    setLoading(false);
  };

  const handleSave = async (patch: Partial<AgentRow>) => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from("ai_agents").update(patch).eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Protocol Synced: Agent updated");
    await load();
    setSelected((s) => (s ? { ...s, ...patch } : s));
  };

  const handleCreate = async (form: {
    agent_key: string;
    name: string;
    description: string;
    system_prompt: string;
    audience: string;
    agent_level: number;
    connection_fee: number;
    message_credit_cost: number;
  }) => {
    if (!form.agent_key || !form.name) {
      toast.error("Logic Fault: agent_key and name required");
      return;
    }
    const { error } = await supabase.from("ai_agents").insert({
      ...form,
      is_active: true,
      owner_kind: "platform",
      allowed_tools: [],
      canvas_mode: "chat",
    } as any);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Node Initialized: Agent created");
    setCreating(false);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will archive the agent. Linked threads remain intact.")) return;
    const { error } = await supabase.from("ai_agents").update({ is_active: false }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Agent node archived");
      await load();
      setSelected(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-6">
        <Skeleton className="h-24 w-full rounded-[40px] bg-muted/40" />
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <Skeleton className="h-[600px] w-full rounded-[32px] bg-muted/40" />
          <Skeleton className="h-[600px] w-full rounded-[40px] bg-muted/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Sparkles className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Agent Studio</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            No-code orchestrator · Prompts · Skills · Knowledge Bases
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" /> Initialize Node
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Agent Registry Sidebar */}
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg flex flex-col h-[80vh] sticky top-6">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 to-blue-500/50 shrink-0" />
          <CardHeader className="p-5 border-b border-border/10 bg-muted/5 shrink-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-muted-foreground/70">
              <TerminalSquare className="h-4 w-4 text-primary" /> Registry Nodes ({agents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 overflow-y-auto no-scrollbar flex-1 space-y-1.5">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all border-2 group",
                  selected?.id === a.id
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "border-transparent hover:bg-muted/50 hover:border-border/40",
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={cn(
                      "font-black text-sm truncate uppercase tracking-tight italic",
                      selected?.id === a.id ? "text-primary" : "text-foreground/80 group-hover:text-foreground",
                    )}
                  >
                    {a.name}
                  </span>
                  {!a.is_active && (
                    <Badge
                      variant="outline"
                      className="text-[8px] font-black tracking-widest border-destructive/30 text-destructive bg-destructive/10 px-1.5 py-0"
                    >
                      OFFLINE
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-[9px] font-bold text-muted-foreground/60 bg-background/50 px-1.5 py-0.5 rounded border border-border/40">
                    {a.agent_key}
                  </code>
                  <Badge
                    variant="secondary"
                    className="text-[8px] font-black uppercase tracking-widest bg-muted px-1.5"
                  >
                    L{a.agent_level ?? 1}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[8px] font-black uppercase tracking-widest border-border/40 px-1.5"
                  >
                    {a.audience ?? "TALENT"}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Detail Viewport */}
        <div className="min-w-0">
          {selected ? (
            <AgentDetailPanel
              agent={selected}
              tools={tools}
              saving={saving}
              onSave={handleSave}
              onDelete={() => handleDelete(selected.id)}
            />
          ) : (
            <Card className="rounded-[40px] border-2 border-dashed border-border/40 h-[80vh] flex items-center justify-center bg-muted/5">
              <div className="text-center text-muted-foreground/50 space-y-4">
                <div className="h-20 w-20 rounded-3xl bg-muted/20 flex items-center justify-center border-2 border-border/20 mx-auto shadow-inner">
                  <Bot className="h-10 w-10 opacity-40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest italic">Awaiting Selection</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Select an agent node to configure.</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <CreateAgentDialog open={creating} onClose={() => setCreating(false)} onCreate={handleCreate} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail Panel                                    */
/* -------------------------------------------------------------------------- */

function AgentDetailPanel({
  agent,
  tools,
  saving,
  onSave,
  onDelete,
}: {
  agent: AgentRow;
  tools: ToolRow[];
  saving: boolean;
  onSave: (patch: Partial<AgentRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const [form, setForm] = useState(agent);
  useEffect(() => setForm(agent), [agent.id]);

  const toggleTool = (key: string) => {
    const cur = form.allowed_tools ?? [];
    setForm({
      ...form,
      allowed_tools: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
    });
  };

  const groupedTools = useMemo(() => {
    const g: Record<string, ToolRow[]> = {};
    tools.forEach((t) => {
      const k = t.category ?? "misc";
      (g[k] ??= []).push(t);
    });
    return g;
  }, [tools]);

  return (
    <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500" />

      <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none truncate text-foreground/90">
              {agent.name}
            </CardTitle>
            <div className="flex items-center gap-3">
              <code className="text-[10px] font-bold uppercase tracking-widest text-primary/60 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                {agent.agent_key}
              </code>
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-border/40">
                {agent.owner_kind}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 bg-background/50 p-2 rounded-2xl border-2 border-border/20 shadow-sm">
            <div className="flex items-center gap-2 px-2">
              <Switch
                checked={!!form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                className="data-[state=checked]:bg-emerald-500"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {form.is_active ? "Live" : "Halted"}
              </span>
            </div>
            <div className="w-px h-6 bg-border/50" />
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              className="h-8 w-8 rounded-xl text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="w-full flex flex-wrap justify-start rounded-none border-b border-border/10 h-auto p-0 bg-muted/10">
            {[
              { value: "config", icon: Bot, label: "Configuration" },
              { value: "tools", icon: Wrench, label: "Tool Allowlist" },
              { value: "economy", icon: Coins, label: "Monetization" },
              { value: "knowledge", icon: BookOpen, label: "Knowledge" },
              { value: "brain", icon: Sparkles, label: "AI Brain" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none font-black uppercase text-[10px] tracking-widest py-4 px-6 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all flex items-center gap-2"
              >
                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Config Tab */}
          <TabsContent value="config" className="p-8 space-y-8 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Agent Identity
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-12 rounded-xl border-2 font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Audience Scope
                </Label>
                <Select value={form.audience ?? "talent"} onValueChange={(v) => setForm({ ...form, audience: v })}>
                  <SelectTrigger className="h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a} value={a} className="font-bold text-[10px] uppercase">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                External Briefing
              </Label>
              <Textarea
                rows={2}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-2xl border-2 bg-background/50 font-medium italic text-sm p-4 resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1 mb-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Core System Prompt
                </Label>
                <Badge variant="secondary" className="text-[8px] uppercase tracking-widest">
                  Base Variant (A)
                </Badge>
              </div>
              <Textarea
                rows={10}
                className="font-mono text-xs p-6 rounded-3xl border-2 bg-muted/5 shadow-inner leading-relaxed text-foreground/80"
                value={form.system_prompt ?? ""}
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 rounded-[24px] border-2 bg-muted/10 border-border/10">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Capability Level
                </Label>
                <Select
                  value={String(form.agent_level ?? 1)}
                  onValueChange={(v) => setForm({ ...form, agent_level: Number(v) })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 font-bold text-[11px] bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {LEVELS.map((l) => (
                      <SelectItem key={l.v} value={String(l.v)} className="font-bold text-[11px]">
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  UI Canvas Mode
                </Label>
                <Select value={form.canvas_mode ?? "chat"} onValueChange={(v) => setForm({ ...form, canvas_mode: v })}>
                  <SelectTrigger className="h-12 rounded-xl border-2 font-bold text-[11px] bg-background/50 uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {CANVAS_MODES.map((m) => (
                      <SelectItem key={m} value={m} className="font-bold text-[11px] uppercase">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/10">
              <Button
                onClick={() => onSave(form)}
                disabled={saving}
                className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Commit Configuration
              </Button>
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="p-8 space-y-8 outline-none bg-muted/5">
            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest italic">Endpoint Routing</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Select logic capabilities exposed to this agent's runtime.
                </p>
              </div>
            </div>

            {Object.entries(groupedTools).map(([cat, list]) => (
              <div key={cat} className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/20 pb-2">
                  {cat} Protocol
                </h4>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {list.map((t) => {
                    const enabled = (form.allowed_tools ?? []).includes(t.tool_key);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTool(t.tool_key)}
                        className={cn(
                          "text-left p-5 rounded-2xl border-2 transition-all flex flex-col gap-2 group",
                          enabled
                            ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
                            : "border-border/40 bg-background/50 hover:border-primary/30 hover:bg-primary/5",
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <code
                            className={cn(
                              "text-[11px] font-black tracking-widest uppercase transition-colors",
                              enabled ? "text-emerald-600" : "text-foreground/80 group-hover:text-primary",
                            )}
                          >
                            {t.tool_key}
                          </code>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] font-black px-2 py-0.5 border-2 transition-colors",
                              enabled
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-border/40 text-muted-foreground",
                            )}
                          >
                            {enabled ? "MAPPED" : "INACTIVE"}
                          </Badge>
                        </div>
                        <p
                          className={cn(
                            "text-xs font-medium italic transition-colors leading-relaxed",
                            enabled ? "text-emerald-700/70" : "text-muted-foreground/60",
                          )}
                        >
                          {t.description || "No endpoint brief provided."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-6 border-t border-border/10">
              <Button
                onClick={() => onSave({ allowed_tools: form.allowed_tools })}
                disabled={saving}
                className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Sync Tool Map
              </Button>
            </div>
          </TabsContent>

          {/* Economy Tab */}
          <TabsContent value="economy" className="p-8 space-y-8 outline-none">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest italic text-amber-600">
                  Monetization Vectors
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Configure token burn rates and connection gates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="p-6 rounded-[24px] border-2 border-border/20 bg-muted/10 space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Connection Fee (CR)
                </Label>
                <div className="relative">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/50" />
                  <Input
                    type="number"
                    step="0.25"
                    value={form.connection_fee ?? 0}
                    onChange={(e) => setForm({ ...form, connection_fee: Number(e.target.value) })}
                    className="h-14 pl-11 rounded-xl border-2 font-black italic text-lg"
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-2 italic">
                  One-time charge on thread initialization. Standard: 1.25
                </p>
              </div>

              <div className="p-6 rounded-[24px] border-2 border-border/20 bg-muted/10 space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Message Cost (CR)
                </Label>
                <div className="relative">
                  <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/50" />
                  <Input
                    type="number"
                    step="0.1"
                    value={form.message_credit_cost ?? 0}
                    onChange={(e) => setForm({ ...form, message_credit_cost: Number(e.target.value) })}
                    className="h-14 pl-11 rounded-xl border-2 font-black italic text-lg"
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-2 italic">
                  Per-interaction deduction. Set 0 for free agents.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/10">
              <Button
                onClick={() =>
                  onSave({ connection_fee: form.connection_fee, message_credit_cost: form.message_credit_cost })
                }
                disabled={saving}
                className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Commit Economy
              </Button>
            </div>
          </TabsContent>

          {/* Knowledge Tab */}
          <TabsContent value="knowledge" className="p-8 outline-none bg-muted/5">
            <KnowledgePanel agentId={agent.id} />
          </TabsContent>

          {/* Brain Tab */}
          <TabsContent value="brain" className="p-8 outline-none">
            <AgentBrainPanel agent={agent as any} onSaved={() => onSave({})} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Knowledge Base Panel                              */
/* -------------------------------------------------------------------------- */

function KnowledgePanel({ agentId }: { agentId: string }) {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [mode, setMode] = useState<"text" | "url">("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    void load();
  }, [agentId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("agent_knowledge_sources")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });
    setSources((data as any) ?? []);
    setLoading(false);
  };

  const handleIngest = async () => {
    setIngesting(true);
    try {
      const payload =
        mode === "text"
          ? { agent_id: agentId, source_type: "text", title, content }
          : { agent_id: agentId, source_type: "url", title: title || url, url: url }; // CTO FIX: Passed url key as per standard standard parsers

      const { data, error } = await supabase.functions.invoke("ingest-agent-knowledge", {
        body: payload,
      });
      if (error) throw error;
      toast.success(`Pipeline Synchronized: Ingested ${data?.chunks ?? 0} vectors`);
      setTitle("");
      setContent("");
      setUrl("");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Ingestion sequence failed");
    } finally {
      setIngesting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("agent_knowledge_sources").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Source artifact purged");
      await load();
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Ingestion Console */}
      <div className="rounded-[32px] border-2 border-border/20 bg-background/50 p-6 space-y-6 shadow-sm h-fit">
        <div className="flex items-center justify-between pb-4 border-b border-border/10">
          <div className="flex items-center gap-3">
            <DbIcon className="h-5 w-5 text-primary" />
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest italic">Ingestion Console</h4>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Embed custom vectors
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/20">
            <Button
              size="sm"
              variant={mode === "text" ? "default" : "ghost"}
              onClick={() => setMode("text")}
              className={cn(
                "h-8 rounded-lg font-black uppercase tracking-widest text-[9px]",
                mode === "text" && "shadow-sm",
              )}
            >
              <FileText className="h-3 w-3 mr-1.5" /> Text
            </Button>
            <Button
              size="sm"
              variant={mode === "url" ? "default" : "ghost"}
              onClick={() => setMode("url")}
              className={cn(
                "h-8 rounded-lg font-black uppercase tracking-widest text-[9px]",
                mode === "url" && "shadow-sm",
              )}
            >
              <LinkIcon className="h-3 w-3 mr-1.5" /> URL
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Artifact Label
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Employee Handbook 2026"
              className="h-12 rounded-xl border-2 font-bold text-sm bg-muted/10"
            />
          </div>
          {mode === "text" ? (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Raw Payload
              </Label>
              <Textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste internal documentation, FAQ protocols, or reference architecture..."
                className="rounded-xl border-2 font-medium italic text-xs p-4 bg-muted/10 resize-none"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Target URL
              </Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/docs"
                className="h-12 rounded-xl border-2 font-mono text-xs bg-muted/10"
              />
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={handleIngest}
              disabled={ingesting || (mode === "text" ? !content : !url)}
              className="w-full h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20 gap-2"
            >
              {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DbIcon className="h-4 w-4" />}
              Inject & Vectorize
            </Button>
          </div>
        </div>
      </div>

      {/* Vector Registry */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic ml-2">
          Vectorized Artifacts ({sources.length})
        </h4>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl bg-muted/20" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-background/50 border-2 border-dashed border-border/20 rounded-[32px]">
            <DbIcon className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              No knowledge vectors embedded.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 p-5 rounded-[24px] border-2 border-border/20 bg-background/50 hover:border-primary/20 transition-all group"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="text-[8px] font-black uppercase tracking-widest border-border/40 bg-muted shrink-0"
                    >
                      {s.source_type}
                    </Badge>
                    <span className="font-black text-sm uppercase tracking-tight italic truncate group-hover:text-primary transition-colors">
                      {s.title || s.uri || "UNTITLED_ARTIFACT"}
                    </span>
                  </div>
                  {s.uri && (
                    <p className="text-[10px] font-mono text-muted-foreground/60 truncate ml-[52px]">{s.uri}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-none",
                      s.status === "ready"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500 animate-pulse",
                    )}
                  >
                    {s.status ?? "PENDING"}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(s.id)}
                    className="h-8 w-8 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Create Agent Dialog                               */
/* -------------------------------------------------------------------------- */

function CreateAgentDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (form: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    agent_key: "",
    name: "",
    description: "",
    system_prompt: "",
    audience: "talent",
    agent_level: 2,
    connection_fee: 1.25,
    message_credit_cost: 1,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <div className="p-10">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4">
              <Bot className="h-8 w-8 text-primary" />
              <div className="space-y-1 text-left">
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                  Initialize Node
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                  Construct a new operational persona on the OS runtime
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4 -mr-4">
            <div className="space-y-6 pb-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Agent Key (Slug)
                  </Label>
                  <Input
                    placeholder="recruiter-pro"
                    value={form.agent_key}
                    onChange={(e) => setForm({ ...form, agent_key: e.target.value })}
                    className="h-12 rounded-xl border-2 font-mono text-sm bg-muted/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Identity (Display Name)
                  </Label>
                  <Input
                    placeholder="Recruiter Pro"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-12 rounded-xl border-2 font-bold text-sm bg-muted/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  External Briefing
                </Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="h-12 rounded-xl border-2 font-medium italic text-sm bg-muted/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  System Prompt
                </Label>
                <Textarea
                  rows={6}
                  className="font-mono text-xs p-4 rounded-2xl border-2 bg-muted/20 shadow-inner resize-none"
                  value={form.system_prompt}
                  onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-[24px] border-2 bg-muted/10 border-border/10">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Scope</Label>
                  <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                    <SelectTrigger className="h-10 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest bg-background/50 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {AUDIENCES.map((a) => (
                        <SelectItem key={a} value={a} className="font-bold text-[9px] uppercase">
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tier</Label>
                  <Select
                    value={String(form.agent_level)}
                    onValueChange={(v) => setForm({ ...form, agent_level: Number(v) })}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest bg-background/50 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {LEVELS.map((l) => (
                        <SelectItem key={l.v} value={String(l.v)} className="font-bold text-[9px] uppercase">
                          L{l.v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Conn Fee
                  </Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={form.connection_fee}
                    onChange={(e) => setForm({ ...form, connection_fee: Number(e.target.value) })}
                    className="h-10 rounded-xl border-2 font-black italic text-xs px-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Msg Cost
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.message_credit_cost}
                    onChange={(e) => setForm({ ...form, message_credit_cost: Number(e.target.value) })}
                    className="h-10 rounded-xl border-2 font-black italic text-xs px-2"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-8 pt-6 border-t border-border/10 gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-2"
            >
              Abort
            </Button>
            <Button
              onClick={() => onCreate(form)}
              className="h-12 px-10 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20 gap-2"
            >
              <Plus className="h-4 w-4" /> Inject Node
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
