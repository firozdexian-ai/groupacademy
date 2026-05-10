import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus,
  Building2,
  Bot,
  Coins,
  BadgeCheck,
  Trash2,
  Users,
  MessageSquare,
  Download,
  Filter,
  UserCheck,
  Zap,
  ShieldCheck,
  Activity,
  Terminal,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: B2B Partnership Terminal (Company Agents)
 * High-fidelity orchestrator for sponsored AI artifacts and lead telemetry.
 * 2024 Standard: Executive Logic geometry with reinforced budgetary guards.
 */

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
}

interface CompanyAgent {
  id: string;
  agent_id: string;
  company_id: string;
  sponsorship_type: string | null;
  monthly_budget: number | null;
  credits_used: number | null;
  is_active: boolean | null;
  lead_config: any;
  created_at: string | null;
  ai_agents: {
    id: string;
    name: string;
    description: string;
    agent_key: string;
    icon: string | null;
    color: string | null;
    bg_color: string | null;
    credit_cost: number | null;
    category: string | null;
    is_active: boolean | null;
    total_conversations: number | null;
    expertise_areas: string[] | null;
  } | null;
  companies: Company | null;
}

interface Lead {
  id: string;
  company_agent_id: string;
  agent_id: string | null;
  talent_id: string | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  lead_company: string | null;
  lead_interest: string | null;
  status: string | null;
  created_at: string | null;
}

const SPONSORSHIP_TYPES = [
  { value: "full", label: "Full Sponsorship", description: "Company pays all credits" },
  { value: "partial", label: "Partial Sponsorship", description: "Company subsidizes credits" },
  { value: "branded", label: "Branded Only", description: "User pays, company branding" },
];

const AGENT_CATEGORIES = [
  { value: "career", label: "Career" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "wellness", label: "Wellness" },
  { value: "industry", label: "Industry Specific" },
];

const LEAD_FIELDS = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Company" },
  { value: "interest", label: "Interest" },
];

