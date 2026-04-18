import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, FileText, BarChart2, BookOpen, ImagePlus, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentCreationGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

const CONTENT_TYPES = [
  { key: "post", label: "Post", icon: FileText, desc: "Text + Image" },
  { key: "poll", label: "Poll", icon: BarChart2, desc: "Community Vote" },
  { key: "article", label: "Article", icon: BookOpen, desc: "Long-form Content" },
];

export function ContentCreationGigForm({ gig, talentId, onSubmitted }: ContentCreationGigFormProps) {
  const [contentType, setContentType] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `gig-content/${talentId}/${gig.id}-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage.from("feed-images").upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("feed-images").getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast.success("Image staged successfully");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getValidationErrors = () => {
    if (!contentType) return "Select a content type";
    if (contentType === "post" && text.length < 10) return "Post must be at least 10 characters";
    if (contentType === "poll") {
      if (pollQuestion.length < 5) return "Question is too short";
      if (pollOptions.filter((o) => o.trim()).length < 2) return "Provide at least 2 options";
    }
    if (contentType === "article") {
      if (title.length < 5) return "Title is too short";
      if (text.length < 50) return "Article body must be at least 50 characters";
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = getValidationErrors();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = {
        type: contentType,
        payload: {
          text: contentType !== "poll" ? text : undefined,
          title: contentType === "article" ? title : undefined,
          image_url: imageUrl || null,
          poll:
            contentType === "poll"
              ? {
                  question: pollQuestion,
                  options: pollOptions.filter((o) => o.trim()),
                }
              : undefined,
        },
        meta: {
          submitted_at: new Date().toISOString(),
          version: "2.0",
        },
      };

      const { error: dbError } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: submissionData,
      });

      if (dbError) throw dbError;
      toast.success("Work submitted for review!");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Format</Label>
        <div className="grid grid-cols-3 gap-3">
          {CONTENT_TYPES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setContentType(key)}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                contentType === key
                  ? "border-primary bg-primary/5 shadow-inner"
                  : "border-border/40 hover:border-primary/30 bg-card",
              )}
            >
              <Icon className={cn("h-5 w-5", contentType === key ? "text-primary" : "text-muted-foreground")} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {contentType === "article" && (
          <div className="space-y-2">
            <Label className="text-xs font-bold">Headline</Label>
            <Input
              placeholder="The Future of Web3 Development..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-border/40"
            />
          </div>
        )}

        {contentType === "poll" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Question</Label>
              <Input
                placeholder="What's your preferred framework?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="rounded-xl border-border/40"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold">Options</Label>
              {pollOptions.map((opt, i) => (
                <Input
                  key={i}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const updated = [...pollOptions];
                    updated[i] = e.target.value;
                    setPollOptions(updated);
                  }}
                  className="rounded-xl border-border/40"
                />
              ))}
              {pollOptions.length < 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-[10px] font-black uppercase tracking-widest hover:bg-primary/5"
                >
                  + Add Option
                </Button>
              )}
            </div>
          </div>
        ) : (
          contentType && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">{contentType === "article" ? "Body Content" : "Caption"}</Label>
                <Textarea
                  placeholder={contentType === "article" ? "Start writing..." : "What's on your mind?"}
                  rows={contentType === "article" ? 8 : 4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="rounded-2xl border-border/40 resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" /> Media Attachment
                </Label>

                {imageUrl ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/40 group">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border/40 rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all"
                    >
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6 text-muted-foreground mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Upload Thumbnail
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {contentType && (
        <Button
          onClick={handleSubmit}
          disabled={!!getValidationErrors() || isSubmitting || isUploading}
          className="w-full rounded-2xl h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Submit Final Draft
        </Button>
      )}
    </div>
  );
}
