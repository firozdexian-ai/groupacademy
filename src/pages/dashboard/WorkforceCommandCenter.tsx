/**
 * Workforce Command Center
 * Enterprise NOC for the AI Workforce-as-a-Service architecture.
 *
 * Tab 1 — The Fleet: ai_agents (Master Templates vs Hired Instances) + Hire/Clone dialog
 * Tab 2 — Channel Connections: workforce_channel_connections
 * Tab 3 — Routing Switchboard: workforce_routing_rules
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminScope } from "@/hooks/useAdminScope";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Radar, Radio, Plus, Copy, Trash2, Eye, EyeOff, Cpu, Activity, Phone, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

// ----- Constants -----

const CHANNEL_PROVIDERS = [
  "telegram", "whatsapp", "linkedin", "web_widget", "email", "instagram",
] as const;
type ChannelProvider = typeof CHANNEL_PROVIDERS[number];

const EVENT_TOPIC_PRESETS = [
  "*", "onboarding", "transactions", "alerts", "signup", "payment", "error",
];

const ANY_AGENT = "__any__";
const CUSTOM_TOPIC = "__custom__";

// ----- Types -----

type AgentRow = {
  id: string;
  agent_key: string;
  name: string;
  company_id: string | null;
  is_template: boolean | null;
  parent_template_id: string | null;
  is_active: boolean | null;
  kill_switch: boolean;
  avatar_url: string | null;
  audience: string;
};

type CompanyRow = { id: string; name: string; slug: string | null };

type ChannelConn = {
  id: string;
  agent_key: string | null;
  client_id: string | null;
  channel_provider: string;
  credentials: any;
  is_active: boolean | null;
  updated_at: string | null;
};

type RoutingRule = {
  id: string;
  agent_key: string | null;
  client_id: string | null;
  event_topic: string;
  channel_provider: string;
  destination_id: string;
  description: string | null;
  is_active: boolean | null;
};

// ----- Helpers -----

const credSummary = (c: any): string => {
  if (!c || typeof c !== "object") return "—";
  const keys = Object.keys(c);
  if (!keys.length) return "{}";
  const first = keys[0];
  const v = String(c[first] ?? "");
  const masked = v.length > 6 ? `••••${v.slice(-4)}` : "••••";
  return `{${first}: ${masked}${keys.length > 1 ? `, +${keys.length - 1}` : ""}}`;
};

// =====================================================
// PAGE
// =====================================================

export function WorkforceCommandCenter() {
  const { scope, isLoading } = useAdminScope();

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading command center…</div>;
  }
  if (scope !== "super" && scope !== "internal") {
    return (
      <Card className="m-6 p-12 flex flex-col items-center gap-3 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h2 className="text-lg font-bold">Restricted Area</h2>
        <p className="text-sm text-muted-foreground">
          Workforce Command Center is limited to internal admins.
        </p>
      </Card>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Radar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Workforce Command Center</h1>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">
              AI Workforce-as-a-Service · Network Operations
            </p>
          </div>
        </div>
        <StatusStrip />
      </header>

      <Tabs defaultValue="fleet" className="w-full">
        <TabsList>
          <TabsTrigger value="fleet">
            <Cpu className="h-3.5 w-3.5 mr-2" /> The Fleet
          </TabsTrigger>
          <TabsTrigger value="channels">
            <Phone className="h-3.5 w-3.5 mr-2" /> Channel Connections
          </TabsTrigger>
          <TabsTrigger value="routing">
            <Radio className="h-3.5 w-3.5 mr-2" /> Routing Switchboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fleet"><FleetPanel /></TabsContent>
        <TabsContent value="channels"><ChannelsPanel /></TabsContent>
        <TabsContent value="routing"><RoutingPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// Status Strip (KPIs)
// =====================================================

function StatusStrip() {
  const { data } = useQuery({
    queryKey: ["wcc-kpis"],
    queryFn: async () => {
      const [tpl, inst, ch, rt] = await Promise.all([
        supabase.from("ai_agents").select("id", { count: "exact", head: true }).eq("is_template", true),
        supabase.from("ai_agents").select("id", { count: "exact", head: true }).eq("is_template", false),
        (supabase.from as any)("workforce_channel_connections").select("id", { count: "exact", head: true }).eq("is_active", true),
        (supabase.from as any)("workforce_routing_rules").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return {
        templates: tpl.count ?? 0,
        instances: inst.count ?? 0,
        channels: ch.count ?? 0,
        routes: rt.count ?? 0,
      };
    },
  });

  const tiles = [
    { label: "Templates", value: data?.templates ?? "—", dot: "bg-primary" },
    { label: "Hired Instances", value: data?.instances ?? "—", dot: "bg-green-500" },
    { label: "Active Channels", value: data?.channels ?? "—", dot: "bg-cyan-400" },
    { label: "Active Routes", value: data?.routes ?? "—", dot: "bg-amber-400" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {tiles.map((t) => (
        <Card key={t.label} className="px-4 py-2 flex items-center gap-3 bg-card/50 backdrop-blur-sm">
          <span className={`h-2 w-2 rounded-full ${t.dot} animate-pulse`} />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-bold">{t.label}</span>
            <span className="text-lg font-black tabular-nums">{t.value}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

// =====================================================
// Tab 1 — The Fleet
// =====================================================

function FleetPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"templates" | "instances">("templates");
  const [search, setSearch] = useState("");
  const [hireOpen, setHireOpen] = useState(false);

  const agentsQ = useQuery({
    queryKey: ["wcc-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("id,agent_key,name,company_id,is_template,parent_template_id,is_active,kill_switch,avatar_url,audience")
        .order("name");
      if (error) throw error;
      return (data ?? []) as AgentRow[];
    },
  });

  const companiesQ = useQuery({
    queryKey: ["wcc-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies").select("id,name,slug").order("name");
      if (error) throw error;
      return (data ?? []) as CompanyRow[];
    },
  });

  const companyMap = useMemo(() => {
    const m = new Map<string, CompanyRow>();
    (companiesQ.data ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [companiesQ.data]);

  const templateMap = useMemo(() => {
    const m = new Map<string, AgentRow>();
    (agentsQ.data ?? []).forEach((a) => m.set(a.id, a));
    return m;
  }, [agentsQ.data]);

  const rows = useMemo(() => {
    const base = (agentsQ.data ?? []).filter((a) =>
      filter === "templates" ? a.is_template === true : a.is_template !== true,
    );
    const s = search.trim().toLowerCase();
    return s
      ? base.filter((a) => a.name.toLowerCase().includes(s) || a.agent_key.toLowerCase().includes(s))
      : base;
  }, [agentsQ.data, filter, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-border/40 p-1 bg-muted/30">
            <button
              onClick={() => setFilter("templates")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${
                filter === "templates" ? "bg-background text-primary shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Master Templates
            </button>
            <button
              onClick={() => setFilter("instances")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${
                filter === "instances" ? "bg-background text-primary shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hired Instances
            </button>
          </div>
          <Input
            placeholder="Search name or key…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        <Dialog open={hireOpen} onOpenChange={setHireOpen}>
          <DialogTrigger asChild>
            <Button>
              <Copy className="h-4 w-4 mr-2" /> Hire / Clone Agent
            </Button>
          </DialogTrigger>
          <HireDialog
            templates={(agentsQ.data ?? []).filter((a) => a.is_template === true)}
            companies={companiesQ.data ?? []}
            onClose={() => setHireOpen(false)}
            onDone={() => {
              qc.invalidateQueries({ queryKey: ["wcc-agents"] });
              qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
            }}
          />
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Company</TableHead>
            {filter === "instances" && <TableHead>Cloned From</TableHead>}
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agentsQ.isLoading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No agents found.</TableCell></TableRow>
          ) : rows.map((a) => {
            const co = a.company_id ? companyMap.get(a.company_id) : null;
            const parent = a.parent_template_id ? templateMap.get(a.parent_template_id) : null;
            return (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {a.avatar_url
                      ? <img src={a.avatar_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      : <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20" />}
                    <div className="flex flex-col">
                      <span className="font-bold tracking-tight">{a.name}</span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{a.audience}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell><code className="text-xs bg-muted/40 px-2 py-1 rounded">{a.agent_key}</code></TableCell>
                <TableCell>
                  {co ? (
                    <span className="font-medium">{co.name}</span>
                  ) : (
                    <Badge variant="secondary">Group Academy</Badge>
                  )}
                </TableCell>
                {filter === "instances" && (
                  <TableCell className="text-xs text-muted-foreground">
                    {parent?.name ?? "—"}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${a.is_active && !a.kill_switch ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                    <span className="text-xs">
                      {a.kill_switch ? "Kill-switch" : a.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function HireDialog({ templates, companies, onClose, onDone }: {
  templates: AgentRow[]; companies: CompanyRow[]; onClose: () => void; onDone: () => void;
}) {
  const [templateId, setTemplateId] = useState("");
  const [companyId, setCompanyId] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!templateId || !companyId) throw new Error("Select a template and company");
      const { data: tpl, error: e1 } = await supabase
        .from("ai_agents").select("*").eq("id", templateId).maybeSingle();
      if (e1 || !tpl) throw new Error(e1?.message ?? "Template not found");
      const company = companies.find((c) => c.id === companyId);
      const slug = company?.slug || company?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20) || "co";
      const { id, created_at, updated_at, ...rest } = tpl as any;
      const newAgentKey = `${tpl.agent_key}__${slug}__${Math.random().toString(36).slice(2, 6)}`;
      const { error: e2 } = await supabase.from("ai_agents").insert({
        ...rest,
        agent_key: newAgentKey,
        name: `${tpl.name} (${company?.name ?? "Client"})`,
        is_template: false,
        parent_template_id: tpl.id,
        company_id: companyId,
        owner_kind: "company",
        owner_id: companyId,
      } as any);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Agent hired and cloned");
      onDone();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to hire agent"),
  });

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Hire / Clone Agent</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Master Template</label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger><SelectValue placeholder="Select a template…" /></SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name} <span className="opacity-50 ml-2">{t.agent_key}</span></SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Target Company</label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger><SelectValue placeholder="Select a company…" /></SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !templateId || !companyId}>
          {mutation.isPending ? "Cloning…" : "Hire Agent"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// =====================================================
// Tab 2 — Channel Connections
// =====================================================

function ChannelsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelConn | null>(null);

  const listQ = useQuery({
    queryKey: ["wcc-channels"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("workforce_channel_connections")
        .select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChannelConn[];
    },
  });

  const instancesQ = useQuery({
    queryKey: ["wcc-instances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents").select("agent_key,name").eq("is_template", false).order("name");
      if (error) throw error;
      return (data ?? []) as { agent_key: string; name: string }[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("workforce_channel_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Connection removed");
      qc.invalidateQueries({ queryKey: ["wcc-channels"] });
      qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to remove"),
  });

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (row: ChannelConn) => { setEditing(row); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New Connection</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Credentials</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-32"> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listQ.isLoading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
          ) : (listQ.data ?? []).length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No connections yet.</TableCell></TableRow>
          ) : (listQ.data ?? []).map((c) => {
            const a = (instancesQ.data ?? []).find((i) => i.agent_key === c.agent_key);
            return (
              <TableRow key={c.id}>
                <TableCell><span className="font-bold">{a?.name ?? c.agent_key ?? "—"}</span></TableCell>
                <TableCell><Badge variant="outline" className="uppercase text-[10px]">{c.channel_provider}</Badge></TableCell>
                <TableCell><code className="text-xs">{credSummary(c.credentials)}</code></TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-2 text-xs`}>
                    <span className={`h-2 w-2 rounded-full ${c.is_active ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.updated_at ? new Date(c.updated_at).toLocaleString() : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      if (confirm("Remove this connection?")) delMut.mutate(c.id);
                    }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <ChannelDialog
          editing={editing}
          instances={instancesQ.data ?? []}
          onClose={() => setOpen(false)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["wcc-channels"] });
            qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
          }}
        />
      </Dialog>
    </div>
  );
}

function ChannelDialog({ editing, instances, onClose, onDone }: {
  editing: ChannelConn | null;
  instances: { agent_key: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [agentKey, setAgentKey] = useState(editing?.agent_key ?? "");
  const [provider, setProvider] = useState<ChannelProvider>((editing?.channel_provider as ChannelProvider) ?? "telegram");
  const [credText, setCredText] = useState(editing?.credentials ? JSON.stringify(editing.credentials, null, 2) : `{\n  "token": ""\n}`);
  const [active, setActive] = useState(editing?.is_active ?? true);
  const [reveal, setReveal] = useState(false);

  let jsonError: string | null = null;
  let parsed: any = null;
  try { parsed = JSON.parse(credText); } catch (e: any) { jsonError = e.message; }

  const mut = useMutation({
    mutationFn: async () => {
      if (!agentKey) throw new Error("Select an agent");
      if (jsonError) throw new Error("Invalid JSON: " + jsonError);
      const payload: any = {
        agent_key: agentKey,
        channel_provider: provider,
        credentials: parsed,
        is_active: active,
        updated_at: new Date().toISOString(),
      };
      if (editing?.id) {
        const { error } = await (supabase.from as any)("workforce_channel_connections").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from as any)("workforce_channel_connections").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Updated" : "Connected"); onDone(); onClose(); },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing ? "Edit Connection" : "New Connection"}</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Agent</label>
          <Select value={agentKey} onValueChange={setAgentKey}>
            <SelectTrigger><SelectValue placeholder="Select an instance…" /></SelectTrigger>
            <SelectContent>
              {instances.map((i) => <SelectItem key={i.agent_key} value={i.agent_key}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Channel Provider</label>
          <Select value={provider} onValueChange={(v) => setProvider(v as ChannelProvider)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CHANNEL_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Credentials (JSON)</label>
            <Button size="sm" variant="ghost" onClick={() => setReveal((r) => !r)}>
              {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <Textarea
            value={reveal ? credText : credText.replace(/("(?:token|api_key|secret|password)"\s*:\s*")([^"]+)(")/gi, (_m, a, _b, c) => `${a}••••••••${c}`)}
            onChange={(e) => setCredText(e.target.value)}
            rows={6}
            className="font-mono text-xs"
            disabled={!reveal && /token|api_key|secret|password/i.test(credText)}
          />
          {jsonError && <p className="text-xs text-destructive">JSON error: {jsonError}</p>}
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
          <div>
            <div className="text-sm font-bold">Active</div>
            <div className="text-xs text-muted-foreground">Disable to pause this channel</div>
          </div>
          <Switch checked={!!active} onCheckedChange={setActive} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending || !!jsonError || !agentKey}>
          {mut.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// =====================================================
// Tab 3 — Routing Switchboard
// =====================================================

function RoutingPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoutingRule | null>(null);
  const [filterProvider, setFilterProvider] = useState<string>("__all__");
  const [activeOnly, setActiveOnly] = useState(false);

  const listQ = useQuery({
    queryKey: ["wcc-rules"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("workforce_routing_rules").select("*").order("event_topic");
      if (error) throw error;
      return (data ?? []) as RoutingRule[];
    },
  });

  const agentsQ = useQuery({
    queryKey: ["wcc-agents-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents").select("agent_key,name,is_template").order("name");
      if (error) throw error;
      return (data ?? []) as { agent_key: string; name: string; is_template: boolean | null }[];
    },
  });

  const filtered = useMemo(() => {
    return (listQ.data ?? []).filter((r) =>
      (filterProvider === "__all__" || r.channel_provider === filterProvider) &&
      (!activeOnly || r.is_active),
    );
  }, [listQ.data, filterProvider, activeOnly]);

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("workforce_routing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rule deleted");
      qc.invalidateQueries({ queryKey: ["wcc-rules"] });
      qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All providers</SelectItem>
              {CHANNEL_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={activeOnly} onCheckedChange={setActiveOnly} /> Active only
          </label>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Rule
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Event Topic</TableHead>
            <TableHead>→</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32"> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listQ.isLoading ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No rules yet.</TableCell></TableRow>
          ) : filtered.map((r) => {
            const a = (agentsQ.data ?? []).find((x) => x.agent_key === r.agent_key);
            return (
              <TableRow key={r.id}>
                <TableCell>
                  {r.agent_key
                    ? <span className="font-bold">{a?.name ?? r.agent_key}</span>
                    : <Badge className="uppercase text-[10px]">Any · Global</Badge>}
                </TableCell>
                <TableCell><code className="text-xs bg-muted/40 px-2 py-1 rounded">{r.event_topic}</code></TableCell>
                <TableCell className="text-muted-foreground">→</TableCell>
                <TableCell><Badge variant="outline" className="uppercase text-[10px]">{r.channel_provider}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{r.destination_id}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${r.is_active ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                    {r.is_active ? "Active" : "Off"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      if (confirm("Delete rule?")) delMut.mutate(r.id);
                    }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <RoutingDialog
          editing={editing}
          agents={agentsQ.data ?? []}
          existing={listQ.data ?? []}
          onClose={() => setOpen(false)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["wcc-rules"] });
            qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
          }}
        />
      </Dialog>
    </div>
  );
}

function RoutingDialog({ editing, agents, existing, onClose, onDone }: {
  editing: RoutingRule | null;
  agents: { agent_key: string; name: string; is_template: boolean | null }[];
  existing: RoutingRule[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [agentKey, setAgentKey] = useState<string>(editing?.agent_key ?? ANY_AGENT);
  const initialTopic = editing?.event_topic ?? "*";
  const isPreset = EVENT_TOPIC_PRESETS.includes(initialTopic);
  const [topicSelect, setTopicSelect] = useState(isPreset ? initialTopic : CUSTOM_TOPIC);
  const [topicCustom, setTopicCustom] = useState(isPreset ? "" : initialTopic);
  const [provider, setProvider] = useState<ChannelProvider>((editing?.channel_provider as ChannelProvider) ?? "telegram");
  const [destination, setDestination] = useState(editing?.destination_id ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [active, setActive] = useState(editing?.is_active ?? true);

  const finalTopic = topicSelect === CUSTOM_TOPIC ? topicCustom.trim() : topicSelect;
  const finalAgentKey = agentKey === ANY_AGENT ? null : agentKey;

  const conflict = useMemo(() => {
    return existing.find((r) =>
      r.id !== editing?.id &&
      r.agent_key === finalAgentKey &&
      r.event_topic === finalTopic &&
      r.channel_provider === provider &&
      r.destination_id === destination,
    );
  }, [existing, editing, finalAgentKey, finalTopic, provider, destination]);

  const mut = useMutation({
    mutationFn: async () => {
      if (!finalTopic) throw new Error("Event topic required");
      if (!destination.trim()) throw new Error("Destination required");
      const payload: any = {
        agent_key: finalAgentKey,
        event_topic: finalTopic,
        channel_provider: provider,
        destination_id: destination.trim(),
        description: description.trim() || null,
        is_active: active,
      };
      if (editing?.id) {
        const { error } = await (supabase.from as any)("workforce_routing_rules").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from as any)("workforce_routing_rules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Rule updated" : "Rule created"); onDone(); onClose(); },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing ? "Edit Routing Rule" : "New Routing Rule"}</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Agent</label>
          <Select value={agentKey} onValueChange={setAgentKey}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_AGENT}>Any / Global</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.agent_key} value={a.agent_key}>
                  {a.name} {a.is_template ? "· template" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Event Topic</label>
          <Select value={topicSelect} onValueChange={setTopicSelect}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENT_TOPIC_PRESETS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              <SelectItem value={CUSTOM_TOPIC}>Custom…</SelectItem>
            </SelectContent>
          </Select>
          {topicSelect === CUSTOM_TOPIC && (
            <Input
              placeholder="custom.topic.name"
              value={topicCustom}
              onChange={(e) => setTopicCustom(e.target.value)}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Channel</label>
            <Select value={provider} onValueChange={(v) => setProvider(v as ChannelProvider)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANNEL_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Destination ID</label>
            <Input
              placeholder="Chat ID / phone / email"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Description</label>
          <Input
            placeholder="What this rule does (optional)"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
          <div>
            <div className="text-sm font-bold">Active</div>
            <div className="text-xs text-muted-foreground">Disable to pause this rule</div>
          </div>
          <Switch checked={!!active} onCheckedChange={setActive} />
        </div>

        {conflict && (
          <div className="text-xs text-amber-500 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" /> A matching rule already exists.
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending ? "Saving…" : "Save Rule"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default WorkforceCommandCenter;
