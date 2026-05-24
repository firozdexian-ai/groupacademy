import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  rejectGigSubmission,
  awardGigCredits,
  listPendingJobSubmissions,
} from "@/domains/jobs/repo/jobsRepo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Eye, Loader2, ShieldCheck, Users, Zap, ClipboardCheck, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { JobFormDialog, type JobFormState } from "./JobFormDialog";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

/**
 * GroUp Academy: Community Submission Gatekeeper
 * CTO Reference: Ingress point for crowdsourced job nodes with atomic credit reward integration.
 */
export function PendingJobSubmissions() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ initial: Partial<JobFormState>; submissionId: string } | null>(null);

  // FETCH PROTOCOL: Filter for pending job-category gigs
  const { data, isLoading } = useQuery({
    queryKey: ["pending-job-submissions"],
    queryFn: () => listPendingJobSubmissions(),
  });

  const handleReview = (sub: any) => {
    const payload = sub.submission_data as any;
    const cd = payload?.curated_data || {};
    const ai = payload?.ai_meta || payload?.parsed_job || {};

    // NEURAL MERGE: Prioritize curated data, fallback to AI extraction
    const initial: Partial<JobFormState> = {
      title: cd.title || ai.title || "",
      company_name: cd.company || ai.company_name || ai.company || "",
      location: cd.location || ai.location || "",
      job_type: (cd.type || ai.job_type || "full_time").toLowerCase().replace(/\s|-/g, "_") as any,
      experience_level: ai.experience_level || "mid",
      description: ai.description || payload?.raw_text || "",
      source_platform: "other",
      application_type: "link",
    };
    setEditing({ initial, submissionId: sub.id });
  };

  const handleReject = async (id: string) => {
    const toastId = toast.loading("Processing rejection protocol...");
    try {
      await rejectGigSubmission({
        submissionId: id,
        adminNotes: "Rejected via Jobs Hub Verification Gate",
      });
      toast.success("Submission removed", { id: toastId });
      qc.invalidateQueries({ queryKey: ["pending-job-submissions"] });
    } catch (error: any) {
      toast.error("Could not remove: " + (error?.message ?? "unknown"), { id: toastId });
    }
  };

  const handlePublished = async () => {
    if (!editing) return;

    const toastId = toast.loading("Publishing and rewarding contributor...");

    // Approve submission and award fractional credits
    try {
      await awardGigCredits({
        submissionId: editing.submissionId,
        adminNotes: "Verified and published via admin",
      });
      toast.success("Published & contributor rewarded", { id: toastId });
    } catch (error: any) {
      toast.error(`Published, but reward failed: ${error?.message ?? "unknown"}`, { id: toastId });
    }

    setEditing(null);
    qc.invalidateQueries({ queryKey: ["pending-job-submissions"] });
    qc.invalidateQueries({ queryKey: ["jobs-hub-manage"] });
  };

  return (
    <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden text-left animate-in fade-in duration-500">
      <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-primary to-amber-400" />
      <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold uppercase italic tracking-tight flex items-center gap-3">
              <ClipboardCheck className="h-7 w-7 text-primary" /> Verification queue
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground italic">
              Review community-submitted jobs before publishing
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="h-10 px-5 rounded-xl border-2 font-semibold gap-2 bg-background/50 uppercase text-primary"
          >
            <Zap className="h-3.5 w-3.5 fill-current" /> {data?.length || 0} pending
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
            <InlineSpinner size="lg" />
            <p className="text-[10px] font-semibold">Loading queue…</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-16 border-2 border-dashed rounded-2xl text-center opacity-30 font-semibold uppercase text-xs tracking-widest">
            Verification queue is currently empty
          </div>
        ) : (
          <div className="grid gap-3">
            {data.map((sub: any) => {
              const payload = sub.submission_data as any;
              const cd = payload?.curated_data || {};
              const ai = payload?.ai_meta || payload?.parsed_job || {};

              return (
                <div
                  key={sub.id}
                  className="group flex items-center justify-between gap-4 p-5 rounded-xl border border-border/40 bg-muted/5 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-primary/10 text-primary text-[8px] font-semibold border-none uppercase px-2 py-0">
                        GIG
                      </Badge>
                      <p className="font-semibold text-sm uppercase italic tracking-tight truncate">
                        {cd.title || ai.title || "Untitled job"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground italic">
                      <Users className="h-3 w-3" />
                      <span className="truncate">{cd.company || ai.company_name || "Unknown company"}</span>
                      <span className="opacity-30">|</span>
                      <span className="text-primary/70">BY: {sub.talents?.full_name || "Anonymous"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-11 px-6 rounded-xl font-semibold uppercase text-[10px] tracking-widest gap-2 shadow-lg active:scale-95 transition-transform"
                      onClick={() => handleReview(sub)}
                    >
                      <Eye className="h-4 w-4" /> Review_Artifact
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-11 w-11 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => handleReject(sub.id)}
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {editing && (
        <JobFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          initialForm={editing.initial}
          onSaved={handlePublished}
        />
      )}
    </Card>
  );
}
