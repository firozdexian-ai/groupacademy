import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Coins,
  User,
  Briefcase,
  MapPin,
  FileText,
  Share2,
  BookOpen,
  ExternalLink,
  UserPlus,
  BriefcaseBusiness,
  MessageSquarePlus,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { emailNotifications } from "@/lib/emailNotifications";

/* -----------------------------------------------------------
 * Schema adapters — read whatever shape the user-side forms wrote.
 * Forms use richer/newer shapes; we adapt here so admin sees real data.
 * --------------------------------------------------------- */

function adaptCV(data: any) {
  // CVUploadGigForm writes { cv_document, lead_profile:{name,phone,email,profession}, generated_outreach }
  // Older code used { cv_url, parsed_name, ... }. Support both.
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
  // JobPostingGigForm writes { input_method, source, curated_data:{title,company,location,type}, ai_meta }
  // Legacy: { parsed_job:{...}, source_image_url, raw_text }
  const cd = data?.curated_data || {};
  const ai = data?.ai_meta || data?.parsed_job || {};
  return {
    title: cd.title || ai.title || null,
    company_name: cd.company || ai.company_name || ai.company || null,
    location: cd.location || ai.location || null,
    job_type: (cd.type || ai.job_type || "").toLowerCase().replace(/\s|-/g, "_") || null,
    experience_level: ai.experience_level || null,
    description: ai.description || data?.raw_text || (data?.input_method === "text" ? data?.source : "") || "",
    source_image_url:
      data?.source_image_url || (data?.input_method === "image" ? data?.source : null) || null,
    raw_text: data?.raw_text || (data?.input_method === "text" ? data?.source : null) || null,
    input_method: data?.input_method || (data?.source_image_url ? "image" : "text"),
  };
}

function adaptContent(data: any) {
  // ContentCreationGigForm writes { type, payload:{ text, title, image_url, poll:{question,options} } }
  // Legacy: { content_type, text, body, title, image_url, poll_question, poll_options }
  const p = data?.payload || {};
  return {
    type: data?.type || data?.content_type || "post",
    title: p.title || data?.title || null,
    text: p.text || data?.text || data?.body || null,
    image_url: p.image_url || data?.image_url || null,
    poll_question: p.poll?.question || data?.poll_question || null,
    poll_options: p.poll?.options || data?.poll_options || [],
  };
}

function adaptShare(data: any) {
  return {
    job_id: data?.job_id || null,
    job_title: data?.job_title || null,
    job_company: data?.job_company || null,
    channels: data?.channels || data?.channels_shared || [],
    share_url: data?.share_url || null,
    ref_code: data?.ref_code || null,
  };
}

function adaptCourse(data: any) {
  return {
    course_id: data?.course_id || null,
    course_title: data?.course_title || null,
    referral_link: data?.referral_link || null,
  };
}

/* -----------------------------------------------------------
 * Rich preview component
 * --------------------------------------------------------- */

