import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { trackError, trackEvent } from "@/lib/errorTracking";

interface PostAuthorProps {
  name: string;
  title?: string;
  avatar?: string;
  createdAt: string;
  contextData?: {
    postId?: string;
    talentId?: string;
  };
}

/**
 * Premium user identity and author metadata header.
 * Displays author details and publication relative timestamps dynamically.
 */
export function PostAuthor({ name, title, avatar, createdAt, contextData }: PostAuthorProps) {
  
  // Track metadata rendering for active content engagement metrics
  useEffect(() => {
    if (contextData?.postId) {
      trackEvent("post_author_rendered", {
        postId: contextData.postId,
        hasTitle: !!title,
        hasAvatar: !!avatar,
      });
    }
  }, [contextData, title, avatar]);

  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";

  let timeAgo = "";
  try {
    const dateInstance = new Date(createdAt);
    if (isNaN(dateInstance.getTime())) {
      throw new Error(`Invalid or non-canonical timestamp format received: [${createdAt}]`);
    }
    timeAgo = formatDistanceToNow(dateInstance, { addSuffix: true });
  } catch (err) {
    // Intercept date parsing exceptions silently to maintain view resilience
    trackError(err instanceof Error ? err : String(err), {
      component: "PostAuthor",
      action: "format_distance_to_now",
      rawCreatedAt: createdAt,
      authorName: name,
      ...contextData,
    });
    timeAgo = "recently";
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0 w-full antialiased selection:bg-primary/20">
      {/* User Interactive Profile Avatar Block */}
      <Avatar className="h-9 w-9 shrink-0 border border-border/30 shadow-sm select-none">
        <AvatarImage src={avatar || undefined} alt={`${name}'s profile photo`} className="object-cover" />
        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary uppercase select-none">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Author Text Metadata Layout */}
      <div className="min-w-0 flex-1 flex flex-col text-left justify-center">
        <p className="text-sm font-bold text-foreground truncate tracking-tight leading-tight select-text w-full">
          {name || "Academy Member"}
        </p>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/90 truncate max-w-full select-none mt-0.5 leading-none">
          {title && (
            <span className="truncate max-w-[60%] text-ellipsis font-medium tracking-tight" title={title}>
              {title}
            </span>
          )}
          {title && timeAgo && <span className="opacity-40 font-bold select-none px-0.5 text-[10px]">&bull;</span>}
          {timeAgo && (
            <span className="whitespace-nowrap font-medium tracking-wide text-muted-foreground/70 lowercase">
              {timeAgo}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}