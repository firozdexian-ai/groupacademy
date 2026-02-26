import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, Coins, User, Briefcase, MapPin, Phone, FileText, Share2, BookOpen, ExternalLink, Image, UserPlus, BriefcaseBusiness } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

function SubmissionPreview({ submission }: { submission: any }) {
  const data = submission.submission_data as any;
  const category = submission.gigs?.category;

  if (!data) return <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">No data</pre>;

  if (category === "cv_upload") {
    return (
      <div className="space-y-3">
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-1.5">
            <User className="h-4 w-4" /> Parsed Profile
          </h4>
          <div className="grid gap-1.5 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {data.parsed_name || "—"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {data.parsed_phone || "—"}</p>
            <p><span className="text-muted-foreground">Email:</span> {data.parsed_email || "—"}</p>
            {data.parsed_profession && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Profession:</span>
                <Badge variant="secondary" className="text-xs">{data.parsed_profession}</Badge>
              </div>
            )}
            {data.parsed_skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {data.parsed_skills.slice(0, 6).map((s: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </div>
          {data.cv_url && (
            <a href={data.cv_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-2">
              <ExternalLink className="h-3 w-3" /> View CV
            </a>
          )}
        </div>
        {data.outreach_message && (
          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3">
            <Label className="text-xs text-muted-foreground mb-1 block">WhatsApp Message</Label>
            <p className="text-xs whitespace-pre-wrap">{data.outreach_message}</p>
          </div>
        )}
      </div>
    );
  }

  if (category === "job_posting") {
    const job = data.parsed_job;
    return (
      <div className="space-y-3">
        {job && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> Parsed Job
            </h4>
            <div className="grid gap-1.5 text-sm">
              <p className="font-medium">{job.title || "—"}</p>
              <p><span className="text-muted-foreground">Company:</span> {job.company_name || "—"}</p>
              <p className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" /> {job.location || "—"}
              </p>
              {job.job_type && <Badge variant="secondary" className="text-xs w-fit">{job.job_type}</Badge>}
              {job.experience_level && <Badge variant="outline" className="text-xs w-fit">{job.experience_level}</Badge>}
            </div>
          </div>
        )}
        {data.source_image_url && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Source Screenshot</Label>
            <img src={data.source_image_url} alt="Source" className="rounded-lg max-h-48 object-cover w-full" />
          </div>
        )}
        {data.raw_text && (
          <details className="text-xs">
            <summary className="text-muted-foreground cursor-pointer">Raw text</summary>
            <pre className="bg-muted p-2 rounded mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">{data.raw_text}</pre>
          </details>
        )}
      </div>
    );
  }

  if (category === "job_sharing") {
    return (
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-sm flex items-center gap-1.5">
          <Share2 className="h-4 w-4" /> Share Details
        </h4>
        <div className="grid gap-1.5 text-sm">
          <p><span className="text-muted-foreground">Job:</span> {data.job_title || "—"}</p>
          <p><span className="text-muted-foreground">Company:</span> {data.job_company || "—"}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Shared on:</span>
            {data.channels_shared?.map((ch: string) => (
              <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
            ))}
          </div>
          {data.share_url && (
            <a href={data.share_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> View Job
            </a>
          )}
        </div>
      </div>
    );
  }

  if (category === "content_creation") {
    return (
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-sm flex items-center gap-1.5">
          <FileText className="h-4 w-4" /> Content: {data.content_type || "post"}
        </h4>
        {data.title && <p className="font-medium text-sm">{data.title}</p>}
        {data.text && <p className="text-sm whitespace-pre-wrap">{data.text}</p>}
        {data.body && <p className="text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{data.body}</p>}
        {data.poll_question && (
          <div className="space-y-1">
            <p className="text-sm font-medium">{data.poll_question}</p>
            {data.poll_options?.map((opt: string, i: number) => (
              <p key={i} className="text-xs text-muted-foreground ml-2">• {opt}</p>
            ))}
          </div>
        )}
        {data.image_url && (
          <img src={data.image_url} alt="Content" className="rounded-lg max-h-40 object-cover w-full" />
        )}
      </div>
    );
  }

  if (category === "course_resell") {
    return (
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-sm flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" /> Course Referral
        </h4>
        <div className="grid gap-1.5 text-sm">
          <p><span className="text-muted-foreground">Course:</span> {data.course_title || "—"}</p>
          {data.referral_link && (
            <a href={data.referral_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Referral Link
            </a>
          )}
        </div>
      </div>
    );
  }

  // Fallback: raw JSON
  return (
    <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap max-h-48 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function GigSubmissionsManager() {
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
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.rpc("award_gig_credits", {
        p_submission_id: submissionId,
        p_admin_notes: adminNotes || null,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Failed to approve");
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Approved! ${data.credits_awarded} credits awarded.`);
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase.rpc("reject_gig_submission", {
        p_submission_id: submissionId,
        p_admin_notes: adminNotes || null,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Failed to reject");
    },
    onSuccess: () => {
      toast.success("Submission rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const approveAndCreateTalentMutation = useMutation({
    mutationFn: async (submission: any) => {
      // 1. Award credits
      const { data: awardResult, error: awardError } = await supabase.rpc("award_gig_credits", {
        p_submission_id: submission.id,
        p_admin_notes: adminNotes || null,
      });
      if (awardError) throw awardError;
      const award = awardResult as any;
      if (!award?.success) throw new Error(award?.error || "Failed to approve");

      const sd = submission.submission_data as any;
      const email = sd?.parsed_email;
      if (!email) throw new Error("No email found in parsed CV data");

      // 2. Create/update talent via RPC
      const { error: talentError } = await supabase.rpc("get_or_create_talent", {
        p_email: email,
        p_full_name: sd.parsed_name || null,
        p_phone: sd.parsed_phone || null,
      });
      if (talentError) throw talentError;

      // 3. Update talent with CV URL, skills, profession
      const updateFields: any = {};
      if (sd.cv_url) updateFields.cv_url = sd.cv_url;
      if (sd.parsed_profession) updateFields.custom_profession = sd.parsed_profession;
      if (sd.parsed_skills?.length) updateFields.skills = sd.parsed_skills;

      if (Object.keys(updateFields).length > 0) {
        await supabase.from("talents").update(updateFields).ilike("email", email);
      }

      return award;
    },
    onSuccess: (data) => {
      toast.success(`Approved! ${data.credits_awarded} credits awarded & talent record created.`);
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const approveAndCreateJobMutation = useMutation({
    mutationFn: async (submission: any) => {
      // 1. Award credits
      const { data: awardResult, error: awardError } = await supabase.rpc("award_gig_credits", {
        p_submission_id: submission.id,
        p_admin_notes: adminNotes || null,
      });
      if (awardError) throw awardError;
      const award = awardResult as any;
      if (!award?.success) throw new Error(award?.error || "Failed to approve");

      const sd = submission.submission_data as any;
      const job = sd?.parsed_job;

      // 2. Insert job record
      const { error: jobError } = await supabase.from("jobs").insert({
        title: job?.title || "Untitled Position",
        company_name: job?.company_name || "Unknown Company",
        location: job?.location || null,
        job_type: job?.job_type || "full_time",
        experience_level: job?.experience_level || "entry",
        description: job?.description || sd?.raw_text || "",
        source_image_url: sd?.source_image_url || null,
        source_platform: "other" as any,
        is_active: true,
      });
      if (jobError) throw jobError;

      return award;
    },
    onSuccess: (data) => {
      toast.success(`Approved! ${data.credits_awarded} credits awarded & job listing created.`);
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pendingSubmissions = submissions?.filter((s: any) => s.status === "pending") || [];
  const processedSubmissions = submissions?.filter((s: any) => s.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Gig Submissions</h2>

      {/* Pending Queue */}
      <div>
        <h3 className="font-semibold text-sm mb-2">
          Pending Review ({pendingSubmissions.length})
        </h3>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talent</TableHead>
                <TableHead>Gig</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No pending submissions
                  </TableCell>
                </TableRow>
              ) : (
                pendingSubmissions.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{sub.talents?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{sub.talents?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{sub.gigs?.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.gigs?.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        {sub.gigs?.credit_reward}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(sub.created_at), "MMM d")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setAdminNotes("");
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {sub.gigs?.category === "cv_upload" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                            title="Approve & Create Talent"
                            onClick={() => approveAndCreateTalentMutation.mutate(sub)}
                            disabled={approveAndCreateTalentMutation.isPending}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        ) : sub.gigs?.category === "job_posting" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                            title="Approve & Create Job"
                            onClick={() => approveAndCreateJobMutation.mutate(sub)}
                            disabled={approveAndCreateJobMutation.isPending}
                          >
                            <BriefcaseBusiness className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                            onClick={() => approveMutation.mutate(sub.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => rejectMutation.mutate(sub.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Processed */}
      {processedSubmissions.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Processed ({processedSubmissions.length})</h3>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talent</TableHead>
                  <TableHead>Gig</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedSubmissions.slice(0, 50).map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-sm">{sub.talents?.full_name}</TableCell>
                    <TableCell className="text-sm">{sub.gigs?.title}</TableCell>
                    <TableCell>
                      <Badge variant={sub.status === "approved" ? "default" : "destructive"}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.credits_awarded || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {sub.reviewed_at ? format(new Date(sub.reviewed_at), "MMM d") : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedSubmission(sub); setAdminNotes(""); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Detail Dialog with Rich Preview */}
      <Dialog open={!!selectedSubmission} onOpenChange={(o) => !o && setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{selectedSubmission.talents?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedSubmission.talents?.email}</p>
                </div>
                <Badge variant="outline">{selectedSubmission.gigs?.category}</Badge>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Gig</Label>
                <p className="text-sm font-medium">{selectedSubmission.gigs?.title}</p>
              </div>

              {/* Rich Preview */}
              <SubmissionPreview submission={selectedSubmission} />

              {selectedSubmission.status === "pending" && (
                <>
                  <div className="space-y-2">
                    <Label>Admin Notes (optional)</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Feedback for the user..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedSubmission.gigs?.category === "cv_upload" && (
                      <Button
                        className="flex-1 gap-1"
                        onClick={() => approveAndCreateTalentMutation.mutate(selectedSubmission)}
                        disabled={approveAndCreateTalentMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4" /> Approve & Create Talent
                      </Button>
                    )}
                    {selectedSubmission.gigs?.category === "job_posting" && (
                      <Button
                        className="flex-1 gap-1"
                        onClick={() => approveAndCreateJobMutation.mutate(selectedSubmission)}
                        disabled={approveAndCreateJobMutation.isPending}
                      >
                        <BriefcaseBusiness className="h-4 w-4" /> Approve & Create Job
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="flex-1 gap-1"
                      onClick={() => approveMutation.mutate(selectedSubmission.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve Only
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-1"
                      onClick={() => rejectMutation.mutate(selectedSubmission.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </>
              )}

              {selectedSubmission.admin_notes && selectedSubmission.status !== "pending" && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground mb-1 block">Admin Notes</Label>
                  <p className="text-sm">{selectedSubmission.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