function SubmissionPreview({ submission }: { submission: any }) {
  const data = submission.submission_data as any;
  const category = submission.gigs?.category;

  if (!data) return <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">No data</pre>;

  if (category === "cv_upload") {
    const cv = adaptCV(data);
    return (
      <div className="space-y-3">
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-1.5">
            <User className="h-4 w-4" /> Parsed Profile
          </h4>
          <div className="grid gap-1.5 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {cv.name || "—"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {cv.phone || "—"}</p>
            <p><span className="text-muted-foreground">Email:</span> {cv.email || "—"}</p>
            {cv.profession && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Profession:</span>
                <Badge variant="secondary" className="text-xs">{cv.profession}</Badge>
              </div>
            )}
            {cv.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {cv.skills.slice(0, 6).map((s: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </div>
          {cv.cv_url && (
            <a href={cv.cv_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-2">
              <ExternalLink className="h-3 w-3" /> View CV
            </a>
          )}
        </div>
        {cv.outreach && (
          <div className="bg-success/10 rounded-xl p-3">
            <Label className="text-xs text-muted-foreground mb-1 block">Generated Outreach</Label>
            <p className="text-xs whitespace-pre-wrap">{cv.outreach}</p>
          </div>
        )}
      </div>
    );
  }

  if (category === "job_posting") {
    const job = adaptJob(data);
    return (
      <div className="space-y-3">
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
            <div className="flex gap-1 flex-wrap">
              {job.job_type && <Badge variant="secondary" className="text-xs">{job.job_type}</Badge>}
              {job.experience_level && <Badge variant="outline" className="text-xs">{job.experience_level}</Badge>}
              <Badge variant="outline" className="text-xs">via {job.input_method}</Badge>
            </div>
          </div>
        </div>
        {job.source_image_url && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Source Screenshot</Label>
            <img src={job.source_image_url} alt="Source" className="rounded-lg max-h-48 object-cover w-full" />
          </div>
        )}
        {job.raw_text && (
          <details className="text-xs">
            <summary className="text-muted-foreground cursor-pointer">Raw text</summary>
            <pre className="bg-muted p-2 rounded mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">{job.raw_text}</pre>
          </details>
        )}
      </div>
    );
  }

  if (category === "job_sharing") {
    const sh = adaptShare(data);
    return (
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-sm flex items-center gap-1.5">
          <Share2 className="h-4 w-4" /> Share Details
        </h4>
        <div className="grid gap-1.5 text-sm">
          {sh.job_title && <p><span className="text-muted-foreground">Job:</span> {sh.job_title}</p>}
          {sh.job_company && <p><span className="text-muted-foreground">Company:</span> {sh.job_company}</p>}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted-foreground">Shared on:</span>
            {sh.channels?.length ? sh.channels.map((ch: string) => (
              <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
            )) : <span className="text-xs text-muted-foreground">none</span>}
          </div>
          {sh.share_url && (
            <a href={sh.share_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> View Share Link
            </a>
          )}
        </div>
      </div>
    );
  }

  if (category === "content_creation") {
    const c = adaptContent(data);
    return (
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-sm flex items-center gap-1.5">
          <FileText className="h-4 w-4" /> Content: {c.type}
        </h4>
        {c.title && <p className="font-medium text-sm">{c.title}</p>}
        {c.text && <p className="text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{c.text}</p>}
        {c.poll_question && (
          <div className="space-y-1">
            <p className="text-sm font-medium">{c.poll_question}</p>
            {c.poll_options?.map((opt: string, i: number) => (
              <p key={i} className="text-xs text-muted-foreground ml-2">• {opt}</p>
            ))}
          </div>
        )}
        {c.image_url && (
          <img src={c.image_url} alt="Content" className="rounded-lg max-h-40 object-cover w-full" />
        )}
      </div>
    );
  }

  if (category === "course_resell") {
    const co = adaptCourse(data);
    return (
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-sm flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" /> Course Referral
        </h4>
        <div className="grid gap-1.5 text-sm">
          <p><span className="text-muted-foreground">Course:</span> {co.course_title || "—"}</p>
          {co.referral_link && (
            <a href={co.referral_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Referral Link
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap max-h-48 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

/* -----------------------------------------------------------
 * Manager
 * --------------------------------------------------------- */

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
    onSuccess: (data, submissionId) => {
      toast.success(`Approved! ${data.credits_awarded} credits awarded.`);
      const sub = submissions?.find((s: any) => s.id === submissionId);
      if (sub?.talents?.full_name) {
        emailNotifications.bidAccepted(sub.talent_id, sub.gigs?.title || "Gig", data.credits_awarded);
      }
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
      const cv = adaptCV(submission.submission_data);
      if (!cv.email) throw new Error("No email found in parsed CV data");

      const { data: awardResult, error: awardError } = await supabase.rpc("award_gig_credits", {
        p_submission_id: submission.id,
        p_admin_notes: adminNotes || null,
      });
      if (awardError) throw awardError;
      const award = awardResult as any;
      if (!award?.success) throw new Error(award?.error || "Failed to approve");

      const { error: talentError } = await supabase.rpc("get_or_create_talent", {
        p_email: cv.email,
        p_full_name: cv.name || null,
        p_phone: cv.phone || null,
      });
      if (talentError) throw talentError;

      const updateFields: any = {};
      if (cv.cv_url) updateFields.cv_url = cv.cv_url;
      if (cv.profession) updateFields.custom_profession = cv.profession;
      if (cv.skills?.length) updateFields.skills = cv.skills;

      if (Object.keys(updateFields).length > 0) {
        await supabase.from("talents").update(updateFields).ilike("email", cv.email);
      }

      return award;
    },
    onSuccess: (data, submission) => {
      toast.success(`Approved! ${data.credits_awarded} credits awarded & talent record created.`);
      if (submission?.talent_id) {
        emailNotifications.bidAccepted(submission.talent_id, submission.gigs?.title || "Gig", data.credits_awarded);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const approveAndCreateJobMutation = useMutation({
    mutationFn: async (submission: any) => {
      const job = adaptJob(submission.submission_data);
      if (!job.title || !job.company_name) {
        throw new Error("Cannot create job: missing title or company. Edit the submission data first.");
      }

      const { data: awardResult, error: awardError } = await supabase.rpc("award_gig_credits", {
        p_submission_id: submission.id,
        p_admin_notes: adminNotes || null,
      });
      if (awardError) throw awardError;
      const award = awardResult as any;
      if (!award?.success) throw new Error(award?.error || "Failed to approve");

      // Validate job_type & experience_level against allowed enums; fallback to defaults
      const allowedJobTypes = ["full_time", "part_time", "contract", "internship", "freelance"];
      const allowedExp = ["entry", "junior", "mid", "senior", "lead", "executive"];
      const jt = allowedJobTypes.includes(job.job_type || "") ? job.job_type : "full_time";
      const exp = allowedExp.includes(job.experience_level || "") ? job.experience_level : "entry";

      const { error: jobError } = await supabase.from("jobs").insert({
        title: job.title,
        company_name: job.company_name,
        location: job.location || null,
        job_type: jt as any,
        experience_level: exp as any,
        description: job.description || job.raw_text || `${job.title} at ${job.company_name}`,
        source_image_url: job.source_image_url || null,
        source_platform: "other" as any,
        application_type: "internal" as any,
        is_active: true,
      });
      if (jobError) throw jobError;

      return award;
    },
    onSuccess: (data, submission) => {
      toast.success(`Approved! ${data.credits_awarded} credits awarded & job listing created.`);
      if (submission?.talent_id) {
        emailNotifications.bidAccepted(submission.talent_id, submission.gigs?.title || "Gig", data.credits_awarded);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const approveAndCreatePostMutation = useMutation({
    mutationFn: async (submission: any) => {
      const c = adaptContent(submission.submission_data);

      // Decide content_type for feed_posts (allowed: text, image, poll, link, article)
      let postType: "text" | "image" | "poll" | "article" = "text";
      if (c.type === "poll" || c.poll_question) postType = "poll";
      else if (c.type === "article" || c.title) postType = "article";
      else if (c.image_url) postType = "image";

      if (postType !== "poll" && !c.text && !c.title) {
        throw new Error("Cannot create post: no text content found.");
      }
      if (postType === "poll" && !c.poll_question) {
        throw new Error("Cannot create poll: missing question.");
      }

      const { data: awardResult, error: awardError } = await supabase.rpc("award_gig_credits", {
        p_submission_id: submission.id,
        p_admin_notes: adminNotes || null,
      });
      if (awardError) throw awardError;
      const award = awardResult as any;
      if (!award?.success) throw new Error(award?.error || "Failed to approve");

      const authorName = submission.talents?.full_name || "Community Member";
      const textContent =
        postType === "poll"
          ? c.poll_question
          : c.title
            ? `${c.title}\n\n${c.text || ""}`.trim()
            : c.text || "";

      const insertPayload: any = {
        author_name: authorName,
        content_type: postType,
        text_content: textContent,
        media_url: c.image_url || null,
        talent_id: submission.talent_id || null,
        status: "published",
        is_active: true,
      };

      if (postType === "poll") {
        insertPayload.poll_options = (c.poll_options || []).map((label: string) => ({
          label,
          votes: 0,
        }));
      }

      const { error: postError } = await supabase.from("feed_posts").insert(insertPayload);
      if (postError) throw postError;

      return award;
    },
    onSuccess: (data, submission) => {
      toast.success(`Approved! ${data.credits_awarded} credits awarded & post published.`);
      if (submission?.talent_id) {
        emailNotifications.bidAccepted(submission.talent_id, submission.gigs?.title || "Gig", data.credits_awarded);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-gig-submissions"] });
      setSelectedSubmission(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pendingSubmissions = submissions?.filter((s: any) => s.status === "pending") || [];
  const processedSubmissions = submissions?.filter((s: any) => s.status !== "pending") || [];

  const renderCategoryAction = (sub: any, size: "icon" | "default" = "icon") => {
    const cat = sub.gigs?.category;
    if (cat === "cv_upload") {
      return (
        <Button
          variant={size === "icon" ? "ghost" : "default"}
          size={size}
          className={size === "icon" ? "text-success" : "flex-1 gap-1"}
          title="Approve & Create Talent"
          onClick={() => approveAndCreateTalentMutation.mutate(sub)}
          disabled={approveAndCreateTalentMutation.isPending}
        >
          <UserPlus className="h-4 w-4" />
          {size !== "icon" && "Approve & Create Talent"}
        </Button>
      );
    }
    if (cat === "job_posting") {
      return (
        <Button
          variant={size === "icon" ? "ghost" : "default"}
          size={size}
          className={size === "icon" ? "text-success" : "flex-1 gap-1"}
          title="Approve & Create Job"
          onClick={() => approveAndCreateJobMutation.mutate(sub)}
          disabled={approveAndCreateJobMutation.isPending}
        >
          <BriefcaseBusiness className="h-4 w-4" />
          {size !== "icon" && "Approve & Create Job"}
        </Button>
      );
    }
    if (cat === "content_creation") {
      return (
        <Button
          variant={size === "icon" ? "ghost" : "default"}
          size={size}
          className={size === "icon" ? "text-success" : "flex-1 gap-1"}
          title="Approve & Publish Post"
          onClick={() => approveAndCreatePostMutation.mutate(sub)}
          disabled={approveAndCreatePostMutation.isPending}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {size !== "icon" && "Approve & Publish Post"}
        </Button>
      );
    }
    return (
      <Button
        variant={size === "icon" ? "ghost" : "secondary"}
        size={size}
        className={size === "icon" ? "text-success" : "flex-1 gap-1"}
        title="Approve (credits only)"
        onClick={() => approveMutation.mutate(sub.id)}
        disabled={approveMutation.isPending}
      >
        <CheckCircle2 className="h-4 w-4" />
        {size !== "icon" && "Approve"}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Gig Submissions</h2>

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
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : pendingSubmissions.length === 0 ? (
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
                        <Coins className="h-3.5 w-3.5 text-warning" />
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
                        {renderCategoryAction(sub, "icon")}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
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
                    {renderCategoryAction(selectedSubmission, "default")}
                    <Button
                      variant="secondary"
                      className="flex-1 gap-1"
                      onClick={() => approveMutation.mutate(selectedSubmission.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Credits Only
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
