import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, FileText, BarChart2, BookOpen, ImagePlus } from "lucide-react";

interface ContentCreationGigFormProps {
  gig: any;
  talentId: string;
  onSubmitted: () => void;
}

const CONTENT_TYPES = [
  { key: "post", label: "Post", icon: FileText, desc: "Short text + optional image" },
  { key: "poll", label: "Poll", icon: BarChart2, desc: "Question + 2-4 options" },
  { key: "article", label: "Article", icon: BookOpen, desc: "Title + longer body" },
];

export function ContentCreationGigForm({ gig, talentId, onSubmitted }: ContentCreationGigFormProps) {
  const [contentType, setContentType] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);

    const fileName = `gig-content/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("feed-images").upload(fileName, file);
    if (error) {
      toast.error("Image upload failed");
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("feed-images").getPublicUrl(fileName);
    setImageUrl(publicUrl);
    toast.success("Image uploaded");
  };

  const isValid = () => {
    if (!contentType) return false;
    if (contentType === "post") return text.length >= 10;
    if (contentType === "poll") return pollQuestion.length >= 5 && pollOptions.filter(o => o.trim()).length >= 2;
    if (contentType === "article") return title.length >= 5 && text.length >= 50;
    return false;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submissionData: any = { content_type: contentType };
      if (contentType === "post") {
        submissionData.text = text;
        submissionData.image_url = imageUrl || null;
      } else if (contentType === "poll") {
        submissionData.poll_question = pollQuestion;
        submissionData.poll_options = pollOptions.filter(o => o.trim());
      } else if (contentType === "article") {
        submissionData.title = title;
        submissionData.body = text;
        submissionData.image_url = imageUrl || null;
      }

      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: submissionData,
      });
      if (error) throw error;
      toast.success("Content submitted for review!");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Content type selector */}
      <div className="space-y-2">
        <Label>Content Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {CONTENT_TYPES.map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              onClick={() => setContentType(key)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                contentType === key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Post form */}
      {contentType === "post" && (
        <>
          <div className="space-y-2">
            <Label>Post Content</Label>
            <Textarea placeholder="Write your post..." rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ImagePlus className="h-4 w-4" /> Image (optional)
            </Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
        </>
      )}

      {/* Poll form */}
      {contentType === "poll" && (
        <>
          <div className="space-y-2">
            <Label>Poll Question</Label>
            <Input placeholder="What would you like to ask?" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
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
              />
            ))}
            {pollOptions.length < 4 && (
              <Button variant="ghost" size="sm" onClick={() => setPollOptions([...pollOptions, ""])}>
                + Add Option
              </Button>
            )}
          </div>
        </>
      )}

      {/* Article form */}
      {contentType === "article" && (
        <>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Article title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea placeholder="Write your article..." rows={6} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ImagePlus className="h-4 w-4" /> Featured Image (optional)
            </Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
        </>
      )}

      {contentType && (
        <Button onClick={handleSubmit} disabled={!isValid() || isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Submit for Review
        </Button>
      )}
    </div>
  );
}
