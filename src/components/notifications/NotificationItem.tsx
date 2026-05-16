import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { X, Zap, ShieldCheck, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackError, trackEvent } from "@/lib/errorTracking";
import {
  getNotificationIcon,
  getNotificationColor,
  formatRelativeTime,
  isAgenticNotification,
  type Notification,
} from "@/lib/notificationHelpers";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Realtime Notification Ledger Row Entry Node (NotificationItem)
 * An authoritative layout wrapper orchestrating candidate alert dispatches, telemetry logs, and state sanitization.
 * Version: Launch Candidate · Phase Z0 Hardened
 */

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete, onClose }: NotificationItemProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const Icon = getNotificationIcon(notification.icon, notification.type);
  const iconColorClass = getNotificationColor(notification.type);

  // Monitor single entry notifications item impressions safely via metrics parameters
  useEffect(() => {
    if (notification?.id) {
      trackEvent("notification_entry_item_rendered", {
        alertId: notification.id,
        alertType: notification.type,
        isReadStatus: !!notification.isRead,
      });
    }
  }, [notification?.id, notification?.type, notification?.isRead]);

  if (!notification || !notification.id) {
    trackError("NotificationItem received an un-calibrated structural model prop context.", {
      component: "NotificationItem",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const handleHandshakeNavigationSequence = async () => {
    trackEvent("notification_entry_selected", { alertId: notification.id, targetLink: notification.link });

    try {
      if (!notification.isRead) {
        await onMarkAsRead(notification.id);
        // Automated Efficiency: Synchronize cache matrices globally to cascade balance changes instantly
        queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
        queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      }

      if (notification.link) {
        navigate(notification.link);
        if (onClose) onClose();
      }
    } catch (err) {
      trackError(err, {
        component: "NotificationItem",
        action: "execute_handshake_navigation_callback",
        targetLink: notification.link,
      });
    }
  };

  const handlePruningRegistryErase = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Registry Protection: Block event propagation from firing parent routing pipelines
    trackEvent("notification_entry_pruning_requested", { alertId: notification.id });

    try {
      onDelete(notification.id);
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    } catch (err) {
      trackError(err, {
        component: "NotificationItem",
        action: "execute_pruning_registry_erase_callback",
      });
    }
  };

  // Safe Memoized Normalization Pass: Eliminate string layout fracture risks down typography layers
  const normalizedDisplayTitle = useMemo(() => {
    const rawFallbackedStringTitle = notification.title || "SYSTEM_ALIGNED_ALERT_NODE";
    return rawFallbackedStringTitle.trim().replace(/\s+/g, "_");
  }, [notification.title]);

  const isAgenticAlertNode = isAgenticNotification(notification.type);

  return (
    <div
      type="button"
      onClick={handleHandshakeNavigationSequence}
      className={cn(
        "group relative flex items-start gap-4 p-4 transition-all duration-300 border-l-4 outline-none focus-visible:bg-muted/30 cursor-pointer transform-gpu text-left select-none sm:select-text w-full min-w-0 overflow-hidden",
        notification.isRead
          ? "bg-transparent border-transparent hover:bg-muted/10"
          : "bg-primary/[0.025] dark:bg-primary/[0.005] border-primary hover:bg-primary/[0.05] animate-in fade-in slide-in-from-left-1 duration-200",
      )}
    >
      {/* HUD ICON FRAME CORE SHIELD LAYER */}
      <div
        className={cn(
          "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border transition-transform duration-500 transform group-hover:scale-105 shadow-sm select-none",
          iconColorClass,
          "bg-background dark:bg-card border-border/40",
        )}
      >
        <Icon className="h-4.5 w-4.5 stroke-[2.2]" />
      </div>

      {/* METADATA TRACK CLUSTER INFRASTRUCTURE AREA */}
      <div className="flex-1 min-w-0 space-y-1 text-left flex flex-col justify-center leading-none">
        <div className="flex items-center gap-2 select-none leading-none w-full">
          <span
            className={cn(
              "text-xs font-black uppercase italic tracking-wide truncate text-ellipsis pr-1 max-w-[85%] block leading-none",
              notification.isRead ? "text-foreground/70" : "text-foreground font-extrabold",
            )}
          >
            {normalizedDisplayTitle}
          </span>
          {!notification.isRead && (
            <Zap className="h-3 w-3 text-primary animate-pulse fill-primary/10 stroke-[2.5] shrink-0" />
          )}
        </div>

        {/* Messaging Text Payload Area Block */}
        <p className="text-[11px] font-semibold text-muted-foreground/80 line-clamp-2 text-ellipsis break-words leading-relaxed italic select-text pr-4">
          {notification.message || "Algorithmic telemetry documentation content payload missing."}
        </p>

        {/* Timing Chronology indicators lines */}
        <div className="flex flex-wrap items-center gap-2 pt-1.5 select-none text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 tabular-nums leading-none">
          {isAgenticAlertNode && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 h-4.5 text-[8px] font-extrabold tracking-widest text-primary border border-primary/5 shadow-sm">
              <Sparkles className="h-2.5 w-2.5 text-primary fill-primary/10 stroke-[2.2]" />
              <span>AI General Engine</span>
            </span>
          )}
          <Clock className="h-3 w-3 text-muted-foreground/30 stroke-[2.2] shrink-0" />
          <span className="pt-0.5">
            SYNC_
            {formatRelativeTime(
              notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
            ).toUpperCase()}
          </span>
        </div>
      </div>

      {/* COMMAND INTERACTION BUTTON PLUG REGISTRY PRUNING TRACK */}
      <div className="flex flex-col justify-center items-center h-full shrink-0 select-none z-10 relative ml-auto pl-1">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-500 active:scale-90 cursor-pointer shadow-none flex items-center justify-center border border-transparent hover:border-rose-500/10"
          onClick={handlePruningErase}
          aria-label={`Erase system log parameter notification artifact row for ${notification.title}`}
        >
          <X className="h-4 w-4 stroke-[2.5]" />
        </Button>
      </div>

      {/* INTERMEDIARY CONTRAST GRAPHIC GLOW BACKDROP VECTOR */}
      {!notification.isRead && (
        <div className="absolute -right-6 -top-6 h-14 w-14 rounded-full bg-primary/5 blur-2xl pointer-events-none select-none" />
      )}
    </div>
  );
}
