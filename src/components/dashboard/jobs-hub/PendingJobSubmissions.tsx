import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { JobFormDialog, type JobFormState } from "./JobFormDialog";

/**
 * Lists `gig_submissions` for `job_posting` gigs that are still pending.
 * Admin can open Job Form pre-filled from AI extraction, edit, then publish
 * (which inserts a job + auto-approves the submission via `award_gig_credits`).
 */
export function PendingJobSubmissions() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ initial: Partial<JobFormState>; submissionId: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pending-job-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gig_submissions")
        .select("*, gigs!inner(title, category, credit_reward), talents(full_name, email)")
        .eq("status", "pending")
        .eq("gigs.category", "job_posting")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleReview = (sub: any) => {
    const payload = sub.submission_data as any;
    const cd = payload?.curated_data || {};
    const ai = payload?.ai_meta || payload?.parsed_job || {};
    const initial: Partial<JobFormState> = {
      title: cd.title || ai.title || "",
      company_name: cd.company || ai.company_name || ai.company || "",
      location: cd.location || ai.location || "",
      job_type: ((cd.type || ai.job_type || "full_time").toLowerCase().replace(/\s|-/g, "_")) as any,
      experience_level: ai.experience_level || "mid",
      description: ai.description || payload?.raw_text || "",
      source_platform: "other",
      application_type: "link",
    };
    setEditing({ initial, submissionId: sub.id });
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.rpc("reject_gig_submission", {
      p_submission_id: id,
      p_admin_notes: "Rejected from Jobs Hub",
    });
    if (error) return toast.error(error.message);
    toast.success("Submission rejected");
    qc.invalidateQueries({ queryKey: ["pending-job-submissions"] });
  };

  const handlePublished = async () => {
    if (!editing) return;
    // Mark submission approved (awards credits via existing RPC)
    const { error } = await supabase.rpc("award_gig_credits", {
      p_submission_id: editing.submissionId,
      p_admin_notes: "Published via Jobs Hub",
    });
    if (error) toast.error(`Job published, but credit award failed: ${error.message}`);
    else toast.success("Job published & contributor rewarded");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["pending-job-submissions"] });
    qc.invalidateQueries({ queryKey: ["jobs-hub-manage"] });
  };

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Pending Gig Submissions</span>
          <Badge variant="secondary">{data?.length || 0} pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No job postings awaiting review.</p>
        ) : (
          data.map((sub: any) => {
            const payload = sub.submission_data as any;
            const cd = payload?.curated_data || {};
            const ai = payload?.ai_meta || payload?.parsed_job || {};
            return (
              <div
                key={sub.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {cd.title || ai.title || "Untitled job"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {cd.company || ai.company_name || "—"} · by {sub.talents?.full_name || sub.talents?.email}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="default" onClick={() => handleReview(sub)} className="gap-1">
                    <Eye className="h-3.5 w-3.5" /> Review & Publish
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleReject(sub.id)} title="Reject">
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
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
