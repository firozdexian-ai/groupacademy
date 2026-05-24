import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Standard inline loading indicator. Use for centered "loading X" blocks
 * and small spinners inside buttons or disabled states.
 */
export function InlineSpinner({ label, size = "md", className }: InlineSpinnerProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";

  if (!label) {
    return <Loader2 className={cn(iconSize, "animate-spin", className)} aria-hidden="true" />;
  }

  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-2 text-sm text-muted-foreground py-6",
        className,
      )}
    >
      <Loader2 className={cn(iconSize, "animate-spin")} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default InlineSpinner;
