import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useContentHype, type HypeContentType } from "@/hooks/useContentHype";

interface HypeButtonProps {
  postId?: string; // back-compat
  contentType?: HypeContentType;
  contentId?: string;
  initialCount?: number;
  variant?: "default" | "compact";
}

/**
 * Universal Hype button — 1 credit/tap. Works for posts, courses, videos, articles.
 */
export function HypeButton({ postId, contentType, contentId, initialCount = 0, variant = "default" }: HypeButtonProps) {
  const finalType: HypeContentType = contentType ?? "post";
  const finalId = contentId ?? postId ?? "";
  const { count, hype, isHyping } = useContentHype(finalType, finalId, initialCount);

  if (!finalId) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isHyping}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        hype();
      }}
      className={cn(
        "h-8 gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold",
        "text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 active:scale-95 transition-all",
        variant === "compact" && "px-2",
      )}
      title="Hype this (1 credit)"
    >
      <Flame className={cn("h-4 w-4", isHyping && "animate-bounce fill-current")} />
      <span>{count > 0 ? count.toLocaleString() : "Hype"}</span>
    </Button>
  );
}
