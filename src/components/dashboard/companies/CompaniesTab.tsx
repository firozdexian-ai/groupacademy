import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  RefreshCw,
  Upload,
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldCheck,
  Activity,
  Filter,
  Zap,
  XCircle,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton } from "../DashboardSkeleton";
import { BatchCompanyUpload } from "./BatchCompanyUpload";
import { getDexianEmailLink, EMAIL_TEMPLATE_OPTIONS, DexianEmailTemplate } from "@/lib/companyOutreachTemplates";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Employer Registry Hub
 * High-fidelity orchestrator for corporate data synthesis and outreach telemetry.
 * 2024 Standard: Executive Logic geometry with reinforced type-safe ingestion.
 */

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  website: string | null;
  primary_email: string | null;
  secondary_emails: string[];
  linkedin_url: string | null;
  facebook_url: string | null;
  notes: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

const emptyCompany = {
  name: "",
  logo_url: "",
  industry: "",
  website: "",
  primary_email: "",
  secondary_emails: [] as string[],
  linkedin_url: "",
  facebook_url: "",
  notes: "",
  is_verified: false,
};

const ITEMS_PER_PAGE = 10;

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function CompaniesManager() {
  const [, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [outreachHistory, setOutreachHistory] = useState<
    Record<string, { last_sent: string; template: string } | null>
  >({});

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [industryFilter, setIndustryFilter] = useState("all");
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState(emptyCompany);
  const [saving, setSaving] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DexianEmailTemplate>("discovery");
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const [kpiVerified, setKpiVerified] = useState(0);
  const [kpiNeverContacted, setKpiNeverContacted] = useState(0);

  const loadRegistryData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      let query = supabase.from("companies").select("*", { count: "exact" }).order("name");

      if (debouncedSearch) {
        const safe = sanitizeIlike(debouncedSearch);
        if (safe) {
          query = query.or(`name.ilike.%${safe}%,industry.ilike.%${safe}%,primary_email.ilike.%${safe}%`);
        }
      }

      if (industryFilter === "none") {
        query = query.is("industry", null);
      } else if (industryFilter !== "all") {
        query = query.eq("industry", industryFilter);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Registry link timeout");

      if (result.error) throw result.error;

      // Type Guard & Handshake: Transforming Json[] from DB to strictly validated string[]
      const mappedCompanies: Company[] = (result.data || []).map((company: any) => ({
        ...company,
        secondary_emails: Array.isArray(company.secondary_emails)
          ? company.secondary_emails.map((e: any) => String(e))
          : [],
      }));

      setCompanies(mappedCompanies);
      setTotalCount(result.count || 0);
    } catch (error: any) {
      setLoadError(error.message || "Registry Sync Failed");
      toast.error("Transmission Error: Sync failure");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, industryFilter]);

  const loadKPIs = async () => {
    const [verifiedRes, outreachRes] = await Promise.all([
      supabase.from("companies").select("id", { count: "exact", head: true }).eq("is_verified", true),
      supabase.from("contact_outreach").select("company_id"),
    ]);
    setKpiVerified(verifiedRes.count || 0);
    const contactedIds = new Set((outreachRes.data || []).map((r: any) => r.company_id).filter(Boolean));
    const totalRes = await supabase.from("companies").select("id", { count: "exact", head: true });
    setKpiNeverContacted((totalRes.count || 0) - contactedIds.size);
  };

  const loadIndustryOptions = async () => {
    const { data } = await supabase.from("companies").select("industry");
    const unique = [...new Set((data || []).map((c: any) => c.industry?.trim()).filter(Boolean))] as string[];
    unique.sort((a, b) => a.localeCompare(b));
    setIndustryOptions(unique);
  };

  const loadOutreachTelemetry = useCallback(async (companyIds: string[]) => {
    if (companyIds.length === 0) return;
    try {
      const { data } = await supabase
        .from("contact_outreach")
        .select("company_id, sent_at, message_type")
        .in("company_id", companyIds)
        .order("sent_at", { ascending: false });
      const historyMap: Record<string, { last_sent: string; template: string } | null> = {};
      data?.forEach((record) => {
        if (record.company_id && !historyMap[record.company_id]) {
          historyMap[record.company_id] = { last_sent: record.sent_at, template: record.message_type || "unknown" };
        }
      });
      setOutreachHistory(historyMap);
    } catch (err) {
      console.error("Telemetry sync error:", err);
    }
  }, []);

  useEffect(() => {
    loadRegistryData();
    loadKPIs();
    loadIndustryOptions();
  }, [loadRegistryData]);
  useEffect(() => {
    if (companies.length > 0) loadOutreachTelemetry(companies.map((c) => c.id));
  }, [companies, loadOutreachTelemetry]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, industryFilter]);

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        logo_url: company.logo_url || "",
        industry: company.industry || "",
        website: company.website || "",
        primary_email: company.primary_email || "",
        secondary_emails: company.secondary_emails || [],
        linkedin_url: company.linkedin_url || "",
        facebook_url: company.facebook_url || "",
        notes: company.notes || "",
        is_verified: company.is_verified,
      });
    } else {
      setEditingCompany(null);
      setFormData(emptyCompany);
    }
    setIsDialogOpen(true);
  };

  const handleAddEmail = () => {
    if (emailInput.trim() && !formData.secondary_emails.includes(emailInput.trim())) {
      setFormData((prev) => ({ ...prev, secondary_emails: [...prev.secondary_emails, emailInput.trim()] }));
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData((prev) => ({ ...prev, secondary_emails: prev.secondary_emails.filter((e) => e !== email) }));
  };

  const handleSaveHandshake = async () => {
    if (!formData.name.trim()) return toast.error("Logic Fault: Company name required");
    setSaving(true);
    try {
      const companyData = {
        name: formData.name.trim(),
        logo_url: formData.logo_url?.trim() || null,
        industry: formData.industry?.trim() || null,
        website: formData.website?.trim() || null,
        primary_email: formData.primary_email?.trim() || null,
        secondary_emails: formData.secondary_emails,
        linkedin_url: formData.linkedin_url?.trim() || null,
        facebook_url: formData.facebook_url?.trim() || null,
        notes: formData.notes?.trim() || null,
        is_verified: formData.is_verified,
      };

      const { error } = editingCompany
        ? await withTimeout(
            Promise.resolve(supabase.from("companies").update(companyData).eq("id", editingCompany.id)),
            TIMEOUTS.DEFAULT,
            "Recalibration timeout",
          )
        : await withTimeout(
            Promise.resolve(supabase.from("companies").insert(companyData)),
            TIMEOUTS.DEFAULT,
            "Artifact injection timeout",
          );

      if (error) throw error;
      toast.success("Registry Synchronized");
      setIsDialogOpen(false);
      loadRegistryData();
    } catch (err) {
      toast.error("Handshake Failed: Immutable node error");
    } finally {
      setSaving(false);
    }
  };

  const handlePurgeArtifact = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await withTimeout(
        Promise.resolve(supabase.from("jobs").update({ company_id: null }).eq("company_id", id)),
        TIMEOUTS.DEFAULT,
        "Dependency unlink timeout",
      );
      const { error } = await withTimeout(
        Promise.resolve(supabase.from("companies").delete().eq("id", id)),
        TIMEOUTS.DEFAULT,
        "Purge protocol timeout",
      );
      if (error) throw error;
      toast.success("Artifact Purged from Registry");
      loadRegistryData();
    } catch (err) {
      toast.error("Purge Error: Active dependencies locked");
    }
  };

  const handleEmailOutreach = async (company: Company, template: DexianEmailTemplate) => {
    if (!company.primary_email) return toast.error("No communication endpoint available");
    window.open(getDexianEmailLink(company.primary_email, template, company.name), "_blank");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("contact_outreach").insert({
          company_id: company.id,
          channel: "email",
          message_type: template,
          message_content: `Dexian protocol email: ${template} to ${company.name}`,
          sent_by: user.id,
        });
        setOutreachHistory((prev) => ({ ...prev, [company.id]: { last_sent: new Date().toISOString(), template } }));
        toast.success("Outreach Protocol Registered");
      }
    } catch (err) {
      console.error("Log fault:", err);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* HUD: Registry Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Registry Artifacts",
            val: totalCount,
            icon: Building2,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Verified Nodes",
            val: kpiVerified,
            icon: ShieldCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Outreach Pending",
            val: kpiNeverContacted,
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
        ].map((kpi, i) => (
          <Card
            key={i}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
          >
            <CardContent className="p-6 flex items-center gap-6">
              <div
                className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                  kpi.bg,
                  "border-white/5",
                )}
              >
                <kpi.icon className={cn("h-7 w-7", kpi.color)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                  {kpi.label}
                </p>
                <p className="text-3xl font-black tracking-tighter italic leading-none">{kpi.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" /> Employer Registry
              </CardTitle>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                Authorized Corporate Artifacts: {totalCount} Nodes Detected
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadRegistryData()}
                className="rounded-xl h-11 px-5 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <RefreshCw className={cn("w-4 h-4 text-primary", isLoading && "animate-spin")} /> Re-Sync
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBatchUpload(true)}
                className="rounded-xl h-11 px-5 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <Upload className="w-4 h-4" /> Bulk Ingestion
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenDialog()}
                className="rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Node
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="mb-8 flex flex-col md:flex-row gap-4 bg-muted/20 p-4 rounded-[28px] border-2 border-border/40 backdrop-blur-md">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Query registry by name, industry, or identifier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base"
              />
            </div>
            <div className="relative flex items-center">
              <Filter className="absolute left-4 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full md:w-[240px] h-14 pl-11 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                  <SelectValue placeholder="Industry Protocol" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  <SelectItem value="all" className="font-bold">
                    GLOBAL REGISTRY
                  </SelectItem>
                  <SelectItem value="none" className="font-bold">
                    UNCLASSED NODES
                  </SelectItem>
                  {industryOptions.map((ind) => (
                    <SelectItem key={ind} value={ind} className="font-bold uppercase text-[9px]">
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : (
            <div className="rounded-[24px] border-2 border-border/20 overflow-hidden bg-background/50">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8">
                      Company Artifact
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Logic Class</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Registry Sync</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                      Interrogate
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-32 text-muted-foreground/40 italic uppercase tracking-[0.2em] font-black"
                      >
                        No employer nodes detected.
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow key={company.id} className="group transition-all hover:bg-primary/[0.02]">
                        <TableCell className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl border-2 overflow-hidden bg-muted flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                              {company.logo_url ? (
                                <img src={company.logo_url} className="object-cover h-full w-full" />
                              ) : (
                                <Building2 className="h-5 w-5 opacity-20" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors">
                                {company.name}
                              </p>
                              {company.website && (
                                <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest truncate max-w-[150px]">
                                  {company.website.replace("https://", "")}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="rounded-lg border-2 font-black text-[9px] uppercase tracking-widest bg-background"
                          >
                            {company.industry || "UNCLASSED"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {outreachHistory[company.id] ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 rounded-lg font-black text-[8px] border-none px-3">
                              SYNC'D: {getRelativeTime(outreachHistory[company.id]!.last_sent)}
                            </Badge>
                          ) : (
                            <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest italic">
                              NEVER_SENT
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] border-none px-3",
                              company.is_verified
                                ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/10"
                                : "bg-muted text-muted-foreground/60",
                            )}
                          >
                            {company.is_verified ? "VERIFIED" : "PENDING"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <Select
                              value={selectedTemplate}
                              onValueChange={(val: DexianEmailTemplate) => handleEmailOutreach(company, val)}
                            >
                              <SelectTrigger className="w-10 h-10 p-0 border-2 rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center bg-transparent">
                                <Send className="w-4 h-4 text-primary" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-2">
                                {EMAIL_TEMPLATE_OPTIONS.map((opt) => (
                                  <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="font-bold text-[10px] uppercase"
                                  >
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all"
                              onClick={() => handleOpenDialog(company)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                              onClick={() => setDeleteTarget(company)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 mt-10">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft />
              </Button>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                Cycle {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-2"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-10">
              <div className="flex items-center gap-5">
                <Activity className="h-8 w-8 text-primary" />
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                  {editingCompany ? "Recalibrate Node" : "Initialize Employer Node"}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Company Identity *
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12 rounded-xl border-2 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Industry Logic
                    </Label>
                    <Input
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="h-12 rounded-xl border-2"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Website Uplink
                    </Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="h-12 rounded-xl border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Logo Metadata URL
                    </Label>
                    <Input
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      className="h-12 rounded-xl border-2"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Primary Email Endpoint
                  </Label>
                  <Input
                    value={formData.primary_email}
                    onChange={(e) => setFormData({ ...formData, primary_email: e.target.value })}
                    className="h-12 rounded-xl border-2"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Secondary Endpoints
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                      placeholder="Inject additional email..."
                      className="h-12 rounded-xl border-2"
                    />
                    <Button
                      variant="outline"
                      onClick={handleAddEmail}
                      className="h-12 rounded-xl border-2 px-6 font-bold"
                    >
                      ADD
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.secondary_emails.map((email) => (
                      <Badge key={email} variant="secondary" className="px-3 py-1 rounded-lg font-bold">
                        {email}{" "}
                        <XCircle
                          className="ml-2 h-3 w-3 cursor-pointer opacity-40 hover:opacity-100"
                          onClick={() => handleRemoveEmail(email)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Internal Registry Notes
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[120px] rounded-2xl border-2 p-6 italic"
                />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border-2 border-border/10">
                <Switch
                  checked={formData.is_verified}
                  onCheckedChange={(v) => setFormData({ ...formData, is_verified: v })}
                />
                <Label className="text-[10px] font-black uppercase tracking-widest">Verified Strategic Partner</Label>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-border/10">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
                >
                  Abort
                </Button>
                <Button
                  onClick={handleSaveHandshake}
                  disabled={saving}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30"
                >
                  {saving ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  {saving ? "Syncing..." : editingCompany ? "Commit Recalibration" : "Authorize Creation"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[32px] border-4 border-destructive/20 bg-background/95 p-8 shadow-2xl">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
              Purge "{deleteTarget?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground italic leading-relaxed">
              System warning: Purging this artifact will orphan all linked job nodes. This logic cycle cannot be
              reverted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="rounded-xl font-black uppercase text-[10px] tracking-widest border-2 h-12 px-8">
              Decline Purge
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurgeArtifact}
              className="bg-destructive text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-10 hover:bg-destructive/90"
            >
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BatchCompanyUpload open={showBatchUpload} onOpenChange={setShowBatchUpload} onComplete={loadRegistryData} />

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Employer Registry: Secured Management
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Node: Global Companies v2.6.4
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
