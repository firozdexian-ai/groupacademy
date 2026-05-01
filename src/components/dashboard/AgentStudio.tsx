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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentBrainPanel } from "@/components/dashboard/AgentBrainPanel";

/**
 * Agent Studio: No-code builder for the unified Agent OS.
 * Manages agent metadata, tool allowlists, fees, and knowledge base ingestion.
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
  { v: 2, label: "L2 — Specialist (paid)" },
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
    const { error } = await supabase
      .from("ai_agents")
      .update(patch)
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Agent updated");
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
      toast.error("agent_key and name required");
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
    toast.success("Agent created");
    setCreating(false);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agent? Threads remain but agent becomes inactive.")) return;
    const { error } = await supabase.from("ai_agents").update({ is_active: false }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Agent deactivated");
      await load();
      setSelected(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Agent Studio
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            No-code builder for the Agent OS. Manage prompts, tools, fees, and knowledge bases.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Agent list */}
        <Card className="h-fit max-h-[80vh] overflow-y-auto">
          <CardHeader className="sticky top-0 bg-card z-10 border-b">
            <CardTitle className="text-xs uppercase tracking-widest">
              Agents ({agents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all border",
                  selected?.id === a.id
                    ? "bg-primary/10 border-primary/40"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm truncate">{a.name}</span>
                  {!a.is_active && (
                    <Badge variant="outline" className="text-[9px]">
                      OFF
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-[10px] text-muted-foreground">{a.agent_key}</code>
                  <Badge variant="secondary" className="text-[9px]">
                    L{a.agent_level ?? 1}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px]">
                    {a.audience ?? "talent"}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Detail panel */}
        <div>
          {selected ? (
            <AgentDetailPanel
              agent={selected}
              tools={tools}
              saving={saving}
              onSave={handleSave}
              onDelete={() => handleDelete(selected.id)}
            />
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Bot className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select an agent to configure.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <CreateAgentDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Detail Panel                                  */
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
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
            <code className="text-xs text-muted-foreground">{agent.agent_key}</code>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={!!form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
            <TabsTrigger value="config" className="rounded-none">
              <Bot className="h-3 w-3" /> Config
            </TabsTrigger>
            <TabsTrigger value="tools" className="rounded-none">
              <Wrench className="h-3 w-3" /> Tools
            </TabsTrigger>
            <TabsTrigger value="economy" className="rounded-none">
              <Coins className="h-3 w-3" /> Economy
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="rounded-none">
              <BookOpen className="h-3 w-3" /> Knowledge
            </TabsTrigger>
            <TabsTrigger value="brain" className="rounded-none">
              <Sparkles className="h-3 w-3" /> Brain
            </TabsTrigger>
          </TabsList>

          {/* Config tab */}
          <TabsContent value="config" className="p-6 space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>System Prompt</Label>
              <Textarea
                rows={10}
                className="font-mono text-xs"
                value={form.system_prompt ?? ""}
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Audience</Label>
                <Select
                  value={form.audience ?? "talent"}
                  onValueChange={(v) => setForm({ ...form, audience: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select
                  value={String(form.agent_level ?? 1)}
                  onValueChange={(v) => setForm({ ...form, agent_level: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l.v} value={String(l.v)}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Canvas</Label>
                <Select
                  value={form.canvas_mode ?? "chat"}
                  onValueChange={(v) => setForm({ ...form, canvas_mode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANVAS_MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => onSave(form)} disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Tools tab */}
          <TabsContent value="tools" className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground">
              Select capabilities this agent can call. Tools are invoked by the runtime via function-calling.
            </p>
            {Object.entries(groupedTools).map(([cat, list]) => (
              <div key={cat}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  {cat}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {list.map((t) => {
                    const enabled = (form.allowed_tools ?? []).includes(t.tool_key);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTool(t.tool_key)}
                        className={cn(
                          "text-left p-3 rounded-lg border transition-all",
                          enabled
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/40",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <code className="text-xs font-bold">{t.tool_key}</code>
                          {enabled && <Badge className="text-[9px]">ON</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{t.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <Button onClick={() => onSave({ allowed_tools: form.allowed_tools })} disabled={saving}>
                <Save className="h-3 w-3" /> Save Tools
              </Button>
            </div>
          </TabsContent>

          {/* Economy tab */}
          <TabsContent value="economy" className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Connection Fee (credits)</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={form.connection_fee ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, connection_fee: Number(e.target.value) })
                  }
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  One-time charge on first interaction. 1.25 = standard.
                </p>
              </div>
              <div>
                <Label>Message Cost (credits)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.message_credit_cost ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, message_credit_cost: Number(e.target.value) })
                  }
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Per-response deduction. 0 = free agent.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() =>
                  onSave({
                    connection_fee: form.connection_fee,
                    message_credit_cost: form.message_credit_cost,
                  })
                }
                disabled={saving}
              >
                <Save className="h-3 w-3" /> Save Economy
              </Button>
            </div>
          </TabsContent>

          {/* Knowledge tab */}
          <TabsContent value="knowledge" className="p-6">
            <KnowledgePanel agentId={agent.id} />
          </TabsContent>

          {/* Brain tab — Phase 7 */}
          <TabsContent value="brain" className="p-6">
            <AgentBrainPanel agent={agent as any} onSaved={() => onSave({})} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Knowledge Base Panel                              */
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
          : { agent_id: agentId, source_type: "url", title: title || url, uri: url };
      const { data, error } = await supabase.functions.invoke("ingest-agent-knowledge", {
        body: payload,
      });
      if (error) throw error;
      toast.success(`Ingested ${data?.chunks ?? 0} chunks`);
      setTitle("");
      setContent("");
      setUrl("");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Ingest failed");
    } finally {
      setIngesting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("agent_knowledge_sources").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Source removed");
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <DbIcon className="h-4 w-4 text-primary" />
          <h4 className="font-bold text-sm">Add Knowledge</h4>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "text" ? "default" : "outline"}
            onClick={() => setMode("text")}
          >
            <FileText className="h-3 w-3" /> Text
          </Button>
          <Button
            size="sm"
            variant={mode === "url" ? "default" : "outline"}
            onClick={() => setMode("url")}
          >
            <LinkIcon className="h-3 w-3" /> URL
          </Button>
        </div>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional label" />
        </div>
        {mode === "text" ? (
          <div>
            <Label>Content</Label>
            <Textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste documentation, FAQ, or any reference text…"
            />
          </div>
        ) : (
          <div>
            <Label>URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/docs"
            />
          </div>
        )}
        <div className="flex justify-end">
          <Button
            onClick={handleIngest}
            disabled={ingesting || (mode === "text" ? !content : !url)}
          >
            {ingesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Ingest & Embed
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-sm mb-3">Sources ({sources.length})</h4>
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : sources.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No knowledge sources yet.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">
                      {s.source_type}
                    </Badge>
                    <span className="font-bold text-sm truncate">{s.title ?? "Untitled"}</span>
                  </div>
                  {s.uri && (
                    <p className="text-[10px] text-muted-foreground truncate mt-1">{s.uri}</p>
                  )}
                </div>
                <Badge
                  variant={s.status === "ready" ? "default" : "secondary"}
                  className="text-[9px]"
                >
                  {s.status ?? "pending"}
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Create Agent Dialog                               */
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>Define a new agent persona on the unified runtime.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Agent Key (slug)</Label>
              <Input
                placeholder="recruiter-pro"
                value={form.agent_key}
                onChange={(e) => setForm({ ...form, agent_key: e.target.value })}
              />
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                placeholder="Recruiter Pro"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>System Prompt</Label>
            <Textarea
              rows={6}
              className="font-mono text-xs"
              value={form.system_prompt}
              onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Level</Label>
              <Select
                value={String(form.agent_level)}
                onValueChange={(v) => setForm({ ...form, agent_level: Number(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l.v} value={String(l.v)}>L{l.v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conn. Fee</Label>
              <Input
                type="number" step="0.25"
                value={form.connection_fee}
                onChange={(e) => setForm({ ...form, connection_fee: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Msg Cost</Label>
              <Input
                type="number" step="0.1"
                value={form.message_credit_cost}
                onChange={(e) => setForm({ ...form, message_credit_cost: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onCreate(form)}>
            <Plus className="h-3 w-3" /> Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
