import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Props {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  ctaLabel?: string;
  ctaLink?: string;
}

export function ChatBubble({ role, content, timestamp, ctaLabel, ctaLink }: Props) {
  const navigate = useNavigate();
  const isUser = role === "user";

  if (role === "system") {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 rounded-full bg-muted/60 text-[11px] text-muted-foreground font-medium">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full mb-1.5", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] px-3 py-2 rounded-2xl shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border/60 rounded-bl-md",
        )}
      >
        <p className="text-[14px] leading-snug whitespace-pre-wrap break-words">{content}</p>
        {ctaLabel && ctaLink && (
          <Button
            size="sm"
            variant={isUser ? "secondary" : "default"}
            className="mt-2 h-8 text-xs w-full"
            onClick={() => navigate(ctaLink)}
          >
            {ctaLabel}
          </Button>
        )}
        {timestamp && (
          <span
            className={cn(
              "block text-[10px] mt-1",
              isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground",
            )}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
