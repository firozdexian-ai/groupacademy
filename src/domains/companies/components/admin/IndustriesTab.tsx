/**
 * Market Sector Normalization Terminal — Phase Z0 Hardened
 * CTO Version: May 2026
 * Fixes: A3 (Scaling Aggregates), A4 (Atomic Fusion), S1 (Rename Restoration)
 * Features: Restored Rename Protocol & Unassigned KPI
 */
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
  Database,
  Zap,
} from "lucide-react";
import { DashboardTableSkeleton } from "../DashboardSkeleton";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 15;

export function IndustriesTab() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [unassignedCount, setUnassignedCount] = useState(0);

  // Normalization State (Merge)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  // Recalibration State (Rename - Restored)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const loadRegistry = useCallback(async () => {
    setIsLoading(true);
    try {
      // A3 Fix: Single RPC for aggregates + Parallel head query for unassigned
      const [rollupRes, unassignedRes] = await Promise.all([
        supabase.rpc("get_industry_rollup"),
        supabase.from("companies").select("id", { count: "exact", head: true }).is("industry", null),
      ]);

      if (rollupRes.error) throw rollupRes.error;

      setIndustries(rollupRes.data || []);
      setUnassignedCount(unassignedRes.count || 0);
    } catch (err: any) {
      toast.error("Registry Sync Failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  // Recalibration Handler (Restored)
  const executeRename = async () => {
    if (!renameTo.trim() || renameTo === renameFrom) return toast.error("Logic Fault: Invalid identifier");
    setIsRenaming(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ industry: renameTo.trim() })
        .eq("industry", renameFrom);

      if (error) throw error;
      toast.success(`Node Recalibrated: "${renameFrom}" → "${renameTo}"`);
      setRenameDialogOpen(false);
      loadRegistry();
    } catch (err: any) {
      toast.error("Handshake Failed: " + err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  // Fusion Handler (Merge - RPC Optimized)
  const executeMerge = async () => {
    if (!mergeTarget.trim()) return toast.error("Target identifier required");
    setIsMerging(true);
    try {
      const sources = [...selected].filter((s) => s !== mergeTarget.trim());
      // A4 Fix: Single atomic transaction via RPC
      const { error } = await supabase.rpc("merge_industries", {
        p_sources: sources,
        p_target: mergeTarget.trim(),
      });

      if (error) throw error;

      toast.success(`Protocol Committed: ${sources.length} sectors fused into "${mergeTarget}"`);
      setMergeDialogOpen(false);
      setSelected(new Set());
      loadRegistry();
    } catch (err: any) {
      toast.error("Fusion Error: " + err.message);
    } finally {
      setIsMerging(false);
    }
  };

  const filtered = industries.filter((i) => i.industry.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSelect = (industry: string) => {
    const next = new Set(selected);
    selected.has(industry) ? next.delete(industry) : next.add(industry);
    setSelected(next);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header - Renders immediately to fix R4 loading regression */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> Sector Registry
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
            Normalization & Institutional Deduplication
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadRegistry} className="rounded-xl h-12 w-12 border-2">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          {selected.size >= 2 && (
            <Button
              onClick={() => {
                setMergeTarget([...selected][0]);
                setMergeDialogOpen(true);
              }}
              className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2 bg-primary shadow-xl"
            >
              <Merge className="h-4 w-4" /> Normalize ({selected.size})
            </Button>
          )}
        </div>
      </div>

      {/* KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricTile
          label="Active Sectors"
          value={industries.length}
          icon={Factory}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <MetricTile
          label="Unassigned Nodes"
          value={unassignedCount}
          icon={AlertCircle}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <MetricTile
          label="Dominant Sector"
          value={industries[0]?.industry || "N/A"}
          icon={TrendingUp}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
      </div>

      <Card className="rounded-[40px] border-2 overflow-hidden shadow-2xl bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <div className="p-6 border-b border-border/10">
          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Filter sectoral artifacts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-12 h-12 bg-muted/10 border-2 rounded-xl font-bold uppercase text-[10px] tracking-widest"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8">
            <DashboardTableSkeleton rows={8} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="border-b-2">
                  <th className="w-12 px-6">
                    <Checkbox
                      checked={selected.size === paginated.length && paginated.length > 0}
                      onCheckedChange={() =>
                        setSelected(
                          selected.size === paginated.length ? new Set() : new Set(paginated.map((i) => i.industry)),
                        )
                      }
                    />
                  </th>
                  <TableHead className="text-[10px] font-black uppercase py-6 pl-0">Sector Identity</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase">Employer Nodes</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase">Logic Nodes</TableHead>
                  <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Interrogate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((row) => (
                  <TableRow key={row.industry} className="group hover:bg-primary/[0.02] border-b border-border/5">
                    <TableCell className="px-6">
                      <Checkbox
                        checked={selected.has(row.industry)}
                        onCheckedChange={() => toggleSelect(row.industry)}
                      />
                    </TableCell>
                    <TableCell className="py-6 font-black text-sm uppercase italic group-hover:text-primary transition-colors">
                      {row.industry}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-black text-[10px] border-2 bg-background/50">
                        {row.company_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-black text-[10px] border-2 bg-background/50">
                        {row.job_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setRenameFrom(row.industry);
                          setRenameTo(row.industry);
                          setRenameDialogOpen(true);
                        }}
                        className="h-10 w-10 border-2 rounded-xl opacity-20 group-hover:opacity-100 transition-all"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="p-6 border-t flex justify-center items-center gap-6 bg-muted/5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border-2"
          >
            <ChevronLeft />
          </Button>
          <span className="text-[10px] font-black uppercase italic opacity-40">
            Registry Frame {page} / {totalPages || 1}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-xl border-2"
          >
            <ChevronRight />
          </Button>
        </div>
      </Card>

      {/* Recalibration Dialog (Rename - Restored Logic) */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-4 bg-background text-left">
          <div className="p-2 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" /> Recalibrate Node
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                Renaming "{renameFrom}" will recursively update every employer node linked to this identifier.
              </p>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">New Sector Designation</Label>
                <Input
                  value={renameTo}
                  onChange={(e) => setRenameTo(e.target.value)}
                  className="rounded-xl border-2 font-black italic uppercase h-12"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                onClick={executeRename}
                disabled={isRenaming}
                className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest gap-2 shadow-xl"
              >
                {isRenaming ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} Commit
                Change
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fusion Dialog (Merge) */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-4 bg-background text-left">
          <div className="p-2 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                <Merge className="h-6 w-6 text-primary" /> Sector Fusion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                Merging {selected.size} sectoral artifacts. This logic cycle fuses multiple nodes into one primary
                designation.
              </p>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Primary Sector Identifier</Label>
                <Input
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  className="rounded-xl border-2 font-black italic h-12 uppercase"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                onClick={executeMerge}
                disabled={isMerging}
                className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest gap-2 shadow-xl"
              >
                {isMerging ? <Loader2 className="animate-spin h-4 w-4" /> : <Activity className="h-4 w-4" />} Execute
                Fusion
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
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-6 text-left group hover:border-primary/30 transition-all shadow-xl relative overflow-hidden">
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
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1 truncate">
            {label}
          </p>
          <p className="text-2xl font-black italic tracking-tighter text-foreground truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}
