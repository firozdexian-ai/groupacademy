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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Eye, EyeOff, Bot, Radio, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trackError } from "@/lib/errorTracking";

/**
 * Group Academy — Career Guidance System: Agent Multichannel Messaging & Notification Router Component
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/command-center?tab=multichannel (Operator Notification Canvas Viewport)
 * Operations Mode: Automated Efficiency mapping system hooks to Telegram communication webhooks.
 */

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
  if (!key) return "Global (Any Assistant)";
  return AI_AGENTS.find((a) => a.id === key)?.name ?? key;
};

const maskToken = (t: string) => (!t ? "—" : t.length <= 8 ? "••••" : `••••${t.slice(-4)}`);

// ─── BOT INTEGRATIONS CREDENTIALS SUB-PANEL ───────────────────────────

function BotCredentialsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cred | null>(null);
  const [draft, setDraft] = useState<Cred>({
    agent_key: "",
    bot_token: "",
    bot_username: "",
    is_active: true,
  });
  const [reveal, setReveal] = useState(false);

  const listQ = useQuery({
    queryKey: ["agent_bot_credentials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_bot_credentials").select("*").order("agent_key");
      if (error) throw error;
      return (data ?? []) as unknown as Cred[];
    },
  });

  const used = new Set((listQ.data ?? []).map((c) => c.agent_key));
  const available = AI_AGENTS.filter((a) => editing?.agent_key === a.id || !used.has(a.id));

  const save = useMutation({
    mutationFn: async () => {
      if (!draft.agent_key || !draft.bot_token)
        throw new Error("Assistant identity selection and API token are required");
      const payload = {
        agent_key: draft.agent_key,
        bot_token: draft.bot_token.trim(),
        bot_username: draft.bot_username?.trim() || null,
        is_active: !!draft.is_active,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("agent_bot_credentials").upsert(payload, { onConflict: "agent_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editing ? "Integration settings modified" : "Integration credential successfully added");
      qc.invalidateQueries({ queryKey: ["agent_bot_credentials"] });
      setOpen(false);
      setEditing(null);
      setReveal(false);
      setDraft({ agent_key: "", bot_token: "", bot_username: "", is_active: true });
    },
    onError: (err: any) => {
      trackError("multichannel-credentials-save-failure", { error: err.message, editingKey: editing?.agent_key });
      toast.error(err.message);
    },
  });

  const remove = useMutation({
    mutationFn: async (agent_key: string) => {
      const { error } = await supabase.from("agent_bot_credentials").delete().eq("agent_key", agent_key);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credential mapping severed");
      qc.invalidateQueries({ queryKey: ["agent_bot_credentials"] });
    },
    onError: (err: any) => trackError("multichannel-credentials-delete-failure", { error: err.message }),
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
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
            <Bot className="h-4 w-4 text-primary" /> Telegram Integration Settings
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Bind dedicated messaging profiles to automated guidance assistants. Access keys are safely encrypted.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={startCreate}
              className="h-9 rounded-xl font-semibold text-xs shrink-0 gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                {editing ? "Modify Integration Credential" : "Configure Integration Credential"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Target Advisory Assistant</label>
                <Select
                  value={draft.agent_key}
                  onValueChange={(v) => setDraft({ ...draft, agent_key: v })}
                  disabled={!!editing}
                >
                  <SelectTrigger className="rounded-xl border-border text-sm">
                    <SelectValue placeholder="Select target assistant" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {available.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-sm font-medium">
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">API Integration Token</label>
                <div className="relative">
                  <Input
                    type={reveal ? "text" : "password"}
                    placeholder="e.g. 123456:ABC-..."
                    value={draft.bot_token}
                    onChange={(e) => setDraft({ ...draft, bot_token: e.target.value })}
                    className="rounded-xl border-border pr-10 text-sm focus-visible:ring-1 focus-visible:ring-primary bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Verified Username (Optional)</label>
                <Input
                  placeholder="e.g. @academy_guidance_bot"
                  value={draft.bot_username ?? ""}
                  onChange={(e) => setDraft({ ...draft, bot_username: e.target.value })}
                  className="rounded-xl border-border text-sm focus-visible:ring-1 focus-visible:ring-primary bg-background"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Channel Activation</span>
                  <span className="text-[11px] text-muted-foreground">
                    Toggle messaging conduit connectivity state.
                  </span>
                </div>
                <Switch checked={!!draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="w-full h-10 rounded-xl font-semibold text-sm shadow-sm"
              >
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {save.isPending ? "Saving changes..." : "Save Credential Mapping"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {listQ.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" /> Synchronizing credentials index...
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border text-xs font-medium text-muted-foreground bg-muted/5 rounded-xl">
          No external messaging proxies mapped to this target cluster workspace.
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((c) => (
            <Card
              key={c.agent_key}
              className="p-4 border-border bg-card shadow-sm flex items-center justify-between gap-4 rounded-xl group"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-foreground leading-none">{agentLabel(c.agent_key)}</p>
                  <Badge
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wide border-none px-2.5 rounded-full py-0",
                      c.is_active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground/60",
                    )}
                  >
                    {c.is_active ? "Online" : "Disabled"}
                  </Badge>
                </div>
                <div className="text-xs font-mono text-muted-foreground/80 flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                  <span>
                    Conduit Access Key: <span className="text-foreground/70 font-medium">{maskToken(c.bot_token)}</span>
                  </span>
                  {c.bot_username && <span className="text-primary font-medium">{c.bot_username}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => startEdit(c)}
                  className="h-8 rounded-lg text-xs font-semibold px-3 bg-muted hover:bg-muted/80 text-foreground"
                >
                  Edit
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Sever integration routing lines for ${agentLabel(c.agent_key)}?`))
                      remove.mutate(c.agent_key);
                  }}
                  className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                  aria-label="Delete mapping"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EVENT ROUTING CRITERIA RULES SUB-PANEL ─────────────────────────

type RuleDraft = {
  id?: string;
  agent_key: string;
  topic_preset: string;
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
        .from("agent_routing_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Rule[];
    },
  });

  const resolvedTopic = (d: RuleDraft) =>
    d.topic_preset === CUSTOM_TOPIC ? d.event_topic_custom.trim() : d.topic_preset;

  const conflicts = useMemo(() => {
    const topic = resolvedTopic(draft);
    const agent = draft.agent_key === ANY_AGENT ? null : draft.agent_key;
    return (listQ.data ?? []).filter(
      (r) =>
        r.id !== editing?.id &&
        r.event_topic === topic &&
        r.audience_type === draft.audience_type &&
        (r.agent_key ?? null) === agent,
    );
  }, [draft, listQ.data, editing?.id]);

  const save = useMutation({
    mutationFn: async () => {
      const topic = resolvedTopic(draft);
      if (!topic) throw new Error("A topic categorization definition path is required");
      if (!draft.telegram_chat_id.trim()) throw new Error("A target Telegram channel chat identifier is required");

      const payload = {
        agent_key: draft.agent_key === ANY_AGENT ? null : draft.agent_key,
        event_topic: topic,
        audience_type: draft.audience_type,
        telegram_chat_id: draft.telegram_chat_id.trim(),
        description: draft.description.trim() || null,
        is_active: draft.is_active,
      };

      if (editing?.id) {
        const { error } = await supabase.from("agent_routing_rules").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agent_routing_rules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Routing rule updated successfully" : "Event distribution path criteria created");
      qc.invalidateQueries({ queryKey: ["agent_routing_rules"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => {
      trackError("multichannel-rules-save-failure", { error: err.message, editingId: editing?.id });
      toast.error(err.message);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agent_routing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Routing criteria rule archived");
      qc.invalidateQueries({ queryKey: ["agent_routing_rules"] });
    },
    onError: (err: any) => trackError("multichannel-rules-delete-failure", { error: err.message }),
  });

  const toggleActive = useMutation({
    mutationFn: async (r: Rule) => {
      const { error } = await supabase.from("agent_routing_rules").update({ is_active: !r.is_active }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent_routing_rules"] }),
    onError: (err: any) => trackError("multichannel-rules-toggle-failure", { error: err.message }),
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
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
            <Radio className="h-4 w-4 text-primary" /> Event Routing Criteria Matrices
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Map event webhooks to Telegram channels by assistant origin, category, and access privilege classifications.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={startCreate}
              className="h-9 rounded-xl font-semibold text-xs shrink-0 gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Routing Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border-border scrollbar-thin">
            <DialogHeader>
              <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                {editing ? "Modify Routing Rule" : "Create Routing Criteria Rule"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Assistant Scope Origin</label>
                <Select value={draft.agent_key} onValueChange={(v) => setDraft({ ...draft, agent_key: v })}>
                  <SelectTrigger className="rounded-xl border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value={ANY_AGENT} className="text-sm font-medium">
                      Global (Any Assistant)
                    </SelectItem>
                    {AI_AGENTS.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-sm font-medium">
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Webhook Category Topic</label>
                <Select value={draft.topic_preset} onValueChange={(v) => setDraft({ ...draft, topic_preset: v })}>
                  <SelectTrigger className="rounded-xl border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {EVENT_TOPIC_PRESETS.map((t) => (
                      <SelectItem key={t} value={t} className="text-sm font-medium">
                        {t === "*" ? "Default fallback catch-all (*)" : t}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_TOPIC} className="text-sm font-medium">
                      Custom Channel Definition...
                    </SelectItem>
                  </SelectContent>
                </Select>
                {draft.topic_preset === CUSTOM_TOPIC && (
                  <Input
                    className="mt-2 rounded-xl border-border text-sm focus-visible:ring-1 focus-visible:ring-primary bg-background"
                    placeholder="e.g. system.security.alerts"
                    value={draft.event_topic_custom}
                    onChange={(e) => setDraft({ ...draft, event_topic_custom: e.target.value })}
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Target Privilege Audience</label>
                <Select value={draft.audience_type} onValueChange={(v) => setDraft({ ...draft, audience_type: v })}>
                  <SelectTrigger className="rounded-xl border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {AUDIENCE_TYPES.map((a) => (
                      <SelectItem key={a} value={a} className="text-sm font-medium capitalize">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Target Chat Identifier</label>
                <Input
                  placeholder="e.g. -1001234567890"
                  value={draft.telegram_chat_id}
                  onChange={(e) => setDraft({ ...draft, telegram_chat_id: e.target.value })}
                  className="rounded-xl border-border text-sm focus-visible:ring-1 focus-visible:ring-primary bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Operator Summary Notes (Optional)</label>
                <Input
                  placeholder="State the objective description for this deployment rule mapping"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="rounded-xl border-border text-sm focus-visible:ring-1 focus-visible:ring-primary bg-background"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">Rule Synchronization State</span>
                  <span className="text-[11px] text-muted-foreground">
                    Archive or resume processing live distributions.
                  </span>
                </div>
                <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
              </div>

              {conflicts.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-bold">
                    {conflicts.length} overlapping distribution criteria rule{conflicts.length > 1 ? "s" : ""} match the
                    same vector configurations:
                  </p>
                  <ul className="mt-1 list-disc pl-4 font-medium space-y-0.5">
                    {conflicts.slice(0, 4).map((c) => (
                      <li key={c.id}>
                        Destination structural channel ID:{" "}
                        <code className="font-mono bg-background px-1 rounded border border-border/40 text-[11px]">
                          {c.telegram_chat_id}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="w-full h-10 rounded-xl font-semibold text-sm shadow-sm"
              >
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {save.isPending
                  ? "Syncing rule configurations..."
                  : editing
                    ? "Modify Rule Schema"
                    : "Commit Distribution Path Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {listQ.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" /> Synchronizing distribution rule
          indexes...
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border text-xs font-medium text-muted-foreground bg-muted/5 rounded-xl">
          No distribution routing rule maps committed into the operational environment profile.
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card
              key={r.id}
              className="p-4 border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-xl group"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground hover:bg-muted font-semibold text-[11px] rounded px-2 py-0"
                  >
                    {agentLabel(r.agent_key)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] font-bold border-border bg-background px-1.5 py-0 rounded text-foreground/80"
                  >
                    Topic: {r.event_topic === "*" ? "Global fallback catch-all (*)" : r.event_topic}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="font-semibold text-[11px] uppercase border-border text-muted-foreground px-2 rounded py-0"
                  >
                    {r.audience_type}
                  </Badge>
                  {!r.is_active && (
                    <Badge className="text-[10px] bg-rose-500/10 hover:bg-rose-500/10 text-rose-700 border-none font-bold px-2 py-0 rounded-full">
                      Disabled
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-foreground/80 font-medium pt-1">
                  Forwarding distribution pathway &rarr; channel{" "}
                  <code className="font-mono bg-muted/60 text-foreground px-1.5 py-0.5 rounded border border-border/60 text-[11px] font-bold">
                    {r.telegram_chat_id}
                  </code>
                </p>
                {r.description && (
                  <p className="text-xs text-muted-foreground/80 font-medium pl-1 italic border-l border-border mt-1">
                    {r.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 sm:self-center">
                <Switch checked={!!r.is_active} onCheckedChange={() => toggleActive.mutate(r)} />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => startEdit(r)}
                  className="h-8 rounded-lg text-xs font-semibold px-3 bg-muted hover:bg-muted/80 text-foreground"
                >
                  Edit
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Permanently archive event routing distribution line?")) remove.mutate(r.id);
                  }}
                  className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                  aria-label="Archive rule"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CENTRAL CONTROLLER DOMAIN CONTAINER WRAPPER ───────────────────

export function AgentMultichannelTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Structural Management Banner */}
      <header className="flex flex-col gap-1.5 bg-muted/40 p-6 rounded-2xl border border-border/40 backdrop-blur-sm shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Multichannel Communication Routing</h2>
        <p className="text-xs text-muted-foreground/90 font-medium leading-relaxed">
          Wire background intelligence assistants directly to Telegram bot APIs and orchestrate selective notification
          delivery pathways across cross-domain clusters.
        </p>
      </header>

      <Tabs defaultValue="creds" className="w-full">
        <TabsList className="bg-muted/40 border border-border p-1 mb-4 w-full md:w-auto flex flex-col md:flex-row h-auto gap-1 rounded-xl">
          <TabsTrigger
            value="creds"
            className="rounded-lg font-semibold text-xs tracking-tight py-2 px-4 flex-1 md:flex-none"
          >
            Bot Connections
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="rounded-lg font-semibold text-xs tracking-tight py-2 px-4 flex-1 md:flex-none"
          >
            Event Routing Criteria
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="creds"
          className="mt-2 animate-in slide-in-from-bottom-2 duration-200 focus-visible:outline-none"
        >
          <BotCredentialsPanel />
        </TabsContent>
        <TabsContent
          value="rules"
          className="mt-2 animate-in slide-in-from-bottom-2 duration-200 focus-visible:outline-none"
        >
          <RoutingRulesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AgentMultichannelTab;
