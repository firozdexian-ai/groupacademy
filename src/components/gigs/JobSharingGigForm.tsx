import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Share2, MessageSquare, Linkedin, Facebook, Copy, CheckCircle, Briefcase } from "lucide-react";

interface JobSharingGigFormProps {
  gig: any;
  talentId: string;
  onSubmitted: () => void;
}

export function JobSharingGigForm({ gig, talentId, onSubmitted }: JobSharingGigFormProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sharedChannels, setSharedChannels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["active-jobs-for-sharing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, company_name, location, job_type")
        .eq("is_active", true)
        .gte("deadline", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const selectedJob = jobs?.find((j: any) => j.id === selectedJobId);
  const shareUrl = selectedJob ? `https://groupacademy.lovable.app/jobs/${selectedJob.id}` : "";
  const shareText = selectedJob
    ? `🔥 ${selectedJob.title} at ${selectedJob.company_name}\n📍 ${selectedJob.location || "Bangladesh"}\nApply now: ${shareUrl}`
    : "";

  const handleShare = async (channel: string) => {
    if (!selectedJobId) return;

    let url = "";
    switch (channel) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "copy":
        await navigator.clipboard.writeText(shareText);
        toast.success("Link copied!");
        break;
    }

    if (url) window.open(url, "_blank");

    // Log share
    if (!sharedChannels.includes(channel)) {
      setSharedChannels([...sharedChannels, channel]);
      await supabase.from("gig_share_logs").insert({
        talent_id: talentId,
        job_id: selectedJobId,
        channel,
      });
    }
  };

  const handleSubmit = async () => {
    if (sharedChannels.length === 0) {
      toast.error("Please share the job on at least one platform");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          job_id: selectedJobId,
          job_title: selectedJob?.title,
          job_company: selectedJob?.company_name,
          channels_shared: sharedChannels,
          share_url: shareUrl,
        },
      });
      if (error) throw error;
      toast.success("Share submission recorded! Credits will be awarded on approval.");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Job Picker */}
      <div className="space-y-2">
        <Label>Select a Job to Share</Label>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading jobs...
          </div>
        ) : !jobs?.length ? (
          <p className="text-sm text-muted-foreground py-4">No active jobs available right now.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {jobs.map((job: any) => (
              <button
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedJobId === job.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.company_name} · {job.location || "BD"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Share Buttons */}
      {selectedJob && (
        <div className="space-y-3">
          <Label>Share on Platforms</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-green-600" },
              { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
              { key: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500" },
              { key: "copy", label: "Copy Link", icon: Copy, color: "text-muted-foreground" },
            ].map(({ key, label, icon: Icon, color }) => (
              <Button
                key={key}
                variant={sharedChannels.includes(key) ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => handleShare(key)}
              >
                {sharedChannels.includes(key) ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                )}
                {label}
              </Button>
            ))}
          </div>

          {sharedChannels.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              Shared on {sharedChannels.length} platform{sharedChannels.length > 1 ? "s" : ""}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={isSubmitting || sharedChannels.length === 0} className="w-full">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit for Review
          </Button>
        </div>
      )}
    </div>
  );
}
