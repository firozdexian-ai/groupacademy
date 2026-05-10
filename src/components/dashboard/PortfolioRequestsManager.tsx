import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  Download,
  Loader2,
  Eye,
  FileText,
  MessageCircle,
  Gift,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Globe,
  Award,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TalentDetailDialog } from "./talent/TalentDetailDialog";
import { downloadFile } from "@/lib/downloadFile";

// Define the strict union type for Portfolio Status [cite: 40, 43]
type PortfolioStatus = "pending" | "contacted" | "in_progress" | "completed" | "cancelled";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const FREE_PORTFOLIO_LIMIT = 1000; // [cite: 88, 171]
const ITEMS_PER_PAGE = 10;

interface PortfolioRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  profession_category_id: string | null;
  custom_profession: string | null;
  cv_url: string | null;
  profile_data: {
    education?: any[];
    experience?: any[];
    skills?: any[];
    projects?: any[];
    achievements?: any[];
  } | null;
  certificates: any;
  achievements: string | null;
  social_links: Record<string, string> | null;
  additional_notes: string | null;
  status: PortfolioStatus; // Strictly typed [cite: 40, 43]
  admin_notes: string | null;
  portfolio_url: string | null;
  portfolio_credentials: Record<string, any> | null;
  created_at: string;
  profession_category?: { name: string } | null;
}

const statusColors: Record<PortfolioStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  contacted: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-purple-500/10 text-purple-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-red-500/10 text-red-600",
};

const statusLabels: Record<PortfolioStatus, string> = {
  pending: "Pending",
  contacted: "Contacted",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function PortfolioRequestsManager() {
  const [requests, setRequests] = useState<PortfolioRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Explicit union typing to resolve TS2345
  const [statusFilter, setStatusFilter] = useState<PortfolioStatus | "all">("all");

  const [selectedRequest, setSelectedRequest] = useState<PortfolioRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTalentEmail, setSelectedTalentEmail] = useState<string | null>(null);
  const [selectedTalentName, setSelectedTalentName] = useState<string>("");

  const [editStatus, setEditStatus] = useState<PortfolioStatus | "">("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [editPortfolioUrl, setEditPortfolioUrl] = useState("");
  const [editCmsEmail, setEditCmsEmail] = useState("");
  const [editCmsPassword, setEditCmsPassword] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("portfolio_requests")
        .select(`*, profession_category:profession_categories(name)`, { count: "exact" })
        .order("created_at", { ascending: false });

      if (debouncedSearch) {
        const safe = sanitizeIlike(debouncedSearch);
        if (safe) {
          query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
        }
      }

      // Filter is now type-safe for Supabase [cite: 7, 16]
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(
        Promise.resolve(query),
        TIMEOUTS.DEFAULT,
        "Loading portfolio requests timed out",
      );

      if (result.error) throw result.error;
      setRequests((result.data as any) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error loading portfolio requests:", err);
      setError(err.message || "Failed to load portfolio requests");
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const openDetail = (request: PortfolioRequest) => {
    setSelectedRequest(request);
    setEditStatus(request.status);
    setEditAdminNotes(request.admin_notes || "");
    setEditPortfolioUrl(request.portfolio_url || "");
    setEditCmsEmail(request.portfolio_credentials?.email || "");
    setEditCmsPassword(request.portfolio_credentials?.password || "");
    setIsDetailOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedRequest || !editStatus) return;
    setIsUpdating(true);
    try {
      const updates: any = {
        status: editStatus,
        admin_notes: editAdminNotes || null,
        portfolio_url: editPortfolioUrl || null,
        portfolio_credentials:
          editCmsEmail || editCmsPassword
            ? { email: editCmsEmail, password: editCmsPassword }
            : selectedRequest.portfolio_credentials,
      };

      const { error } = await supabase.from("portfolio_requests").update(updates).eq("id", selectedRequest.id);
      if (error) throw error;

      toast.success("Request updated successfully");
      setIsDetailOpen(false);
      loadRequests();
    } catch (err: any) {
      toast.error("Failed to update request", { description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PortfolioStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 w-fit">
            <Gift className="h-8 w-8 text-primary" />
            <div>
              <div className="text-xl font-bold text-primary">{Math.max(0, FREE_PORTFOLIO_LIMIT - totalCount)}</div>
              <div className="text-xs text-muted-foreground">Free slots left</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <DashboardTableSkeleton rows={5} columns={6} />
      ) : error ? (
        <DashboardErrorState title="Error" message={error} onRetry={loadRequests} />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Profession</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No portfolio requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => {
                  const hasProfileData =
                    request.profile_data &&
                    ((request.profile_data.education?.length || 0) > 0 ||
                      (request.profile_data.experience?.length || 0) > 0);
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">{request.full_name}</div>
                        <div className="text-xs text-muted-foreground">{request.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.custom_profession || request.profession_category?.name || "-"}
                        </div>
                        {request.custom_profession && (
                          <Badge variant="outline" className="text-[10px] mt-1">
                            Custom
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {request.cv_url && (
                            <Badge variant="secondary" className="text-[10px]">
                              📄 CV
                            </Badge>
                          )}
                          {hasProfileData && (
                            <Badge variant="secondary" className="text-[10px]">
                              📋 Profile
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status]}>{statusLabels[request.status]}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedTalentEmail(request.email);
                              setSelectedTalentName(request.full_name);
                            }}
                            title="View Talent Profile"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(request)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openWhatsApp(request.phone)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          {request.cv_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => downloadFile(request.cv_url!, `${request.full_name}-CV.pdf`)}
                              title="Download CV"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4 px-4">
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
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Portfolio Request Details</DialogTitle>
            <DialogDescription>Review and manage this portfolio request</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedRequest.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedRequest.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Profession</Label>
                  <p className="font-medium">
                    {selectedRequest.custom_profession || selectedRequest.profession_category?.name || "Not specified"}
                  </p>
                </div>
              </div>

              {selectedRequest.social_links && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Globe className="h-3 w-3" /> Social Links
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedRequest.social_links).map(
                      ([platform, url]) =>
                        url && (
                          <Badge
                            key={platform}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => window.open(url, "_blank")}
                          >
                            {platform}
                          </Badge>
                        ),
                    )}
                  </div>
                </div>
              )}

              <hr />

              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as PortfolioStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Admin Notes (Internal)</Label>
                  <Textarea
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    rows={2}
                  />
                </div>

                {editStatus === "completed" && (
                  <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4" /> Delivery Details
                    </h4>
                    <div>
                      <Label>Portfolio URL</Label>
                      <Input
                        value={editPortfolioUrl}
                        onChange={(e) => setEditPortfolioUrl(e.target.value)}
                        placeholder="https://portfolio-site.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>CMS Email</Label>
                        <Input
                          value={editCmsEmail}
                          onChange={(e) => setEditCmsEmail(e.target.value)}
                          placeholder="user@cms.com"
                        />
                      </div>
                      <div>
                        <Label>CMS Password</Label>
                        <Input
                          value={editCmsPassword}
                          onChange={(e) => setEditCmsPassword(e.target.value)}
                          placeholder="password123"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TalentDetailDialog
        open={!!selectedTalentEmail}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTalentEmail(null);
            setSelectedTalentName("");
          }
        }}
        talentEmail={selectedTalentEmail || ""}
        talentName={selectedTalentName}
      />
    </div>
  );
}
