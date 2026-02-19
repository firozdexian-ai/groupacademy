import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Briefcase, MapPin, Clock, CheckCircle, ImagePlus } from "lucide-react";

interface JobPostingGigFormProps {
  gig: any;
  talentId: string;
  onSubmitted: () => void;
}

export function JobPostingGigForm({ gig, talentId, onSubmitted }: JobPostingGigFormProps) {
  const [jobText, setJobText] = useState("");
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedJob, setParsedJob] = useState<any>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState("");

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceImage(file);

    // Upload immediately
    const fileName = `gig-job-sources/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("job-assets").upload(fileName, file);
    if (error) {
      toast.error("Image upload failed");
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("job-assets").getPublicUrl(fileName);
    setSourceImageUrl(publicUrl);
    toast.success("Screenshot uploaded");
  };

  const parseJob = async () => {
    if (!jobText || jobText.length < 20) {
      toast.error("Please paste a longer job posting");
      return;
    }

    setIsParsing(true);
    setParsedJob(null);

    try {
      toast.info("Parsing job with AI...");
      const { data, error } = await supabase.functions.invoke("parse-job-post", {
        body: { rawText: jobText },
      });
      if (error) throw error;
      if (!data?.success && !data?.parsed) throw new Error(data?.error || "Parse failed");

      const parsed = data.parsed || data;
      setParsedJob(parsed);
      toast.success("Job parsed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to parse job");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          raw_text: jobText,
          source_image_url: sourceImageUrl || null,
          parsed_job: parsedJob,
        },
      });
      if (error) throw error;
      toast.success("Job posting submitted! You'll earn credits once approved.");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Paste job text */}
      <div className="space-y-2">
        <Label>Paste Job Posting</Label>
        <Textarea
          placeholder="Copy and paste the full job posting text from Facebook, LinkedIn, company website, etc."
          rows={5}
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
        />
      </div>

      {/* Source screenshot */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <ImagePlus className="h-4 w-4" /> Source Screenshot (optional)
        </Label>
        <Input type="file" accept="image/*" onChange={handleImageChange} />
        {sourceImage && (
          <p className="text-xs text-muted-foreground">Uploaded: {sourceImage.name}</p>
        )}
      </div>

      {!parsedJob && (
        <Button onClick={parseJob} disabled={!jobText || jobText.length < 20 || isParsing} className="w-full">
          {isParsing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isParsing ? "Parsing with AI..." : "Parse Job with AI"}
        </Button>
      )}

      {/* Parsed job preview */}
      {parsedJob && (
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" /> Parsed Job Preview
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{parsedJob.title || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Company:</span>
              <span>{parsedJob.company_name || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{parsedJob.location || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{parsedJob.job_type || "—"}</span>
            </div>
            {parsedJob.experience_level && (
              <Badge variant="secondary" className="text-xs">
                {parsedJob.experience_level}
              </Badge>
            )}
          </div>

          {sourceImageUrl && (
            <img src={sourceImageUrl} alt="Source" className="rounded-lg max-h-40 object-cover w-full" />
          )}

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit for Review
          </Button>
        </div>
      )}
    </div>
  );
}
