import { useNavigate } from "react-router-dom";
import { X, Zap, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotificationIcon,
  getNotificationColor,
  formatRelativeTime,
  type Notification,
} from "@/lib/notificationHelpers";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Alert Artifact
 * CTO Reference: Authoritative item for notification ledger synchronization.
 */

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete, onClose }: NotificationItemProps) {
  const navigate = useNavigate();
  const Icon = getNotificationIcon(notification.icon, notification.type);
  const iconColorClass = getNotificationColor(notification.type);

  const executeHandshake = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose?.();
    }
  };

  const executePruning = (e: React.MouseEvent) => {
    e.stopPropagation(); // Registry Protect: Prevent accidental navigation
    onDelete(notification.id);
  };

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-4 cursor-pointer transition-all duration-300 border-l-4 overflow-hidden",
        notification.isRead
          ? "bg-transparent border-transparent hover:bg-muted/10"
          : "bg-primary/5 border-primary hover:bg-primary/10 animate-in fade-in slide-in-from-left-1",
      )}
      onClick={executeHandshake}
    >
      {/* HUD: SEMANTIC_ICON */}
      <div
        className={cn(
          "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 shadow-lg",
          iconColorClass,
          "bg-current/10 border-current/20",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* HUD: CONTENT_CLUSTER */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-[13px] font-black uppercase italic tracking-tight truncate leading-none",
              notification.isRead ? "text-foreground/80" : "text-foreground",
            )}
          >
            {notification.title.replace(" ", "_")}
          </p>
          {!notification.isRead && <Zap className="h-3 w-3 text-primary animate-pulse fill-current" />}
        </div>

        <p className="text-[11px] font-medium text-muted-foreground/80 line-clamp-2 leading-relaxed italic">
          {notification.message}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <Clock className="h-3 w-3 text-muted-foreground/40" />
          <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest tabular-nums">
            SYNC_{formatRelativeTime(notification.createdAt).toUpperCase()}
          </p>
        </div>
      </div>

      {/* ACTION: PRUNING_NODE */}
      <div className="flex flex-col justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 hover:text-rose-500 active:scale-90"
          onClick={executePruning}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ATMOSPHERIC_GLOW: Subtle background artifact for unread status */}
      {!notification.isRead && (
        <div className="absolute -right-4 -top-4 h-16 w-16 bg-primary/5 blur-2xl rounded-full pointer-events-none" />
      )}
    </div>
  );
}
