/**
 * Employer Registry Hub — Phase Z0 Hardened
 * CTO Version: May 2026
 * Fixes: A5 (Never Contacted KPI Scale), A6 (Industry Dropdown Cap), P2 (Layout)
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [industryOptions, setIndustryOptions] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ verified: 0, pendingOutreach: 0 });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({ name: "", is_verified: false });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // A6 Fix: Use rollup RPC for industry dropdown and total counts
      const [registryRes, industryRes, overviewRes] = await Promise.all([
        supabase
          .from("companies")
          .select("*", { count: "exact" })
          .order("name")
          .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1),
        supabase.rpc("get_industry_rollup"),
        supabase.rpc("get_companies_overview"), // A5 Fix: KPI derived from overview logic
      ]);

      if (registryRes.data) {
        setCompanies(registryRes.data);
        setTotalCount(registryRes.count || 0);
      }
      if (industryRes.data) setIndustryOptions(industryRes.data);

      if (overviewRes.data) {
        setKpis({
          verified: overviewRes.data.verified,
          pendingOutreach: overviewRes.data.totals - (overviewRes.data.riya_funnel?.converted || 0),
        });
      }
    } catch (err) {
      toast.error("Registry sync fault");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!formData.name) return toast.error("Node identity required");
    setSaving(true);
    try {
      const { error } = await supabase.from("companies").upsert(formData);
      if (error) throw error;
      toast.success("Artifact synchronized");
      setIsDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error("Injection failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* P2 Fix: Header Action Row */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Employer Registry
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {totalCount} Corporate Artifacts Detected
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBatchUpload(true)}
            className="rounded-xl border-2 font-black uppercase text-[10px] h-11 px-5"
          >
            <Upload className="h-4 w-4 mr-2" /> Bulk Ingestion
          </Button>
          <Button
            onClick={() => {
              setFormData({ name: "", is_verified: false });
              setIsDialogOpen(true);
            }}
            className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl"
          >
            <Plus className="h-4 w-4" /> Add Node
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricTile
          label="Total Artifacts"
          value={totalCount}
          icon={Building2}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <MetricTile
          label="Verified Nodes"
          value={kpis.verified}
          icon={ShieldCheck}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <MetricTile
          label="Outreach Pending"
          value={kpis.pendingOutreach}
          icon={Zap}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
      </div>

      <Card className="rounded-[40px] border-2 overflow-hidden shadow-2xl bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

        {/* Registry Filters */}
        <div className="p-8 border-b border-border/10 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by identity or identifier..."
              className="pl-12 h-14 rounded-2xl border-2 bg-muted/10 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full md:w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] bg-muted/10">
              <SelectValue placeholder="Protocol: Industry" />
            </SelectTrigger>
            <SelectContent className="font-black text-[10px] uppercase">
              <SelectItem value="all">GLOBAL SECTOR</SelectItem>
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
            <TableRow>
              <TableHead className="pl-8 text-[10px] font-black uppercase py-6">Company Artifact</TableHead>
              <TableHead className="text-[10px] font-black uppercase">Industry Class</TableHead>
              <TableHead className="text-[10px] font-black uppercase">Registry Status</TableHead>
              <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Interrogate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-20 text-center">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" />
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id} className="group hover:bg-primary/[0.02]">
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center border-2 overflow-hidden">
                        {company.logo_url ? (
                          <img src={company.logo_url} className="object-cover" />
                        ) : (
                          <Building2 className="h-5 w-5 opacity-20" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase italic group-hover:text-primary transition-colors">
                          {company.name}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">
                          {company.website || "No endpoint"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase border-2">
                      {company.industry || "UNCLASSED"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "rounded-lg font-black text-[8px] border-none px-3",
                        company.is_verified ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {company.is_verified ? "VERIFIED" : "PENDING"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg hover:bg-primary hover:text-white"
                        onClick={() => handleOpenDialog(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg hover:bg-destructive/10 text-destructive"
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

        <div className="p-4 border-t flex justify-center gap-4 bg-muted/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border-2 h-10 w-10"
          >
            <ChevronLeft />
          </Button>
          <span className="text-[10px] font-black self-center uppercase tracking-widest italic">
            Sector {page} / {Math.ceil(totalCount / ITEMS_PER_PAGE)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={companies.length < ITEMS_PER_PAGE}
            className="rounded-xl border-2 h-10 w-10"
          >
            <ChevronRight />
          </Button>
        </div>
      </Card>

      {/* Batch Upload Terminal */}
      <BatchCompanyUpload open={showBatchUpload} onOpenChange={setShowBatchUpload} onComplete={loadData} />

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-4">
          <div className="p-2 space-y-6 text-left">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
                Recalibrate Employer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Entity Identity</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Sector Class</Label>
                <Input
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 rounded-xl font-black uppercase text-[10px] gap-2"
              >
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Activity className="h-4 w-4" />} Commit
                Artifact
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-6 text-left group transition-all hover:border-primary/30">
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-3 shadow-inner",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">{label}</p>
          <p className="text-3xl font-black italic tracking-tighter text-foreground">{value.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
}
