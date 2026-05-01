import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, FileText, BarChart2, BookOpen, ImagePlus, X, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Content Creation Artifact Node
 * CTO Reference: Authoritative submission interface for polymorphic gig payloads.
 */

interface ContentCreationGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

const CONTENT_FORMATS = [
  { key: "post", label: "ATOMIC_POST", icon: FileText },
  { key: "poll", label: "COMMUNITY_POLL", icon: BarChart2 },
  { key: "article", label: "INTEL_ARTICLE", icon: BookOpen },
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

  const handleMediaIngress = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("DATA_LIMIT_EXCEEDED: 5MB MAX");
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
      toast.success("MEDIA_SYNC_STAGED");
    } catch (error: any) {
      toast.error("SYNC_FAULT: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const validateDraftSync = () => {
    if (!contentType) return "FORMAT_NOT_SELECTED";
    if (contentType === "post" && text.length < 10) return "MIN_LENGTH_NOT_MET (10 chars)";
    if (contentType === "poll") {
      if (pollQuestion.length < 5) return "QUERY_TOO_SHORT";
      if (pollOptions.filter((o) => o.trim()).length < 2) return "MIN_OPTIONS_NOT_MET";
    }
    if (contentType === "article") {
      if (title.length < 5) return "HEADLINE_INSUFFICIENT";
      if (text.length < 50) return "MIN_BODY_DEPTH_NOT_MET (50 chars)";
    }
    return null;
  };

  const executeDraftSubmission = async () => {
    const error = validateDraftSync();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
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
          protocol_v: "2.0_EXEC",
        },
      };

      const { data: inserted, error: dbError } = await supabase
        .from("gig_submissions")
        .insert({ gig_id: gig.id, talent_id: talentId, status: "pending", submission_data: payload })
        .select("id")
        .single();

      if (dbError) throw dbError;
      const { triggerAutoReview } = await import("@/lib/gigAutoReview");
      triggerAutoReview(inserted.id);
      toast.success("Submitted — auto-review in progress");
      onSubmitted();
    } catch (err: any) {
      toast.error("SUBMISSION_FAULT: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* HUD: FORMAT_SELECTOR */}
      <div className="space-y-4">
        <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
          Protocol_Select
        </Label>
        <div className="grid grid-cols-3 gap-4">
          {CONTENT_FORMATS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setContentType(key)}
              className={cn(
                "p-5 rounded-[22px] border-2 transition-all duration-500 flex flex-col items-center gap-3 relative overflow-hidden",
                contentType === key
                  ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)] scale-[1.02]"
                  : "border-border/40 hover:border-primary/20 bg-card/50",
              )}
            >
              {contentType === key && <Zap className="absolute top-2 right-2 h-3 w-3 text-primary animate-pulse" />}
              <Icon
                className={cn(
                  "h-6 w-6 transition-transform duration-500",
                  contentType === key ? "text-primary scale-110" : "text-muted-foreground",
                )}
              />
              <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {contentType === "article" && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-500">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary italic">
              Headline_Artifact
            </Label>
            <Input
              placeholder="e.g. THE_FUTURE_OF_RECRUITMENT_2026"
              value={title}
              onChange={(e) => setTitle(e.target.value.toUpperCase())}
              className="rounded-2xl border-2 font-black italic h-12 bg-background/50"
            />
          </div>
        )}

        {contentType === "poll" ? (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                Community_Query
              </Label>
              <Input
                placeholder="What protocol defines your workflow?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="rounded-2xl border-2 font-bold bg-background/50 h-12"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Response_Nodes
              </Label>
              <div className="grid gap-3">
                {pollOptions.map((opt, i) => (
                  <Input
                    key={i}
                    placeholder={`NODE_0${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[i] = e.target.value;
                      setPollOptions(updated);
                    }}
                    className="rounded-xl border-border/60 bg-muted/20 h-11"
                  />
                ))}
              </div>
              {pollOptions.length < 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-[9px] font-black uppercase tracking-[0.2em] hover:bg-primary/10 hover:text-primary"
                >
                  + INITIALIZE_NEW_NODE
                </Button>
              )}
            </div>
          </div>
        ) : (
          contentType && (
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                  Core_Knowledge_Payload
                </Label>
                <Textarea
                  placeholder={
                    contentType === "article"
                      ? "Commence deep-dive data ingress..."
                      : "Sync atomic thoughts with the community..."
                  }
                  rows={contentType === "article" ? 10 : 5}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="rounded-[28px] border-2 bg-background/50 resize-none p-6 font-medium leading-relaxed italic"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" /> Visual_Artifact_Support
                </Label>

                {imageUrl ? (
                  <div className="relative aspect-video rounded-[32px] overflow-hidden border-2 border-primary/20 group shadow-2xl">
                    <img
                      src={imageUrl}
                      alt="STAGED_MEDIA"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setImageUrl("")}
                        className="rounded-full h-12 w-12 shadow-2xl"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleMediaIngress}
                      className="hidden"
                      id="media-ingress"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="media-ingress"
                      className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border/40 rounded-[32px] cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all group"
                    >
                      {isUploading ? (
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      ) : (
                        <>
                          <div className="h-14 w-14 rounded-2xl bg-muted/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all">
                            <ImagePlus className="h-7 w-7 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                            UPLOAD_THUMBNAIL_NODE
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
          onClick={executeDraftSubmission}
          disabled={!!validateDraftSync() || isSubmitting || isUploading}
          className="w-full rounded-2xl h-16 font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95 gap-3"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          COMMIT_FINAL_DRAFT
        </Button>
      )}
    </div>
  );
}
