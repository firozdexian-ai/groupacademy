import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Building2, Bot, Coins, BadgeCheck, Trash2, Users, MessageSquare, Download, Filter, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Fetch companies
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["companies-for-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, logo_url, industry")
        .order("name");
      if (error) throw error;
      return data as Company[];
    },
  });

  // Fetch company agents with related data
  const { data: companyAgents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["company-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_agents")
        .select(`
          *,
          ai_agents (
            id, name, description, agent_key, icon, color, bg_color, 
            credit_cost, category, is_active, total_conversations, expertise_areas
          ),
          companies (id, name, logo_url, industry)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CompanyAgent[];
    },
  });

  // Fetch leads
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

  // Create new sponsored agent
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
          expertise_areas: data.expertise_areas.split(",").map(s => s.trim()).filter(Boolean),
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

      const leadConfig = {
        enabled: data.lead_enabled,
        fields: data.lead_fields,
        notification_email: data.lead_notification_email || null,
      };

      const { error: linkError } = await supabase
        .from("company_agents")
        .insert({
          agent_id: newAgent.id,
          company_id: data.company_id,
          sponsorship_type: data.sponsorship_type,
          monthly_budget: data.monthly_budget,
          credits_used: 0,
          is_active: true,
          lead_config: leadConfig,
        });

      if (linkError) throw linkError;
      return newAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Company agent created successfully!");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create agent");
    },
  });

  // Toggle agent active status
  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, companyAgentId, isActive }: { agentId: string; companyAgentId: string; isActive: boolean }) => {
      await supabase.from("ai_agents").update({ is_active: isActive }).eq("id", agentId);
      const { error } = await supabase.from("company_agents").update({ is_active: isActive }).eq("id", companyAgentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Agent status updated");
    },
    onError: () => toast.error("Failed to update agent status"),
  });

  // Delete agent
  const deleteAgentMutation = useMutation({
    mutationFn: async ({ agentId, companyAgentId }: { agentId: string; companyAgentId: string }) => {
      await supabase.from("company_agents").delete().eq("id", companyAgentId);
      const { error } = await supabase.from("ai_agents").delete().eq("id", agentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Agent deleted");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete agent");
      setDeleteTarget(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "", description: "", system_prompt: "", expertise_areas: "",
      category: "finance", credit_cost: 10, sponsorship_type: "branded",
      monthly_budget: 1000, lead_enabled: false, lead_fields: ["name", "email"],
      lead_notification_email: "",
    });
    setSelectedCompany("");
  };

  const handleSubmit = () => {
    if (!selectedCompany) { toast.error("Please select a company"); return; }
    if (!formData.name || !formData.description || !formData.system_prompt) { toast.error("Please fill all required fields"); return; }
    createAgentMutation.mutate({ ...formData, company_id: selectedCompany });
  };

  const exportLeadsCSV = () => {
    const filtered = leadFilter === "all" ? leads : leads.filter(l => l.company_agent_id === leadFilter);
    if (filtered.length === 0) { toast.error("No leads to export"); return; }
    const headers = ["Name", "Email", "Phone", "Company", "Interest", "Status", "Date"];
    const rows = filtered.map(l => [
      l.lead_name || "", l.lead_email || "", l.lead_phone || "",
      l.lead_company || "", l.lead_interest || "", l.status || "",
      l.created_at ? new Date(l.created_at).toLocaleDateString() : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "company-agent-leads.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported!");
  };

  const toggleLeadField = (field: string) => {
    setFormData(prev => ({
      ...prev,
      lead_fields: prev.lead_fields.includes(field)
        ? prev.lead_fields.filter(f => f !== field)
        : [...prev.lead_fields, field],
    }));
  };

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  // Stats
  const totalAgents = companyAgents.length;
  const activeAgents = companyAgents.filter(a => a.is_active).length;
  const totalBudget = companyAgents.reduce((sum, a) => sum + (a.monthly_budget || 0), 0);
  const totalLeads = leads.length;
  const totalConversations = companyAgents.reduce((sum, a) => sum + (a.ai_agents?.total_conversations || 0), 0);

  if (loadingAgents || loadingCompanies) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Company Agents</h2>
          <p className="text-xs text-muted-foreground">B2B sponsored agents & lead generation</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Agent</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sponsored Agent</DialogTitle>
              <DialogDescription>Create a new AI agent sponsored by a partner company</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Company Selection */}
              <div className="space-y-2">
                <Label>Sponsoring Company *</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={company.logo_url || ""} />
                            <AvatarFallback className="text-[10px]">{company.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{company.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompanyData && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedCompanyData.logo_url || ""} />
                        <AvatarFallback>{selectedCompanyData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm flex items-center gap-1">
                          {selectedCompanyData.name}
                          <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
                        </p>
                        <p className="text-xs text-muted-foreground">{selectedCompanyData.industry || "Company"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Agent Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Agent Name *</Label>
                  <Input placeholder="e.g., Financial Advisor" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AGENT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Description *</Label>
                <Input placeholder="Brief description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Expertise Areas (comma-separated)</Label>
                <Input placeholder="e.g., Personal Loans, Savings" value={formData.expertise_areas} onChange={e => setFormData({ ...formData, expertise_areas: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">System Prompt *</Label>
                <Textarea placeholder="Define personality, expertise, response style..." value={formData.system_prompt} onChange={e => setFormData({ ...formData, system_prompt: e.target.value })} rows={5} />
              </div>

              {/* Sponsorship Settings */}
              <div className="border-t pt-3 space-y-3">
                <h4 className="font-medium text-sm">Sponsorship Settings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sponsorship Type</Label>
                    <Select value={formData.sponsorship_type} onValueChange={v => setFormData({ ...formData, sponsorship_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPONSORSHIP_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div><p>{type.label}</p><p className="text-xs text-muted-foreground">{type.description}</p></div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Credit Cost (per session)</Label>
                    <Input type="number" min={0} value={formData.credit_cost} onChange={e => setFormData({ ...formData, credit_cost: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly Credit Budget</Label>
                  <Input type="number" min={0} value={formData.monthly_budget} onChange={e => setFormData({ ...formData, monthly_budget: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              {/* Lead Capture Settings */}
              <div className="border-t pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Lead Capture</h4>
                    <p className="text-xs text-muted-foreground">Collect contact info during chats</p>
                  </div>
                  <Switch checked={formData.lead_enabled} onCheckedChange={v => setFormData({ ...formData, lead_enabled: v })} />
                </div>

                {formData.lead_enabled && (
                  <div className="space-y-3 pl-1">
                    <div className="space-y-2">
                      <Label className="text-xs">Fields to Collect</Label>
                      <div className="flex flex-wrap gap-3">
                        {LEAD_FIELDS.map(f => (
                          <div key={f.value} className="flex items-center gap-1.5">
                            <Checkbox
                              id={`lead-${f.value}`}
                              checked={formData.lead_fields.includes(f.value)}
                              onCheckedChange={() => toggleLeadField(f.value)}
                            />
                            <label htmlFor={`lead-${f.value}`} className="text-xs cursor-pointer">{f.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Notification Email</Label>
                      <Input type="email" placeholder="leads@company.com" value={formData.lead_notification_email} onChange={e => setFormData({ ...formData, lead_notification_email: e.target.value })} />
                      <p className="text-[10px] text-muted-foreground">Where captured leads will be sent</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createAgentMutation.isPending}>
                {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md"><Building2 className="h-3.5 w-3.5 text-primary" /></div>
            <div>
              <p className="text-lg font-bold leading-none">{totalAgents}</p>
              <p className="text-xs text-muted-foreground">Agents</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-md"><Bot className="h-3.5 w-3.5 text-green-600" /></div>
            <div>
              <p className="text-lg font-bold leading-none">{activeAgents}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-md"><MessageSquare className="h-3.5 w-3.5 text-amber-600" /></div>
            <div>
              <p className="text-lg font-bold leading-none">{totalConversations}</p>
              <p className="text-xs text-muted-foreground">Chats</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded-md"><UserCheck className="h-3.5 w-3.5 text-purple-600" /></div>
            <div>
              <p className="text-lg font-bold leading-none">{totalLeads}</p>
              <p className="text-xs text-muted-foreground">Leads</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs: Agents + Leads */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="agents" className="flex-1 text-xs">Agents ({totalAgents})</TabsTrigger>
          <TabsTrigger value="leads" className="flex-1 text-xs">Leads ({totalLeads})</TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="mt-3">
          {companyAgents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-medium text-sm mb-1">No Sponsored Agents Yet</h3>
                <p className="text-xs text-muted-foreground mb-3">Create your first company-sponsored agent</p>
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Create Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {companyAgents.map(ca => {
                const budgetPct = Math.min(100, ((ca.credits_used || 0) / (ca.monthly_budget || 1)) * 100);
                const leadConfig = ca.lead_config as any;
                const agentLeadsCount = leads.filter(l => l.company_agent_id === ca.id).length;

                return (
                  <Card key={ca.id} className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Agent icon */}
                      <div className={`p-2 rounded-lg shrink-0 ${ca.ai_agents?.bg_color || "bg-primary/10"}`}>
                        <Bot className={`h-4 w-4 ${ca.ai_agents?.color || "text-primary"}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{ca.ai_agents?.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={ca.companies?.logo_url || ""} />
                                <AvatarFallback className="text-[8px]">{ca.companies?.name?.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground truncate">{ca.companies?.name}</span>
                              <BadgeCheck className="h-3 w-3 text-blue-500 shrink-0" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Switch
                              checked={ca.is_active ?? false}
                              onCheckedChange={(checked) =>
                                ca.ai_agents && toggleAgentMutation.mutate({
                                  agentId: ca.ai_agents.id, companyAgentId: ca.id, isActive: checked,
                                })
                              }
                            />
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => ca.ai_agents && setDeleteTarget({ agentId: ca.ai_agents.id, companyAgentId: ca.id })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Metrics row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          <Badge variant="outline" className="text-[10px] capitalize h-5">{ca.sponsorship_type || "branded"}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ca.ai_agents?.total_conversations || 0}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            {agentLeadsCount}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            {(ca.credits_used || 0).toLocaleString()}/{(ca.monthly_budget || 0).toLocaleString()}
                          </span>
                          {leadConfig?.enabled && (
                            <Badge variant="secondary" className="text-[10px] h-5">Lead Capture</Badge>
                          )}
                        </div>

                        {/* Budget bar */}
                        <Progress value={budgetPct} className="h-1 mt-2" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <Select value={leadFilter} onValueChange={setLeadFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {companyAgents.map(ca => (
                  <SelectItem key={ca.id} value={ca.id}>
                    {ca.ai_agents?.name} — {ca.companies?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={exportLeadsCSV}>
              <Download className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>

          {loadingLeads ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : leads.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-medium text-sm mb-1">No Leads Yet</h3>
                <p className="text-xs text-muted-foreground">Leads will appear here when agents capture contact info during chats</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {(leadFilter === "all" ? leads : leads.filter(l => l.company_agent_id === leadFilter)).map(lead => {
                const agent = companyAgents.find(ca => ca.id === lead.company_agent_id);
                return (
                  <Card key={lead.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{lead.lead_name || "Unknown"}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          {lead.lead_email && <span className="text-xs text-muted-foreground">{lead.lead_email}</span>}
                          {lead.lead_phone && <span className="text-xs text-muted-foreground">{lead.lead_phone}</span>}
                        </div>
                        {lead.lead_interest && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Interest: {lead.lead_interest}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          {agent && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Bot className="h-2.5 w-2.5" />
                              {agent.ai_agents?.name}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </div>
                      <Badge variant={lead.status === "new" ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {lead.status || "new"}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the sponsored agent and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteAgentMutation.mutate(deleteTarget)}
            >
              {deleteAgentMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
