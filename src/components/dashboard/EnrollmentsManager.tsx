import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Use shadcn Checkbox
import type { Database } from "@/integrations/supabase/types";

type EnrollmentStatus = Database["public"]["Enums"]["enrollment_status"];
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  // Data State
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch Data (Paginated)
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

      // Note: Relation search isn't supported directly client-side for pagination efficiently without RPC.
      // We implement basic pagination first. Search will filter client side for now on loaded page or needs RPC.

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
  }, [loadEnrollments]);

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

  // Simplified counts for now (RPC recommended for true counts)
  const counts = {
    total: totalCount,
    // Note: These are inaccurate in paginated view unless we run separate count queries
    // Keeping placeholders for now
    active: "-",
    pending: "-",
    completed: "-",
  };

  return (
    <div className="space-y-6">
      {/* Stats - Note: Real counts require separate queries in paginated view */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Enrollments</p>
            <p className="text-2xl font-bold">{counts.total}</p>
          </CardContent>
        </Card>
        {/* Other stats cards could be implemented with separate count queries if needed */}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Enrollments</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadEnrollments}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" /> Export
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
              <SelectTrigger className="w-[180px]">
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

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-border mx-2" />
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("active")}>
                Mark Active
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("completed")}>
                Mark Completed
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                Clear Selection
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
            <div className="rounded-md border overflow-auto">
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
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