export function CompanyAgentsManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<{ agentId: string; companyAgentId: string } | null>(null);
  const [activeTab, setActiveTab] = useState("agents");
  const [leadFilter, setLeadFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
    expertise_areas: "",
    category: "finance",
    credit_cost: 10,
    sponsorship_type: "branded",
    monthly_budget: 1000,
    lead_enabled: false,
    lead_fields: ["name", "email"] as string[],
    lead_notification_email: "",
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["companies-for-agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name, logo_url, industry").order("name");
      if (error) throw error;
      return data as Company[];
    },
  });

  const { data: companyAgents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["company-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_agents")
        .select(
          `
          *,
          ai_agents (*),
          companies (id, name, logo_url, industry)
        `,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CompanyAgent[];
    },
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["company-agent-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_agent_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const createAgentMutation = useMutation({
    mutationFn: async (data: typeof formData & { company_id: string }) => {
      const agentKey = `${data.name.toLowerCase().replace(/\s+/g, "-")}-${selectedCompany.slice(0, 8)}`;
      const { data: newAgent, error: agentError } = await supabase
        .from("ai_agents")
        .insert({
          agent_key: agentKey,
          name: data.name,
          description: data.description,
          system_prompt: data.system_prompt,
          expertise_areas: data.expertise_areas
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          category: data.category,
          credit_cost: data.credit_cost,
          company_id: data.company_id,
          agent_type: "company_sponsored",
          icon: "Building2",
          color: "text-blue-600",
          bg_color: "bg-blue-500/10",
          capabilities: ["text"],
          is_active: true,
          is_featured: false,
        })
        .select()
        .single();

      if (agentError) throw agentError;

      const { error: linkError } = await supabase.from("company_agents").insert({
        agent_id: newAgent.id,
        company_id: data.company_id,
        sponsorship_type: data.sponsorship_type,
        monthly_budget: data.monthly_budget,
        credits_used: 0,
        is_active: true,
        lead_config: {
          enabled: data.lead_enabled,
          fields: data.lead_fields,
          notification_email: data.lead_notification_email || null,
        },
      });

      if (linkError) throw linkError;
      return newAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Artifact Synced: Sponsored Agent live.");
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const toggleAgentMutation = useMutation({
    mutationFn: async ({
      agentId,
      companyAgentId,
      isActive,
    }: {
      agentId: string;
      companyAgentId: string;
      isActive: boolean;
    }) => {
      await supabase.from("ai_agents").update({ is_active: isActive }).eq("id", agentId);
      const { error } = await supabase.from("company_agents").update({ is_active: isActive }).eq("id", companyAgentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Node Status Updated");
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async ({ agentId, companyAgentId }: { agentId: string; companyAgentId: string }) => {
      await supabase.from("company_agents").delete().eq("id", companyAgentId);
      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Artifact Purged");
      setDeleteTarget(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      system_prompt: "",
      expertise_areas: "",
      category: "finance",
      credit_cost: 10,
      sponsorship_type: "branded",
      monthly_budget: 1000,
      lead_enabled: false,
      lead_fields: ["name", "email"],
      lead_notification_email: "",
    });
    setSelectedCompany("");
  };

  const toggleLeadField = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      lead_fields: prev.lead_fields.includes(field)
        ? prev.lead_fields.filter((f) => f !== field)
        : [...prev.lead_fields, field],
    }));
  };

  // CTO RESTORATION: Export Logic
  const exportLeadsCSV = () => {
    const filtered = leadFilter === "all" ? leads : leads.filter((l) => l.company_agent_id === leadFilter);
    if (filtered.length === 0) {
      toast.error("No leads detected in query.");
      return;
    }

    const headers = ["Name", "Email", "Phone", "Interest", "Status", "Timestamp"];
    const rows = filtered.map((l) => [
      l.lead_name || "N/A",
      l.lead_email || "N/A",
      l.lead_phone || "N/A",
      l.lead_interest || "N/A",
      l.status || "new",
      l.created_at ? new Date(l.created_at).toISOString() : "N/A",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Partner_Leads_${new Date().getTime()}.csv`);
    link.click();
    toast.success("Lead Ledger Exported");
  };

  // Telemetry Constants
  const totalAgents = companyAgents.length;
  const activeNodes = companyAgents.filter((a) => a.is_active).length;
  const totalLeads = leads.length;
  const totalInteractions = companyAgents.reduce((sum, a) => sum + (a.ai_agents?.total_conversations || 0), 0);
  const totalBudget = companyAgents.reduce((sum, a) => sum + (a.monthly_budget || 0), 0);

  if (loadingAgents || loadingCompanies || loadingLeads)
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[32px] bg-muted/40" />
          ))}
        </div>
        <Skeleton className="h-[600px] w-full rounded-[40px] bg-muted/40" />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Partnership Terminal</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            B2B Sponsored Intelligence & Lead Telemetry
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              <Plus className="h-4 w-4 mr-2" /> Initialize Artifact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
            <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
            <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
              <DialogHeader className="mb-8">
                <div className="flex items-center gap-4">
                  <Terminal className="h-8 w-8 text-primary" />
                  <div className="space-y-1">
                    <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                      Create Sponsored Node
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Inject new AI logic under corporate sponsorship
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-10 py-2">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">
                    Partnership Entity *
                  </Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                      <SelectValue placeholder="Select target registry..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id} className="font-bold">
                          {company.name} [{company.industry?.toUpperCase() || "GLOBAL"}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Artifact Name *
                      </Label>
                      <Input
                        placeholder="e.g., Financial Logic Unit"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12 rounded-xl border-2 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Logic Category
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                          {AGENT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="font-bold uppercase text-[9px]">
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        External Briefing *
                      </Label>
                      <Input
                        placeholder="Brief system purpose..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="h-12 rounded-xl border-2 italic font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Expertise Matrix
                      </Label>
                      <Input
                        placeholder="Comma-separated domains..."
                        value={formData.expertise_areas}
                        onChange={(e) => setFormData({ ...formData, expertise_areas: e.target.value })}
                        className="h-12 rounded-xl border-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">
                    Core System Prompt *
                  </Label>
                  <Textarea
                    placeholder="Define behavioral constraints, tone, and logic boundaries..."
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    rows={6}
                    className="rounded-3xl border-2 bg-muted/5 font-mono text-sm p-6 italic"
                  />
                </div>

                <div className="p-8 rounded-[32px] border-2 bg-muted/10 space-y-8 shadow-inner">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic border-b border-border/10 pb-4 flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4" /> Sponsorship Protocol
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                        Billing Type
                      </Label>
                      <Select
                        value={formData.sponsorship_type}
                        onValueChange={(v) => setFormData({ ...formData, sponsorship_type: v })}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                          {SPONSORSHIP_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="font-bold">
                              <p className="text-[10px] uppercase">{t.label}</p>
                              <p className="text-[8px] opacity-40 italic">{t.description}</p>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                        Monthly Token Budget
                      </Label>
                      <Input
                        type="number"
                        value={formData.monthly_budget}
                        onChange={(e) => setFormData({ ...formData, monthly_budget: parseInt(e.target.value) || 0 })}
                        className="h-12 rounded-xl border-2 font-black italic text-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[32px] border-2 bg-primary/5 border-primary/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-tight italic">Lead Ingestion Node</h4>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">
                        Extract contact telemetry during runtime
                      </p>
                    </div>
                    <Switch
                      checked={formData.lead_enabled}
                      onCheckedChange={(v) => setFormData({ ...formData, lead_enabled: v })}
                    />
                  </div>

                  {formData.lead_enabled && (
                    <div className="space-y-6 animate-in slide-in-from-top-4">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">
                          Target Metadata
                        </Label>
                        <div className="flex flex-wrap gap-3">
                          {LEAD_FIELDS.map((f) => (
                            <div
                              key={f.value}
                              className="flex items-center gap-2 bg-background px-4 py-2 rounded-xl border shadow-sm"
                            >
                              <Checkbox
                                id={`lead-${f.value}`}
                                checked={formData.lead_fields.includes(f.value)}
                                onCheckedChange={() => toggleLeadField(f.value)}
                              />
                              <label
                                htmlFor={`lead-${f.value}`}
                                className="text-[10px] font-black uppercase tracking-widest cursor-pointer"
                              >
                                {f.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                          Telemetry Notification Email
                        </Label>
                        <Input
                          type="email"
                          placeholder="leads@partnership.com"
                          value={formData.lead_notification_email}
                          onChange={(e) => setFormData({ ...formData, lead_notification_email: e.target.value })}
                          className="h-12 rounded-xl border-2"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-10 pt-8 border-t border-border/10">
                <Button
                  variant="ghost"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
                >
                  Abort
                </Button>
                <Button
                  onClick={() => createAgentMutation.mutate({ ...formData, company_id: selectedCompany })}
                  disabled={createAgentMutation.isPending || !selectedCompany || !formData.name.trim()}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30"
                >
                  {createAgentMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  {createAgentMutation.isPending ? "Syncing..." : "Authorize Creation"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Partnership HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Active Nodes",
            val: activeNodes,
            icon: Activity,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Global Interactions",
            val: totalInteractions,
            icon: MessageSquare,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Partner Leads",
            val: totalLeads,
            icon: UserCheck,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
          },
          {
            label: "Collective Budget",
            val: totalBudget.toLocaleString(),
            icon: Coins,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
          >
            <CardContent className="p-6 flex items-center gap-5">
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                  stat.bg,
                  "border-white/5",
                )}
              >
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-black tracking-tighter italic leading-none">{stat.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Terminal Viewport */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/30 backdrop-blur-md rounded-[24px] border-2 border-border/40 p-1 mb-8 w-full max-w-md">
          <TabsTrigger
            value="agents"
            className="flex-1 rounded-[18px] font-black uppercase text-[10px] tracking-widest py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            Registry Artifacts ({totalAgents})
          </TabsTrigger>
          <TabsTrigger
            value="leads"
            className="flex-1 rounded-[18px] font-black uppercase text-[10px] tracking-widest py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            Lead Registry ({totalLeads})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="animate-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {companyAgents.map((ca) => {
              const budgetPct = Math.min(100, ((ca.credits_used || 0) / (ca.monthly_budget || 1)) * 100);
              const agentLeads = leads.filter((l) => l.company_agent_id === ca.id).length;

              return (
                <Card
                  key={ca.id}
                  className={cn(
                    "rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-primary/40 group",
                    !ca.is_active && "opacity-60 grayscale-[0.5]",
                  )}
                >
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-5">
                        <div
                          className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 shadow-inner",
                            ca.ai_agents?.bg_color || "bg-primary/10",
                            "border-white/5",
                          )}
                        >
                          <Bot className={cn("h-7 w-7", ca.ai_agents?.color || "text-primary")} />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none">
                            {ca.ai_agents?.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 border border-primary/20">
                              <AvatarImage src={ca.companies?.logo_url || ""} />
                              <AvatarFallback className="text-[8px] font-black">
                                {ca.companies?.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
                              {ca.companies?.name}
                            </span>
                            <BadgeCheck className="h-3 w-3 text-blue-500" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={ca.is_active ?? false}
                          onCheckedChange={(v) =>
                            ca.ai_agents &&
                            toggleAgentMutation.mutate({ agentId: ca.ai_agents.id, companyAgentId: ca.id, isActive: v })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive/20 hover:text-destructive transition-all"
                          onClick={() =>
                            ca.ai_agents && setDeleteTarget({ agentId: ca.ai_agents.id, companyAgentId: ca.id })
                          }
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 pt-0 space-y-8">
                    <div className="flex flex-wrap gap-3">
                      <Badge
                        variant="outline"
                        className="rounded-lg border-2 font-black text-[9px] uppercase tracking-widest bg-background px-3 py-1"
                      >
                        {ca.sponsorship_type || "branded"} PROTOCOL
                      </Badge>
                      <div className="flex items-center gap-4 ml-auto text-muted-foreground/60 italic font-black uppercase text-[9px] tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-3 w-3" /> {ca.ai_agents?.total_conversations || 0}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="h-3 w-3" /> {agentLeads}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                            Resource Consumption
                          </p>
                          <p className="text-lg font-black italic tracking-tight">
                            {ca.credits_used?.toLocaleString()} / {ca.monthly_budget?.toLocaleString()} TOKENS
                          </p>
                        </div>
                        <p
                          className={cn(
                            "text-[10px] font-black italic",
                            budgetPct > 90 ? "text-destructive" : "text-primary",
                          )}
                        >
                          {budgetPct.toFixed(0)}%
                        </p>
                      </div>
                      <Progress value={budgetPct} className="h-2.5 rounded-full bg-primary/5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="leads" className="animate-in slide-in-from-bottom-4 duration-700">
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-border/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1 max-w-md">
                  <Select value={leadFilter} onValueChange={setLeadFilter}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest bg-muted/20">
                      <Filter className="h-4 w-4 mr-2 text-primary" />
                      <SelectValue placeholder="Protocol Filter" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="all" className="font-bold">
                        GLOBAL REGISTRY
                      </SelectItem>
                      {companyAgents.map((ca) => (
                        <SelectItem key={ca.id} value={ca.id} className="font-bold">
                          {ca.ai_agents?.name} [{ca.companies?.name}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest gap-2"
                    onClick={exportLeadsCSV}
                  >
                    <Download className="h-4 w-4" /> Export Ledger
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-0 divide-y divide-border/10">
                {leads
                  .filter((l) => leadFilter === "all" || l.company_agent_id === leadFilter)
                  .map((lead) => {
                    const agent = companyAgents.find((ca) => ca.id === lead.company_agent_id);
                    return (
                      <div
                        key={lead.id}
                        className="p-8 hover:bg-primary/[0.02] transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-6">
                          <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center border-2 border-border/20 shadow-inner group-hover:rotate-3 transition-transform">
                            <UserCheck className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-black uppercase tracking-tight italic leading-none group-hover:text-primary transition-colors">
                              {lead.lead_name || "ANONYMOUS_ENTITY"}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                              <span>{lead.lead_email}</span>
                              {lead.lead_phone && (
                                <>
                                  {" "}
                                  <span className="h-1 w-1 rounded-full bg-border" />{" "}
                                  <span>{lead.lead_phone}</span>{" "}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-12">
                          <div className="hidden md:flex flex-col items-end">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 italic">
                              Ingested Via
                            </p>
                            <p className="text-xs font-black uppercase tracking-tighter italic">
                              {agent?.ai_agents?.name}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              "rounded-lg font-black text-[9px] uppercase tracking-widest px-4 py-1.5 border-none",
                              lead.status === "new" ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {lead.status || "IDLE"}_LOG
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[32px] border-4 border-destructive/20 bg-background/95 p-8 shadow-2xl">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
              Purge Artifact?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground italic leading-relaxed">
              System warning: Purging this sponsored node will permanently terminate all associated logic chains and
              token history. This cycle cannot be reverted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="rounded-xl font-black uppercase text-[10px] tracking-widest border-2 h-12 px-8">
              Decline Purge
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteAgentMutation.mutate(deleteTarget)}
              className="bg-destructive text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-10 hover:bg-destructive/90"
            >
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Partnership Terminal: Authorized Access Only
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Protocol: B2B Intel Registry v2.6.4
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
