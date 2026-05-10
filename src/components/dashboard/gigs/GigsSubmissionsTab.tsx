import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  XCircle,
  Eye,
  Coins,
  User,
  Briefcase,
  ExternalLink,
  Activity,
  ShieldCheck,
  Terminal,
  Layers,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Incentive Validation Terminal (Gig Submissions)
 * CTO Audit: Notifications schema aligned with strict DB types (talent_id, message, link).
 */

/* -----------------------------------------------------------
 * Schema Adapters — Logic Hardening
 * --------------------------------------------------------- */

function adaptCV(data: any) {
  const lp = data?.lead_profile || {};
  return {
    name: lp.name || data?.parsed_name || null,
    phone: lp.phone || data?.parsed_phone || null,
    email: lp.email || data?.parsed_email || null,
    profession: lp.profession || data?.parsed_profession || null,
    skills: data?.parsed_skills || lp.skills || [],
    cv_url: data?.cv_document || data?.cv_url || null,
    outreach: data?.generated_outreach || data?.outreach_message || null,
  };
}

function adaptJob(data: any) {
  const cd = data?.curated_data || {};
  const ai = data?.ai_meta || data?.parsed_job || {};
  return {
    title: cd.title || ai.title || null,
    company_name: cd.company || ai.company_name || ai.company || null,
    location: cd.location || ai.location || null,
    job_type: (cd.type || ai.job_type || "").toLowerCase().replace(/\s|-/g, "_") || null,
    experience_level: ai.experience_level || null,
    description: ai.description || data?.raw_text || (data?.input_method === "text" ? data?.source : "") || "",
    source_image_url: data?.source_image_url || (data?.input_method === "image" ? data?.source : null) || null,
    raw_text: data?.raw_text || (data?.input_method === "text" ? data?.source : null) || null,
    input_method: data?.input_method || (data?.source_image_url ? "image" : "text"),
  };
}

/* -----------------------------------------------------------
 * Payload Inspection Node
 * --------------------------------------------------------- */

