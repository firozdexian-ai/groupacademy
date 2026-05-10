import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell,
  Send,
  Users,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
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

interface Notification {
  id: string;
  talent_id: string;
  title: string;
  message: string;
  type: string;
  icon: string | null;
  link: string | null;
  is_read: boolean | null;
  created_at: string;
  talent?: {
    full_name: string;
    email: string;
  };
}

interface Talent {
  id: string;
  full_name: string;
  email: string;
  profession_category_id?: string;
}

interface ProfessionCategory {
  id: string;
  name: string;
}

const NOTIFICATION_TYPES = [
  { value: "announcement", label: "Announcement" },
  { value: "promotion", label: "Promotion" },
  { value: "reminder", label: "Reminder" },
  { value: "update", label: "Update" },
  { value: "achievement", label: "Achievement" },
];

const ITEMS_PER_PAGE = 10;

export function NotificationsManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [sendDialog, setSendDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, read: 0, unread: 0, today: 0 });

  // New notification form
  const [newNotification, setNewNotification] = useState({
    targetType: "all" as "all" | "single" | "category",
    targetTalentId: "",
    targetCategoryId: "",
    title: "",
    message: "",
    type: "announcement",
    link: "",
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("notifications")
        .select(`*, talent:talents(full_name, email)`, { count: "exact" })
        .order("created_at", { ascending: false });

      if (debouncedSearch) {
        const safe = sanitizeIlike(debouncedSearch);
        if (safe) query = query.ilike("title", `%${safe}%`);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const {
        data: notificationsData,
        count,
        error: notificationsError,
      } = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Notifications load timed out");

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);
      setTotalCount(count || 0);

      if (talents.length === 0) {
        const { data: talentsData } = await supabase
          .from("talents")
          .select("id, full_name, email, profession_category_id")
          .order("full_name");
        setTalents(talentsData || []);
      }

      if (categories.length === 0) {
        const { data: catData } = await supabase.from("profession_categories").select("id, name").eq("is_active", true);
        setCategories(catData || []);
      }

      if (page === 1) {
        const { count: unreadCount } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { count: todayCount } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayStart.toISOString());

        setStats({
          total: count || 0,
          read: (count || 0) - (unreadCount || 0),
          unread: unreadCount || 0,
          today: todayCount || 0,
        });
      }
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError("Failed to load notifications");
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, talents.length, categories.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error("Please fill in title and message");
      return;
    }

    if (newNotification.targetType === "single" && !newNotification.targetTalentId) {
      toast.error("Please select a talent");
      return;
    }

    if (newNotification.targetType === "category" && !newNotification.targetCategoryId) {
      toast.error("Please select a category");
      return;
    }

    setIsSending(true);
    try {
      let targetTalents: Talent[] = [];

      if (newNotification.targetType === "all") {
        targetTalents = talents;
      } else if (newNotification.targetType === "category") {
        targetTalents = talents.filter((t) => t.profession_category_id === newNotification.targetCategoryId);
      } else {
        const single = talents.find((t) => t.id === newNotification.targetTalentId);
        if (single) targetTalents = [single];
      }

      if (targetTalents.length === 0) {
        toast.warning("No talents found for selected target");
        setIsSending(false);
        return;
      }

      const CHUNK_SIZE = 500;
      const chunks = [];
      for (let i = 0; i < targetTalents.length; i += CHUNK_SIZE) {
        chunks.push(targetTalents.slice(i, i + CHUNK_SIZE));
      }

      for (const chunk of chunks) {
        const notificationsToInsert = chunk.map((talent) => ({
          talent_id: talent.id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          link: newNotification.link || null,
          icon: "bell",
        }));

        const { error: insertError } = await supabase.from("notifications").insert(notificationsToInsert);
        if (insertError) throw insertError;
      }

      toast.success(`Notification sent to ${targetTalents.length} talents`);
      setSendDialog(false);
      setNewNotification({
        targetType: "all",
        targetTalentId: "",
        targetCategoryId: "",
        title: "",
        message: "",
        type: "announcement",
        link: "",
      });
      loadData();
    } catch (err: any) {
      console.error("Error sending notification:", err);
      toast.error("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (isLoading && page === 1 && notifications.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Notifications Manager</h2>
          <p className="text-muted-foreground">Send announcements and manage alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => setSendDialog(true)}>
            <Send className="h-4 w-4 mr-2" /> Send Notification
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sent</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Read</p>
              <p className="text-2xl font-bold">{stats.read}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unread</p>
              <p className="text-2xl font-bold">{stats.unread}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-accent/10">
              <Send className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sent Today</p>
              <p className="text-2xl font-bold">{stats.today}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">History</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No notifications found
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(notification.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{notification.talent?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{notification.talent?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{notification.message}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {notification.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={notification.is_read ? "secondary" : "default"}>
                        {notification.is_read ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-end p-4 border-t gap-2">
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

      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Send To</label>
              <Select
                value={newNotification.targetType}
                onValueChange={(v: "all" | "single" | "category") =>
                  setNewNotification({ ...newNotification, targetType: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> All Talents ({talents.length})
                    </div>
                  </SelectItem>
                  <SelectItem value="category">Specific Profession</SelectItem>
                  <SelectItem value="single">Specific Talent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newNotification.targetType === "category" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Profession</label>
                <Select
                  value={newNotification.targetCategoryId}
                  onValueChange={(v) => setNewNotification({ ...newNotification, targetCategoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newNotification.targetType === "single" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Talent</label>
                <Select
                  value={newNotification.targetTalentId}
                  onValueChange={(v) => setNewNotification({ ...newNotification, targetTalentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a talent" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {talents.map((talent) => (
                      <SelectItem key={talent.id} value={talent.id}>
                        {talent.full_name} ({talent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={newNotification.type}
                  onValueChange={(v) => setNewNotification({ ...newNotification, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Link (Optional)</label>
                <Input
                  value={newNotification.link}
                  onChange={(e) => setNewNotification({ ...newNotification, link: e.target.value })}
                  placeholder="/app/..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                placeholder="Notification message..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification} disabled={isSending}>
              {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {isSending ? "Sending..." : "Send Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
