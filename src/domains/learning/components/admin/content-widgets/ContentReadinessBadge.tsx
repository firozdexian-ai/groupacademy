import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Video, Activity, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Readiness Telemetry Node
 * Now reflects the DB rule: a recorded course is auto-active only when EVERY module
 * is "playable" (has a video URL OR at least one non-empty resource URL).
 */

export interface ModuleStats {
  module_count: number;
  modules_with_desc: number;
  modules_with_video: number;
  /** Modules that satisfy the active rule (video_url OR ≥1 resource_url) */
  playable_modules?: number;
}

interface ContentReadinessBadgeProps {
  stats: ModuleStats | undefined;
  /** Platform-computed `content.is_ready` (drives the live filter on talent app) */
  isReady?: boolean;
  /** Whether this content is gated by the playable-module rule */
  appliesPlayableRule?: boolean;
  className?: string;
  /** When true, renders a single compact status pill instead of the bar */
  compact?: boolean;
}

function getStatusInfo(stats: ModuleStats | undefined, appliesPlayableRule: boolean, isReady?: boolean) {
  if (!stats || stats.module_count === 0) {
    return {
      tone: "destructive" as const,
      label: "Inactive",
      reason: "No modules added yet.",
    };
  }
  if (appliesPlayableRule) {
    const playable = stats.playable_modules ?? 0;
    const missing = Math.max(0, stats.module_count - playable);
    if (missing > 0) {
      return {
        tone: "amber" as const,
        label: "Inactive",
        reason: `${missing}/${stats.module_count} module${missing === 1 ? "" : "s"} missing video or resource — auto-hidden from talent app.`,
      };
    }
  }
  if (isReady === false) {
    return { tone: "amber" as const, label: "Inactive", reason: "Marked not-ready by platform rules." };
  }
  return { tone: "emerald" as const, label: "Active", reason: "All modules playable. Visible to talents." };
}

const toneClasses: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
};

const ContentReadinessBadge = ({
  stats,
  isReady,
  appliesPlayableRule = true,
  className,
  compact = false,
}: ContentReadinessBadgeProps) => {
  const status = getStatusInfo(stats, appliesPlayableRule, isReady);
  const ToneIcon = status.tone === "emerald" ? CheckCircle2 : status.tone === "amber" ? AlertTriangle : Activity;

  if (compact) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "rounded-md font-black text-[8px] uppercase tracking-[0.18em] px-2 py-0.5 border gap-1",
          toneClasses[status.tone],
          className,
        )}
        title={status.reason}
      >
        <ToneIcon className="w-2.5 h-2.5" />
        {status.label}
      </Badge>
    );
  }

  if (!stats || stats.module_count === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <Badge
          variant="outline"
          className={cn("rounded-md font-black text-[9px] uppercase tracking-widest gap-1.5", toneClasses[status.tone])}
        >
          <ToneIcon className="w-3 h-3" /> {status.label}
        </Badge>
        <p className="text-[10px] font-medium text-muted-foreground italic flex items-center gap-1.5">
          <Layers className="w-3 h-3" /> {status.reason}
        </p>
      </div>
    );
  }

  const descPct = Math.round((stats.modules_with_desc / stats.module_count) * 100);
  const videoPct = Math.round((stats.modules_with_video / stats.module_count) * 100);
  const playablePct = Math.round(((stats.playable_modules ?? stats.modules_with_video) / stats.module_count) * 100);

  const getStatusColor = (pct: number) =>
    pct === 100 ? "text-emerald-500" : pct > 0 ? "text-amber-500" : "text-destructive";

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={cn("rounded-md font-black text-[9px] uppercase tracking-widest gap-1.5", toneClasses[status.tone])}
        >
          <ToneIcon className="w-3 h-3" /> {status.label}
        </Badge>
        {playablePct === 100 && (
          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-tighter px-1.5 h-4 gap-1">
            <Sparkles className="w-2.5 h-2.5 fill-current" /> READY
          </Badge>
        )}
      </div>

      {status.tone !== "emerald" && (
        <p className="text-[10px] font-medium text-muted-foreground italic leading-snug">{status.reason}</p>
      )}

      <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
        <Progress
          value={playablePct}
          className={cn("h-full transition-all duration-700", playablePct === 100 ? "bg-emerald-500" : "bg-primary")}
        />
      </div>

      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest flex-wrap">
        <div className="flex items-center gap-1 text-muted-foreground/70 italic">
          <Layers className="w-3 h-3 opacity-70" />
          {stats.module_count} MODULES
        </div>
        <div className={cn("flex items-center gap-1", getStatusColor(playablePct))}>
          <CheckCircle2 className="w-3 h-3 opacity-70" />
          {playablePct}% PLAYABLE
        </div>
        <div className={cn("flex items-center gap-1", getStatusColor(videoPct))}>
          <Video className="w-3 h-3 opacity-70" />
          {videoPct}% VIDEO
        </div>
        <div className={cn("flex items-center gap-1", getStatusColor(descPct))}>
          <FileText className="w-3 h-3 opacity-70" />
          {descPct}% SPEC
        </div>
      </div>
    </div>
  );
};

export default ContentReadinessBadge;
