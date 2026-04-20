import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Video, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Readiness Telemetry Node
 * High-fidelity diagnostic artifact for auditing module maturity and AI synthesis.
 * 2026 Standard: Executive Logic geometry with reinforced percentage rounding.
 */

export interface ModuleStats {
  module_count: number;
  modules_with_desc: number;
  modules_with_video: number;
}

interface ContentReadinessBadgeProps {
  stats: ModuleStats | undefined;
  className?: string;
}

const ContentReadinessBadge = ({ stats, className }: ContentReadinessBadgeProps) => {
  if (!stats || stats.module_count === 0) {
    return (
      <div
        className={cn(
          "text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic flex items-center gap-2",
          className,
        )}
      >
        <Activity className="w-3 h-3" /> Registry Node Null
      </div>
    );
  }

  const descPct = Math.round((stats.modules_with_desc / stats.module_count) * 100);
  const videoPct = Math.round((stats.modules_with_video / stats.module_count) * 100);

  // Logic Handshake: Overall readiness is the weighted average of core artifacts
  const overallPct = Math.round((descPct + videoPct) / 2);
  const isFullySynthesized = descPct === 100;

  const getStatusColor = (pct: number) =>
    pct === 100 ? "text-emerald-500" : pct > 0 ? "text-amber-500" : "text-destructive";

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
          <Progress
            value={overallPct}
            className={cn(
              "h-full transition-all duration-1000 ease-in-out",
              overallPct === 100 ? "bg-emerald-500" : "bg-primary",
            )}
          />
        </div>
        {isFullySynthesized && (
          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-tighter px-1.5 h-4 gap-1 animate-in zoom-in-50">
            <Sparkles className="w-2.5 h-2.5 fill-current" /> SYNC'D
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-1.5 text-muted-foreground/60 italic">
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          {stats.module_count} NODES
        </div>

        <div className={cn("flex items-center gap-1 transition-colors", getStatusColor(descPct))}>
          <FileText className="w-3 h-3 opacity-70" />
          <span>{descPct}% SPEC</span>
        </div>

        <div className={cn("flex items-center gap-1 transition-colors", getStatusColor(videoPct))}>
          <Video className="w-3 h-3 opacity-70" />
          <span>{videoPct}% VISUAL</span>
        </div>
      </div>
    </div>
  );
};

export default ContentReadinessBadge;
