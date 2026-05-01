import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bot, Pin, Sparkles } from "lucide-react";
import { formatRelativeTime } from "@/lib/notificationHelpers";
import { cn } from "@/lib/utils";
import type { MessageThread } from "@/hooks/useMessageThreads";

interface Props {
  thread: MessageThread;
  onClick: () => void;
}

export function ThreadListItem({ thread, onClick }: Props) {
  const unread = thread.unread_count > 0;
  const isSystem = thread.thread_type === "system";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left border-b border-border/40",
        "hover:bg-muted/40 active:bg-muted/60",
        unread && "bg-primary/[0.02]",
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 rounded-full">
          {thread.agentAvatarUrl && <AvatarImage src={thread.agentAvatarUrl} alt={thread.agentName} />}
          <AvatarFallback
            className="rounded-full text-white font-bold"
            style={{ backgroundColor: thread.agentColor || (isSystem ? "#2A7DDE" : "#10D576") }}
          >
            {isSystem ? <Sparkles className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        {thread.is_pinned && (
          <span className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
            <Pin className="h-3 w-3 text-muted-foreground" fill="currentColor" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-[15px]", unread ? "font-bold text-foreground" : "font-medium text-foreground/90")}>
            {thread.agentName}
          </span>
          <span className={cn("text-[11px] shrink-0", unread ? "text-primary font-bold" : "text-muted-foreground")}>
            {formatRelativeTime(thread.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className={cn("truncate text-[13px]", unread ? "text-foreground/80" : "text-muted-foreground")}>
            {thread.last_message_preview || "No messages yet"}
          </span>
          {unread && (
            <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {thread.unread_count > 99 ? "99+" : thread.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
