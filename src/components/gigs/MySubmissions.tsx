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
  pending: { label: "AUDITING", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  approved: {
    label: "VERIFIED",
    icon: ShieldCheck,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  rejected: { label: "CORRECTION", icon: AlertCircle, className: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-[32px] opacity-40" />
        ))}
      </div>
    );

  if (!submissions?.length)
    return (
      <div className="py-24 text-center border-2 border-dashed rounded-[40px] border-border/20 bg-muted/5">
        <Sparkles className="h-12 w-12 text-muted-foreground/10 mx-auto mb-6" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
          NO_ACTIVE_MISSIONS_SYNCED
        </p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      {submissions.map((sub: any) => {
        const config = STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
        const StatusIcon = config.icon;
        const isJobSharing = sub.gigs?.category === "job_sharing";
        const jobId = (sub.submission_data as any)?.job_id;
        const clicks = isJobSharing && jobId ? clickCounts?.[jobId] || 0 : null;
        const CLICK_THRESHOLD = 10;

        return (
          <div
            key={sub.id}
            className="group relative bg-card/30 backdrop-blur-xl rounded-[32px] p-6 border-2 border-border/40 hover:border-primary/40 transition-all shadow-xl"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase italic tracking-[0.2em] text-primary/60">
                    {sub.gigs?.title.replace(" ", "_")}
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-border/40" />
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase italic">
                    SYNC_{format(new Date(sub.created_at), "MMM_dd")}
                  </span>
                </div>
                <h4 className="font-black text-base uppercase italic tracking-tighter truncate leading-none">
                  {(sub.submission_data as any)?.job_title ||
                    (sub.submission_data as any)?.parsed_job?.title ||
                    "ARTIFACT_SUBMISSION"}
                </h4>
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] font-black uppercase italic tracking-widest px-3 h-7 border-2",
                    config.className,
                  )}
                >
                  <StatusIcon className="h-3.5 w-3.5 mr-2" /> {config.label}
                </Badge>
                {sub.status === "approved" && (
                  <div className="flex items-center gap-2 text-emerald-500 animate-in zoom-in">
                    <Coins className="h-4 w-4 fill-current" />
                    <span className="text-sm font-black italic">+{sub.credits_awarded} CR</span>
                  </div>
                )}
              </div>
            </div>

            {/* VIRAL_REACH_HUD: Real-time campaign tracking */}
            {isJobSharing && sub.status === "pending" && clicks !== null && (
              <div className="mt-6 space-y-4 bg-primary/5 rounded-[22px] p-5 border border-primary/20 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                      <MousePointerClick className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
                      Viral_Sync_Reach
                    </span>
                  </div>
                  <span className="text-[10px] font-black tabular-nums italic text-foreground">
                    {clicks}
                    <span className="text-muted-foreground/40 mx-1">/</span>
                    {CLICK_THRESHOLD} CLICKS
                  </span>
                </div>
                <Progress
                  value={Math.min((clicks / CLICK_THRESHOLD) * 100, 100)}
                  className="h-2 bg-primary/10 rounded-full"
                />

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 flex items-center gap-3 bg-background/50 rounded-xl px-4 py-2.5 border border-border/40 min-w-0 shadow-sm">
                    <Link2 className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                    <code className="text-[9px] font-bold text-muted-foreground truncate uppercase">
                      {`${window.location.origin}/jobs/${jobId}?ref=${talentRefCode}`}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl border-2 hover:bg-primary/5 hover:text-primary transition-all active:scale-90"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/jobs/${jobId}?ref=${talentRefCode}`);
                      setCopiedId(sub.id);
                      toast.success("LINK_SYNCED");
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                  >
                    {copiedId === sub.id ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* AUDIT_FEEDBACK: Correction Node */}
            {sub.admin_notes && (
              <div className="mt-5 flex gap-4 p-4 bg-rose-500/5 border-2 border-rose-500/10 rounded-2xl animate-in slide-in-from-top-2">
                <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 italic">
                    Faculty_Audit_Note:
                  </p>
                  <p className="text-xs font-medium text-rose-500 leading-relaxed italic">{sub.admin_notes}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
