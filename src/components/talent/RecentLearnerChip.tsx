import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recencyScore: number;
  threshold?: number;
  className?: string;
}

/** Renders only when learning_recency_score is above threshold. */
export function RecentLearnerChip({
  recencyScore,
  threshold = 0.7,
  className,
}: Props) {
  if (recencyScore < threshold) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-success-green/30 bg-success-green/10 text-success-green text-[11px]",
        className,
      )}
      title="Active learner — recent learning activity in the last 30 days"
    >
      <Activity className="h-3 w-3" />
      Active learner
    </span>
  );
}
