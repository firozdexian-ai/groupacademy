import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  countAiAgentsByTemplateFlag,
  listAiAgentsForFleet,
  listAiAgentsCompact,
  getAiAgentById,
  cloneAiAgentInstance,
} from "@/domains/agents/repo/agentsRepo";
import { listAllCompaniesWithSlug } from "@/domains/companies/repo/companiesRepo";
import {
  countActiveWorkforceChannelConnections,
  countActiveWorkforceRoutingRules,
  deleteWorkforceRoutingRule,
} from "@/domains/workforce/repo/workforceRepo";
import { toast } from "sonner";
import { useAdminScope } from "@/hooks/useAdminScope";
import { telegramDiagnostic } from "@/domains/messaging/api/messagingApi";

// =====================================================
// TYPES & CONSTANTS
// =====================================================
type AgentRow = {
  id: string;
  agent_key: string;
  name: string;
  company_id: string | null;
  is_template: boolean;
  parent_template_id: string | null;
  is_active: boolean;
  kill_switch: boolean;
  avatar_url: string | null;
  audience: string | null;
};

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
};

type ChannelConn = {
  id: string;
  agent_key: string;
  channel_provider: string;
  credentials: any;
  is_active: boolean;
  updated_at: string;
};

type RoutingRule = {
  id: string;
  agent_key: string | null;
  event_topic: string;
  channel_provider: string;
  destination_id: string;
  description: string | null;
  is_active: boolean;
};

const CHANNEL_PROVIDERS = ["telegram", "whatsapp", "linkedin", "web_widget", "email", "instagram"];
const EVENT_TOPIC_PRESETS = ["*", "new_lead", "auth_struggle", "onboarding", "transactions", "alerts"];
const ANY_AGENT = "__ANY__";
const CUSTOM_TOPIC = "__CUSTOM__";

const credSummary = (c: any) => {
  if (!c || typeof c !== "object") return "—";
  const keys = Object.keys(c);
  if (!keys.length) return "{}";
  const first = keys[0];
  const v = String(c[first] ?? "");
  const masked = v.length > 6 ? `••••${v.slice(-4)}` : "••••";
  return `{${first}: ${masked}${keys.length > 1 ? `, +${keys.length - 1}` : ""}}`;
};

// =====================================================
// PAGE ENTRANCE
// =====================================================
export function WorkforceCommandCenter() {
  const { scope, isLoading } = useAdminScope();
  const [activeTab, setActiveTab] = useState<"fleet" | "channels" | "routing">("fleet");

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading command center...</div>;
  }

  if (scope !== "super" && scope !== "internal") {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold text-red-500">Restricted Area</h2>
        <p className="text-muted-foreground">Workforce Command Center is limited to internal admins.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Workforce Command Center</h1>
        <p className="text-muted-foreground">AI Workforce-as-a-Service · Network Operations</p>
      </div>

      <StatusStrip />

      <div className="flex space-x-2 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab("fleet")}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === "fleet" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted"}`}
        >
          The Fleet
        </button>
        <button
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === "channels" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted"}`}
        >
          Channel Connections
        </button>
        <button
          onClick={() => setActiveTab("routing")}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === "routing" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted"}`}
        >
          Routing Switchboard
        </button>
      </div>

      <div className="bg-card/30 backdrop-blur border border-border/40 rounded-xl p-6 shadow-sm min-h-[500px]">
        {activeTab === "fleet" && <FleetPanel />}
        {activeTab === "channels" && <ChannelsPanel />}
        {activeTab === "routing" && <RoutingPanel />}
      </div>
    </div>
  );
}

