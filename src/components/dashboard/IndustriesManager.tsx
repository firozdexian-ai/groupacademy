import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Factory,
  Search,
  Merge,
  Edit,
  RefreshCw,
  Building2,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
  Zap,
  Database,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Market Sector Normalization Terminal (Industries)
 * High-fidelity orchestrator for sectoral aggregation and registry deduplication.
 * 2024 Standard: Executive Logic geometry with reinforced aggregation guards.
 */

interface IndustryRow {
  industry: string;
  companyCount: number;
  jobCount: number;
}

const ITEMS_PER_PAGE = 20;

export function IndustriesManager() {
  const [industries, setIndustries] = useState<IndustryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Telemetry
  const [totalIndustries, setTotalIndustries] = useState(0);
  const [noIndustryCount, setNoIndustryCount] = useState(0);
  const [topIndustry, setTopIndustry] = useState("");

  // Transformation State
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const loadRegistryTelemetry = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // 1. Ingest Raw Sectoral Data (CTO Patch: Expanded limit to prevent silent 1000-row truncation)
      const { data: companies, error: compErr } = await withTimeout(
        Promise.resolve(supabase.from("companies").select("id, industry").limit(10000)),
        TIMEOUTS.DEFAULT,
        "Sector Ingestion Timeout",
      );
      if (compErr) throw compErr;

      // 2. Map Job Dependencies (CTO Patch: Expanded limit)
      const { data: jobs, error: jobErr } = await withTimeout(
        Promise.resolve(supabase.from("jobs").select("company_id").limit(10000)),
        TIMEOUTS.DEFAULT,
        "Job Dependency Sync Timeout",
      );
      if (jobErr) throw jobErr;

      const jobCountMap: Record<string, number> = {};
      jobs?.forEach((j: any) => {
        if (j.company_id) jobCountMap[j.company_id] = (jobCountMap[j.company_id] || 0) + 1;
      });

      // 3. Aggregate Logic Nodes
      const industryMap: Record<string, { companyCount: number; jobCount: number }> = {};
      let unassigned = 0;

      companies?.forEach((c: any) => {
        const ind = c.industry?.trim();
        if (!ind) {
          unassigned++;
          return;
        }

        if (!industryMap[ind]) industryMap[ind] = { companyCount: 0, jobCount: 0 };
        industryMap[ind].companyCount++;
        if (jobCountMap[c.id]) industryMap[ind].jobCount += jobCountMap[c.id];
      });

      const rows: IndustryRow[] = Object.entries(industryMap)
        .map(([industry, data]) => ({ industry, ...data }))
        .sort((a, b) => b.companyCount - a.companyCount);

      setIndustries(rows);
      setTotalIndustries(rows.length);
      setNoIndustryCount(unassigned);
      setTopIndustry(rows[0]?.industry || "NULL_SECTOR");
    } catch (error: any) {
      setLoadError(error.message || "Registry Sync Failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistryTelemetry();
  }, [loadRegistryTelemetry]);

  const filtered = industries.filter((i) => i.industry.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSelect = (industry: string) => {
    const next = new Set(selected);
    selected.has(industry) ? next.delete(industry) : next.add(industry);
    setSelected(next);
  };

  const executeMergeProtocol = async () => {
    if (!mergeTarget.trim()) return toast.error("Merge Fault: Target identifier required");
    setIsMerging(true);
    try {
      const sources = [...selected].filter((s) => s !== mergeTarget.trim());
      for (const source of sources) {
        const { error } = await supabase
          .from("companies")
          .update({ industry: mergeTarget.trim() })
          .eq("industry", source);
        if (error) throw error;
      }
      toast.success(`Protocol Committed: ${sources.length} sectors normalized into "${mergeTarget}"`);
      setMergeDialogOpen(false);
      setSelected(new Set());
      loadRegistryTelemetry();
    } catch (err: any) {
      toast.error("Handshake Failed: " + err.message);
    } finally {
      setIsMerging(false);
    }
  };

  const executeRenameProtocol = async () => {
    if (!renameTo.trim() || renameTo.trim() === renameFrom) return toast.error("Logic Fault: Invalid identifier");
    setIsRenaming(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ industry: renameTo.trim() })
        .eq("industry", renameFrom);
      if (error) throw error;
      toast.success(`Node Recalibrated: "${renameFrom}" → "${renameTo}"`);
      setRenameDialogOpen(false);
      loadRegistryTelemetry();
    } catch (err: any) {
      toast.error("Rename failed: " + err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Telemetry HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Market Sectors",
            val: totalIndustries,
            icon: Factory,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Unassigned Nodes",
            val: noIndustryCount,
            icon: AlertCircle,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "Dominant Sector",
            val: topIndustry,
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
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
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                  {kpi.label}
                </p>
                <p className="text-2xl font-black tracking-tighter italic leading-none truncate">{kpi.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <Database className="h-8 w-8 text-primary" /> Sector Registry
              </CardTitle>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                De-duplication & Sector Normalization Active
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadRegistryTelemetry}
                className="rounded-xl h-11 px-5 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <RefreshCw className={cn("w-4 h-4 text-primary", isLoading && "animate-spin")} /> Re-Sync
              </Button>
              {selected.size >= 2 && (
                <Button
                  onClick={() => {
                    const sorted = [...selected].sort(
                      (a, b) =>
                        (industries.find((i) => i.industry === b)?.companyCount || 0) -
                        (industries.find((i) => i.industry === a)?.companyCount || 0),
                    );
                    setMergeTarget(sorted[0]);
                    setMergeDialogOpen(true);
                  }}
                  className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 bg-primary animate-in zoom-in-95"
                >
                  <Merge className="w-4 h-4 mr-2" /> Normalize ({selected.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="mb-8 flex flex-col md:flex-row gap-4 bg-muted/20 p-4 rounded-[28px] border-2 border-border/40 backdrop-blur-md">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Query market sectors..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base"
              />
            </div>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={10} columns={5} />
          ) : loadError ? (
            <DashboardErrorState title="Registry Fault" message={loadError} onRetry={loadRegistryTelemetry} />
          ) : (
            <div className="rounded-[24px] border-2 border-border/20 overflow-hidden bg-background/50">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="w-12 px-6">
                      <Checkbox
                        checked={selected.size === paginated.length && paginated.length > 0}
                        onCheckedChange={() =>
                          setSelected(
                            selected.size === paginated.length ? new Set() : new Set(paginated.map((i) => i.industry)),
                          )
                        }
                      />
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-8">
                      Market Sector
                    </TableHead>
                    <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">
                      Entity Count
                    </TableHead>
                    <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">
                      Logic Nodes (Jobs)
                    </TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                      Interrogate
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-32 text-muted-foreground/40 italic uppercase tracking-[0.2em] font-black"
                      >
                        No market sectors match query.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((row) => (
                      <TableRow
                        key={row.industry}
                        className="group transition-all hover:bg-primary/[0.02] border-b-2 border-border/5 last:border-0"
                      >
                        <TableCell className="px-6">
                          <Checkbox
                            checked={selected.has(row.industry)}
                            onCheckedChange={() => toggleSelect(row.industry)}
                          />
                        </TableCell>
                        <TableCell className="py-6 font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors">
                          {row.industry}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="rounded-lg border-2 font-black text-[9px] gap-2 bg-background"
                          >
                            <Building2 className="h-3 w-3 opacity-40" /> {row.companyCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="rounded-lg border-2 font-black text-[9px] gap-2 bg-background"
                          >
                            <Briefcase className="h-3 w-3 opacity-40" /> {row.jobCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all"
                            onClick={() => {
                              setRenameFrom(row.industry);
                              setRenameTo(row.industry);
                              setRenameDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-10 p-8 bg-muted/20 rounded-[32px] border-2 border-border/40 backdrop-blur-md">
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic leading-none">
                  Registry Frame
                </p>
                <p className="text-xl font-black italic tracking-tighter leading-none">
                  {page} <span className="text-xs opacity-20">of</span> {totalPages}
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10">
            <DialogHeader className="mb-8 text-left">
              <div className="flex items-center gap-4">
                <Activity className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    Normalization Protocol
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    Merging logic nodes into primary market sector
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-8 py-4">
              <div className="p-6 rounded-[28px] border-2 bg-muted/20 border-border/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-4 italic">
                  Source Nodes for Fusion:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...selected].map((s) => (
                    <Badge key={s} className="bg-primary/10 text-primary border-none font-bold text-[9px] uppercase">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Target Sector Identifier
                </Label>
                <Input
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  className="h-14 rounded-2xl border-2 font-black italic text-lg uppercase"
                  placeholder="Enter final sector designation..."
                />
              </div>
            </div>

            <DialogFooter className="mt-10 pt-8 border-t border-border/10">
              <Button
                variant="ghost"
                onClick={() => setMergeDialogOpen(false)}
                className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
              >
                Abort
              </Button>
              <Button
                onClick={executeMergeProtocol}
                disabled={isMerging || !mergeTarget.trim()}
                className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 flex items-center gap-3"
              >
                {isMerging ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                Execute Fusion
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-primary" />
          <div className="p-10">
            <DialogHeader className="mb-8 text-left">
              <div className="flex items-center gap-4">
                <Zap className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    Node Recalibration
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Updating sector identifier across global registry
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <p className="text-sm font-medium italic text-muted-foreground leading-relaxed">
                Renaming node "<strong>{renameFrom}</strong>" will trigger a recursive update for all linked company
                artifacts.
              </p>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  New Descriptor
                </Label>
                <Input
                  value={renameTo}
                  onChange={(e) => setRenameTo(e.target.value)}
                  className="h-14 rounded-2xl border-2 font-black italic text-lg uppercase"
                />
              </div>
            </div>
            <DialogFooter className="mt-10 pt-8 border-t border-border/10">
              <Button
                variant="ghost"
                onClick={() => setRenameDialogOpen(false)}
                className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
              >
                Abort
              </Button>
              <Button
                onClick={executeRenameProtocol}
                disabled={isRenaming}
                className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 flex items-center gap-3"
              >
                {isRenaming ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                Update Node
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
