import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Coins, Loader2 } from "lucide-react";

interface GigSubmissionFormProps {
  gig: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GigSubmissionForm({ gig, open, onOpenChange }: GigSubmissionFormProps) {
  const { talent } = useTalent();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!talent?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talent.id,
        submission_data: formData,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submission sent! You'll earn credits once approved.");
      queryClient.invalidateQueries({ queryKey: ["gig-submission-counts"] });
      queryClient.invalidateQueries({ queryKey: ["my-gig-submissions"] });
      onOpenChange(false);
      setFormData({});
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit");
    },
  });

  const renderFormFields = () => {
    switch (gig.category) {
      case "cv_upload":
        return (
          <>
            <div className="space-y-2">
              <Label>Friend's Full Name</Label>
              <Input
                placeholder="Enter their full name"
                value={formData.full_name || ""}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Friend's Email</Label>
              <Input
                type="email"
                placeholder="Enter their email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Friend's Phone (with country code)</Label>
              <Input
                placeholder="+880..."
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </>
        );
      case "job_posting":
        return (
          <div className="space-y-2">
            <Label>Paste Job Information</Label>
            <Textarea
              placeholder="Paste the full job posting text here (from LinkedIn, Facebook, company website, etc.)"
              rows={6}
              value={formData.job_text || ""}
              onChange={(e) => setFormData({ ...formData, job_text: e.target.value })}
            />
          </div>
        );
      case "job_sharing":
        return (
          <>
            <div className="space-y-2">
              <Label>Screenshot or Proof URL</Label>
              <Input
                placeholder="Link to your share post or screenshot"
                value={formData.proof_url || ""}
                onChange={(e) => setFormData({ ...formData, proof_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Platform shared on</Label>
              <Input
                placeholder="e.g., Facebook, LinkedIn, WhatsApp"
                value={formData.platform || ""}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              />
            </div>
          </>
        );
      case "content_creation":
        return (
          <>
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Input
                placeholder="Post, Poll, Video, Blog, Article"
                value={formData.content_type || ""}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Content or Link</Label>
              <Textarea
                placeholder="Paste your content or share a link"
                rows={4}
                value={formData.content || ""}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
          </>
        );
      case "course_resell":
        return (
          <>
            <div className="space-y-2">
              <Label>Referral Name</Label>
              <Input
                placeholder="Who did you refer?"
                value={formData.referral_name || ""}
                onChange={(e) => setFormData({ ...formData, referral_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Referral Email</Label>
              <Input
                type="email"
                placeholder="Their email address"
                value={formData.referral_email || ""}
                onChange={(e) => setFormData({ ...formData, referral_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Course Name</Label>
              <Input
                placeholder="Which course did they enroll in?"
                value={formData.course_name || ""}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              />
            </div>
          </>
        );
      default:
        return (
          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea
              placeholder="Provide submission details..."
              rows={4}
              value={formData.details || ""}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
          </div>
        );
    }
  };

  const isValid = () => {
    switch (gig.category) {
      case "cv_upload":
        return formData.full_name && formData.email;
      case "job_posting":
        return formData.job_text && formData.job_text.length > 20;
      case "job_sharing":
        return formData.proof_url;
      case "content_creation":
        return formData.content_type && formData.content;
      case "course_resell":
        return formData.referral_name && formData.referral_email;
      default:
        return formData.details;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{gig.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            Earn <Coins className="h-3.5 w-3.5 text-amber-500 inline" />{" "}
            <span className="font-semibold text-amber-600">{gig.credit_reward} credits</span>{" "}
            upon approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {renderFormFields()}

          <Button
            className="w-full"
            onClick={() => submitMutation.mutate()}
            disabled={!isValid() || submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Submit for Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
