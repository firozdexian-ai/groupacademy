import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Zap, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { NotificationItem } from "./NotificationItem";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Realtime Telemetry Notification Dispatcher (NotificationDropdown)
 * An authoritative operational dropdown node handling candidate alert indexing and state cleanups.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function NotificationDropdown() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Core Server State Hook Ingress
  const {
    notifications = [],
    unreadCount = 0,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Monitor real-time alert board visibility parameters via analytics hooks
  useEffect(() => {
    if (open) {
      trackEvent("notification_registry_panel_opened", { unreadCount });
    }
  }, [open, unreadCount]);

  // High-Performance Slice Mapping: Restrict overhead using clean memo allocations
  const primaryIngress = useMemo(() => {
    return Array.isArray(notifications) ? notifications.slice(0, 10) : [];
  }, [notifications]);

  const hasPendingAlerts = typeof unreadCount === "number" && unreadCount > 0;
  const safeUnreadCountLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  const handleMarkAllVerifiedAction = async () => {
    trackEvent("notification_mark_all_read_requested", { count: unreadCount });
    try {
      await markAllAsRead();

      // Automated Efficiency: Synchronize state metrics instantly across core dashboard metrics
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      trackEvent("notification_mark_all_read_success");
    } catch (err) {
      trackError(err, {
        component: "NotificationDropdown",
        action: "execute_mark_all_as_read_callback",
      });
    }
  };

  const handleFullRegistryAuditRedirect = () => {
    trackEvent("notification_full_registry_audit_triggered");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpenState) => {
        setOpen(nextOpenState);
        if (!nextOpenState) trackEvent("notification_registry_panel_closed");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="h-10 w-10 relative rounded-xl hover:bg-muted/20 transition-all active:scale-95 border border-border/10 focus-visible:ring-1 focus-visible:ring-ring select-none shrink-0 flex items-center justify-center shadow-sm"
          aria-label={`Open system notification alerts menu channel, current unread status count holds ${unreadCount} indicators`}
        >
          <Bell
            className={cn(
              "h-5 w-5 text-foreground/80 transition-transform duration-300 stroke-[2.2]",
              hasPendingAlerts && "animate-pulse text-primary font-bold",
            )}
          />

          {hasPendingAlerts && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full bg-rose-500 text-[9px] font-black tracking-tighter text-white shadow-md shadow-rose-500/20 animate-in zoom-in duration-200 tabular-nums leading-none select-none">
              {safeUnreadCountLabel}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[360px] p-0 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-3xl shadow-2xl overflow-hidden select-none sm:select-text text-left antialiased transform-gpu"
        sideOffset={10}
      >
        {/* HUD LEVEL 1: TITLE HEADER SYNC RETAIN BAR */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/10 bg-muted/20 select-none leading-none w-full">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="h-4 w-4 text-primary fill-primary/5 stroke-[2.2] shrink-0" />
            <h3 className="font-extrabold uppercase tracking-wider text-xs text-foreground/90 truncate">
              System Alerts Ledger
            </h3>
          </div>

          {hasPendingAlerts && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-7 rounded-xl px-2.5 text-[9px] font-extrabold uppercase tracking-wide text-primary hover:bg-primary/5 shadow-none shrink-0 flex items-center gap-1 leading-none transition-colors cursor-pointer"
              onClick={handleMarkAllVerifiedAction}
            >
              <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Clear Backlog</span>
            </Button>
          )}
        </div>

        {/* HUD LEVEL 2: DYNAMIC CONTAINER SCROLL LEDGER STACK */}
        <ScrollArea className="max-h-[400px] w-full min-w-0 flex flex-col">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 w-full select-none">
              <Loader2 className="h-5 w-5 border-none animate-spin text-primary stroke-[2.5]" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 animate-pulse leading-none">
                Synchronizing Ledger Channels…
              </p>
            </div>
          ) : primaryIngress.length === 0 ? (
            <div className="p-12 text-center animate-in fade-in zoom-in-98 duration-200 select-none w-full flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-xl bg-muted/20 border border-border/10 flex items-center justify-center mx-auto mb-4 shrink-0 shadow-inner">
                <Bell className="h-5 w-5 text-muted-foreground/30 stroke-[2.2]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground/80 leading-none">
                Ecosystem Registry Idle
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground/50 italic mt-1.5 uppercase tracking-wide text-center leading-normal max-w-xs">
                Awaiting algorithmic synchronization events from target clusters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/10 w-full min-w-0 font-medium">
              {primaryIngress.map((alertItem) => {
                if (!alertItem || !alertItem.id) return null;
                return (
                  <NotificationItem
                    key={alertItem.id}
                    notification={alertItem}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onClose={() => setOpen(false)}
                  />
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* HUD LEVEL 3: ADMINISTRATIVE FULL INDEX AUDIT CONTROLS FOOTER */}
        {notifications.length > 0 && (
          <div className="p-3.5 bg-muted/20 border-t border-border/10 select-none w-full shrink-0">
            <Button
              variant="outline"
              type="button"
              className="w-full h-9 rounded-xl border border-border/60 text-muted-foreground font-extrabold uppercase text-[10px] tracking-wide gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all shadow-sm group flex items-center justify-center cursor-pointer active:scale-[0.995]"
              onClick={handleFullRegistryAuditRedirect}
            >
              <span>Audit Broad Activity Registry</span>
              <ShieldCheck className="h-4 w-4 text-current opacity-60 group-hover:opacity-100 transition-opacity stroke-[2.2] shrink-0" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
