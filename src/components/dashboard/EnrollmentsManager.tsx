import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/integrations/supabase/types";

type EnrollmentStatus = Database["public"]["Enums"]["enrollment_status"];
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  PlayCircle,
  ShieldCheck,
  Activity,
  Zap,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Academic Deployment Terminal (Enrollments)
 * High-fidelity orchestrator for learner lifecycle management and status telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced bulk-state handshakes.
 */

interface Enrollment {
  id: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  payment_amount: number | null;
  notes: string | null;
  student: { id: string; full_name: string; email: string } | null;
  talent: { id: string; full_name: string; email: string } | null;
  content: { id: string; title: string; content_type: string } | null;
}

const STATUS_OPTIONS = [
  { value: "all", label: "GLOBAL REGISTRY" },
  { value: "active", label: "ACTIVE_NODE" },
  { value: "pending_payment", label: "PENDING_FUNDS" },
  { value: "completed", label: "COMPLETED_LOG" },
  { value: "cancelled", label: "TERMINATED" },
];

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  active: { icon: PlayCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  completed: { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
  pending_payment: { icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
  cancelled: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

const ITEMS_PER_PAGE = 10;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function EnrollmentsManager() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusCounts, setStatusCounts] = useState({ active: 0, completed: 0, pending: 0 });

  const loadRegistryTelemetry = useCallback(async () => {
    try {
      const [activeRes, completedRes, pendingRes] = await Promise.all([
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "pending_payment"),
      ]);
      setStatusCounts({
        active: activeRes.count || 0,
        completed: completedRes.count || 0,
        pending: pendingRes.count || 0,
      });
    } catch (err) {
      console.error("Telemetry Fault:", err);
    }
  }, []);

  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("enrollments")
        .select(
          `
          id, status, enrolled_at, completed_at, payment_amount, notes,
          student:students!enrollments_student_id_fkey(id, full_name, email),
          talent:talents!enrollments_talent_id_fkey(id, full_name, email),
          content:content!enrollments_content_id_fkey(id, title, content_type)
        `,
          { count: "exact" },
        )
        .order("enrolled_at", { ascending: false });

      if (statusFilter !== "all") query = query.eq("status", statusFilter as EnrollmentStatus);

      if (debouncedSearch.trim()) {
        const term = `%${debouncedSearch.trim()}%`;
        query = query.or(`student.full_name.ilike.${term},talent.full_name.ilike.${term},content.title.ilike.${term}`);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const result = await withTimeout(
        Promise.resolve(query.range(from, from + ITEMS_PER_PAGE - 1)),
        TIMEOUTS.DEFAULT,
        "Registry Timeout",
      );

      if (result.error) throw result.error;
      setEnrollments((result.data as any) || []);
      setTotalCount(result.count || 0);
    } catch (error) {
      toast.error("Transmission Error: Sync failed");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    loadEnrollments();
    loadRegistryTelemetry();
  }, [loadEnrollments, loadRegistryTelemetry]);

  const handleStatusUpdate = async (enrollmentId: string, newStatus: EnrollmentStatus) => {
    try {
      const updateData: any = { status: newStatus };
      updateData.completed_at = newStatus === "completed" ? new Date().toISOString() : null;

      const { error } = await supabase.from("enrollments").update(updateData).eq("id", enrollmentId);
      if (error) throw error;
      toast.success("Protocol Updated");
      loadEnrollments();
      loadRegistryTelemetry();
    } catch (error) {
      toast.error("Handshake Failed");
    }
  };

  const handleBulkStatusUpdate = async (newStatus: EnrollmentStatus) => {
    try {
      const updateData: any = { status: newStatus };
      updateData.completed_at = newStatus === "completed" ? new Date().toISOString() : null;

      const { error } = await supabase.from("enrollments").update(updateData).in("id", selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} Nodes Synchronized`);
      setSelectedIds([]);
      loadEnrollments();
      loadRegistryTelemetry();
    } catch (error) {
      toast.error("Bulk Protocol Failed");
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Name", "Email", "Artifact", "Status", "Timestamp"].join(","),
      ...enrollments.map((e) =>
        [
          `"${e.talent?.full_name || e.student?.full_name}"`,
          e.talent?.email || e.student?.email,
          `"${e.content?.title}"`,
          e.status,
          e.enrolled_at,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Academic_Deployment_${Date.now()}.csv`;
    link.click();
    toast.success("Ledger Exported");
  };

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === enrollments.length ? [] : enrollments.map((e) => e.id));
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Telemetry HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Registry Nodes", val: totalCount, icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
          {
            label: "Active Deploy",
            val: statusCounts.active,
            icon: PlayCircle,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Finalized Log",
            val: statusCounts.completed,
            icon: ShieldCheck,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
          },
          {
            label: "Capital Pending",
            val: statusCounts.pending,
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
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" /> Academic Registry
              </CardTitle>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                Deployment Status: {totalCount} Nodes Registered
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadEnrollments}
                className="rounded-xl h-11 px-5 border-2 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-primary hover:text-white transition-all"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Re-Sync
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="rounded-xl h-11 px-5 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
              >
                <Download className="w-4 h-4" /> Export Ledger
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-4 mb-8 bg-muted/20 p-4 rounded-[28px] border-2 border-border/40 backdrop-blur-md">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Query registry by name, identifier, or artifact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base shadow-inner"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                <SelectValue placeholder="Status Protocol" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 shadow-2xl">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-bold">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Node Manipulation */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-4 mb-8 p-6 bg-primary/5 border-2 border-primary/20 rounded-[32px] animate-in slide-in-from-top-4">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                  Node Batch Selected
                </p>
                <p className="text-lg font-black tracking-tight">{selectedIds.length} Entities Ready for Instruction</p>
              </div>
              <div className="flex items-center gap-3">
                {["active", "completed"].map((st) => (
                  <AlertDialog key={st}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-xl font-black uppercase text-[9px] tracking-widest border-2 h-10 px-6"
                      >
                        Mark {st.toUpperCase()}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[32px] border-4 border-primary/20 bg-background/95 p-10">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                          Confirm Bulk Instruction
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium italic text-muted-foreground leading-relaxed">
                          Deploying {newStatusLabel(st)} protocol to {selectedIds.length} selected nodes. This will
                          overwrite existing lifecycle data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-8 gap-4">
                        <AlertDialogCancel className="rounded-xl border-2 font-black uppercase text-[10px]">
                          Abort
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleBulkStatusUpdate(st as any)}
                          className="rounded-xl bg-primary font-black uppercase text-[10px]"
                        >
                          Execute Sync
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ))}
                <Button
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="h-10 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest text-muted-foreground/40 hover:text-destructive"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-12 space-y-4">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="rounded-[24px] border-2 border-border/20 overflow-hidden bg-background/50">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b-2 border-border/10">
                    <TableHead className="w-12 px-6">
                      <Checkbox
                        checked={selectedIds.length === enrollments.length && enrollments.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-6">
                      Learner Artifact
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Academic Node</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Temporal Log</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                      Lifecycle Override
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => {
                    const person = enrollment.talent || enrollment.student;
                    const config = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.active;
                    return (
                      <TableRow
                        key={enrollment.id}
                        className="group transition-all hover:bg-primary/[0.02] border-b-2 border-border/5 last:border-0"
                      >
                        <TableCell className="px-6">
                          <Checkbox
                            checked={selectedIds.includes(enrollment.id)}
                            onCheckedChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(enrollment.id)
                                  ? prev.filter((x) => x !== enrollment.id)
                                  : [...prev, enrollment.id],
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="px-6 py-6">
                          <div className="space-y-1">
                            <p className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">
                              {person?.full_name || "NULL_ENTITY"}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                              {person?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-black text-xs uppercase tracking-tighter italic line-clamp-1">
                              {enrollment.content?.title || "UNCLASSED_ARTIFACT"}
                            </p>
                            <Badge
                              variant="outline"
                              className="rounded-lg border-2 font-black text-[8px] uppercase tracking-widest py-0"
                            >
                              {enrollment.content?.content_type?.replace("_", " ")}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <Badge
                              className={cn(
                                "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] border-none px-3 py-1 w-fit",
                                config.color,
                                config.bg,
                              )}
                            >
                              <config.icon className="h-2.5 w-2.5 mr-1" /> {enrollment.status.replace("_", " ")}
                            </Badge>
                            <p className="text-[10px] font-bold text-muted-foreground/30 italic uppercase tracking-widest ml-1">
                              {format(new Date(enrollment.enrolled_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Select
                            value={enrollment.status}
                            onValueChange={(v) => handleStatusUpdate(enrollment.id, v as any)}
                          >
                            <SelectTrigger className="w-[160px] h-10 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest bg-transparent ml-auto shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 shadow-2xl">
                              {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                                <SelectItem key={o.value} value={o.value} className="font-bold text-[9px] uppercase">
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-10 p-8 bg-muted/20 rounded-[32px] border-2 border-border/40">
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

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Enrollment Registry: Secured Access Active
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Protocol: Academic Lifecycle Registry v2.6.4
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

function newStatusLabel(st: string) {
  if (st === "active") return "ACTIVE_NODE";
  if (st === "completed") return "COMPLETED_LOG";
  return st.toUpperCase();
}
