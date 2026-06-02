import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  countAiAgentsByTemplateFlag,
  listAiAgentsForFleet,
  listAiAgentsCompact,
  listAiAgentInstancesMinimal,
  getAiAgentById,
  cloneAiAgentInstance,
} from "@/domains/agents/repo/agentsRepo";
import { listAllCompaniesWithSlug } from "@/domains/companies/repo/companiesRepo";
import {
  countActiveWorkforceChannelConnections,
  countActiveWorkforceRoutingRules,
  deleteWorkforceRoutingRule,
  listWorkforceChannelConnections,
  deleteWorkforceChannelConnection,
  upsertWorkforceChannelConnection,
  listWorkforceRoutingRules,
  upsertWorkforceRoutingRule,
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
    return <div className="p-8 text-muted-foreground font-medium text-sm">Loading workspace dashboard...</div>;
  }

  if (scope !== "super" && scope !== "internal") {
    return (
      <div className="p-8 text-left">
        <h2 className="text-xl font-bold text-destructive uppercase tracking-tight">Restricted Access Area</h2>
        <p className="text-muted-foreground text-sm mt-1 font-medium">Workforce Command Center access is restricted to authorized platform administrators only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2 text-left">
        <h1 className="text-3xl font-black tracking-tight uppercase italic text-foreground">Workforce Dashboard</h1>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Automated Workforce Management & System Integration</p>
      </div>

      <StatusStrip />

      <div className="flex space-x-2 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab("fleet")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-t-lg transition-colors border-0 cursor-pointer ${activeTab === "fleet" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground bg-transparent hover:bg-muted/50"}`}
        >
          AI Assistants Pool
        </button>
        <button
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-t-lg transition-colors border-0 cursor-pointer ${activeTab === "channels" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground bg-transparent hover:bg-muted/50"}`}
        >
          Integration Channels
        </button>
        <button
          onClick={() => setActiveTab("routing")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-t-lg transition-colors border-0 cursor-pointer ${activeTab === "routing" ? "bg-card text-primary border-b-2 border-primary" : "text-muted-foreground bg-transparent hover:bg-muted/50"}`}
        >
          Event Notification Rules
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
    { label: "Assigned Profiles", value: data?.instances ?? "—", color: "text-emerald-500" },
    { label: "Connected Streams", value: data?.channels ?? "—", color: "text-cyan-400" },
    { label: "Active Notification Rules", value: data?.routes ?? "—", color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="bg-card/30 border border-border/40 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm text-center"
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
// TAB 1 — AI ASSISTANTS POOL
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
            className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest border-0 cursor-pointer transition ${filter === "templates" ? "bg-background text-primary shadow" : "text-muted-foreground bg-transparent hover:text-foreground"}`}
          >
            Master Templates
          </button>
          <button
            onClick={() => setFilter("instances")}
            className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest border-0 cursor-pointer transition ${filter === "instances" ? "bg-background text-primary shadow" : "text-muted-foreground bg-transparent hover:text-foreground"}`}
          >
            Assigned Profiles
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search AI models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-background border border-border/50 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          />
          <button
            onClick={() => setHireOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-md hover:bg-primary/90 whitespace-nowrap border-0 cursor-pointer transition-all shadow-sm"
          >
            Clone & Assign
          </button>
        </div>
      </div>

      <div className="overflow-x-auto text-left">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-4 font-semibold text-left">Assistant Profile Name</th>
              <th className="py-3 px-4 font-semibold text-left">System Reference Key</th>
              <th className="py-3 px-4 font-semibold text-left">Assigned Scope / Company</th>
              {filter === "instances" && <th className="py-3 px-4 font-semibold text-left">Source Template</th>}
              <th className="py-3 px-4 font-semibold text-right pr-4">Operational Status</th>
            </tr>
          </thead>
          <tbody className="font-medium text-foreground">
            {agentsQ.isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground italic text-xs uppercase font-semibold">
                  Syncing assistant profiles registry...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground italic text-xs uppercase font-semibold">
                  No active assistant configurations match the query criteria.
                </td>
              </tr>
            ) : (
              rows.map((a) => {
                const co = a.company_id ? companyMap.get(a.company_id) : null;
                const parent = a.parent_template_id ? templateMap.get(a.parent_template_id) : null;
                return (
                  <tr key={a.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4 font-semibold text-left text-foreground uppercase italic text-xs">{a.name}</td>
                    <td className="py-4 px-4 font-mono text-xs text-muted-foreground text-left">{a.agent_key}</td>
                    <td className="py-4 px-4 text-left">
                      {co ? (
                        <span className="text-foreground uppercase text-xs font-bold">{co.name}</span>
                      ) : (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[8px] font-black tracking-widest px-2.5 py-1 rounded-sm">
                          GLOBAL HUB
                        </Badge>
                      )}
                    </td>
                    {filter === "instances" && (
                      <td className="py-4 px-4 text-muted-foreground text-left uppercase text-xs">{parent?.name ?? "—"}</td>
                    )}
                    <td className="py-4 px-4 text-right pr-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${a.kill_switch ? "bg-destructive text-white" : a.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}
                      >
                        {a.kill_switch ? "Emergency Stop" : a.is_active ? "Online" : "Offline"}
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
      if (!templateId || !companyId) throw new Error("Please select a master template and target company profile.");

      const tpl = await getAiAgentById(templateId);
      if (!tpl) throw new Error("Specified master template could not be loaded.");

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
        name: `${tpl.name} (${company?.name ?? "Partner Client"})`,
        is_template: false,
        parent_template_id: tpl.id,
        company_id: companyId,
        owner_kind: "company",
        owner_id: companyId,
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("AI Assistant successfully cloned and assigned to partner profile.");
      onDone();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not assign assistant profile."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-left">
      <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 shadow-xl space-y-4 text-left">
        <h3 className="text-xl font-bold uppercase tracking-tight italic">Clone and Deploy Assistant</h3>

        <div className="space-y-2 text-left">
          <Label className="text-[10px] font-semibold uppercase tracking-wider ml-1">Master Model Template</Label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-md text-sm font-medium focus:ring-1 focus:ring-primary"
          >
            <option value="">Select template configuration...</option>
            {templates.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.agent_key})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 text-left">
          <Label className="text-[10px] font-semibold uppercase tracking-wider ml-1">Target Account Assignment</Label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-md text-sm font-medium focus:ring-1 focus:ring-primary"
          >
            <option value="">Select destination company profile...</option>
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
            className="px-4 py-2 border-0 bg-transparent text-xs font-bold uppercase text-muted-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !templateId || !companyId}
            className="px-5 py-2 bg-primary text-primary-foreground border-0 text-xs font-black uppercase tracking-wider rounded-md disabled:opacity-50 cursor-pointer shadow-md"
          >
            {mutation.isPending ? "Deploying Configuration..." : "Confirm Deployment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// TAB 2 — INTEGRATION CHANNELS
// =====================================================
function ChannelsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelConn | null>(null);

  const listQ = useQuery({
    queryKey: ["wcc-channels"],
    queryFn: async () => (await listWorkforceChannelConnections()) as ChannelConn[],
  });

  const instancesQ = useQuery({
    queryKey: ["wcc-instances"],
    queryFn: async () => await listAiAgentInstancesMinimal(),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      await deleteWorkforceChannelConnection(id);
    },
    onSuccess: () => {
      toast.success("Connection successfully detached.");
      qc.invalidateQueries({ queryKey: ["wcc-channels"] });
      qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not detach connection mapping."),
  });

  async function activateTelegramWebhook(c: ChannelConn) {
    const botToken = (c.credentials as any)?.bot_token;
    if (!botToken) {
      toast.error("This integration contains no verified bot_token parameter.");
      return;
    }
    const projectRef = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID;
    const defaultBase = projectRef ? `https://${projectRef}.supabase.co` : "";
    const base = window.prompt(
      "Confirm core messaging API base endpoint URL configuration:",
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
        toast.success("Messaging integration channel successfully connected.");
      } else {
        toast.error(`Channel provider verification rejected: ${data.description ?? "Access Denied"}`);
      }
    } catch (e: any) {
      toast.error("Network synchronization time out. Please check server status.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold uppercase text-left tracking-tight">Active Integration Channels</h3>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-md hover:bg-primary/90 border-0 cursor-pointer shadow-sm transition-all"
        >
          Establish Integration Channel
        </button>
      </div>

      <div className="overflow-x-auto border border-border/40 rounded-lg text-left">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-muted/30">
            <tr className="border-b border-border/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-4 font-semibold text-left">Assigned Assistant Profile</th>
              <th className="py-3 px-4 font-semibold text-left">Platform Channel Provider</th>
              <th className="py-3 px-4 font-semibold text-left">Credentials Summary</th>
              <th className="py-3 px-4 font-semibold text-left">Channel Status</th>
              <th className="py-3 px-4 font-semibold text-right pr-4">Available Actions</th>
            </tr>
          </thead>
          <tbody className="font-medium text-foreground">
            {listQ.isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground italic text-xs font-semibold uppercase">
                  Synchronizing messaging integrations...
                </td>
              </tr>
            ) : (listQ.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground italic text-xs font-semibold uppercase">
                  No messaging integrations established. Please wire a profile configuration stream.
                </td>
              </tr>
            ) : (
              (listQ.data ?? []).map((c) => {
                const a = (instancesQ.data ?? []).find((i) => i.agent_key === c.agent_key);
                return (
                  <tr key={c.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4 font-semibold text-primary uppercase italic text-xs text-left">{a?.name ?? c.agent_key}</td>
                    <td className="py-4 px-4 font-mono text-xs uppercase text-muted-foreground text-left">
                      {c.channel_provider}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-muted-foreground text-left">{credSummary(c.credentials)}</td>
                    <td className="py-4 px-4 text-left">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${c.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}
                      >
                        {c.is_active ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right pr-4 space-x-3 text-xs font-bold uppercase">
                      {c.channel_provider === "telegram" && (
                        <button
                          onClick={() => activateTelegramWebhook(c)}
                          className="text-cyan-500 hover:underline border-0 bg-transparent cursor-pointer font-bold text-xs"
                          title="Register this background endpoint URL with the platform provider."
                        >
                          Verify Channel Connection
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditing(c);
                          setOpen(true);
                        }}
                        className="text-primary hover:underline border-0 bg-transparent cursor-pointer font-bold text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to decouple this platform channel provider stream?")) delMut.mutate(c.id);
                        }}
                        className="text-destructive hover:underline border-0 bg-transparent cursor-pointer font-bold text-xs"
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
      if (!agentKey || jsonError) throw new Error("Please correct validation and formatting issues before saving updates.");
      const payload = {
        agent_key: agentKey,
        channel_provider: provider,
        credentials: parsed,
        is_active: active,
        updated_at: new Date().toISOString(),
      };

      await upsertWorkforceChannelConnection(payload, editing?.id);
    },
    onSuccess: () => {
      toast.success(editing ? "Channel configurations updated successfully." : "Integration channel established successfully.");
      onDone();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save configuration rules."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-left">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl p-6 shadow-xl space-y-4 text-left">
        <h3 className="text-xl font-bold uppercase tracking-tight italic">{editing ? "Modify Integration Parameters" : "Configure Channel Stream"}</h3>

        <div className="space-y-2 text-left">
          <Label className="text-[10px] font-semibold uppercase tracking-wider ml-1">Assigned AI Assistant Instance</Label>
          <select
            value={agentKey}
            onChange={(e) => setAgentKey(e.target.value)}
            disabled={!!editing}
            className="w-full p-3 bg-background border border-border rounded-md text-sm font-medium disabled:opacity-50 focus:ring-1 focus:ring-primary"
          >
            <option value="">Select active configuration profile...</option>
            {instances.map((i: any) => (
              <option key={i.agent_key} value={i.agent_key}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 text-left">
          <Label className="text-[10px] font-semibold uppercase tracking-wider ml-1">Communication Channel Provider</Label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={!!editing}
            className="w-full p-3 bg-background border border-border rounded-md text-sm font-medium uppercase disabled:opacity-50 focus:ring-1 focus:ring-primary"
          >
            {CHANNEL_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[10px] font-semibold uppercase tracking-wider ml-1 flex justify-between">
            <span>JSON Object Tokens / Security Parameters</span>
            {jsonError && <span className="text-destructive text-xs uppercase font-bold tracking-normal">Syntax Failure</span>}
          </label>
          <textarea
            value={credText}
            onChange={(e) => setCredText(e.target.value)}
            rows={6}
            className="w-full p-3 font-mono text-xs bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <label className="flex items-center space-x-2 py-2 cursor-pointer text-left">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
          />
          <span className="text-xs font-bold uppercase tracking-wide text-foreground">Enable communication stream parameters</span>
        </label>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border/50">
          <button
            onClick={onClose}
            className="px-4 py-2 border-0 bg-transparent text-xs font-bold uppercase text-muted-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !!jsonError || !agentKey}
            className="px-5 py-2 bg-primary text-primary-foreground border-0 text-xs font-black uppercase tracking-wider rounded-md disabled:opacity-50 cursor-pointer shadow-md"
          >
            {mut.isPending ? "Saving Stream Parameters..." : "Save Parameters"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// TAB 3 — EVENT NOTIFICATION RULES
// =====================================================
function RoutingPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoutingRule | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const listQ = useQuery({
    queryKey: ["wcc-rules"],
    queryFn: async () => (await listWorkforceRoutingRules()) as RoutingRule[],
  });

  const agentsQ = useQuery({
    queryKey: ["wcc-agents-min"],
    queryFn: async () => await listAiAgentsCompact(),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      await deleteWorkforceRoutingRule(id);
    },
    onSuccess: () => {
      toast.success("Notification rule successfully removed.");
      qc.invalidateQueries({ queryKey: ["wcc-rules"] });
      qc.invalidateQueries({ queryKey: ["wcc-kpis"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold uppercase text-left tracking-tight">Active Event Notification Rules</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setScannerOpen(true)}
            className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/30 font-bold text-xs uppercase tracking-wider rounded-md cursor-pointer transition-all"
          >
            Channel Diagnostics Panel
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-md border-0 cursor-pointer transition-all shadow-sm"
          >
            Create Rule Option
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-border/40 rounded-lg text-left">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-muted/30">
            <tr className="border-b border-border/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-4 font-semibold text-left">Trigger Event Topic</th>
              <th className="py-3 px-4 font-semibold text-left">Profile Filter Scope</th>
              <th className="py-3 px-4 font-semibold text-left">Destination Stream Provider</th>
              <th className="py-3 px-4 font-semibold text-left">Destination ID (Chat/Group Token)</th>
              <th className="py-3 px-4 font-semibold text-left">Rule Status</th>
              <th className="py-3 px-4 font-semibold text-right pr-4">Available Actions</th>
            </tr>
          </thead>
          <tbody className="font-medium text-foreground">
            {listQ.isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground italic text-xs font-semibold uppercase">
                  Synchronizing configuration criteria logs...
                </td>
              </tr>
            ) : (listQ.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground italic text-xs font-semibold uppercase">
                  No active event notification metrics recorded. Workspace routing is currently quiet.
                </td>
              </tr>
            ) : (
              (listQ.data ?? []).map((r) => {
                const a = (agentsQ.data ?? []).find((x) => x.agent_key === r.agent_key);
                return (
                  <tr key={r.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4 text-left">
                      <span className="font-mono bg-amber-500/10 text-amber-500 font-bold px-2 py-1 rounded text-xs">
                        {r.event_topic}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-foreground text-xs text-left">
                      {r.agent_key ? (
                        (a?.name ?? r.agent_key)
                      ) : (
                        <span className="text-muted-foreground italic uppercase font-bold text-[10px]">Global Workspace Scope</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs uppercase text-muted-foreground text-left">
                      {r.channel_provider}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-foreground text-left">{r.destination_id}</td>
                    <td className="py-4 px-4 text-left">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${r.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}
                      >
                        {r.is_active ? "Active" : "Muted"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right pr-4 space-x-3 text-xs font-bold uppercase">
                      <button
                        onClick={() => {
                          setEditing(r);
                          setOpen(true);
                        }}
                        className="text-primary hover:underline border-0 bg-transparent cursor-pointer font-bold text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to permanently delete this notification criteria rule?")) delMut.mutate(r.id);
                        }}
                        className="text-destructive hover:underline border-0 bg-transparent cursor-pointer font-bold text-xs"
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
// CHANNEL DIAGNOSTICS PANEL (DEBUG)
// =====================================================
function TelegramScannerDialog({ onClose }: { onClose: () => void }) {
  const scanQ = useQuery({
    queryKey: ["wcc-telegram-scan"],
    queryFn: async () => {
      const data = await telegramDiagnostic({});
      if (!data?.ok) throw new Error(data?.error ?? "Synchronization scan failed to pull data feeds.");
      return data as { ok: true; count: number; total_updates: number; chats: any[] };
    },
    retry: false,
  });

  const copy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(`Copied target verification ID token: ${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-6 overflow-y-auto text-left">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl my-8 shadow-2xl text-left">
        <div className="flex justify-between items-center p-5 border-b border-border/50">
          <div className="text-left">
            <h3 className="text-xl font-bold text-sky-500 uppercase tracking-tight italic">Channel Diagnostics Monitor</h3>
            <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">
              Recent incoming stream handshakes detected on platform bot endpoints
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl px-2 border-0 bg-transparent cursor-pointer">
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs rounded-md p-3 uppercase font-bold tracking-wide leading-relaxed text-left">
            <strong>Operational Note:</strong> If a targeted operator name does not appear within this ledger list, you must open the messaging client and broadcast a baseline activation command (such as <code className="font-mono bg-amber-500/20 px-1 rounded normal-case">/start</code>) to establish communication boundaries.
          </div>

          {scanQ.isLoading && (
            <div className="py-10 text-center text-muted-foreground text-xs italic font-semibold uppercase">Scanning active platform channel components...</div>
          )}

          {scanQ.isError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md p-3 font-semibold">
              {(scanQ.error as Error).message}
            </div>
          )}

          {scanQ.data && scanQ.data.chats.length === 0 && (
            <div className="py-10 text-center text-muted-foreground text-xs italic font-semibold uppercase">
              No recent communication streams recognized. Send a baseline trigger to refresh diagnostic telemetry logs.
            </div>
          )}

          {scanQ.data && scanQ.data.chats.length > 0 && (
            <div className="space-y-2">
              {scanQ.data.chats.map((c: any) => (
                <div
                  key={c.chat_id}
                  className="border border-border/50 rounded-md p-3 flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-semibold text-sm uppercase text-foreground">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") || c.username || "(unnamed contact)"}
                      {c.username && (
                        <span className="ml-2 text-xs text-muted-foreground normal-case font-medium">@{c.username}</span>
                      )}
                      {c.chat_type && (
                        <span className="ml-2 text-[10px] uppercase font-black text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm tracking-widest">
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
                    className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-black uppercase tracking-wider border-0 rounded shrink-0 cursor-pointer shadow-sm transition-all"
                  >
                    Copy Token
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-border/40 text-xs font-bold uppercase tracking-wide">
            <span className="text-muted-foreground opacity-60">
              {scanQ.data ? `${scanQ.data.count} unique connections established across ${scanQ.data.total_updates} total logs` : ""}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => scanQ.refetch()}
                className="px-4 py-2 border border-border text-xs font-bold uppercase rounded hover:bg-muted transition-colors bg-transparent cursor-pointer"
              >
                Refresh Scan
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-muted border-0 text-xs font-bold uppercase rounded hover:bg-muted/70 transition-colors cursor-pointer"
              >
                Close Panel
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
      if (!topic.trim() || !destination.trim()) throw new Error("Trigger Topic and Destination profile ID are required.");
      const payload = {
        agent_key: agentKey === ANY_AGENT ? null : agentKey,
        event_topic: topic.trim(),
        channel_provider: provider,
        destination_id: destination.trim(),
        description: desc.trim() || null,
        is_active: active,
      };

      await upsertWorkforceRoutingRule(payload, editing?.id);
    },
    onSuccess: () => {
      toast.success(editing ? "Notification rule updated successfully." : "Event routing rule established successfully.");
      onDone();
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save notifications criteria mapping rules."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-left">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl p-6 shadow-xl space-y-4 text-left">
        <h3 className="text-xl font-bold text-amber-500 uppercase tracking-tight italic">{editing ? "Modify Notification Rule" : "Create Notification Trigger"}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-semibold uppercase tracking-wider ml-1">Trigger Event Source (AI Profile)</Label>
            <select
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value)}
              className="w-full p-3 bg-background border border-border rounded-md text-sm font-medium focus:ring-1 focus:ring-primary"
            >
              <option value={ANY_AGENT}>Global Scope (Any Active Instance)</option>
              {agents.map((a: any) => (
                <option key={a.agent_key} value={a.agent_key}>
                  {a.name} {a.is_template ? "(Template)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-semibold uppercase tracking-wider ml-1">Event Topic Slugs / Flags</Label>
            <input
              type="text"
              placeholder="e.g. *, new_lead, auth_struggle"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 bg-background border border-border rounded-md text-sm font-mono text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/40 pt-4 mt-2">
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-semibold uppercase tracking-wider ml-1">Target Distribution Stream</Label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full p-3 bg-background border border-border rounded-md text-sm font-medium uppercase focus:ring-1 focus:ring-primary"
            >
              {CHANNEL_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-semibold uppercase tracking-wider ml-1">Destination Target Token / Group ID</Label>
            <input
              type="text"
              placeholder="e.g., -100123456789"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full p-3 bg-background border border-border rounded-md text-sm font-mono text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2 text-left">
          <Label className="text-[10px] font-semibold uppercase tracking-wider ml-1">Internal Reference Description (Optional)</Label>
          <input
            type="text"
            placeholder="Enter administrative memo or workflow description..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-md text-sm font-medium text-foreground"
          />
        </div>

        <label className="flex items-center space-x-2 py-2 cursor-pointer text-left">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded border-border text-amber-500 focus:ring-amber-500 h-4 w-4 cursor-pointer"
          />
          <span className="text-xs font-bold uppercase tracking-wide text-foreground">Activate this notification matching criteria rule</span>
        </label>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border/50">
          <button
            onClick={onClose}
            className="px-4 py-2 border-0 bg-transparent text-xs font-bold uppercase text-muted-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !topic.trim() || !destination.trim()}
            className="px-5 py-2 bg-amber-500 text-white text-xs font-black uppercase tracking-wider rounded-md hover:bg-amber-600 disabled:opacity-50 cursor-pointer shadow-md"
          >
            {mut.isPending ? "Saving Trigger Criteria..." : "Save Trigger Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkforceCommandCenter;