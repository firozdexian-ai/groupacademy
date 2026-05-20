import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

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
 * Premium, performance-hardened User Identity and Author Metadata header.
 * Built according to GroUp Academy Phase Z0 highly professional SAAS UI specifications
 * and Digital Workforce automated data tracking guidelines.
 */
export function PostAuthor({ name, title, avatar, createdAt, contextData }: PostAuthorProps) {
  // Trace card meta rendering flags safely over data collection tracks
  useEffect(() => {
    if (contextData?.postId) {
      trackEvent("post_author_metadata_compiled", {
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
      .toUpperCase() || "??";

  let timeAgo = "";
  try {
    const dateInstance = new Date(createdAt);
    if (isNaN(dateInstance.getTime())) {
      throw new Error(`Malformed or non-canonical timestamp structure parsed: [${createdAt}]`);
    }
    timeAgo = formatDistanceToNow(dateInstance, { addSuffix: true });
  } catch (err) {
    // Intercept operational date exceptions securely via central trackError hooks
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
        <AvatarImage src={avatar || undefined} alt={`${name}'s professional profile photo`} className="object-cover" />
        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary uppercase select-none">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Structured Text Metadata Info Block */}
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
