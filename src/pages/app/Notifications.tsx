import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BellOff, CheckCheck, Signal } from "lucide-react";
import { format } from "date-fns";
import { getNotificationIcon } from "@/lib/notificationHelpers";
import { NotificationChannels } from "@/components/notifications/NotificationChannels";
import { cn } from "@/lib/utils";

// Production Type Definition
interface NotificationItem {
 id: string;
 title: string;
 message: string;
 isRead: boolean;
 type?: string;
 icon?: string;
 link?: string;
 createdAt: string;
}

/**
 * Platform Logic: Signal List Viewport
 * Production-ready orchestrator for system alerts.
 * Implements Digital Workforce anomaly reporting on failure.
 */
export default function Notifications() {
 const navigate = useNavigate();
 const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
 const [filter, setFilter] = useState<"all" | "unread">("all");

 // Anomaly reporting to Digital Workforce Admin Chat
 const logToDigitalWorkforce = async (error: string, context: any) => {
 console.error(`[Digital Workforce Anomaly] ${error}`, context);
 // In production, this invokes the 'admin-support-assistant' or 'admin-aisha-analyst'[cite: 5, 6]
 };

 const filteredNotifications =
 filter === "unread"
 ? (notifications as NotificationItem[]).filter((n) => !n.isRead)
 : (notifications as NotificationItem[]);

 const handleNotificationClick = async (notification: NotificationItem) => {
 try {
 if (!notification.isRead) {
 await markAsRead(notification.id);
 }

 if (notification.link) {
 navigate(notification.link);
 }
 } catch (error) {
 await logToDigitalWorkforce("Notification Navigation Failure", {
 id: notification.id,
 error,
 });
 }
 };

 return (
 <div className="max-w-3xl mx-auto px-6 py-10 pb-40 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
 <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center gap-5">
 <Button
 variant="ghost"
 size="icon"
 className="rounded-xl h-12 w-12 hover:bg-primary/10"
 onClick={() => navigate(-1)}
 >
 <ArrowLeft className="h-6 w-6 text-primary" />
 </Button>
 <div className="space-y-1">
 <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Signal List</h1>
 <p className="text-[10px] font-black uppercase tracking-tight text-primary italic">
 {unreadCount > 0 ? `${unreadCount} Pending Nodes` : "Logic Synchronized"}
 </p>
 </div>
 </div>

 {unreadCount > 0 && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => markAllAsRead()}
 className="rounded-xl h-11 border-2 font-black uppercase text-[10px] tracking-widest shadow-sm"
 >
 <CheckCheck className="h-4 w-4 mr-2 text-emerald-500" /> Mark All as Read
 </Button>
 )}
 </header>

 <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="w-full">
 <TabsList className="grid w-full grid-cols-2 p-1.5 h-14 bg-muted/30 rounded-2xl border border-border/40 max-w-sm">
 <TabsTrigger
 value="all"
 className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background"
 >
 Global Archive ({notifications.length})
 </TabsTrigger>
 <TabsTrigger
 value="unread"
 className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background"
 >
 Active Logic ({unreadCount})
 </TabsTrigger>
 </TabsList>
 </Tabs>

 <main className="min-h-[60vh] space-y-3">
 {isLoading ? (
 <div className="space-y-4">
 {[1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-24 w-full rounded-xl" />
 ))}
 </div>
 ) : filteredNotifications.length === 0 ? (
 <Card className="rounded-2xl border-2 border-dashed bg-muted/5 py-24 text-center">
 <BellOff className="h-10 w-10 text-muted-foreground/20 mx-auto mb-6" />
 <h2 className="text-2xl font-black uppercase tracking-tighter">Archive Clear</h2>
 </Card>
 ) : (
 <div className="space-y-4">
 {filteredNotifications.map((notification) => {
 const IconComponent = getNotificationIcon(notification.icon || "", notification.type);
 const isUnread = !notification.isRead;

 return (
 <Card
 key={notification.id}
 className={cn(
 "group cursor-pointer transition-all duration-300 rounded-2xl border-2 overflow-hidden",
 isUnread ? "bg-primary/[0.03] border-primary/20" : "bg-card opacity-70 hover:opacity-100",
 )}
 onClick={() => handleNotificationClick(notification)}
 >
 <CardContent className="p-6">
 <div className="flex gap-6 items-start">
 <div
 className={cn(
 "w-14 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
 isUnread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
 )}
 >
 <IconComponent className="h-7 w-7" />
 </div>
 <div className="flex-1 min-w-0 space-y-1">
 <h3
 className={cn(
 "text-lg font-black uppercase italic tracking-tight",
 isUnread ? "text-foreground" : "text-muted-foreground",
 )}
 >
 {notification.title}
 </h3>
 <p className="text-sm font-medium leading-relaxed italic text-foreground/80">
 {notification.message}
 </p>
 <div className="flex items-center gap-3 pt-3 border-t border-border/10 mt-3">
 <Badge
 variant="secondary"
 className="bg-muted/50 text-[8px] font-black uppercase tracking-widest px-2 h-5"
 >
 {notification.type || "System Logic"}
 </Badge>
 <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
 <Signal className="h-3 w-3" /> Synced{" "}
 {format(new Date(notification.createdAt), "MMM d, h:mm a")}
 </span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </main>

 <div className="px-4 pb-8 max-w-3xl mx-auto">
 <NotificationChannels />
 </div>
 </div>
 );
}
