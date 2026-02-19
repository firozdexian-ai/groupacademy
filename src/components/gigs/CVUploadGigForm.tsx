import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Loader2, MessageSquare, User, Phone, Briefcase, CheckCircle } from "lucide-react";

interface CVUploadGigFormProps {
  gig: any;
  talentId: string;
  onSubmitted: () => void;
}

export function CVUploadGigForm({ gig, talentId, onSubmitted }: CVUploadGigFormProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [outreachMessage, setOutreachMessage] = useState("");
  const [cvUrl, setCvUrl] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  };

  const parseCV = async () => {
    if (!cvFile) {
      toast.error("Please upload a CV file");
      return;
    }

    setIsParsing(true);
    setParsedData(null);
    setOutreachMessage("");

    try {
      // Upload to storage
      const fileName = `gig-cvs/${Date.now()}-${cvFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(fileName, cvFile);
      if (uploadError) throw new Error("Upload failed: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from("portfolio-uploads")
        .getPublicUrl(fileName);
      setCvUrl(publicUrl);

      // Parse CV
      toast.info("Parsing CV with AI...");
      const { data, error } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl, serviceType: "cv_outreach" },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Parse failed");

      setParsedData(data.parsed);
      toast.success("CV parsed! Generating message...");

      // Generate outreach message
      setIsGenerating(true);
      const { data: msgData, error: msgError } = await supabase.functions.invoke("generate-outreach-message", {
        body: {
          parsedCV: data.parsed,
          product: "digital-portfolio",
          professionCategory: data.parsed?.profession_category || "Professional",
          senderName: "Growthpad Team",
          language: "auto",
        },
      });
      if (msgError) throw msgError;
      if (!msgData?.success) throw new Error(msgData?.error || "Message generation failed");

      setOutreachMessage(msgData.message);
      toast.success("WhatsApp message ready!");
    } catch (err: any) {
      toast.error(err.message || "Failed to process CV");
    } finally {
      setIsParsing(false);
      setIsGenerating(false);
    }
  };

  const getWhatsAppLink = () => {
    const phone = parsedData?.phone || parsedData?.contact?.phone || "";
    let formatted = phone.replace(/[\s\-\(\)\+]/g, "");
    if (formatted.startsWith("0")) formatted = "880" + formatted.slice(1);
    else if (!formatted.startsWith("880") && formatted.length <= 11) formatted = "880" + formatted;
    return `https://wa.me/${formatted}?text=${encodeURIComponent(outreachMessage)}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          cv_url: cvUrl,
          parsed_name: parsedData?.full_name || parsedData?.name || "",
          parsed_phone: parsedData?.phone || parsedData?.contact?.phone || "",
          parsed_email: parsedData?.email || parsedData?.contact?.email || "",
          parsed_profession: parsedData?.profession_category || "",
          parsed_skills: parsedData?.skills || [],
          outreach_message: outreachMessage,
        },
      });
      if (error) throw error;
      toast.success("Submission sent! You'll earn credits once approved.");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Upload className="h-4 w-4" /> Upload Friend's CV
        </Label>
        <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
        {cvFile && <p className="text-xs text-muted-foreground">Selected: {cvFile.name}</p>}
      </div>

      {!parsedData && (
        <Button onClick={parseCV} disabled={!cvFile || isParsing} className="w-full">
          {isParsing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isParsing ? "Parsing CV..." : "Parse CV with AI"}
        </Button>
      )}

      {/* Step 2: Parsed Result Preview */}
      {parsedData && (
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" /> Parsed Profile
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{parsedData.full_name || parsedData.name || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{parsedData.phone || parsedData.contact?.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {parsedData.profession_category || "Professional"}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: WhatsApp Message */}
      {outreachMessage && (
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4">
            <Label className="text-xs text-muted-foreground mb-1 block">Generated WhatsApp Message</Label>
            <p className="text-sm whitespace-pre-wrap">{outreachMessage}</p>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 border-green-500 text-green-700 hover:bg-green-50"
            onClick={() => window.open(getWhatsAppLink(), "_blank")}
          >
            <MessageSquare className="h-4 w-4" /> Share on WhatsApp
          </Button>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit for Review
          </Button>
        </div>
      )}

      {isGenerating && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating WhatsApp message...
        </div>
      )}
    </div>
  );
}
