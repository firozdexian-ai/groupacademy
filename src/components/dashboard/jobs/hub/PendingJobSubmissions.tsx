import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Eye, Loader2, ShieldCheck, Users, Zap, ClipboardCheck, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { JobFormDialog, type JobFormState } from "./JobFormDialog";
import { cn } from "@/lib/utils";

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
    const { error } = await supabase.rpc("reject_gig_submission", {
      p_submission_id: id,
      p_admin_notes: "Rejected via Jobs Hub Verification Gate",
    });

    if (error) return toast.error("Protocol Fault: " + error.message, { id: toastId });

    toast.success("Submission Node Terminated", { id: toastId });
    qc.invalidateQueries({ queryKey: ["pending-job-submissions"] });
  };

  const handlePublished = async () => {
    if (!editing) return;

    const toastId = toast.loading("Finalizing publication & reward protocol...");

    // ATOMIC SYNC: Approve submission and award fractional credits
    const { error } = await supabase.rpc("award_gig_credits", {
      p_submission_id: editing.submissionId,
      p_admin_notes: "Identity Verified: Published via Recruiter OS",
    });

    if (error) {
      toast.error(`Infra published, but ledger sync failed: ${error.message}`, { id: toastId });
    } else {
      toast.success("Node Verified & Contributor Rewarded", { id: toastId });
    }

    setEditing(null);
    qc.invalidateQueries({ queryKey: ["pending-job-submissions"] });
    qc.invalidateQueries({ queryKey: ["jobs-hub-manage"] });
  };

  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden text-left animate-in fade-in duration-500">
      <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-primary to-amber-400" />
      <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <ClipboardCheck className="h-7 w-7 text-primary" /> Verification_Queue
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
              Audit community crowdsourced job artifacts before registry deployment
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="h-10 px-5 rounded-xl border-2 font-black italic gap-2 bg-background/50 uppercase text-primary"
          >
            <Zap className="h-3.5 w-3.5 fill-current" /> {data?.length || 0} Pending_Nodes
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">Synchronizing Queue...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-16 border-2 border-dashed rounded-[32px] text-center opacity-30 italic font-black uppercase text-xs tracking-widest">
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
                  className="group flex items-center justify-between gap-4 p-5 rounded-[24px] border-2 border-border/20 bg-muted/5 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-primary/10 text-primary text-[8px] font-black border-none uppercase px-2 py-0">
                        GIG_SYNC
                      </Badge>
                      <p className="font-black text-sm uppercase italic tracking-tight truncate">
                        {cd.title || ai.title || "NULL_ARTIFACT_TITLE"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
                      <Users className="h-3 w-3" />
                      <span className="truncate">{cd.company || ai.company_name || "UNKNOWN_CORP"}</span>
                      <span className="opacity-30">|</span>
                      <span className="text-primary/70">BY: {sub.talents?.full_name || "ANONYMOUS_NODE"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-11 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg active:scale-95 transition-transform"
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
