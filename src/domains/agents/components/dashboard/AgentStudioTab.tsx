import { useEffect, useMemo, useState } from "react";
import {
  getStudioBundle,
  updateAiAgent,
  insertAiAgent,
  deactivateAiAgent,
  deleteAgentKnowledgeSource,
  listAgentKnowledgeSources,
} from "@/domains/agents/repo/agentsRepo";
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
import { AgentBrainPanel } from "@/domains/agents/components/dashboard/AgentBrainPanel";
import { ingestAgentKnowledge } from "@/domains/agents/api/agentsApi";

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
  { v: 1, label: "Tier 1 — Free / Platform Concierge" },
  { v: 2, label: "Tier 2 — Specialist / Premium Advisor" },
  { v: 3, label: "Tier 3 — Expert / Executive Operator" },
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
    const { agents: a, tools: t } = await getStudioBundle();
    setAgents((a as any) ?? []);
    setTools((t as any) ?? []);
    setLoading(false);
  };

  const handleSave = async (patch: Partial<AgentRow>) => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateAiAgent(selected.id, patch);
    } catch (error: any) {
      setSaving(false);
      toast.error(error.message || "Something went wrong while updating configurations.");
      return;
    }
    setSaving(false);
    toast.success("Agent configuration changes saved successfully.");
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
      toast.error("Required fields missing: unique agent key and display name are mandatory.");
      return;
    }
    try {
      await insertAiAgent({
        ...form,
        is_active: true,
        owner_kind: "platform",
        allowed_tools: [],
        canvas_mode: "chat",
      });
    } catch (error: any) {
      toast.error(error.message || "Could not initialize agent instance.");
      return;
    }
    toast.success("New agent created and mounted successfully.");
    setCreating(false);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will archive the agent persona. Ongoing user threads will remain preserved."))
      return;
    try {
      await deactivateAiAgent(id);
      toast.success("Agent instance deactivated and archived safely.");
      await load();
      setSelected(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to archive agent workspace.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-6">
        <Skeleton className="h-24 w-full rounded-2xl bg-muted/40" />
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <Skeleton className="h-[600px] w-full rounded-2xl bg-muted/40" />
          <Skeleton className="h-[600px] w-full rounded-2xl bg-muted/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-4 md:p-6">
      {/* Platform Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10 p-6 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Agent Studio</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure system parameters, allowlist operational tools, and manage custom text or URL knowledge bases.
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="rounded-lg h-10 px-4 text-xs font-semibold gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create New Agent
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Agent Registry Sidebar */}
        <Card className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-sm flex flex-col h-[75vh] sticky top-6">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary/40 to-blue-500/40 shrink-0 rounded-t-2xl" />
          <CardHeader className="p-4 border-b border-border/40 bg-muted/5 shrink-0">
            <CardTitle className="text-xs font-semibold tracking-wider uppercase flex items-center gap-2 text-muted-foreground">
              <TerminalSquare className="h-4 w-4 text-primary" /> Active Profiles ({agents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 overflow-y-auto no-scrollbar flex-1 space-y-1">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all border group flex flex-col gap-1.5",
                  selected?.id === a.id
                    ? "bg-primary/5 border-primary/40 shadow-inner"
                    : "border-transparent hover:bg-muted/40 hover:border-border/30",
                )}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span
                    className={cn(
                      "font-bold text-sm truncate tracking-tight",
                      selected?.id === a.id ? "text-primary" : "text-foreground/80 group-hover:text-foreground",
                    )}
                  >
                    {a.name}
                  </span>
                  {!a.is_active && (
                    <Badge
                      variant="outline"
                      className="text-[9px] font-medium tracking-wide border-destructive/30 text-destructive bg-destructive/5 px-1.5 py-0 rounded"
                    >
                      Offline
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <code className="text-[10px] font-mono text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                    {a.agent_key}
                  </code>
                  <Badge variant="secondary" className="text-[9px] font-medium tracking-wide bg-muted px-1.5 rounded">
                    Tier {a.agent_level ?? 1}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-medium tracking-wide border-border/60 px-1.5 rounded uppercase"
                  >
                    {a.audience ?? "talent"}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Workspace Panel */}
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
            <Card className="rounded-2xl border border-dashed border-border/60 h-[75vh] flex items-center justify-center bg-muted/5">
              <div className="text-center text-muted-foreground/60 space-y-3">
                <div className="h-14 w-14 rounded-xl bg-card border border-border/50 flex items-center justify-center mx-auto shadow-sm">
                  <Bot className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">No Agent Selected</p>
                  <p className="text-xs">Select a profile from the sidebar layout to configure settings.</p>
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
/* Detail Panel                                                               */
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
      const k = t.category ?? "General Tools";
      (g[k] ??= []).push(t);
    });
    return g;
  }, [tools]);

  return (
    <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card/40 backdrop-blur-xl flex flex-col">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500 rounded-t-2xl" />

      <CardHeader className="p-6 border-b border-border/40 bg-muted/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">{agent.name}</CardTitle>
            <div className="flex items-center gap-2">
              <code className="text-[11px] font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                {agent.agent_key}
              </code>
              <Badge
                variant="outline"
                className="text-[10px] font-medium uppercase tracking-wide border-border/60 rounded"
              >
                Type: {agent.owner_kind}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 bg-background/50 p-1.5 rounded-xl border border-border/40 shadow-sm">
            <div className="flex items-center gap-2 px-1.5">
              <Switch
                checked={!!form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                className="data-[state=checked]:bg-emerald-500"
              />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {form.is_active ? "Live" : "Halted"}
              </span>
            </div>
            <div className="w-px h-5 bg-border/60" />
            <Button
              size="icon"
              aria-label="Archive profile"
              variant="ghost"
              onClick={onDelete}
              className="h-8 w-8 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="w-full flex flex-wrap justify-start rounded-none border-b border-border/40 h-auto p-0 bg-muted/10">
            {[
              { value: "config", icon: Bot, label: "Core Configuration" },
              { value: "tools", icon: Wrench, label: "Allowlisted Tools" },
              { value: "economy", icon: Coins, label: "Credit Rates" },
              { value: "knowledge", icon: BookOpen, label: "Knowledge Bases" },
              { value: "brain", icon: Sparkles, label: "System Brain" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none font-semibold text-xs py-3 px-4 sm:px-5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all flex items-center gap-1.5"
              >
                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Config Tab */}
          <TabsContent value="config" className="p-6 space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Display Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 rounded-lg font-medium text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Audience Context Mapping</Label>
                <Select value={form.audience ?? "talent"} onValueChange={(v) => setForm({ ...form, audience: v })}>
                  <SelectTrigger className="h-10 rounded-lg font-medium text-xs bg-background/50 uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border">
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a} value={a} className="font-medium text-xs uppercase">
                        {a} Surface
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Public Overview / Briefing</Label>
              <Textarea
                rows={2}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-lg text-xs p-3 resize-none font-medium leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-semibold text-foreground">Primary LLM System Prompts</Label>
                <Badge variant="secondary" className="text-[10px] rounded px-1.5 font-medium">
                  Active Instruction Block
                </Badge>
              </div>
              <Textarea
                rows={10}
                className="font-mono text-xs p-4 rounded-xl border bg-muted/30 shadow-inner leading-relaxed text-foreground"
                value={form.system_prompt ?? ""}
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border bg-muted/10">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Expertise Tier Level</Label>
                <Select
                  value={String(form.agent_level ?? 1)}
                  onValueChange={(v) => setForm({ ...form, agent_level: Number(v) })}
                >
                  <SelectTrigger className="h-10 rounded-lg text-xs bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border">
                    {LEVELS.map((l) => (
                      <SelectItem key={l.v} value={String(l.v)} className="text-xs">
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Default Chat Layout Style</Label>
                <Select value={form.canvas_mode ?? "chat"} onValueChange={(v) => setForm({ ...form, canvas_mode: v })}>
                  <SelectTrigger className="h-10 rounded-lg text-xs bg-background/50 uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border">
                    {CANVAS_MODES.map((m) => (
                      <SelectItem key={m} value={m} className="text-xs uppercase">
                        {m} Window Layout
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button
                onClick={() => onSave(form)}
                disabled={saving}
                className="h-10 px-5 rounded-lg text-xs font-semibold gap-2 shadow-sm"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Agent Configuration
              </Button>
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="p-6 space-y-6 outline-none bg-muted/5">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Capability Function Binding</h3>
                <p className="text-xs text-muted-foreground">
                  Allow specific workspace functions and RPC tools to trigger automatically during user chat sessions.
                </p>
              </div>
            </div>

            {Object.entries(groupedTools).map(([cat, list]) => (
              <div key={cat} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1.5">
                  {cat} Extensions
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
                          "text-left p-4 rounded-xl border transition-all flex flex-col gap-1 group bg-background",
                          enabled
                            ? "border-emerald-500/30 bg-emerald-500/[0.02] shadow-sm"
                            : "border-border/60 bg-background/50 hover:border-primary/40 hover:bg-primary/[0.01]",
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <code
                            className={cn(
                              "text-xs font-mono tracking-wide font-semibold transition-colors",
                              enabled ? "text-emerald-600" : "text-foreground/80 group-hover:text-primary",
                            )}
                          >
                            {t.tool_key}
                          </code>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-medium px-2 py-0.5 rounded transition-colors",
                              enabled
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-border text-muted-foreground",
                            )}
                          >
                            {enabled ? "Allowed" : "Inactive"}
                          </Badge>
                        </div>
                        <p
                          className={cn(
                            "text-xs transition-colors leading-relaxed mt-0.5",
                            enabled ? "text-emerald-800/80" : "text-muted-foreground",
                          )}
                        >
                          {t.description || "No tool utility instructions provided."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button
                onClick={() => onSave({ allowed_tools: form.allowed_tools })}
                disabled={saving}
                className="h-10 px-5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Tool Matrix
              </Button>
            </div>
          </TabsContent>

          {/* Economy Tab */}
          <TabsContent value="economy" className="p-6 space-y-6 outline-none">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              <div>
                <h3 className="text-sm font-semibold text-amber-700">Monetization & Credit Settings</h3>
                <p className="text-xs text-muted-foreground">
                  Set connection boundaries and message token deduction values. 1 credit = ৳2 BDT.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Initial Connection Charge (Credits)</Label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/50" />
                  <Input
                    type="number"
                    step="0.25"
                    value={form.connection_fee ?? 0}
                    onChange={(e) => setForm({ ...form, connection_fee: Number(e.target.value) })}
                    className="h-10 pl-9 rounded-lg font-bold text-sm"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Charged exactly once when a user opens a new chat session thread.
                </p>
              </div>

              <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Deduction Cost Per Response (Credits)
                </Label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/50" />
                  <Input
                    type="number"
                    step="0.1"
                    value={form.message_credit_cost ?? 0}
                    onChange={(e) => setForm({ ...form, message_credit_cost: Number(e.target.value) })}
                    className="h-10 pl-9 rounded-lg font-bold text-sm"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Deducted per response iteration. Set to 0 for platform-wide free tools.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button
                onClick={() =>
                  onSave({ connection_fee: form.connection_fee, message_credit_cost: form.message_credit_cost })
                }
                disabled={saving}
                className="h-10 px-5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Monetization Settings
              </Button>
            </div>
          </TabsContent>

          {/* Knowledge Tab */}
          <TabsContent value="knowledge" className="p-6 outline-none bg-muted/5">
            <KnowledgePanel agentId={agent.id} />
          </TabsContent>

          {/* Brain Tab */}
          <TabsContent value="brain" className="p-6 outline-none">
            <AgentBrainPanel agent={agent as any} onSaved={() => onSave({})} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Knowledge Base Panel                                                       */
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
    try {
      const data = await listAgentKnowledgeSources(agentId);
      setSources(data as any);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    setIngesting(true);
    try {
      // Repaired edge-function serialization:
      const payload =
        mode === "text"
          ? { agent_id: agentId, source_kind: "text" as const, title, content, source_ref: null }
          : { agent_id: agentId, source_kind: "url" as const, title: title || url, content: "", source_ref: url };

      const data = await ingestAgentKnowledge(payload);
      toast.success(`Knowledge base updated successfully. Embedded ${data?.chunks ?? 0} data chunks.`);
      setTitle("");
      setContent("");
      setUrl("");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Knowledge base ingestion failed. Try again.");
    } finally {
      setIngesting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAgentKnowledgeSource(id);
      toast.success("Knowledge reference source deleted successfully.");
      await load();
    } catch (error: any) {
      toast.error(error.message || "Failed to clear knowledge reference.");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Ingestion Console */}
      <div className="rounded-xl border bg-background p-5 space-y-5 shadow-sm h-fit">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <DbIcon className="h-4 w-4 text-primary" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Knowledge Console</h4>
              <p className="text-xs text-muted-foreground">Embed customized reference data</p>
            </div>
          </div>
          <div className="flex gap-1 p-1 bg-muted rounded-lg border">
            <Button
              size="sm"
              variant={mode === "text" ? "default" : "ghost"}
              onClick={() => setMode("text")}
              className={cn("h-7 rounded-md text-xs font-medium px-2.5", mode === "text" && "shadow-sm")}
            >
              <FileText className="h-3.5 w-3.5 mr-1" /> Plain Text
            </Button>
            <Button
              size="sm"
              variant={mode === "url" ? "default" : "ghost"}
              onClick={() => setMode("url")}
              className={cn("h-7 rounded-md text-xs font-medium px-2.5", mode === "url" && "shadow-sm")}
            >
              <LinkIcon className="h-3.5 w-3.5 mr-1" /> Web URL
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Document / Resource Label</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Academy Core Syllabus Guidelines"
              className="h-10 rounded-lg text-sm bg-muted/20"
            />
          </div>
          {mode === "text" ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Document Body Text</Label>
              <Textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste reference rules, onboarding criteria, program details, or organizational handbooks..."
                className="rounded-lg text-xs p-3 bg-muted/20 resize-none font-medium leading-relaxed"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Target Web Page URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://groupacademy.online/docs/policy"
                className="h-10 rounded-lg font-mono text-xs bg-muted/20"
              />
            </div>
          )}

          <div className="pt-1">
            <Button
              onClick={handleIngest}
              disabled={ingesting || (mode === "text" ? !content : !url)}
              className="w-full h-10 rounded-lg text-xs font-semibold gap-2 shadow-sm"
            >
              {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DbIcon className="h-4 w-4" />}
              Vectorize Knowledge Source
            </Button>
          </div>
        </div>
      </div>

      {/* Vector Registry */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground tracking-wide px-1">
          Vectorized Data Sources ({sources.length})
        </h4>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted/20" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-background/50 border border-dashed rounded-xl">
            <DbIcon className="h-6 w-6 text-muted-foreground/30 mb-2" />
            <div className="text-center text-xs text-muted-foreground">
              No integrated reference documents found for this workspace.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border bg-background hover:border-primary/30 transition-all group shadow-sm"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium uppercase rounded bg-muted shrink-0 px-1"
                    >
                      {s.source_type}
                    </Badge>
                    <span className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                      {s.title || s.uri || "Untitled Reference Source"}
                    </span>
                  </div>
                  {s.uri && (
                    <p className="text-[11px] font-mono text-muted-foreground truncate max-w-sm pl-1">{s.uri}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={cn(
                      "text-[9px] font-medium uppercase px-1.5 py-0.5 border-none rounded",
                      s.status === "ready"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600 animate-pulse",
                    )}
                  >
                    {s.status ?? "Pending"}
                  </Badge>
                  <Button
                    size="icon"
                    aria-label="Delete source"
                    variant="ghost"
                    onClick={() => handleDelete(s.id)}
                    className="h-8 w-8 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-colors"
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
/* Create Agent Dialog                                                       */
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
      <DialogContent className="max-w-2xl rounded-xl border bg-background p-0 overflow-hidden shadow-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary rounded-t-xl" />
        <div className="p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-primary" />
              <div className="space-y-0.5 text-left">
                <DialogTitle className="text-xl font-bold tracking-tight">Initialize Agent Node</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Deploy a new active runtime interface profile to the platform swarm ecosystem.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] pr-2">
            <div className="space-y-5 pb-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Unique Agent Identifier Key</Label>
                  <Input
                    placeholder="recruiter-pro"
                    value={form.agent_key}
                    onChange={(e) => setForm({ ...form, agent_key: e.target.value })}
                    className="h-10 rounded-lg font-mono text-xs bg-muted/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Agent Display Name</Label>
                  <Input
                    placeholder="Recruiter Pro Advisor"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-10 rounded-lg font-bold text-sm bg-muted/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Brief Marketplace Summary</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g., Expert consultant for automated candidate matching pipelines"
                  className="h-10 rounded-lg text-sm bg-muted/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Initial Instructions / Prompt System Block
                </Label>
                <Textarea
                  rows={6}
                  placeholder="Define role behavioral boundaries, context metrics, and operational goals..."
                  className="font-mono text-xs p-3 rounded-lg border bg-muted/20 shadow-inner resize-none leading-relaxed"
                  value={form.system_prompt}
                  onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border bg-muted/10">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">Scope</Label>
                  <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                    <SelectTrigger className="h-9 rounded-lg font-semibold text-xs bg-background px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border">
                      {AUDIENCES.map((a) => (
                        <SelectItem key={a} value={a} className="font-medium text-xs">
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">Tier</Label>
                  <Select
                    value={String(form.agent_level)}
                    onValueChange={(v) => setForm({ ...form, agent_level: Number(v) })}
                  >
                    <SelectTrigger className="h-9 rounded-lg font-semibold text-xs bg-background px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border">
                      {LEVELS.map((l) => (
                        <SelectItem key={l.v} value={String(l.v)} className="font-medium text-xs">
                          L{l.v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">Conn Fee</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={form.connection_fee}
                    onChange={(e) => setForm({ ...form, connection_fee: Number(e.target.value) })}
                    className="h-9 rounded-lg font-bold text-xs px-2"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">Msg Cost</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.message_credit_cost}
                    onChange={(e) => setForm({ ...form, message_credit_cost: Number(e.target.value) })}
                    className="h-9 rounded-lg font-bold text-xs px-2"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-6 pt-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose} className="h-10 px-4 rounded-lg text-xs font-semibold">
              Cancel
            </Button>
            <Button
              onClick={() => onCreate(form)}
              className="h-10 px-5 rounded-lg text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Create Agent Node
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
