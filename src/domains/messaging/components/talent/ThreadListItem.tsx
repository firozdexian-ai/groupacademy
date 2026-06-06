import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Bot, Pin, Sparkles } from "lucide-react";
import { formatRelativeTime } from "@/lib/notificationHelpers";
import { cn } from "@/lib/utils";
import type { MessageThread } from "@/domains/messaging/hooks/useMessageThreads";

interface Props {
  thread: MessageThread;
  onClick: () => void;
}

/**
 * GroUp Academy: Messaging Thread Directory List Item Node (ThreadListItem)
 * An authoritative operational row rendering agent contexts, pin metrics, and unread badge indices.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ThreadListItem({ thread, onClick }: Props) {
  const queryClient = useQueryClient();
  const unread = typeof thread.unread_count === "number" && thread.unread_count > 0;
  const isSystem = thread.thread_type === "system";

  // Monitor conversational line selection views via telemetry indicators
  useEffect(() => {
    if (thread?.id) {
      trackEvent("chat_thread_list_item_rendered", {
        threadId: thread.id,
        threadType: thread.thread_type,
        isPinned: !!thread.is_pinned,
        isUnread: unread,
      });
    }
  }, [thread?.id, thread?.thread_type, thread?.is_pinned, unread]);

  if (!thread || !thread.id) {
    trackError("ThreadListItem received a null or un-calibrated structural model prop.", {
      component: "ThreadListItem",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const handleThreadSelectionClick = () => {
    trackEvent("chat_thread_row_selected", { threadId: thread.id, currentUnread: thread.unread_count });

    // Automated Efficiency: Synchronize notification caches globally across layout headers instantly
    if (unread) {
      queryClient.invalidateQueries({ queryKey: ["message-threads"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    }

    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleThreadSelectionClick}
      className={cn(
        "w-full flex items-center gap-3.5 px-3.5 py-3 transition-colors text-left border-b border-border/10 outline-none focus-visible:bg-muted/30 transform-gpu select-none min-w-0",
        "hover:bg-muted/20 active:bg-muted/40",
        unread ? "bg-primary/[0.015] dark:bg-primary/[0.005]" : "bg-transparent",
      )}
    >
      {/* COMPOSITE AVATAR MARKER FRAME */}
      <div className="relative shrink-0 select-none">
        <Avatar className="h-11 w-11 rounded-full border border-border/10 shadow-sm bg-muted flex items-center justify-center overflow-hidden">
          {thread.agentAvatarUrl && (
            <AvatarImage
              src={thread.agentAvatarUrl}
              alt={`${thread.agentName || "Agent"} interaction hub profile snap`}
              className="w-full h-full object-cover border-none"
              loading="lazy"
            />
          )}
          {/* Theme Hardening: Replaced dirty inline style calculations with semantic structural utility bindings */}
          <AvatarFallback
            className={cn(
              "rounded-full text-primary-foreground font-extrabold flex items-center justify-center w-full h-full shadow-inner",
              isSystem ? "bg-primary dark:bg-primary" : "bg-success dark:bg-success",
            )}
          >
            {isSystem ? (
              <Sparkles className="h-4.5 w-4.5 text-primary-foreground stroke-[2.2] animate-pulse" />
            ) : (
              <Bot className="h-4.5 w-4.5 text-primary-foreground stroke-[2.2]" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Persistent sticky pinning badge element */}
        {thread.is_pinned && (
          <span className="absolute -bottom-0.5 -right-0.5 bg-background border border-border/40 rounded-full p-0.5 shadow-sm animate-in zoom-in-50">
            <Pin className="h-3 w-3 text-muted-foreground stroke-[2.5]" fill="currentColor" />
          </span>
        )}
      </div>

      {/* METADATA CONTENT AREA PANEL COLUMN */}
      <div className="flex-1 min-w-0 flex flex-col justify-center leading-none">
        {/* ROW FRAME 1: IDENTITY TARGET LABEL STRIP */}
        <div className="flex items-center justify-between gap-3 w-full leading-none select-none">
          <span
            className={cn(
              "truncate text-sm tracking-tight",
              unread ? "font-extrabold text-foreground tracking-tight" : "font-semibold text-foreground/80",
            )}
          >
            {thread.agentName || "System Notification"}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider tabular-nums shrink-0",
              unread ? "text-primary font-black" : "text-muted-foreground/60",
            )}
          >
            {formatRelativeTime(thread.last_message_at)}
          </span>
        </div>

        {/* ROW FRAME 2: LAST MESSAGE CONTEXT ARRAY SLICE PREVIEW */}
        <div className="flex items-center justify-between gap-4 mt-1.5 w-full leading-none font-medium text-xs">
          <p
            className={cn(
              "truncate text-ellipsis break-all pr-1 flex-1 select-text selection:bg-primary/10 leading-none",
              unread ? "text-foreground/90 font-bold" : "text-muted-foreground/80 font-medium",
            )}
          >
            {thread.last_message_preview ? thread.last_message_preview.trim() : "No messages yet."}
          </p>

          {unread && (
            <Badge className="h-4.5 min-w-4.5 px-1.5 rounded-full border-none bg-primary text-primary-foreground text-[9px] font-black tabular-nums select-none shadow-sm flex items-center justify-center shrink-0 leading-none">
              {Number(thread.unread_count) > 99 ? "99+" : thread.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
