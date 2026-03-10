import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";

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

  // KPI
  const [totalIndustries, setTotalIndustries] = useState(0);
  const [noIndustryCount, setNoIndustryCount] = useState(0);
  const [topIndustry, setTopIndustry] = useState("");

  // Merge
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  // Rename
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  const loadIndustries = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Fetch all companies with industry
      const { data: companies, error: compErr } = await withTimeout(
        Promise.resolve(supabase.from("companies").select("industry")),
        TIMEOUTS.DEFAULT,
        "Loading industries timed out",
      );
      if (compErr) throw compErr;

      // Fetch job counts by company_name (since jobs don't have company_id reliably)
      const { data: jobs, error: jobErr } = await withTimeout(
        Promise.resolve(supabase.from("jobs").select("company_id")),
        TIMEOUTS.DEFAULT,
        "Loading job counts timed out",
      );
      if (jobErr) throw jobErr;

      // Build company_id -> count map from jobs
      const jobCountByCompanyId: Record<string, number> = {};
      jobs?.forEach((j: any) => {
        if (j.company_id) {
          jobCountByCompanyId[j.company_id] = (jobCountByCompanyId[j.company_id] || 0) + 1;
        }
      });

      // We need company_id -> industry mapping for job counts
      const { data: companyFull } = await supabase.from("companies").select("id, industry");

      const companyIndustryMap: Record<string, string> = {};
      companyFull?.forEach((c: any) => {
        if (c.industry) companyIndustryMap[c.id] = c.industry;
      });

      // Aggregate
      const industryMap: Record<string, { companyCount: number; jobCount: number }> = {};
      let noInd = 0;

      companies?.forEach((c: any) => {
        const ind = c.industry?.trim();
        if (!ind) {
          noInd++;
          return;
        }
        if (!industryMap[ind]) industryMap[ind] = { companyCount: 0, jobCount: 0 };
        industryMap[ind].companyCount++;
      });

      // Add job counts
      Object.entries(jobCountByCompanyId).forEach(([compId, count]) => {
        const ind = companyIndustryMap[compId];
        if (ind && industryMap[ind]) {
          industryMap[ind].jobCount += count;
        }
      });

      const rows: IndustryRow[] = Object.entries(industryMap)
        .map(([industry, data]) => ({ industry, ...data }))
        .sort((a, b) => b.companyCount - a.companyCount);

      setIndustries(rows);
      setTotalIndustries(rows.length);
      setNoIndustryCount(noInd);
      setTopIndustry(rows[0]?.industry || "N/A");
    } catch (error: any) {
      console.error("Error loading industries:", error);
      setLoadError(error.message || "Failed to load industries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIndustries();
  }, [loadIndustries]);

  // Filter
  const filtered = industries.filter((i) =>
    i.industry.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Selection
  const toggleSelect = (industry: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(industry)) next.delete(industry);
      else next.add(industry);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((i) => i.industry)));
    }
  };

  // Merge
  const openMergeDialog = () => {
    if (selected.size < 2) {
      toast.error("Select at least 2 industries to merge");
      return;
    }
    // Default merge target to the one with most companies
    const sorted = [...selected].sort((a, b) => {
      const aRow = industries.find((i) => i.industry === a);
      const bRow = industries.find((i) => i.industry === b);
      return (bRow?.companyCount || 0) - (aRow?.companyCount || 0);
    });
    setMergeTarget(sorted[0]);
    setMergeDialogOpen(true);
  };

  const executeMerge = async () => {
    if (!mergeTarget.trim()) {
      toast.error("Enter a target industry name");
      return;
    }
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
      toast.success(`Merged ${sources.length} industries into "${mergeTarget.trim()}"`);
      setMergeDialogOpen(false);
      setSelected(new Set());
      loadIndustries();
    } catch (error: any) {
      toast.error("Merge failed: " + error.message);
    } finally {
      setIsMerging(false);
    }
  };

  // Rename
  const openRenameDialog = (industry: string) => {
    setRenameFrom(industry);
    setRenameTo(industry);
    setRenameDialogOpen(true);
  };

  const executeRename = async () => {
    if (!renameTo.trim() || renameTo.trim() === renameFrom) {
      toast.error("Enter a different name");
      return;
    }
    setIsRenaming(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ industry: renameTo.trim() })
        .eq("industry", renameFrom);
      if (error) throw error;
      toast.success(`Renamed "${renameFrom}" → "${renameTo.trim()}"`);
      setRenameDialogOpen(false);
      loadIndustries();
    } catch (error: any) {
      toast.error("Rename failed: " + error.message);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Factory className="w-4 h-4" />
            <span className="text-xs font-medium">Industries</span>
          </div>
          <p className="text-xl font-bold">{totalIndustries}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Unassigned</span>
          </div>
          <p className="text-xl font-bold">{noIndustryCount}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Top</span>
          </div>
          <p className="text-xl font-bold truncate" title={topIndustry}>{topIndustry}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Factory className="w-5 h-5" />
                Industries
              </CardTitle>
              <CardDescription>
                {totalIndustries} unique industries across {totalIndustries + noIndustryCount > 0 ? "all" : "0"} companies
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadIndustries} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 sm:mr-2 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              {selected.size >= 2 && (
                <Button onClick={openMergeDialog} variant="default">
                  <Merge className="w-4 h-4 mr-2" />
                  Merge ({selected.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search industries..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={8} columns={5} />
          ) : loadError ? (
            <DashboardErrorState title="Failed to load industries" message={loadError} onRetry={loadIndustries} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Factory className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No industries found.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="rounded-md border hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selected.size === paginated.length && paginated.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead className="text-center">Companies</TableHead>
                      <TableHead className="text-center">Jobs</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((row) => (
                      <TableRow key={row.industry}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(row.industry)}
                            onCheckedChange={() => toggleSelect(row.industry)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{row.industry}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="w-3 h-3" />
                            {row.companyCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Briefcase className="w-3 h-3" />
                            {row.jobCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRenameDialog(row.industry)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {paginated.map((row) => (
                  <Card key={row.industry} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selected.has(row.industry)}
                          onCheckedChange={() => toggleSelect(row.industry)}
                        />
                        <div>
                          <p className="font-medium">{row.industry}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs gap-1">
                              <Building2 className="w-3 h-3" /> {row.companyCount}
                            </Badge>
                            <Badge variant="outline" className="text-xs gap-1">
                              <Briefcase className="w-3 h-3" /> {row.jobCount}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openRenameDialog(row.industry)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Merge Industries</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Merging {selected.size} industries into one. All companies with these industries will be updated.
            </p>
            <div className="flex flex-wrap gap-2">
              {[...selected].map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Target Industry Name</Label>
              <Input
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                placeholder="Final industry name..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>Cancel</Button>
              <Button onClick={executeMerge} disabled={isMerging}>
                {isMerging && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Merge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Industry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Renaming "<strong>{renameFrom}</strong>" will update all companies with this industry.
            </p>
            <div className="space-y-2">
              <Label>New Name</Label>
              <Input
                value={renameTo}
                onChange={(e) => setRenameTo(e.target.value)}
                placeholder="New industry name..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
              <Button onClick={executeRename} disabled={isRenaming}>
                {isRenaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
