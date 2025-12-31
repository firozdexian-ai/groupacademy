import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Send, Users, Search, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

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
}

const NOTIFICATION_TYPES = [
  { value: "announcement", label: "Announcement" },
  { value: "promotion", label: "Promotion" },
  { value: "reminder", label: "Reminder" },
  { value: "update", label: "Update" },
  { value: "achievement", label: "Achievement" },
];

export function NotificationsManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendDialog, setSendDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // New notification form
  const [newNotification, setNewNotification] = useState({
    targetType: "all" as "all" | "single",
    targetTalentId: "",
    title: "",
    message: "",
    type: "announcement",
    link: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load recent notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select(`
          *,
          talent:talents(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);

      // Load talents for targeted notifications
      const { data: talentsData, error: talentsError } = await supabase
        .from("talents")
        .select("id, full_name, email")
        .order("full_name");

      if (talentsError) throw talentsError;
      setTalents(talentsData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error("Please fill in title and message");
      return;
    }

    if (newNotification.targetType === "single" && !newNotification.targetTalentId) {
      toast.error("Please select a talent");
      return;
    }

    setIsSending(true);
    try {
      if (newNotification.targetType === "all") {
        // Send to all talents
        const notificationsToInsert = talents.map((talent) => ({
          talent_id: talent.id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          link: newNotification.link || null,
          icon: "bell",
        }));

        const { error } = await supabase
          .from("notifications")
          .insert(notificationsToInsert);

        if (error) throw error;
        toast.success(`Notification sent to ${talents.length} talents`);
      } else {
        // Send to single talent
        const { error } = await supabase.from("notifications").insert({
          talent_id: newNotification.targetTalentId,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          link: newNotification.link || null,
          icon: "bell",
        });

        if (error) throw error;
        toast.success("Notification sent successfully");
      }

      setSendDialog(false);
      setNewNotification({
        targetType: "all",
        targetTalentId: "",
        title: "",
        message: "",
        type: "announcement",
        link: "",
      });
      loadData();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  const filteredNotifications = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.talent?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: notifications.length,
    read: notifications.filter((n) => n.is_read).length,
    unread: notifications.filter((n) => !n.is_read).length,
    today: notifications.filter(
      (n) => new Date(n.created_at).toDateString() === new Date().toDateString()
    ).length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications Manager</h2>
          <p className="text-muted-foreground">
            Send announcements and manage notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setSendDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Read</p>
                <p className="text-2xl font-bold">{stats.read}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Send className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent Today</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Notifications Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Talent</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No notifications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="text-sm">
                      {format(new Date(notification.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{notification.talent?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.talent?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {notification.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{notification.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={notification.is_read ? "outline" : "default"}>
                        {notification.is_read ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Send Dialog */}
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
                onValueChange={(v: "all" | "single") =>
                  setNewNotification({ ...newNotification, targetType: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      All Talents ({talents.length})
                    </div>
                  </SelectItem>
                  <SelectItem value="single">Specific Talent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newNotification.targetType === "single" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Talent</label>
                <Select
                  value={newNotification.targetTalentId}
                  onValueChange={(v) =>
                    setNewNotification({ ...newNotification, targetTalentId: v })
                  }
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

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={newNotification.type}
                onValueChange={(v) =>
                  setNewNotification({ ...newNotification, type: v })
                }
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
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={newNotification.title}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, title: e.target.value })
                }
                placeholder="Notification title"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={newNotification.message}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, message: e.target.value })
                }
                placeholder="Notification message..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Link (optional)</label>
              <Input
                value={newNotification.link}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, link: e.target.value })
                }
                placeholder="/app/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification} disabled={isSending}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
