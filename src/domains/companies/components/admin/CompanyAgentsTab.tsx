import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCompaniesForAgentPicker,
  listCompanyAgentsFull,
  listCompanyAgentLeads,
  insertAiAgent,
  insertCompanyAgent,
  updateAiAgentActive,
  updateCompanyAgentActive,
  deleteAiAgent,
  deleteCompanyAgentById,
} from "@/domains/companies/repo/companiesRepo";
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
 * Platform Logic: Company Assistants Management Hub
 * High-fidelity orchestrator for sponsored AI assistants and partner lead tracking.
 * 2024 Standard: Highly professional SAAS UI with clean business labels.
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
  { value: "full", label: "Full Subsidy", description: "Company pays all usage credits" },
  { value: "partial", label: "Partial Subsidy", description: "Company subsidizes user credits" },
  { value: "branded", label: "Branded Only", description: "User pays, company branding visible" },
];

const AGENT_CATEGORIES = [
  { value: "career", label: "Career & Matching" },
  { value: "finance", label: "Finance & Accounts" },
  { value: "education", label: "Training & Education" },
  { value: "wellness", label: "Professional Wellness" },
  { value: "industry", label: "Industry Specific" },
];

const LEAD_FIELDS = [
  { value: "name", label: "Full Name" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
  { value: "company", label: "Current Company" },
  { value: "interest", label: "Area of Interest" },
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
    queryFn: async () => (await listCompaniesForAgentPicker()) as Company[],
  });

  const { data: companyAgents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["company-agents"],
    queryFn: async () => (await listCompanyAgentsFull()) as CompanyAgent[],
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["company-agent-leads"],
    queryFn: async () => (await listCompanyAgentLeads()) as Lead[],
  });

  const createAgentMutation = useMutation({
    mutationFn: async (data: typeof formData & { company_id: string }) => {
      const agentKey = `${data.name.toLowerCase().replace(/\s+/g, "-")}-${selectedCompany.slice(0, 8)}`;
      const newAgent = await insertAiAgent({
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
      });

      await insertCompanyAgent({
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
      return newAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("AI Assistant successfully deployed for corporate partner.");
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
      await updateAiAgentActive(agentId, isActive);
      await updateCompanyAgentActive(companyAgentId, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Assistant status updated.");
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async ({ agentId, companyAgentId }: { agentId: string; companyAgentId: string }) => {
      await deleteCompanyAgentById(companyAgentId);
      await deleteAiAgent(agentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Assistant profile successfully removed.");
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

  const exportLeadsCSV = () => {
    const filtered = leadFilter === "all" ? leads : leads.filter((l) => l.company_agent_id === leadFilter);
    if (filtered.length === 0) {
      toast.error("No lead data available to export.");
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
    toast.success("Leads record successfully exported");
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
            <Skeleton key={i} className="h-28 rounded-2xl bg-muted/40" />
          ))}
        </div>
        <Skeleton className="h-[600px] w-full rounded-2xl bg-muted/40" />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 text-left">
          <h2 className="text-4xl font-semibold uppercase tracking-tight italic leading-none text-foreground">Workspace Assistants</h2>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Manage corporate-sponsored AI tools and candidate matching activities
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-12 px-8 font-semibold uppercase text-xs shadow-sm transition-all hover:scale-105 active:scale-95">
              <Plus className="h-4 w-4 mr-2" /> Assign New Assistant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl rounded-2xl border-4 border-border/40 bg-background/95 p-0 overflow-hidden shadow-sm">
            <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
            <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar text-left">
              <DialogHeader className="mb-8">
                <div className="flex items-center gap-4">
                  <Terminal className="h-8 w-8 text-primary" />
                  <div className="space-y-1">
                    <DialogTitle className="text-3xl font-semibold uppercase tracking-tight italic">
                      Configure Corporate Assistant
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium text-muted-foreground/60">
                      Setup custom AI behaviors for an employer account
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-10 py-2">
                <div className="space-y-4">
                  <Label className="text-[10px] font-semibold text-primary ml-2">
                    Associated Employer Account *
                  </Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger className="h-10 rounded-xl border font-bold bg-muted/20">
                      <SelectValue placeholder="Select target employer..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border text-left">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id} className="font-bold">
                          {company.name} [{company.industry?.toUpperCase() || "GENERAL"}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Spacer label="Assistant Name *" className="text-[10px] font-semibold text-primary ml-1" />
                      <Input
                        placeholder="e.g., Technical Interview Advisor"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12 rounded-xl border font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-semibold text-primary ml-1">
                        Core Focus Area
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                      >
                        <SelectTrigger className="h-12 rounded-xl border font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border">
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
                      <Label className="text-[10px] font-semibold text-primary ml-1">
                        Short Description *
                      </Label>
                      <Input
                        placeholder="Brief statement of purpose..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="h-12 rounded-xl border italic font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-semibold text-primary ml-1">
                        Expertise & Skills
                      </Label>
                      <Input
                        placeholder="e.g. JavaScript, AWS, System Architecture"
                        value={formData.expertise_areas}
                        onChange={(e) => setFormData({ ...formData, expertise_areas: e.target.value })}
                        className="h-12 rounded-xl border"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-semibold text-primary ml-2">
                    Core System Prompt & Instructions *
                  </Label>
                  <Textarea
                    placeholder="Define assistant instructions, persona guidelines, and response guardrails..."
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    rows={6}
                    className="rounded-2xl border bg-muted/5 font-mono text-sm p-6 italic"
                  />
                </div>

                <div className="p-8 rounded-2xl border bg-muted/10 space-y-8 shadow-inner">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary italic border-b border-border/10 pb-4 flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4" /> Credit & Budgetary Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-semibold opacity-40 ml-1">
                        Sponsorship Tier
                      </Label>
                      <Select
                        value={formData.sponsorship_type}
                        onValueChange={(v) => setFormData({ ...formData, sponsorship_type: v })}
                      >
                        <SelectTrigger className="h-12 rounded-xl border font-bold bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border">
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
                      <Label className="text-[10px] font-semibold opacity-40 ml-1">
                        Monthly Credit Allocations
                      </Label>
                      <Input
                        type="number"
                        value={formData.monthly_budget}
                        onChange={(e) => setFormData({ ...formData, monthly_budget: parseInt(e.target.value) || 0 })}
                        className="h-12 rounded-xl border font-semibold text-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-2xl border bg-primary/5 border-primary/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold uppercase tracking-tight italic">Lead Generation Preferences</h4>
                      <p className="text-[9px] font-bold text-muted-foreground italic">
                        Gather candidate profile details during user conversation paths
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
                        <Label className="text-[10px] font-semibold opacity-40">
                          Required Candidate Info
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
                                className="text-[10px] font-semibold cursor-pointer"
                              >
                                {f.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-semibold opacity-40 ml-1">
                          Notification Routing Email
                        </Label>
                        <Input
                          type="email"
                          placeholder="recruitment@company.com"
                          value={formData.lead_notification_email}
                          onChange={(e) => setFormData({ ...formData, lead_notification_email: e.target.value })}
                          className="h-12 rounded-xl border"
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
                  className="h-14 px-8 font-semibold uppercase text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createAgentMutation.mutate({ ...formData, company_id: selectedCompany })}
                  disabled={createAgentMutation.isPending || !selectedCompany || !formData.name.trim()}
                  className="h-10 px-4 rounded-xl font-semibold text-[11px] shadow-sm"
                >
                  {createAgentMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  {createAgentMutation.isPending ? "Deploying..." : "Save and Deploy"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Partnership Dashboard HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Active Assistants",
            val: activeNodes,
            icon: Activity,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Total Conversations",
            val: totalInteractions,
            icon: MessageSquare,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Sourced Candidates",
            val: totalLeads,
            icon: UserCheck,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
          },
          {
            label: "Total Sponsored Budget",
            val: totalBudget.toLocaleString(),
            icon: Coins,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
          >
            <CardContent className="p-6 flex items-center gap-5">
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                  stat.bg,
                  "border-white/5",
                )}
              >
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-semibold text-muted-foreground/40 mb-1 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold tracking-tight italic leading-none text-foreground">{stat.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Operational Viewport */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/30 rounded-xl border border-border/60 p-1 mb-8 w-full max-w-md">
          <TabsTrigger
            value="agents"
            className="flex-1 rounded-[18px] font-semibold uppercase text-xs py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            Assigned Assistants ({totalAgents})
          </TabsTrigger>
          <TabsTrigger
            value="leads"
            className="flex-1 rounded-[18px] font-semibold uppercase text-xs py-3 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            Candidate Referrals ({totalLeads})
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
                    "rounded-2xl border border-border/40 bg-card overflow-hidden transition-all duration-500 hover:border-primary/40 group text-left",
                    !ca.is_active && "opacity-60 grayscale-[0.5]",
                  )}
                >
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-5">
                        <div
                          className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner",
                            ca.ai_agents?.bg_color || "bg-primary/10",
                            "border-white/5",
                          )}
                        >
                          <Bot className={cn("h-7 w-7", ca.ai_agents?.color || "text-primary")} />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-2xl font-semibold uppercase tracking-tight italic leading-none text-foreground">
                            {ca.ai_agents?.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 border border-primary/20">
                              <AvatarImage src={ca.companies?.logo_url || ""} />
                              <AvatarFallback className="text-[8px] font-semibold">
                                {ca.companies?.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-semibold text-muted-foreground/60 italic">
                              {ca.companies?.name}
                            </span>
                            <BadgeCheck className="h-3 w-3 text-blue-500" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={ca.is_active ?? false}
                          aria-label="Toggle assistant active status"
                          onCheckedChange={(v) =>
                            ca.ai_agents &&
                            toggleAgentMutation.mutate({ agentId: ca.ai_agents.id, companyAgentId: ca.id, isActive: v })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Remove assistant assignment"
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
                        className="rounded-lg border font-semibold text-[9px] bg-background px-3 py-1 uppercase"
                      >
                        {ca.sponsorship_type || "Branded"} Tier
                      </Badge>
                      <div className="flex items-center gap-4 ml-auto text-muted-foreground/60 font-semibold uppercase text-[9px] tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-3 w-3" /> {ca.ai_agents?.total_conversations || 0} Chats
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="h-3 w-3" /> {agentLeads} Candidates
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[9px] font-semibold text-muted-foreground/40 italic uppercase">
                            Budget & Credit Consumption
                          </p>
                          <p className="text-lg font-semibold tracking-tight text-foreground">
                            {ca.credits_used?.toLocaleString()} / {ca.monthly_budget?.toLocaleString()} Credits Used
                          </p>
                        </div>
                        <p
                          className={cn(
                            "text-[10px] font-semibold",
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
          <Card className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <CardHeader className="p-8 border-b border-border/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1 max-w-md">
                  <Select value={leadFilter} onValueChange={setLeadFilter}>
                    <SelectTrigger className="h-12 rounded-xl border font-semibold uppercase text-xs bg-muted/20">
                      <Filter className="h-4 w-4 mr-2 text-primary" />
                      <SelectValue placeholder="Filter by assistant" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border text-left">
                      <SelectItem value="all" className="font-bold">
                        ALL PARTNER PROFILES
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
                    className="h-12 rounded-xl border font-semibold uppercase text-xs gap-2"
                    onClick={exportLeadsCSV}
                  >
                    <Download className="h-4 w-4" /> Export Spreadsheet
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
                          <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/40 shadow-inner group-hover:rotate-3 transition-transform">
                            <UserCheck className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                          <div className="space-y-1 text-left">
                            <p className="text-lg font-semibold uppercase tracking-tight italic leading-none group-hover:text-primary transition-colors text-foreground">
                              {lead.lead_name || "General User"}
                            </p>
                            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground/60 italic">
                              <span>{lead.lead_email}</span>
                              {lead.lead_phone && (
                                <>
                                  <span className="h-1 w-1 rounded-full bg-border" />
                                  <span>{lead.lead_phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-12">
                          <div className="hidden md:flex flex-col items-end">
                            <p className="text-[9px] font-semibold text-muted-foreground/30 italic uppercase">
                              Acquired Via
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-tight italic text-foreground">
                              {agent?.ai_agents?.name}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              "rounded-lg font-black text-[9px] px-4 py-1.5 border-none",
                              lead.status === "new" ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {lead.status === "new" ? "NEW LEAD" : "PROCESSED"}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border border-destructive/30 bg-background/95 p-8 shadow-sm text-left">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-semibold uppercase tracking-tight italic">
              Remove Assistant Assignment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground italic leading-relaxed">
              Are you sure you want to delete this corporate partner assistant configuration? This action will permanently stop all active usage paths and clear recent usage metrics. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="rounded-xl font-semibold uppercase text-xs border h-12 px-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteAgentMutation.mutate(deleteTarget)}
              className="bg-destructive text-white rounded-xl font-semibold uppercase text-xs h-12 px-10 hover:bg-destructive/90"
            >
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1 text-left">
          <p className="text-[9px] font-semibold uppercase tracking-[0.4em] italic">
            Corporate Partner Portal · Admin Console
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase">
            Platform Access Authorized Only
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

// Inline helper for explicit element spacing and typing
function Spacer({ label, className }: { label: string; className?: string }) {
  return <Label className={className}>{label}</Label>;
}