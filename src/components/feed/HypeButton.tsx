import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHype } from "@/hooks/useHype";

interface HypeButtonProps {
  postId: string;
  initialCount?: number;
}

/**
 * Paid 🔥 Hype button — costs 1 credit, 80% goes to the creator's earned wallet.
 */
export function HypeButton({ postId, initialCount = 0 }: HypeButtonProps) {
  const { count, hype, isHyping } = useHype(postId, initialCount);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isHyping}
      onClick={hype}
      className={cn(
        "h-8 gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold",
        "text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 active:scale-95 transition-all",
      )}
      title="Hype this post (1 credit → creator)"
    >
      <Flame className={cn("h-4 w-4", isHyping && "animate-bounce fill-current")} />
      <span>{count > 0 ? count.toLocaleString() : "Hype"}</span>
    </Button>
  );
}
