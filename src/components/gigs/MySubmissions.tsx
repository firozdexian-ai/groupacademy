import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  MousePointerClick,
  Copy,
  Check,
  Link2,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Mission Audit Ledger
 * CTO Reference: Authoritative node for tracking gig completion and viral reach.
 */

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  approved: { label: "Approved", icon: ShieldCheck, className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  rejected: { label: "Rejected", icon: AlertCircle, className: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
};

export function MySubmissions({ talentId }: { talentId?: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // REGISTRY_SYNC: Fetch submission history
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["my-gig-submissions", talentId],
    enabled: !!talentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gig_submissions")
        .select("*, gigs(title, credit_reward, category)")
        .eq("talent_id", talentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: talentRefCode } = useQuery({
    queryKey: ["talent-ref-code", talentId],
    enabled: !!talentId,
    queryFn: async () => {
      const { data } = await supabase.from("talents").select("ref_code").eq("id", talentId!).single();
      return data?.ref_code;
    },
  });

  // TELEMETRY: Aggregate IDs for viral tracking
  const jobShareIds =
    submissions?.filter((s) => s.gigs?.category === "job_sharing").map((s) => (s.submission_data as any)?.job_id) || [];

  const { data: clickCounts } = useQuery({
    queryKey: ["share-click-counts", talentId, jobShareIds],
    enabled: jobShareIds.length > 0,
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const jobId of jobShareIds) {
        const { count } = await supabase
          .from("job_share_clicks")
          .select("*", { count: "exact", head: true })
          .eq("talent_id", talentId!)
          .eq("job_id", jobId);
        counts[jobId] = count || 0;
      }
      return counts;
    },
    refetchInterval: 30000,
  });

  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl opacity-40" />
        ))}
      </div>
    );

  if (!submissions?.length)
    return (
      <div className="py-12 text-center border border-dashed rounded-2xl border-border/40 bg-muted/10">
        <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-xs text-muted-foreground">No submissions yet — pick a task to start earning.</p>
      </div>
    );

  return (
    <div className="space-y-2 animate-in fade-in duration-500 text-left">
      {submissions.map((sub: any) => {
        const config = STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
        const StatusIcon = config.icon;
        const isJobSharing = sub.gigs?.category === "job_sharing";
        const jobId = (sub.submission_data as any)?.job_id;
        const clicks = isJobSharing && jobId ? clickCounts?.[jobId] || 0 : null;
        const CLICK_THRESHOLD = 10;
        const aiScore = sub.ai_score != null ? Number(sub.ai_score) : null;

        return (
          <div
            key={sub.id}
            className="bg-card/60 rounded-2xl px-3 py-3 border border-border/50 hover:border-primary/30 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-primary/80">{sub.gigs?.title}</span>
                  <span>·</span>
                  <span>{format(new Date(sub.created_at), "MMM dd")}</span>
                </div>
                <h4 className="font-bold text-sm leading-tight truncate mt-0.5">
                  {(sub.submission_data as any)?.job_title ||
                    (sub.submission_data as any)?.parsed_job?.title ||
                    (sub.submission_data as any)?.title ||
                    "Submission"}
                </h4>
                {sub.ai_feedback && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 italic">
                    {sub.ai_feedback}
                    {aiScore != null && (
                      <span className="ml-1 font-semibold not-italic text-primary">· AI {aiScore}/10</span>
                    )}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-bold px-2 h-6 gap-1 border", config.className)}
                >
                  <StatusIcon className="h-3 w-3" /> {config.label}
                </Badge>
                {sub.status === "approved" && sub.credits_awarded > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <Coins className="h-3 w-3" />+{sub.credits_awarded}
                  </span>
                )}
              </div>
            </div>

            {/* Viral reach widget — kept compact */}
            {isJobSharing && sub.status === "pending" && clicks !== null && (
              <div className="mt-3 space-y-2 bg-primary/5 rounded-xl p-3 border border-primary/15">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
                    <MousePointerClick className="h-3 w-3" /> Reach
                  </span>
                  <span className="text-[10px] font-bold tabular-nums">
                    {clicks}/{CLICK_THRESHOLD} clicks
                  </span>
                </div>
                <Progress value={Math.min((clicks / CLICK_THRESHOLD) * 100, 100)} className="h-1.5" />
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-background/70 rounded-lg px-2 py-1.5 border border-border/40 min-w-0">
                    <Link2 className="h-3 w-3 text-primary/50 shrink-0" />
                    <code className="text-[10px] truncate text-muted-foreground">
                      {`${window.location.origin}/jobs/${jobId}?ref=${talentRefCode}`}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/jobs/${jobId}?ref=${talentRefCode}`);
                      setCopiedId(sub.id);
                      toast.success("Link copied");
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                  >
                    {copiedId === sub.id ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {sub.admin_notes && !sub.ai_feedback && (
              <div className="mt-2 flex gap-2 p-2 bg-rose-500/5 border border-rose-500/15 rounded-lg">
                <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-rose-700 leading-snug">{sub.admin_notes}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
