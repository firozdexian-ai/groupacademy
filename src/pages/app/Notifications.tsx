import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BellOff, CheckCheck, Zap, ShieldCheck, Target, Signal } from "lucide-react";
import { format } from "date-fns";
import { getNotificationIcon } from "@/lib/notificationHelpers";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Signal List Viewport
 * High-fidelity orchestrator for system alerts and career logic triggers.
 * 2026 Standard: Executive Logic geometry with reinforced unread telemetry.
 */

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  const handleNotificationClick = async (notification: (typeof notifications)[0]) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-40 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Executive Header: Signal Connection */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-12 w-12 hover:bg-primary/10 transition-all active:scale-90"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Signal List</h1>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
                {unreadCount > 0 ? `${unreadCount} Pending Nodes` : "Logic Synchronized"}
              </p>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                Protocol v2.6
              </p>
            </div>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            className="rounded-xl h-11 border-2 font-black uppercase text-[10px] tracking-widest gap-2 bg-background hover:bg-primary/5 shadow-sm"
          >
            <CheckCheck className="h-4 w-4 text-emerald-500" /> Mark All as Read
          </Button>
        )}
      </header>

      {/* Logic Filter HUD */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1.5 h-14 bg-muted/30 backdrop-blur-md rounded-2xl border border-border/40 max-w-sm">
          <TabsTrigger
            value="all"
            className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            Global Archive ({notifications.length})
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            Active Logic ({unreadCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List Viewport */}
      <main className="min-h-[60vh] space-y-3">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-[24px] bg-muted/40" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-muted/5 py-24 text-center animate-in zoom-in-95 duration-700">
            <CardContent className="space-y-6">
              <div className="h-20 w-20 rounded-[32px] bg-muted/10 flex items-center justify-center mx-auto mb-6 rotate-3 border border-border/40">
                <BellOff className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Archive Clear</h2>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                {filter === "unread" ? "All active nodes verified." : "Signal registry is currently idle."}
              </p>
            </CardContent>
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
                    "group cursor-pointer transition-all duration-500 rounded-[28px] border-2 overflow-hidden",
                    isUnread
                      ? "bg-primary/[0.03] border-primary/20 shadow-lg shadow-primary/5 hover:border-primary/40"
                      : "bg-card/30 backdrop-blur-sm border-border/40 opacity-70 hover:opacity-100 hover:border-border",
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-6 items-start">
                      {/* Icon Node */}
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:rotate-6",
                          isUnread
                            ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20"
                            : "bg-muted text-muted-foreground/40 border-border/60",
                        )}
                      >
                        <IconComponent className="h-7 w-7" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <h3
                            className={cn(
                              "text-lg font-black uppercase tracking-tight italic transition-colors",
                              isUnread ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {notification.title}
                          </h3>
                          {isUnread && (
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] italic">
                                Unsync'd Node
                              </span>
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),1)]" />
                            </div>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm font-medium leading-relaxed italic",
                            isUnread ? "text-foreground/80" : "text-muted-foreground/60",
                          )}
                        >
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 pt-3 border-t border-border/10 mt-3">
                          <Badge
                            variant="secondary"
                            className="bg-muted/50 text-[8px] font-black uppercase tracking-widest border-none px-2 h-5"
                          >
                            {notification.type || "System Logic"}
                          </Badge>
                          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic flex items-center gap-1.5">
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

      {/* Operational Metadata Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Signal List: Verified Encryption Active
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Protocol Version: Executive Logic 2026.4
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