function SubmissionPreview({ submission }: { submission: any }) {
  const data = submission.submission_data as any;
  const category = submission.gigs?.category;

  if (!data)
    return <div className="text-[10px] font-mono p-4 bg-muted/20 rounded-xl italic">NULL_PAYLOAD_DETECTED</div>;

  if (category === "cv_upload") {
    const cv = adaptCV(data);
    return (
      <div className="space-y-4">
        <div className="bg-muted/30 border-2 border-border/10 rounded-[24px] p-6 space-y-4 shadow-inner">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <User className="h-3.5 w-3.5" /> Artifact Spec: CV_ENTITY
          </h4>
          <div className="grid gap-3 text-sm">
            <p className="font-bold text-lg leading-none uppercase italic">{cv.name || "UNNAMED_NODE"}</p>
            <div className="flex flex-wrap gap-4 text-[11px] font-medium text-muted-foreground/60 italic uppercase tracking-wider">
              <span>{cv.phone}</span>
              <span>{cv.email}</span>
            </div>
            {cv.profession && (
              <Badge className="w-fit bg-primary/10 text-primary border-none font-black text-[9px] uppercase">
                {cv.profession}
              </Badge>
            )}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {cv.skills?.slice(0, 6).map((s: string, i: number) => (
                <Badge key={i} variant="outline" className="text-[9px] border-2 uppercase font-bold">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
          {cv.cv_url && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest gap-2"
              onClick={() => window.open(cv.cv_url, "_blank")}
            >
              <ExternalLink className="h-3 w-3" /> Interrogate CV
            </Button>
          )}
        </div>
        {cv.outreach && (
          <div className="bg-emerald-500/5 border-2 border-emerald-500/10 rounded-[24px] p-6">
            <Label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-3 block italic">
              Generated outreach payload
            </Label>
            <p className="text-xs font-medium leading-relaxed italic text-foreground/80">{cv.outreach}</p>
          </div>
        )}
      </div>
    );
  }

  if (category === "job_posting") {
    const job = adaptJob(data);
    return (
      <div className="bg-muted/30 border-2 border-border/10 rounded-[24px] p-6 space-y-4 shadow-inner">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
          <Briefcase className="h-3.5 w-3.5" /> Artifact Spec: JOB_LOG
        </h4>
        <div className="space-y-2">
          <p className="text-lg font-black italic uppercase leading-none">{job.title}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{job.company_name}</p>
          <div className="flex gap-2 pt-2">
            <Badge variant="outline" className="text-[9px] uppercase border-2 font-black">
              {job.job_type}
            </Badge>
            <Badge variant="outline" className="text-[9px] uppercase border-2 font-black">
              via_{job.input_method}
            </Badge>
          </div>
        </div>
        {job.source_image_url && (
          <img
            src={job.source_image_url}
            alt="Source"
            className="rounded-xl border-2 border-border/10 h-48 w-full object-cover"
          />
        )}
      </div>
    );
  }

  return (
    <pre className="text-[10px] font-mono bg-muted/20 p-4 rounded-xl overflow-auto max-h-48 leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

/* -----------------------------------------------------------
 * Terminal Execution Node
 * --------------------------------------------------------- */

export function GigsSubmissionsTab() {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin-gig-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gig_submissions")
        .select("*, gigs(title, credit_reward, category), talents(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (submission: any) => {
      const { data, error } = await supabase.rpc("award_gig_credits", {
        p_submission_id: submission.id,
        p_admin_notes: adminNotes || null,
      });

      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || "Protocol Failure");

      const creditsAwarded = (data as any).credits_awarded || submission.gigs?.credit_reward;

      // In-App Notification ONLY (Removed mismatched email dispatch)
      try {
        await supabase.from("notifications").insert({
          talent_id: submission.talent_id,
          title: "Gig Approved! 🎉",
          message: `Your submission for "${submission.gigs?.title}" was approved. You earned ${creditsAwarded} credits!`,
          type: "system",
          link: "/app/transactions",
        });
      } catch (notifErr) {
        console.warn("Failed to dispatch in-app notification", notifErr);
      }

      // Safe return bypassing object spread limitations
      return { rawPayload: data, creditsAwarded };
    },
    onSuccess: (result: any) => {
      toast.success(`Protocol Committed: ${result.creditsAwarded} tokens awarded and user notified.`);
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => {
      toast.error(`Approval Failed: ${err.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (submission: any) => {
      const { data, error } = await supabase.rpc("reject_gig_submission", {
        p_submission_id: submission.id,
        p_admin_notes: adminNotes || null,
      });

      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error || "Rejection logic failed");

      // In-App Notification ONLY (Removed mismatched email dispatch)
      try {
        await supabase.from("notifications").insert({
          talent_id: submission.talent_id,
          title: "Gig Review Update",
          message: `Your submission for "${submission.gigs?.title}" requires attention. Check your gig history for admin notes.`,
          type: "system",
          link: "/app/gigs",
        });
      } catch (notifErr) {
        console.warn("Failed to dispatch in-app notification", notifErr);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Artifact Purged: Submission rejected and user notified.");
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => {
      toast.error(`Rejection Failed: ${err.message}`);
    },
  });

  const pendingNodes = submissions?.filter((s: any) => s.status === "pending") || [];
  const processedNodes = submissions?.filter((s: any) => s.status !== "pending") || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Telemetry HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Pending Validation",
            val: pendingNodes.length,
            icon: Activity,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "Yield Distributed",
            val: processedNodes.filter((n) => n.status === "approved").length,
            icon: ShieldCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Logic Purged",
            val: processedNodes.filter((n) => n.status === "rejected").length,
            icon: XCircle,
            color: "text-destructive",
            bg: "bg-destructive/10",
          },
        ].map((kpi, i) => (
          <Card
            key={i}
            className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-sm"
          >
            <CardContent className="p-6 flex items-center gap-6">
              <div
                className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-6 shadow-inner",
                  kpi.bg,
                  "border-white/5",
                )}
              >
                <kpi.icon className={cn("h-7 w-7", kpi.color)} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                  {kpi.label}
                </p>
                <p className="text-3xl font-black tracking-tighter italic leading-none">{kpi.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Validation Registry */}
      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <Terminal className="h-6 w-6 text-primary" /> Validation Registry
              </CardTitle>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                Interrogating pending incentive handshakes
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] })}
              className="rounded-full hover:bg-primary/10"
            >
              <RefreshCw className={cn("h-5 w-5 text-primary", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8">
                  Talent Identity
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Incentive Node</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Logic Class</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Token Yield</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                  Validation
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingNodes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-20 italic opacity-20 font-black uppercase tracking-widest"
                  >
                    Queue Clear: All artifacts synchronized.
                  </TableCell>
                </TableRow>
              ) : (
                pendingNodes.map((sub: any) => (
                  <TableRow
                    key={sub.id}
                    className="group transition-all hover:bg-primary/[0.02] border-b-2 border-border/5 last:border-0"
                  >
                    <TableCell className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors leading-none">
                          {sub.talents?.full_name}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                          {sub.talents?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-xs uppercase italic tracking-tighter text-foreground/80">
                      {sub.gigs?.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-lg border-2 font-black text-[8px] uppercase tracking-widest bg-background"
                      >
                        {sub.gigs?.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-black italic text-sm text-primary">
                        <Coins className="h-3.5 w-3.5" /> {sub.gigs?.credit_reward} TKN
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-primary hover:text-white transition-all shadow-inner"
                          onClick={() => setSelectedSubmission(sub)}
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-emerald-500/40"
                          onClick={() => approveMutation.mutate(sub)}
                        >
                          <ShieldCheck className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-destructive hover:text-white transition-all text-destructive/40"
                          onClick={() => rejectMutation.mutate(sub)}
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Validation Node (Dialog) */}
      <Dialog open={!!selectedSubmission} onOpenChange={(o) => !o && setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-8 text-left">
              <div className="flex items-center gap-4">
                <Layers className="h-8 w-8 text-primary" />
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    Payload Inspection
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    Artifact verification protocol
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/10">
                <div className="space-y-1">
                  <p className="text-lg font-black italic uppercase leading-none">
                    {selectedSubmission?.talents?.full_name}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    {selectedSubmission?.gigs?.title}
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-3">
                  {selectedSubmission?.gigs?.category}
                </Badge>
              </div>

              <SubmissionPreview submission={selectedSubmission} />

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Administrative Logic (Notes)
                </Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Provide feedback or justification..."
                  rows={3}
                  className="rounded-2xl border-2 p-6 italic font-medium"
                />
              </div>

              <div className="pt-6 border-t border-border/10 flex gap-4">
                <Button
                  onClick={() => approveMutation.mutate(selectedSubmission)}
                  disabled={approveMutation.isPending}
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30 gap-2"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}{" "}
                  Commit Handshake
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => rejectMutation.mutate(selectedSubmission)}
                  disabled={rejectMutation.isPending}
                  className="h-14 px-8 rounded-2xl font-black uppercase text-[11px] tracking-widest text-destructive hover:bg-destructive/10"
                >
                  Reject Node
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
