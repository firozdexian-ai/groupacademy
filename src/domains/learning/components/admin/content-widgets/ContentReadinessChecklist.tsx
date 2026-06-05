import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { setContentPublished, recomputeContentReadiness } from "@/domains/learning/repo/learningRepo";
import { toast } from "sonner";

import {
  computeChecks,
  readinessSummary,
  type ReadinessFormSnapshot,
  type CheckSeverity,
} from "@/lib/contentReadiness";
import type { ModuleStats } from "./ContentReadinessBadge";

interface Props {
  contentId: string;
  formData: ReadinessFormSnapshot;
  moduleStats: ModuleStats | undefined;
  moduleAudit: Array<{ id: string; title: string; reason: string }>;
  sessionCount: number;
  onRecomputed?: () => void;
}

const sevIcon = (s: CheckSeverity) =>
  s === "pass" ? CheckCircle2 : s === "warn" ? AlertTriangle : XCircle;

const sevTone: Record<CheckSeverity, string> = {
  pass: "text-success",
  warn: "text-warning",
  fail: "text-destructive",
};

function jumpToField(field?: string) {
  if (!field) return;
  const el = document.querySelector(`[data-readiness-field="${field}"]`) as HTMLElement | null;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-xl", "transition-all");
  setTimeout(() => el.classList.remove("ring-2", "ring-primary", "ring-offset-2"), 1800);
}

export default function ContentReadinessChecklist({
  contentId,
  formData,
  moduleStats,
  moduleAudit,
  sessionCount,
  onRecomputed,
}: Props) {
  const [busy, setBusy] = useState(false);
  const checks = useMemo(
    () => computeChecks(formData, moduleStats, moduleAudit, sessionCount),
    [formData, moduleStats, moduleAudit, sessionCount],
  );
  const sum = readinessSummary(checks);

  const recompute = async () => {
    setBusy(true);
    try {
      await recomputeContentReadiness(contentId);
      setBusy(false);
      toast.success("Readiness recomputed");
      onRecomputed?.();
    } catch (error: any) {
      setBusy(false);
      toast.error(error?.message ?? "Recompute failed");
    }
  };

  const forcePublish = async () => {
    setBusy(true);
    try {
      await setContentPublished(contentId, true);
    } catch (err: any) {
      setBusy(false);
      return toast.error(err?.message ?? "Force publish failed");
    }
    setBusy(false);
    toast.success("Force-published. Talent app may still hide it until is_ready = true.");

    onRecomputed?.();
  };

  const statusLabel = sum.blockers > 0
    ? `Inactive — ${sum.blockers} blocker${sum.blockers === 1 ? "" : "s"}`
    : sum.warnings > 0
    ? `Active with ${sum.warnings} warning${sum.warnings === 1 ? "" : "s"}`
    : "Ready to go live";

  return (
    <Card className="rounded-2xl border-border/40 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-black flex items-center justify-between">
          <span>Readiness</span>
          <Badge
            variant="outline"
            className={cn(
              "rounded-md text-[9px] font-black  border",
              sum.blockers > 0
                ? "border-destructive/40 text-destructive bg-destructive/5"
                : sum.warnings > 0
                ? "border-warning/40 text-warning bg-warning/5"
                : "border-success/40 text-success bg-success/5",
            )}
          >
            {sum.passed}/{sum.total}
          </Badge>
        </CardTitle>
        <Progress value={sum.pct} className="h-1.5 mt-2" />
        <p className="text-[10px] text-muted-foreground font-medium mt-1.5">{statusLabel}</p>
      </CardHeader>

      <CardContent className="space-y-1.5 pt-0">
        {checks.map((c) => {
          const Icon = sevIcon(c.severity);
          return (
            <div
              key={c.id}
              className={cn(
                "flex items-start gap-2 p-2 rounded-lg group hover:bg-muted/30 transition-colors",
                c.field && "cursor-pointer",
              )}
              onClick={() => c.field && jumpToField(c.field)}
            >
              <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", sevTone[c.severity])} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold leading-tight">{c.label}</p>
                {c.detail && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.detail}</p>
                )}
              </div>
              {c.field && c.severity !== "pass" && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 mt-0.5" />
              )}
            </div>
          );
        })}

        {moduleAudit.length > 0 && (
          <div className="pt-2 mt-2 border-t border-border/20 space-y-1">
            <p className="text-[9px] font-black text-warning">Modules blocking</p>
            {moduleAudit.slice(0, 5).map((m) => (
              <p key={m.id} className="text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">{m.title}</span> — {m.reason}
              </p>
            ))}
            {moduleAudit.length > 5 && (
              <p className="text-[10px] italic text-muted-foreground">+{moduleAudit.length - 5} more</p>
            )}
          </div>
        )}

        <div className="pt-3 mt-2 border-t border-border/20 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={recompute}
            className="rounded-xl text-[10px] font-bold"
          >
            <RefreshCw className={cn("w-3 h-3 mr-1.5", busy && "animate-spin")} /> Recompute
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={forcePublish}
                  className="rounded-xl text-[10px] font-bold text-warning border-warning/30"
                >
                  <Zap className="w-3 h-3 mr-1.5" /> Force Publish
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-[10px]">
                Sets is_published=true. The talent app's live filter still hides items where is_ready=false.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
