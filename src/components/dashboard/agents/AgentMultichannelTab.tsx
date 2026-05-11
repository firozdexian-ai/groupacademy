/**
 * Admin: Multichannel Routing
 * - Tab 1: Telegram bot credentials per agent (agent_bot_credentials)
 * - Tab 2: Event routing rules → Telegram chat IDs (agent_routing_rules)
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AI_AGENTS } from "@/lib/constants/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Eye, EyeOff, Bot, Radio } from "lucide-react";
import { toast } from "sonner";

const AUDIENCE_TYPES = ["admin", "talent", "business", "system"] as const;
const EVENT_TOPIC_PRESETS = ["onboarding", "transactions", "alerts", "*"];

const ANY_AGENT = "__any__";
const CUSTOM_TOPIC = "__custom__";

type Cred = {
  agent_key: string;
  bot_token: string;
  bot_username: string | null;
  is_active: boolean | null;
};

type Rule = {
  id: string;
  agent_key: string | null;
  event_topic: string;
  audience_type: string;
  telegram_chat_id: string;
  description: string | null;
  is_active: boolean | null;
};

const agentLabel = (key: string | null | undefined) => {
  if (!key) return "Any agent";
  return AI_AGENTS.find((a) => a.id === key)?.name ?? key;
};

const maskToken = (t: string) =>
  !t ? "—" : t.length <= 8 ? "••••" : `••••${t.slice(-4)}`;

// ---------------- Bot Credentials ----------------

function BotCredentialsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cred | null>(null);
  const [draft, setDraft] = useState<Cred>({
    agent_key: "", bot_token: "", bot_username: "", is_active: true,
  });
  const [reveal, setReveal] = useState(false);

  const listQ = useQuery({
    queryKey: ["agent_bot_credentials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_bot_credentials" as any)
        .select("*")
        .order("agent_key");
      if (error) throw error;
      return ((data ?? []) as unknown) as Cred[];
    },
  });

  const used = new Set((listQ.data ?? []).map((c) => c.agent_key));
  const available = AI_AGENTS.filter((a) => editing?.agent_key === a.id || !used.has(a.id));

  const save = useMutation({
    mutationFn: async () => {
      if (!draft.agent_key || !draft.bot_token) throw new Error("Agent and token are required");
      const payload = {
        agent_key: draft.agent_key,
        bot_token: draft.bot_token.trim(),
        bot_username: draft.bot_username?.trim() || null,
        is_active: !!draft.is_active,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("agent_bot_credentials" as any)
        .upsert(payload, { onConflict: "agent_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editing ? "Updated" : "Saved");
      qc.invalidateQueries({ queryKey: ["agent_bot_credentials"] });
      setOpen(false); setEditing(null); setReveal(false);
      setDraft({ agent_key: "", bot_token: "", bot_username: "", is_active: true });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (agent_key: string) => {
      const { error } = await supabase
        .from("agent_bot_credentials" as any).delete().eq("agent_key", agent_key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent_bot_credentials"] }),
  });

  const startEdit = (c: Cred) => {
    setEditing(c);
    setDraft({ ...c, bot_username: c.bot_username ?? "" });
    setReveal(false);
    setOpen(true);
  };

  const startCreate = () => {
    setEditing(null);
    setDraft({ agent_key: "", bot_token: "", bot_username: "", is_active: true });
    setReveal(false);
    setOpen(true);
  };

  const rows = listQ.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4" /> Telegram Bot Tokens
          </h3>
          <p className="text-xs text-muted-foreground">
            Assign one Telegram bot per AI agent. Tokens are stored encrypted in your backend.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={startCreate}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit bot credential" : "Add bot credential"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Agent</label>
                <Select
                  value={draft.agent_key}
                  onValueChange={(v) => setDraft({ ...draft, agent_key: v })}
                  disabled={!!editing}
                >
                  <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                  <SelectContent>
                    {available.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Bot token</label>
                <div className="relative">
                  <Input
                    type={reveal ? "text" : "password"}
                    placeholder="123456:ABC-..."
                    value={draft.bot_token}
                    onChange={(e) => setDraft({ ...draft, bot_token: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Bot username (optional)</label>
                <Input
                  placeholder="@my_bot"
                  value={draft.bot_username ?? ""}
                  onChange={(e) => setDraft({ ...draft, bot_username: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-2">
                <span className="text-sm">Active</span>
                <Switch
                  checked={!!draft.is_active}
                  onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {listQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No bot credentials yet.
        </Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((c) => (
            <Card key={c.agent_key} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{agentLabel(c.agent_key)}</p>
                  {c.is_active ? (
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Disabled</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                  <span>Token: {maskToken(c.bot_token)}</span>
                  {c.bot_username && <span>{c.bot_username}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>Edit</Button>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => { if (confirm(`Remove credential for ${agentLabel(c.agent_key)}?`)) remove.mutate(c.agent_key); }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Routing Rules ----------------

type RuleDraft = {
  id?: string;
  agent_key: string; // ANY_AGENT or actual id
  topic_preset: string; // one of presets or CUSTOM_TOPIC
  event_topic_custom: string;
  audience_type: string;
  telegram_chat_id: string;
  description: string;
  is_active: boolean;
};

function RoutingRulesPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [draft, setDraft] = useState<RuleDraft>({
    agent_key: ANY_AGENT,
    topic_preset: "*",
    event_topic_custom: "",
    audience_type: "talent",
    telegram_chat_id: "",
    description: "",
    is_active: true,
  });

  const listQ = useQuery({
    queryKey: ["agent_routing_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_routing_rules" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown) as Rule[];
    },
  });

  const resolvedTopic = (d: RuleDraft) =>
    d.topic_preset === CUSTOM_TOPIC ? d.event_topic_custom.trim() : d.topic_preset;

  const conflicts = useMemo(() => {
    const topic = resolvedTopic(draft);
    const agent = draft.agent_key === ANY_AGENT ? null : draft.agent_key;
    return (listQ.data ?? []).filter((r) =>
      r.id !== editing?.id &&
      r.event_topic === topic &&
      r.audience_type === draft.audience_type &&
      (r.agent_key ?? null) === agent
    );
  }, [draft, listQ.data, editing?.id]);

  const save = useMutation({
    mutationFn: async () => {
      const topic = resolvedTopic(draft);
      if (!topic) throw new Error("Event topic is required");
      if (!draft.telegram_chat_id.trim()) throw new Error("Telegram chat ID is required");

      const payload = {
        agent_key: draft.agent_key === ANY_AGENT ? null : draft.agent_key,
        event_topic: topic,
        audience_type: draft.audience_type,
        telegram_chat_id: draft.telegram_chat_id.trim(),
        description: draft.description.trim() || null,
        is_active: draft.is_active,
      };

      if (editing?.id) {
        const { error } = await supabase
          .from("agent_routing_rules" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agent_routing_rules" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Rule updated" : "Rule created");
      qc.invalidateQueries({ queryKey: ["agent_routing_rules"] });
      setOpen(false); setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agent_routing_rules" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent_routing_rules"] }),
  });

  const toggleActive = useMutation({
    mutationFn: async (r: Rule) => {
      const { error } = await supabase
        .from("agent_routing_rules" as any)
        .update({ is_active: !r.is_active })
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent_routing_rules"] }),
  });

  const startCreate = () => {
    setEditing(null);
    setDraft({
      agent_key: ANY_AGENT,
      topic_preset: "*",
      event_topic_custom: "",
      audience_type: "talent",
      telegram_chat_id: "",
      description: "",
      is_active: true,
    });
    setOpen(true);
  };

  const startEdit = (r: Rule) => {
    setEditing(r);
    const isPreset = EVENT_TOPIC_PRESETS.includes(r.event_topic);
    setDraft({
      id: r.id,
      agent_key: r.agent_key ?? ANY_AGENT,
      topic_preset: isPreset ? r.event_topic : CUSTOM_TOPIC,
      event_topic_custom: isPreset ? "" : r.event_topic,
      audience_type: r.audience_type,
      telegram_chat_id: r.telegram_chat_id,
      description: r.description ?? "",
      is_active: !!r.is_active,
    });
    setOpen(true);
  };

  const rows = listQ.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Radio className="h-4 w-4" /> Event → Telegram Routing
          </h3>
          <p className="text-xs text-muted-foreground">
            Route platform events to Telegram chats by agent, topic, and audience.
            Use <code className="text-[11px]">*</code> as a global catch-all topic.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={startCreate}><Plus className="h-4 w-4 mr-1" /> Add rule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit routing rule" : "New routing rule"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Agent</label>
                <Select value={draft.agent_key} onValueChange={(v) => setDraft({ ...draft, agent_key: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_AGENT}>Any agent (global)</SelectItem>
                    {AI_AGENTS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium">Event topic</label>
                <Select
                  value={draft.topic_preset}
                  onValueChange={(v) => setDraft({ ...draft, topic_preset: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TOPIC_PRESETS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === "*" ? "* (catch-all)" : t}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_TOPIC}>Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {draft.topic_preset === CUSTOM_TOPIC && (
                  <Input
                    className="mt-2"
                    placeholder="custom.topic.name"
                    value={draft.event_topic_custom}
                    onChange={(e) => setDraft({ ...draft, event_topic_custom: e.target.value })}
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-medium">Audience type</label>
                <Select
                  value={draft.audience_type}
                  onValueChange={(v) => setDraft({ ...draft, audience_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_TYPES.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium">Telegram chat ID</label>
                <Input
                  placeholder="-1001234567890"
                  value={draft.telegram_chat_id}
                  onChange={(e) => setDraft({ ...draft, telegram_chat_id: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-medium">Description (optional)</label>
                <Input
                  placeholder="What this rule is for"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-2">
                <span className="text-sm">Active</span>
                <Switch
                  checked={draft.is_active}
                  onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                />
              </div>

              {conflicts.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-medium">
                    {conflicts.length} existing rule{conflicts.length > 1 ? "s" : ""} match the same agent + topic + audience:
                  </p>
                  <ul className="mt-1 list-disc pl-4">
                    {conflicts.slice(0, 4).map((c) => (
                      <li key={c.id}>chat <code>{c.telegram_chat_id}</code></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
                {save.isPending ? "Saving…" : editing ? "Update rule" : "Create rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {listQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No routing rules yet.
        </Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">{agentLabel(r.agent_key)}</Badge>
                  <Badge variant="secondary">
                    {r.event_topic === "*" ? "* catch-all" : r.event_topic}
                  </Badge>
                  <Badge variant="outline">{r.audience_type}</Badge>
                  {!r.is_active && <Badge variant="destructive" className="text-[10px]">disabled</Badge>}
                </div>
                <p className="text-sm mt-1">
                  → chat <code className="text-xs">{r.telegram_chat_id}</code>
                </p>
                {r.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={!!r.is_active}
                  onCheckedChange={() => toggleActive.mutate(r)}
                />
                <Button size="sm" variant="ghost" onClick={() => startEdit(r)}>Edit</Button>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => { if (confirm("Delete rule?")) remove.mutate(r.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Wrapper ----------------

export function AgentMultichannelTab() {
  return (
    <div className="p-3 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Multichannel Routing</h2>
        <p className="text-sm text-muted-foreground">
          Wire AI agents to Telegram bots and decide which events get pushed to which chats.
        </p>
      </div>
      <Tabs defaultValue="creds">
        <TabsList>
          <TabsTrigger value="creds">Bot Credentials</TabsTrigger>
          <TabsTrigger value="rules">Routing Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="creds" className="mt-4">
          <BotCredentialsPanel />
        </TabsContent>
        <TabsContent value="rules" className="mt-4">
          <RoutingRulesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AgentMultichannelTab;
