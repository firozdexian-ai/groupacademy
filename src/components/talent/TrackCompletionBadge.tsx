import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  count: number;
  className?: string;
}

export function TrackCompletionBadge({ count, className }: Props) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#33E1E4]/30 bg-[#33E1E4]/10 text-[#33E1E4] text-[11px]",
        className,
      )}
      title={`${count} learning track${count === 1 ? "" : "s"} completed`}
    >
      <Layers className="h-3 w-3" />
      {count} track{count === 1 ? "" : "s"}
    </span>
  );
}