// =====================================================
// STATUS STRIP (KPIs)
// =====================================================
function StatusStrip() {
  const { data } = useQuery({
    queryKey: ["wcc-kpis"],
    queryFn: async () => {
      const [templates, instances, channels, routes] = await Promise.all([
        countAiAgentsByTemplateFlag(true),
        countAiAgentsByTemplateFlag(false),
        countActiveWorkforceChannelConnections(),
        countActiveWorkforceRoutingRules(),
      ]);
      return { templates, instances, channels, routes };
    },
  });

  const tiles = [
    { label: "Master Templates", value: data?.templates ?? "—", color: "text-primary" },
    { label: "Hired Instances", value: data?.instances ?? "—", color: "text-green-500" },
    { label: "Active Channels", value: data?.channels ?? "—", color: "text-cyan-400" },
    { label: "Active Routes", value: data?.routes ?? "—", color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="bg-card/30 border border-border/40 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm"
        >
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-black mb-1">
            {t.label}
          </span>
          <span className={`text-3xl font-black ${t.color}`}>{t.value}</span>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// TAB 1 — THE FLEET
// =====================================================
function FleetPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"templates" | "instances">("templates");
  const [search, setSearch] = useState("");
  const [hireOpen, setHireOpen] = useState(false);

  const agentsQ = useQuery({
    queryKey: ["wcc-agents"],
    queryFn: async () => (await listAiAgentsForFleet()) as AgentRow[],
  });

  const companiesQ = useQuery({
    queryKey: ["wcc-companies"],
    queryFn: async () => (await listAllCompaniesWithSlug()) as CompanyRow[],
  });

  const companyMap = useMemo(() => new Map((companiesQ.data ?? []).map((c) => [c.id, c])), [companiesQ.data]);
  const templateMap = useMemo(() => new Map((agentsQ.data ?? []).map((a) => [a.id, a])), [agentsQ.data]);

  const rows = useMemo(() => {
    const base = (agentsQ.data ?? []).filter((a) =>
      filter === "templates" ? a.is_template === true : a.is_template !== true,
    );
    const s = search.trim().toLowerCase();
    return s ? base.filter((a) => a.name.toLowerCase().includes(s) || a.agent_key.toLowerCase().includes(s)) : base;
  }, [agentsQ.data, filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-muted/50 p-1 rounded-lg">
          <button
            onClick={() => setFilter("templates")}
            className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition ${filter === "templates" ? "bg-background text-primary shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            Master Templates
          </button>
          <button
            onClick={() => setFilter("instances")}
            className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition ${filter === "instances" ? "bg-background text-primary shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            Hired Instances
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-background border border-border/50 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => setHireOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:bg-primary/90 whitespace-nowrap"
          >
            Hire / Clone
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/50 text-muted-foreground">
              <th className="py-3 px-4 font-semibold">Agent</th>
              <th className="py-3 px-4 font-semibold">Key</th>
              <th className="py-3 px-4 font-semibold">Company</th>
              {filter === "instances" && <th className="py-3 px-4 font-semibold">Cloned From</th>}
              <th className="py-3 px-4 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {agentsQ.isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading fleet data...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No agents found.
                </td>
              </tr>
            ) : (
              rows.map((a) => {
                const co = a.company_id ? companyMap.get(a.company_id) : null;
                const parent = a.parent_template_id ? templateMap.get(a.parent_template_id) : null;
                return (
                  <tr key={a.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">{a.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{a.agent_key}</td>
                    <td className="py-3 px-4">
                      {co ? (
                        <span className="text-foreground">{co.name}</span>
                      ) : (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase">
                          Group Academy
                        </span>
                      )}
                    </td>
                    {filter === "instances" && (
                      <td className="py-3 px-4 text-muted-foreground">{parent?.name ?? "—"}</td>
                    )}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${a.kill_switch ? "bg-red-500/10 text-red-500" : a.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}
                      >
                        {a.kill_switch ? "Kill-switch" : a.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {hireOpen && (
        <HireDialog
          templates={(agentsQ.data ?? []).filter((a) => a.is_template)}
          companies={companiesQ.data ?? []}
          onClose={() => setHireOpen(false)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["wcc-agents"] });
            qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
          }}
        />
      )}
    </div>
  );
}

function HireDialog({ templates, companies, onClose, onDone }: any) {
  const [templateId, setTemplateId] = useState("");
  const [companyId, setCompanyId] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!templateId || !companyId) throw new Error("Select a template and company");

      // FIX 1: Changed .select("") to .select("*")
      const tpl = await getAiAgentById(templateId);
      if (!tpl) throw new Error("Template not found");

      const company = companies.find((c: any) => c.id === companyId);
      const slug =
        company?.slug ||
        company?.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 20) ||
        "co";
      const { id, created_at, updated_at, ...rest } = tpl as any;
      const newAgentKey = `${tpl.agent_key}__${slug}__${Math.random().toString(36).slice(2, 6)}`;

      const { error: e2 } = await cloneAiAgentInstance({
        ...rest,
        agent_key: newAgentKey,
        name: `${tpl.name} (${company?.name ?? "Client"})`,
        is_template: false,
        parent_template_id: tpl.id,
        company_id: companyId,
        owner_kind: "company",
        owner_id: companyId,
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Agent hired and cloned successfully!");
      onDone();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to hire agent"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-xl font-bold">Hire / Clone Agent</h3>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Master Template</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full p-2 bg-background border border-border rounded-md text-sm"
          >
            <option value="">Select a template...</option>
            {templates.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.agent_key})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Target Company</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full p-2 bg-background border border-border rounded-md text-sm"
          >
            <option value="">Select a company...</option>
            {companies.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold hover:bg-muted rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !templateId || !companyId}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md disabled:opacity-50"
          >
            {mutation.isPending ? "Cloning Engine..." : "Deploy Clone"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// TAB 2 — CHANNEL CONNECTIONS
// =====================================================
function ChannelsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelConn | null>(null);

  const listQ = useQuery({
    queryKey: ["wcc-channels"],
    queryFn: async () => {
      // FIX 2: Changed .select("") to .select("*")
      const { data, error } = await (supabase as any)
        .from("workforce_channel_connections")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChannelConn[];
    },
  });

  const instancesQ = useQuery({
    queryKey: ["wcc-instances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("agent_key,name")
        .eq("is_template", false)
        .order("name");
      if (error) throw error;
      return (data ?? []) as { agent_key: string; name: string }[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("workforce_channel_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Connection removed");
      qc.invalidateQueries({ queryKey: ["wcc-channels"] });
      qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to remove"),
  });

  async function activateTelegramWebhook(c: ChannelConn) {
    const botToken = (c.credentials as any)?.bot_token;
    if (!botToken) {
      toast.error("This connection has no bot_token in credentials.");
      return;
    }
    const projectRef = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID;
    const defaultBase = projectRef ? `https://${projectRef}.supabase.co` : "";
    const base = window.prompt(
      "Supabase Functions base URL (leave as-is to use default):",
      defaultBase,
    );
    if (!base) return;
    const webhookUrl = `${base.replace(/\/$/, "")}/functions/v1/telegram-agent-webhook?agent_key=${encodeURIComponent(c.agent_key)}`;
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=${encodeURIComponent(JSON.stringify(["message", "edited_message"]))}`,
      );
      const data = await res.json();
      if (data.ok) {
        toast.success(`Webhook activated → ${webhookUrl}`);
      } else {
        toast.error(`Telegram rejected: ${data.description ?? "unknown error"}`);
      }
    } catch (e: any) {
      toast.error(`Network error: ${e?.message ?? e}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Active Agent Connections</h3>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:bg-primary/90"
        >
          New Connection
        </button>
      </div>

      <div className="overflow-x-auto border border-border/40 rounded-lg">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-muted/30">
            <tr className="border-b border-border/50 text-muted-foreground">
              <th className="py-3 px-4 font-semibold">Agent Instance</th>
              <th className="py-3 px-4 font-semibold">Provider</th>
              <th className="py-3 px-4 font-semibold">Credentials Summary</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listQ.isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading connections...
                </td>
              </tr>
            ) : (listQ.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No connections found. Build the bridge!
                </td>
              </tr>
            ) : (
              (listQ.data ?? []).map((c) => {
                const a = (instancesQ.data ?? []).find((i) => i.agent_key === c.agent_key);
                return (
                  <tr key={c.id} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium text-primary">{a?.name ?? c.agent_key}</td>
                    <td className="py-3 px-4 font-mono text-xs uppercase text-muted-foreground">
                      {c.channel_provider}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{credSummary(c.credentials)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${c.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}
                      >
                        {c.is_active ? "Live" : "Paused"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-3">
                      {c.channel_provider === "telegram" && (
                        <button
                          onClick={() => activateTelegramWebhook(c)}
                          className="text-cyan-400 hover:underline text-xs font-semibold"
                          title="Register this Edge Function URL with Telegram so the bot delivers messages here."
                        >
                          Activate Webhook
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditing(c);
                          setOpen(true);
                        }}
                        className="text-primary hover:underline text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Remove this connection?")) delMut.mutate(c.id);
                        }}
                        className="text-red-500 hover:underline text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <ChannelDialog
          editing={editing}
          instances={instancesQ.data ?? []}
          onClose={() => setOpen(false)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["wcc-channels"] });
            qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
          }}
        />
      )}
    </div>
  );
}

function ChannelDialog({ editing, instances, onClose, onDone }: any) {
  const [agentKey, setAgentKey] = useState(editing?.agent_key ?? "");
  const [provider, setProvider] = useState(editing?.channel_provider ?? "telegram");
  const [credText, setCredText] = useState(
    editing?.credentials ? JSON.stringify(editing.credentials, null, 2) : `{\n  "bot_token": ""\n}`,
  );
  const [active, setActive] = useState(editing?.is_active ?? true);

  let jsonError = null;
  let parsed = null;
  try {
    parsed = JSON.parse(credText);
  } catch (e: any) {
    jsonError = e.message;
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!agentKey || jsonError) throw new Error("Fix errors before saving.");
      const payload = {
        agent_key: agentKey,
        channel_provider: provider,
        credentials: parsed,
        is_active: active,
        updated_at: new Date().toISOString(),
      };

      if (editing?.id) {
        const { error } = await (supabase as any)
          .from("workforce_channel_connections")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("workforce_channel_connections").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Updated!" : "Connected!");
      onDone();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-xl font-bold">{editing ? "Edit Connection" : "New Channel Connection"}</h3>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Agent Instance</label>
          <select
            value={agentKey}
            onChange={(e) => setAgentKey(e.target.value)}
            disabled={!!editing}
            className="w-full p-2 bg-background border border-border rounded-md text-sm disabled:opacity-50"
          >
            <option value="">Select a hired agent...</option>
            {instances.map((i: any) => (
              <option key={i.agent_key} value={i.agent_key}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Channel Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={!!editing}
            className="w-full p-2 bg-background border border-border rounded-md text-sm uppercase disabled:opacity-50"
          >
            {CHANNEL_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold flex justify-between">
            <span>JSON Credentials</span>
            {jsonError && <span className="text-red-500 text-xs">Invalid JSON</span>}
          </label>
          <textarea
            value={credText}
            onChange={(e) => setCredText(e.target.value)}
            rows={6}
            className="w-full p-3 font-mono text-xs bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <label className="flex items-center space-x-2 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
          <span className="text-sm font-semibold">Connection is Active</span>
        </label>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold hover:bg-muted rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !!jsonError || !agentKey}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md disabled:opacity-50"
          >
            {mut.isPending ? "Saving..." : "Save Connection"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// TAB 3 — ROUTING SWITCHBOARD
// =====================================================
function RoutingPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoutingRule | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const listQ = useQuery({
    queryKey: ["wcc-rules"],
    queryFn: async () => {
      // FIX 3: Changed .select("") to .select("*")
      const { data, error } = await (supabase as any).from("workforce_routing_rules").select("*").order("event_topic");
      if (error) throw error;
      return (data ?? []) as RoutingRule[];
    },
  });

  const agentsQ = useQuery({
    queryKey: ["wcc-agents-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_agents").select("agent_key,name,is_template").order("name");
      if (error) throw error;
      return (data ?? []) as { agent_key: string; name: string; is_template: boolean }[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("workforce_routing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rule deleted");
      qc.invalidateQueries({ queryKey: ["wcc-rules"] });
      qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Master Routing Switchboard</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setScannerOpen(true)}
            className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/30 font-bold text-sm rounded-md"
          >
            Telegram Scanner (Debug)
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-md shadow-sm"
          >
            New Route
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-border/40 rounded-lg">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-muted/30">
            <tr className="border-b border-border/50 text-muted-foreground">
              <th className="py-3 px-4 font-semibold">Event Topic</th>
              <th className="py-3 px-4 font-semibold">Agent Filter</th>
              <th className="py-3 px-4 font-semibold">Destination Channel</th>
              <th className="py-3 px-4 font-semibold">Destination ID</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listQ.isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading switchboard...
                </td>
              </tr>
            ) : (listQ.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No active routes. System is silent.
                </td>
              </tr>
            ) : (
              (listQ.data ?? []).map((r) => {
                const a = (agentsQ.data ?? []).find((x) => x.agent_key === r.agent_key);
                return (
                  <tr key={r.id} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <span className="font-mono bg-amber-500/10 text-amber-500 font-bold px-2 py-1 rounded text-xs">
                        {r.event_topic}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-primary text-xs">
                      {r.agent_key ? (
                        (a?.name ?? r.agent_key)
                      ) : (
                        <span className="text-muted-foreground italic">Global (Any Agent)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs uppercase text-muted-foreground">
                      {r.channel_provider}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-foreground">{r.destination_id}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${r.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}
                      >
                        {r.is_active ? "Routing" : "Muted"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-3">
                      <button
                        onClick={() => {
                          setEditing(r);
                          setOpen(true);
                        }}
                        className="text-primary hover:underline text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete rule?")) delMut.mutate(r.id);
                        }}
                        className="text-red-500 hover:underline text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <RoutingDialog
          editing={editing}
          agents={agentsQ.data ?? []}
          onClose={() => setOpen(false)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["wcc-rules"] });
            qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
          }}
        />
      )}

      {scannerOpen && <TelegramScannerDialog onClose={() => setScannerOpen(false)} />}
    </div>
  );
}

// =====================================================
// TELEGRAM SCANNER (DEBUG)
// =====================================================
function TelegramScannerDialog({ onClose }: { onClose: () => void }) {
  const scanQ = useQuery({
    queryKey: ["wcc-telegram-scan"],
    queryFn: async () => {
      const data = await telegramDiagnostic({});
      if (!data?.ok) throw new Error(data?.error ?? "Scan failed");
      return data as { ok: true; count: number; total_updates: number; chats: any[] };
    },
    retry: false,
  });

  const copy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(`Copied ${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-6 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl my-8 shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-border/50">
          <div>
            <h3 className="text-xl font-bold text-sky-500">Telegram Scanner</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Recent chats that have messaged your bot
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl px-2">
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm rounded-md p-3">
            <strong>Note:</strong> If your name doesn't appear here, you must go to Telegram and send a
            message (like <code className="font-mono bg-amber-500/20 px-1 rounded">/start</code>) to your
            bot first!
          </div>

          {scanQ.isLoading && (
            <div className="py-10 text-center text-muted-foreground text-sm">Scanning bot updates...</div>
          )}

          {scanQ.isError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-md p-3">
              {(scanQ.error as Error).message}
            </div>
          )}

          {scanQ.data && scanQ.data.chats.length === 0 && (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No recent chats found. Send <code className="font-mono">/start</code> to your bot, then rescan.
            </div>
          )}

          {scanQ.data && scanQ.data.chats.length > 0 && (
            <div className="space-y-2">
              {scanQ.data.chats.map((c: any) => (
                <div
                  key={c.chat_id}
                  className="border border-border/50 rounded-md p-3 flex items-start justify-between gap-3 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") || c.username || "(no name)"}
                      {c.username && (
                        <span className="ml-2 text-xs text-muted-foreground">@{c.username}</span>
                      )}
                      {c.chat_type && (
                        <span className="ml-2 text-[10px] uppercase font-bold text-muted-foreground">
                          {c.chat_type}
                        </span>
                      )}
                    </div>
                    {c.text && (
                      <div className="text-xs text-muted-foreground mt-1 truncate italic">"{c.text}"</div>
                    )}
                    <div className="font-mono text-base font-bold text-sky-500 mt-1">{c.chat_id}</div>
                  </div>
                  <button
                    onClick={() => copy(c.chat_id)}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded shrink-0"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">
              {scanQ.data ? `${scanQ.data.count} unique chats from ${scanQ.data.total_updates} updates` : ""}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => scanQ.refetch()}
                className="px-3 py-1.5 border border-border text-sm rounded hover:bg-muted"
              >
                Rescan
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-muted text-sm rounded hover:bg-muted/70"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoutingDialog({ editing, agents, onClose, onDone }: any) {
  const [agentKey, setAgentKey] = useState(editing?.agent_key ?? ANY_AGENT);
  const [topic, setTopic] = useState(editing?.event_topic ?? "*");
  const [provider, setProvider] = useState(editing?.channel_provider ?? "telegram");
  const [destination, setDestination] = useState(editing?.destination_id ?? "");
  const [desc, setDesc] = useState(editing?.description ?? "");
  const [active, setActive] = useState(editing?.is_active ?? true);

  const mut = useMutation({
    mutationFn: async () => {
      if (!topic.trim() || !destination.trim()) throw new Error("Topic and Destination required");
      const payload = {
        agent_key: agentKey === ANY_AGENT ? null : agentKey,
        event_topic: topic.trim(),
        channel_provider: provider,
        destination_id: destination.trim(),
        description: desc.trim() || null,
        is_active: active,
      };

      if (editing?.id) {
        const { error } = await (supabase as any).from("workforce_routing_rules").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("workforce_routing_rules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Rule updated" : "Rule created");
      onDone();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-amber-500">{editing ? "Edit Routing Rule" : "New Routing Rule"}</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Triggered By (Agent)</label>
            <select
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded-md text-sm"
            >
              <option value={ANY_AGENT}>Global (Any Agent)</option>
              {agents.map((a: any) => (
                <option key={a.agent_key} value={a.agent_key}>
                  {a.name} {a.is_template ? "(Template)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Event Topic</label>
            <input
              type="text"
              placeholder="e.g. *, new_lead, auth_struggle"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded-md text-sm font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Destination Channel</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded-md text-sm uppercase"
            >
              {CHANNEL_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Destination ID (Chat/Phone)</label>
            <input
              type="text"
              placeholder="-100123456789"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded-md text-sm font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Description (Optional)</label>
          <input
            type="text"
            placeholder="Internal note..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full p-2 bg-background border border-border rounded-md text-sm"
          />
        </div>

        <label className="flex items-center space-x-2 py-2 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-border text-amber-500 focus:ring-amber-500 h-4 w-4"
          />
          <span className="text-sm font-semibold">Rule is Active</span>
        </label>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold hover:bg-muted rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !topic.trim() || !destination.trim()}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-md hover:bg-amber-600 disabled:opacity-50"
          >
            {mut.isPending ? "Saving..." : "Save Route"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkforceCommandCenter;
