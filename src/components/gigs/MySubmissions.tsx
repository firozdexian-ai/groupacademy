import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Coins, Clock, CheckCircle2, XCircle, FileText, MousePointerClick } from "lucide-react";
import { format } from "date-fns";

interface MySubmissionsProps {
  talentId?: string;
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" },
};

export function MySubmissions({ talentId }: MySubmissionsProps) {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["my-gig-submissions", talentId],
    enabled: !!talentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gig_submissions")
        .select("*, gigs(title, credit_reward, icon, category)")
        .eq("talent_id", talentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get click counts for pending job_sharing submissions
  const pendingJobShareSubs = submissions?.filter(
    (s: any) => s.status === "pending" && s.gigs?.category === "job_sharing" && (s.submission_data as any)?.job_id
  ) || [];

  const { data: clickCounts } = useQuery({
    queryKey: ["share-click-counts", talentId, pendingJobShareSubs.map((s: any) => (s.submission_data as any)?.job_id)],
    enabled: pendingJobShareSubs.length > 0,
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const sub of pendingJobShareSubs) {
        const jobId = (sub.submission_data as any)?.job_id;
        if (jobId) {
          const { count, error } = await supabase
            .from("job_share_clicks")
            .select("*", { count: "exact", head: true })
            .eq("talent_id", talentId!)
            .eq("job_id", jobId);
          if (!error) counts[jobId] = count || 0;
        }
      }
      return counts;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!submissions?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p>No submissions yet. Start completing gigs to earn credits!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((sub: any) => {
        const config = statusConfig[sub.status as keyof typeof statusConfig] || statusConfig.pending;
        const StatusIcon = config.icon;
        const isJobSharing = sub.gigs?.category === "job_sharing";
        const jobId = (sub.submission_data as any)?.job_id;
        const clicks = isJobSharing && jobId && clickCounts ? (clickCounts[jobId] || 0) : null;
        const CLICK_THRESHOLD = 10;

        const submissionData = sub.submission_data as any;
        const jobTitle = isJobSharing ? submissionData?.job_title : null;
        const companyName = isJobSharing ? submissionData?.company : null;
        const channelsShared = isJobSharing ? submissionData?.channels_shared : null;
        const displayTitle = jobTitle
          ? `${companyName ? companyName + " — " : ""}${jobTitle}`
          : sub.gigs?.title;

        return (
          <div key={sub.id} className="bg-card rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{displayTitle}</h4>
                {isJobSharing && jobTitle && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{sub.gigs?.title}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(sub.created_at), "MMM d, yyyy")}
                  </p>
                  {channelsShared && Array.isArray(channelsShared) && (
                    <span className="text-xs text-muted-foreground">
                      · {channelsShared.length} channel{channelsShared.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sub.status === "approved" && (
                  <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 gap-1">
                    <Coins className="h-3 w-3" />
                    +{sub.credits_awarded}
                  </Badge>
                )}
                <Badge className={`gap-1 ${config.className}`}>
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>
            </div>

            {/* Click progress for pending job sharing submissions */}
            {isJobSharing && sub.status === "pending" && clicks !== null && (
              <div className="mt-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3" />
                    {clicks}/{CLICK_THRESHOLD} clicks
                  </span>
                  <span className="text-muted-foreground">
                    {clicks >= CLICK_THRESHOLD ? "Auto-approving..." : `${CLICK_THRESHOLD - clicks} more needed`}
                  </span>
                </div>
                <Progress value={Math.min((clicks / CLICK_THRESHOLD) * 100, 100)} className="h-1.5" />
              </div>
            )}

            {sub.admin_notes && (
              <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded p-2 italic">
                {sub.admin_notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
