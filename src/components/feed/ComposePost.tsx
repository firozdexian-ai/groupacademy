import { useState, useRef } from "react";
import { Send, X, Loader2, Hash, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ComposePostProps {
  onPostCreated: () => void;
}

const MAX_LENGTH = 1000;
const MAX_TAGS = 5;

export function ComposePost({ onPostCreated }: ComposePostProps) {
  const { talent } = useTalent();
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initials =
    talent?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || !talent?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("feed_posts").insert({
        text_content: trimmed,
        author_name: talent.fullName || "Anonymous",
        author_avatar: talent.profilePhotoUrl || null,
        author_title: talent.customProfession || talent.currentTitle || "Professional",
        talent_id: talent.id,
        content_type: "text",
        tags: tags.length > 0 ? tags : null,
        status: "published",
        is_active: true,
      });

      if (error) throw error;

      toast.success("Post shared with the community!");
      handleReset();
      onPostCreated();
    } catch (err: any) {
      console.error("[FeedService] Create post error:", err);
      toast.error("Failed to publish post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setText("");
    setTags([]);
    setTagInput("");
    setIsExpanded(false);
  };

  const addTag = () => {
    // Sanitize tag: remove special characters, only allow alphanumeric
    const cleanTag = tagInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (cleanTag && tags.length < MAX_TAGS && !tags.includes(cleanTag)) {
      setTags((prev) => [...prev, cleanTag]);
      setTagInput("");
    } else if (tags.length >= MAX_TAGS) {
      toast.info("Maximum 5 tags reached");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  if (!talent) return null;

  return (
    <Card
      className={cn(
        "rounded-2xl transition-all duration-300 border-primary/10 shadow-sm",
        isExpanded ? "ring-1 ring-primary/20 shadow-md" : "hover:border-primary/20",
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar
            className={cn(
              "h-10 w-10 shrink-0 transition-all duration-500",
              isExpanded ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-border",
            )}
          >
            <AvatarImage src={talent.profilePhotoUrl} alt={talent.fullName || ""} />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase tracking-tighter">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-3">
            {!isExpanded ? (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full text-left text-sm text-muted-foreground bg-muted/30 hover:bg-muted/50 rounded-xl px-4 py-3 transition-all flex items-center justify-between group"
              >
                <span>Share an update, milestone, or question...</span>
                <Sparkles className="h-4 w-4 opacity-0 group-hover:opacity-100 text-primary transition-all" />
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                <Textarea
                  ref={textareaRef}
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                  placeholder="What's happening in your career journey?"
                  className={cn(
                    "min-h-[120px] resize-none border-0 bg-transparent p-0 text-base focus-visible:ring-0 placeholder:text-muted-foreground/40",
                    "scrollbar-thin scrollbar-thumb-primary/10",
                  )}
                />

                {/* Tag Display Area */}
                <div className="flex flex-wrap gap-2 py-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 hover:bg-primary/10 text-primary border-primary/10 pl-2 pr-1 h-6"
                    >
                      #{tag}
                      <button
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        className="ml-1 p-0.5 rounded-full hover:bg-destructive hover:text-white transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                  {tags.length < MAX_TAGS && (
                    <div className="flex items-center text-muted-foreground ml-1">
                      <Hash className="h-3 w-3 mr-1" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={addTag}
                        placeholder="add-tag"
                        className="text-xs bg-transparent border-0 outline-none w-20 placeholder:text-muted-foreground/30 font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between border-t pt-3 mt-2">
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "text-[10px] font-bold tabular-nums tracking-widest uppercase",
                        text.length > MAX_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground/40",
                      )}
                    >
                      {text.length} / {MAX_LENGTH}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold hover:bg-destructive/5 hover:text-destructive h-9"
                      onClick={handleReset}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-9 px-5 gap-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/10"
                      disabled={!text.trim() || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Publish Post
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
