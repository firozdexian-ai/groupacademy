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
  Ban,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface Enrollment {
  id: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  payment_amount: number | null;
  notes: string | null;
  student: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  talent: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  content: {
    id: string;
    title: string;
    content_type: string;
  } | null;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_ICONS: Record<string, React.ElementType> = {
  active: CheckCircle2,
  completed: CheckCircle2,
  pending_payment: Clock,
  cancelled: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-700 dark:text-green-400",
  completed: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  pending_payment: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  cancelled: "bg-red-500/20 text-red-700 dark:text-red-400",
};

const ITEMS_PER_PAGE = 10;

export function EnrollmentsManager() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusCounts, setStatusCounts] = useState({ active: 0, completed: 0, cancelled: 0 });

  const loadStatusCounts = useCallback(async () => {
    try {
      const [activeRes, completedRes, pendingRes] = await Promise.all([
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "pending_payment"),
      ]);
      setStatusCounts({
        active: activeRes.count || 0,
        completed: completedRes.count || 0,
        cancelled: pendingRes.count || 0,
      });
    } catch (err) {
      console.error("Error loading status counts:", err);
    }
  }, []);

  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("enrollments")
        .select(
          `
          id,
          status,
          enrolled_at,
          completed_at,
          payment_amount,
          notes,
          student:students!enrollments_student_id_fkey(id, full_name, email),
          talent:talents!enrollments_talent_id_fkey(id, full_name, email),
          content:content!enrollments_content_id_fkey(id, title, content_type)
        `,
          { count: "exact" },
        )
        .order("enrolled_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as EnrollmentStatus);
      }

      // Apply search filter across related tables
      if (debouncedSearch.trim()) {
        const term = `%${debouncedSearch.trim()}%`;
        query = query.or(
          `student.full_name.ilike.${term},talent.full_name.ilike.${term},content.title.ilike.${term}`,
        );
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await withTimeout(
        Promise.resolve(query),
        TIMEOUTS.DEFAULT,
        "Enrollments load timed out",
      );

      if (error) throw error;
      setEnrollments((data as unknown as Enrollment[]) || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading enrollments:", error);
      toast.error("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    loadEnrollments();
    loadStatusCounts();
  }, [loadEnrollments, loadStatusCounts]);

  const handleStatusUpdate = async (enrollmentId: string, newStatus: EnrollmentStatus) => {
    try {
      const updateData: { status: EnrollmentStatus; completed_at?: string | null } = {
        status: newStatus,
      };
      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase.from("enrollments").update(updateData).eq("id", enrollmentId);

      if (error) throw error;
      toast.success("Status updated");
      loadEnrollments();
      loadStatusCounts();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleBulkStatusUpdate = async (newStatus: EnrollmentStatus) => {
    if (selectedIds.length === 0) {
      toast.error("Select enrollments first");
      return;
    }

    try {
      const updateData: { status: EnrollmentStatus; completed_at?: string | null } = {
        status: newStatus,
      };
      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase.from("enrollments").update(updateData).in("id", selectedIds);

      if (error) throw error;
      toast.success(`Updated ${selectedIds.length} enrollments`);
      setSelectedIds([]);
      loadEnrollments();
      loadStatusCounts();
    } catch (error) {
      console.error("Error bulk updating:", error);
      toast.error("Failed to update enrollments");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Content", "Status", "Enrolled At", "Completed At", "Payment"];
    const rows = enrollments.map((e) => [
      e.talent?.full_name || e.student?.full_name || "N/A",
      e.talent?.email || e.student?.email || "N/A",
      e.content?.title || "N/A",
      e.status,
      e.enrolled_at ? format(new Date(e.enrolled_at), "yyyy-MM-dd") : "",
      e.completed_at ? format(new Date(e.completed_at), "yyyy-MM-dd") : "",
      e.payment_amount?.toString() || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enrollments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === enrollments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(enrollments.map((e) => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Compact KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{totalCount}</p>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-bold">{statusCounts.active}</p>
            </div>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold">{statusCounts.completed}</p>
            </div>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
              <p className="text-lg font-bold">{statusCounts.cancelled}</p>
            </div>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="text-lg">Enrollments</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadEnrollments}>
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions with AlertDialog confirmation */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted rounded-lg animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-border mx-2" />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">Mark Active</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Bulk Update</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to mark {selectedIds.length} enrollment{selectedIds.length > 1 ? "s" : ""} as <strong>Active</strong>?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleBulkStatusUpdate("active")}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">Mark Completed</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Bulk Update</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to mark {selectedIds.length} enrollment{selectedIds.length > 1 ? "s" : ""} as <strong>Completed</strong>?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleBulkStatusUpdate("completed")}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No enrollments found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedIds.length === enrollments.length && enrollments.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Student/Talent</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => {
                      const StatusIcon = STATUS_ICONS[enrollment.status] || Clock;
                      const person = enrollment.talent || enrollment.student;
                      return (
                        <TableRow key={enrollment.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(enrollment.id)}
                              onCheckedChange={() => toggleSelect(enrollment.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{person?.full_name || "N/A"}</p>
                              <p className="text-xs text-muted-foreground">{person?.email || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium line-clamp-1">{enrollment.content?.title || "N/A"}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {enrollment.content?.content_type?.replace("_", " ") || ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`gap-1 ${STATUS_COLORS[enrollment.status] || ""}`}>
                              <StatusIcon className="h-3 w-3" />
                              {enrollment.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {enrollment.enrolled_at ? format(new Date(enrollment.enrolled_at), "MMM d, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={enrollment.status || ""}
                              onValueChange={(value) => handleStatusUpdate(enrollment.id, value as EnrollmentStatus)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending_payment">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Layout */}
              <div className="sm:hidden space-y-3">
                {enrollments.map((enrollment) => {
                  const StatusIcon = STATUS_ICONS[enrollment.status] || Clock;
                  const person = enrollment.talent || enrollment.student;
                  return (
                    <Card key={enrollment.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.includes(enrollment.id)}
                          onCheckedChange={() => toggleSelect(enrollment.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{person?.full_name || "N/A"}</p>
                              <p className="text-xs text-muted-foreground truncate">{person?.email || ""}</p>
                            </div>
                            <Badge className={`gap-1 shrink-0 text-[10px] ${STATUS_COLORS[enrollment.status] || ""}`}>
                              <StatusIcon className="h-3 w-3" />
                              {enrollment.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {enrollment.content?.title || "N/A"}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              {enrollment.enrolled_at ? format(new Date(enrollment.enrolled_at), "MMM d, yyyy") : "N/A"}
                            </span>
                            <Select
                              value={enrollment.status || ""}
                              onValueChange={(value) => handleStatusUpdate(enrollment.id, value as EnrollmentStatus)}
                            >
                              <SelectTrigger className="w-[110px] h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending_payment">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4 border-t mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 sm:mr-2" />
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
                <ChevronRight className="h-4 w-4 sm:ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
