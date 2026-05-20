import { useMemo } from "react";
import { formatDistanceToNow, isValid } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PipelineApplication } from "@/domains/jobs";
import { cn } from "@/lib/utils";
import { Briefcase, Sparkles, UserCheck } from "lucide-react";

interface ApplicationKanbanCardProps {
  app: PipelineApplication;
  onClick: () => void;
  className?: string; // Support layout extensions from parent lane views smoothly
}

/**
 * GroUp Academy: Sourcing Pipeline Kanban Card Primitive (V5.6.0)
 * CTO Reference: High-performance discrete visual card displaying candidate candidate credentials.
 * Architecture: Optimized via memoized date parsers eliminating render-time object instantiation leaks.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function ApplicationKanbanCard({ app, onClick, className }: ApplicationKanbanCardProps) {
  // --- PHASE: MEMOIZED_TEMPORAL_NORMALIZATION ---
  // Architecture Fix: Prevent redundant date instantiations and engine layout loops during lane updates
  const relativeTimeLabel = useMemo((): string => {
    const rawTimestampSource = app.last_status_at ?? app.created_at;
    if (!rawTimestampSource) return "Recent Ingress";

    const computedDateInstance = new Date(rawTimestampSource);

    // Defensive Guard: Check structural date validity parameters before parsing text streams
    if (!isValid(computedDateInstance)) {
      return "Synchronized";
    }

    try {
      return formatDistanceToNow(computedDateInstance, { addSuffix: true });
    } catch (err) {
      console.error("[Digital Workforce] FAULT: Failed to calculate relative time delta.", err);
      return "Active State";
    }
  }, [app.last_status_at, app.created_at]);

  // Clean title conversions normalize layouts natively
  const fallbackTalentName = useMemo(() => {
    return String(app.talent_name ?? "").trim() || "Anonymous Talent Node";
  }, [app.talent_name]);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "p-4 cursor-pointer hover:bg-accent/40 bg-card border-2 border-border/20 rounded-[20px] transition-all duration-300 space-y-3 shadow-sm select-none group text-left relative focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* COMPONENT: CANDIDATE_METADATA_BLOCK */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-black text-sm uppercase italic tracking-tight text-foreground truncate group-hover:text-primary transition-colors duration-300">
            {fallbackTalentName}
          </p>
          {app.talent_headline && (
            <p className="text-[11px] font-medium italic text-muted-foreground truncate leading-relaxed">
              {String(app.talent_headline).trim()}
            </p>
          )}
        </div>

        {/* METRICS HUD: BADGE_STATUS_ROW */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {typeof app.ai_match_score === "number" && (
            <Badge
              variant="secondary"
              className="font-black bg-primary/10 text-primary text-[10px] h-5 px-1.5 rounded-md"
            >
              🔥 {app.ai_match_score}%
            </Badge>
          )}
          {app.sourced && (
            <Badge
              variant="outline"
              className="text-[8px] font-mono font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border-cyan-500/20 h-4 px-1 rounded"
            >
              <UserCheck className="h-2 w-2 mr-0.5 text-cyan-400" /> Sourced
            </Badge>
          )}
        </div>
      </div>

      {/* FOOTER: POSITION_CONTEXT_ANCHORS */}
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-t border-border/10 pt-2.5 mt-1 font-mono">
        <span className="truncate pr-2 flex items-center gap-1">
          <Briefcase className="h-3 w-3 text-muted-foreground/40 shrink-0" /> {app.job_title || "General Allocation"}
        </span>
        <span className="shrink-0 italic opacity-80 tabular-nums">{relativeTimeLabel}</span>
      </div>
    </Card>
  );
}
