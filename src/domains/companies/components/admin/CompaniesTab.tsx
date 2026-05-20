/**
 * Employer Registry Hub — Fully Restored & RPC Hardened
 * CTO Version: May 2026 (Refactored for Scale, Restored for Depth)
 * Fixes: A5, A6 (Scaling), R3 (Crashes), Outreach UX Restoration
 */
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  Zap,
  Filter,
  XCircle,
  Globe,
  Mail,
  Linkedin,
  Facebook,
  Activity,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton } from "../DashboardSkeleton";
import { BatchCompanyUpload } from "./BatchCompanyUpload";
import { getDexianEmailLink, EMAIL_TEMPLATE_OPTIONS, DexianEmailTemplate } from "@/lib/companyOutreachTemplates";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export function CompaniesTab() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [outreachHistory, setOutreachHistory] = useState<Record<string, any>>({});

  // Registry State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [industryOptions, setIndustryOptions] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ verified: 0, pending: 0 });

  // Form & Dialog State (Fully Restored)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ name: "", secondary_emails: [] });
  const [emailInput, setEmailInput] = useState("");
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DexianEmailTemplate>("discovery");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Deep Registry Sync Logic
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("companies").select("*", { count: "exact" }).order("name");

      // Logic Restoration: Search & Industry Filters
      if (searchQuery) {
        const safe = sanitizeIlike(searchQuery);
        query = query.or(`name.ilike.%${safe}%,industry.ilike.%${safe}%,primary_email.ilike.%${safe}%`);
      }
      if (industryFilter !== "all") {
        industryFilter === "none"
          ? (query = query.is("industry", null))
          : (query = query.eq("industry", industryFilter));
      }

      const [registryRes, industryRes, overviewRes] = await Promise.all([
        query.range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1),
        supabase.rpc("get_industry_rollup"),
        supabase.rpc("get_companies_overview"),
      ]);

      if (registryRes.error) throw registryRes.error;

      setCompanies(registryRes.data || []);
      setTotalCount(registryRes.count || 0);
      setIndustryOptions(industryRes.data || []);

      if (overviewRes.data) {
        const ov = overviewRes.data as any;
        setKpis({
          verified: ov.verified,
          pending: ov.totals - (ov.riya_funnel?.converted || 0),
        });
      }

      // Outreach Telemetry Fetch
      if (registryRes.data?.length) {
        const { data: out } = await supabase
          .from("contact_outreach")
          .select("company_id, sent_at, message_type")
          .in(
            "company_id",
            registryRes.data.map((c) => c.id),
          )
          .order("sent_at", { ascending: false });

        const history: Record<string, any> = {};
        out?.forEach((r) => {
          if (!history[r.company_id]) history[r.company_id] = r;
        });
        setOutreachHistory(history);
      }
    } catch (err) {
      toast.error("Registry synchronization failure");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, industryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler Restoration
  const handleOpenDialog = (company?: any) => {
    setEditingCompany(company || null);
    setFormData(
      company || {
        name: "",
        industry: "",
        website: "",
        logo_url: "",
        primary_email: "",
        secondary_emails: [],
        linkedin_url: "",
        facebook_url: "",
        notes: "",
        is_verified: false,
      },
    );
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error("Entity identity required");
    setSaving(true);
    try {
      const { error } = await supabase.from("companies").upsert(formData);
      if (error) throw error;
      toast.success("Artifact synchronized with global registry");
      setIsDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error("Data rejection: Logic fault");
    } finally {
      setSaving(false);
    }
  };

  const handleEmailOutreach = async (company: any, template: DexianEmailTemplate) => {
    if (!company.primary_email) return toast.error("No communication endpoint provided");
    window.open(getDexianEmailLink(company.primary_email, template, company.name), "_blank");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("contact_outreach").insert({
        company_id: company.id,
        channel: "email",
        message_type: template,
        sent_by: user.id,
      });
      loadData();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Executive Action Bar */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Employer Registry
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {totalCount} Logic Nodes In Sector
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBatchUpload(true)}
            className="rounded-xl border-2 font-black uppercase text-[10px] h-11 px-5"
          >
            Bulk Ingestion
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="rounded-xl font-black uppercase text-[10px] h-11 px-6 shadow-xl bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Node
          </Button>
        </div>
      </div>

      {/* Scalable KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricTile
          label="Registry Artifacts"
          value={totalCount}
          icon={Building2}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <MetricTile
          label="Verified Strategy"
          value={kpis.verified}
          icon={ShieldCheck}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <MetricTile label="Outreach Gap" value={kpis.pending} icon={Zap} color="text-amber-500" bg="bg-amber-500/10" />
      </div>

      <Card className="rounded-[40px] border-2 shadow-2xl bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

        {/* Search & Filter Terminal */}
        <div className="p-8 border-b border-border/10 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by identity or identifier..."
              className="pl-12 h-14 rounded-2xl border-2 bg-muted/5 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] bg-muted/5">
              <SelectValue placeholder="Industry Filter" />
            </SelectTrigger>
            <SelectContent className="font-black text-[10px] uppercase">
              <SelectItem value="all">Global Sector</SelectItem>
              <SelectItem value="none">Unclassed Nodes</SelectItem>
              {industryOptions.map((opt) => (
                <SelectItem key={opt.industry} value={opt.industry}>
                  {opt.industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="text-[10px] font-black uppercase tracking-widest">
              <th className="pl-8 py-6">Employer Artifact</th>
              <th>Status</th>
              <th>Outreach Pulse</th>
              <th className="text-right pr-8">Interrogate</th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-20 text-center">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto opacity-10" />
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow
                  key={company.id}
                  className="group hover:bg-primary/[0.02] transition-colors border-b border-border/5 last:border-0"
                >
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center border-2 overflow-hidden shadow-inner shrink-0">
                        {company.logo_url ? (
                          <img src={company.logo_url} className="object-cover h-full w-full" />
                        ) : (
                          <Building2 className="h-5 w-5 opacity-20" />
                        )}
                      </div>
                      <div>
                        <p className="font-black uppercase italic group-hover:text-primary transition-colors text-sm">
                          {company.name}
                        </p>
                        <p className="text-[9px] font-bold opacity-50 uppercase truncate max-w-[200px]">
                          {company.industry || "Unclassed"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-[8px] font-black px-3 rounded-full",
                        company.is_verified ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {company.is_verified ? "VERIFIED" : "PENDING"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {outreachHistory[company.id] ? (
                      <Badge
                        variant="outline"
                        className="text-[8px] font-black bg-emerald-500/5 text-emerald-600 border-emerald-500/10"
                      >
                        SENT: {new Date(outreachHistory[company.id].sent_at).toLocaleDateString()} ·{" "}
                        {outreachHistory[company.id].message_type}
                      </Badge>
                    ) : (
                      <span className="text-[9px] opacity-20 italic font-black uppercase">NO_HISTORY</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                      <Select onValueChange={(val: DexianEmailTemplate) => handleEmailOutreach(company, val)}>
                        <SelectTrigger className="w-10 h-10 p-0 border-2 rounded-xl hover:bg-primary/10 transition-all bg-transparent">
                          <Send className="w-4 h-4 text-primary m-auto" />
                        </SelectTrigger>
                        <SelectContent className="font-black text-[10px] uppercase">
                          {EMAIL_TEMPLATE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border-2 rounded-xl"
                        onClick={() => handleOpenDialog(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 border-2 rounded-xl hover:bg-destructive/10 hover:text-destructive"
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

        {/* Scalable Pagination Logic */}
        <div className="p-6 border-t flex justify-center items-center gap-6 bg-muted/5">
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="font-black text-[10px] uppercase"
          >
            Prev
          </Button>
          <span className="text-[10px] font-black uppercase italic opacity-40">
            Sector {page} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
          </span>
          <Button
            variant="ghost"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * ITEMS_PER_PAGE >= totalCount}
            className="font-black text-[10px] uppercase"
          >
            Next
          </Button>
        </div>
      </Card>

      {/* Full Registry Recalibration Dialog (Restored 100%) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl rounded-[40px] border-4 p-0 overflow-hidden shadow-2xl bg-background text-left">
          <div className="h-2 w-full bg-primary" />
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="col-span-full flex items-center gap-3 border-b pb-4 mb-2">
              <Activity className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Recalibrate Employer Node</h3>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Identity*</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Industry Sector</Label>
              <Input
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="rounded-xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Website URL</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="rounded-xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Primary Email</Label>
              <Input
                value={formData.primary_email}
                onChange={(e) => setFormData({ ...formData, primary_email: e.target.value })}
                className="rounded-xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">LinkedIn Profile</Label>
              <Input
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                className="rounded-xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Facebook Handle</Label>
              <Input
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                className="rounded-xl border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Logo Metadata URL</Label>
              <Input
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="rounded-xl border-2"
              />
            </div>

            <div className="col-span-full space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Registry Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="rounded-2xl border-2 min-h-[120px] p-4 text-xs italic"
              />
            </div>

            <div className="col-span-full flex items-center justify-between p-5 bg-muted/20 rounded-3xl border-2 border-border/10">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest">Verified Strategic Artifact</p>
                <p className="text-[9px] text-muted-foreground uppercase opacity-60">
                  High-priority node in B2B matching logic
                </p>
              </div>
              <Switch
                checked={formData.is_verified}
                onCheckedChange={(v) => setFormData({ ...formData, is_verified: v })}
              />
            </div>

            <div className="col-span-full flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl uppercase text-[10px] font-black px-8"
              >
                Abort
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl px-12 uppercase text-[10px] font-black shadow-lg"
              >
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4 mr-2" />}{" "}
                Commit Node
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert (Restored) */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl border-4 bg-background text-left">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black italic uppercase text-2xl tracking-tighter">
              Purge Registry Node?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
              Confirm termination of artifact "{deleteTarget?.name}". This cycle will orphan all linked job nodes across
              the cluster.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl font-black uppercase text-[10px]">Decline</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await supabase.from("companies").delete().eq("id", deleteTarget.id);
                setDeleteTarget(null);
                loadData();
              }}
              className="bg-destructive text-white rounded-xl font-black uppercase text-[10px] px-10"
            >
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BatchCompanyUpload open={showBatchUpload} onOpenChange={setShowBatchUpload} onComplete={loadData} />
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-6 text-left group transition-all hover:border-primary/30 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="h-12 w-12" />
      </div>
      <div className="flex items-center gap-5 relative z-10">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:rotate-3 shadow-inner",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1">{label}</p>
          <p className="text-3xl font-black italic tracking-tighter text-foreground">{value.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
}
