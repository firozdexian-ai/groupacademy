import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Briefcase, MapPin, Clock, CheckCircle, ImagePlus, RotateCcw, AlertCircle } from "lucide-react";

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
  const [parseError, setParseError] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState("");

  // Editable parsed fields
  const [parsedRaw, setParsedRaw] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editJobType, setEditJobType] = useState("");
  const [editLevel, setEditLevel] = useState("");

  const MIN_CHARS = 20;
  const hasParsed = parsedRaw !== null;
  const canSubmit = editTitle.trim() && editTitle !== "—" && editCompany.trim() && editCompany !== "—";

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceImage(file);

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
    if (!jobText || jobText.length < MIN_CHARS) {
      toast.error(`Please paste at least ${MIN_CHARS} characters`);
      return;
    }

    setIsParsing(true);
    setParsedRaw(null);
    setParseError(null);

    try {
      const { data, error } = await supabase.functions.invoke("parse-job-post", {
        body: { rawText: jobText },
      });
      if (error) throw error;
      if (!data?.success && !data?.parsed) throw new Error(data?.error || "Parse failed");

      const parsed = data.parsed || data;
      setParsedRaw(parsed);
      setEditTitle(parsed.title || "");
      setEditCompany(parsed.company_name || "");
      setEditLocation(parsed.location || "");
      setEditJobType(parsed.job_type || "");
      setEditLevel(parsed.experience_level || "");
      setParseError(null);
      toast.success("Job parsed successfully!");
    } catch (err: any) {
      const msg = err.message || "Failed to parse job";
      setParseError(msg);
      toast.error(msg);
    } finally {
      setIsParsing(false);
    }
  };

  const handleReparse = () => {
    setParsedRaw(null);
    setParseError(null);
    setEditTitle("");
    setEditCompany("");
    setEditLocation("");
    setEditJobType("");
    setEditLevel("");
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Title and Company are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalParsed = {
        ...parsedRaw,
        title: editTitle,
        company_name: editCompany,
        location: editLocation,
        job_type: editJobType,
        experience_level: editLevel,
      };

      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          raw_text: jobText,
          source_image_url: sourceImageUrl || null,
          parsed_job: finalParsed,
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
        <p className={`text-xs ${jobText.length >= MIN_CHARS ? "text-muted-foreground" : "text-destructive"}`}>
          {jobText.length}/{MIN_CHARS} characters minimum
        </p>
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

      {/* Parse error */}
      {parseError && !hasParsed && (
        <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Parsing failed</p>
            <p className="text-xs mt-0.5">{parseError}</p>
          </div>
        </div>
      )}

      {!hasParsed && (
        <Button onClick={parseJob} disabled={!jobText || jobText.length < MIN_CHARS || isParsing} className="w-full">
          {isParsing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isParsing ? "Parsing with AI..." : "Parse Job with AI"}
        </Button>
      )}

      {/* Parsed job preview — editable */}
      {hasParsed && (
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-600" /> Parsed Job — Edit if needed
            </h4>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleReparse}>
              <RotateCcw className="h-3 w-3" /> Re-parse
            </Button>
          </div>

          <div className="space-y-2.5">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Title <span className="text-destructive">*</span>
              </Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Job title" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                Company <span className="text-destructive">*</span>
              </Label>
              <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} placeholder="Company name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Location
              </Label>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Location" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" /> Job Type
              </Label>
              <Input value={editJobType} onChange={(e) => setEditJobType(e.target.value)} placeholder="e.g. full_time" />
            </div>
            {editLevel && (
              <Badge variant="secondary" className="text-xs">
                {editLevel}
              </Badge>
            )}
          </div>

          {sourceImageUrl && (
            <img src={sourceImageUrl} alt="Source" className="rounded-lg max-h-40 object-cover w-full" />
          )}

          <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit} className="w-full">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit for Review
          </Button>

          {!canSubmit && (
            <p className="text-xs text-destructive text-center">Title and Company are required to submit</p>
          )}
        </div>
      )}
    </div>
  );
}
