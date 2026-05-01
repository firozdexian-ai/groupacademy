import { useState, useRef } from "react";
import { Send, X, Loader2, Hash, Sparkles, UserCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Social Ingress Terminal (ComposePost)
 * CTO Reference: High-fidelity node for social artifact creation and feed synchronization.
 */

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
    const toastId = toast.loading("Posting…");

    try {
      const { error } = await supabase.from("feed_posts").insert({
        text_content: trimmed,
        author_name: talent.fullName || "Community member",
        author_avatar: talent.profilePhotoUrl || null,
        author_title: talent.customProfession || "Academy member",
        talent_id: talent.id,
        content_type: "text",
        tags: tags.length > 0 ? tags : null,
        status: "published",
        is_active: true,
      });

      if (error) throw error;

      toast.success("Post published.", { id: toastId });
      handleReset();
      onPostCreated();
    } catch (err: any) {
      toast.error("Couldn't publish your post. Please try again.", { id: toastId });
      console.error("[ComposePost] error:", err);
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
    const cleanTag = tagInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (cleanTag && tags.length < MAX_TAGS && !tags.includes(cleanTag)) {
      setTags((prev) => [...prev, cleanTag]);
      setTagInput("");
    } else if (tags.length >= MAX_TAGS) {
      toast.info("You can add up to 5 tags.");
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
        "rounded-[32px] border-2 border-primary/10 bg-card/30 backdrop-blur-md transition-all duration-500 shadow-xl overflow-hidden",
        isExpanded ? "ring-2 ring-primary/20 scale-[1.01]" : "hover:border-primary/30",
      )}
    >
      <CardContent className="p-6">
        <div className="flex gap-5">
          <div className="relative shrink-0">
            <Avatar
              className={cn(
                "h-12 w-12 border-2 transition-all duration-700",
                isExpanded ? "border-primary scale-110 shadow-lg" : "border-border/40",
              )}
            >
              <AvatarImage src={talent.profilePhotoUrl} alt={talent.fullName || ""} />
              <AvatarFallback className="bg-primary/5 text-primary font-black italic tracking-tighter">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isExpanded && (
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                <UserCheck className="h-4 w-4 text-primary fill-primary/10" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {!isExpanded ? (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full text-left bg-muted/20 hover:bg-muted/40 border-2 border-transparent hover:border-primary/10 rounded-[20px] px-6 py-4 transition-all flex items-center justify-between group"
              >
                <span className="text-sm font-medium text-muted-foreground">
                  Share an update with the community…
                </span>
                <Sparkles className="h-5 w-5 opacity-0 group-hover:opacity-100 text-primary transition-all duration-500" />
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                <Textarea
                  ref={textareaRef}
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                  placeholder="DEPLOY CAREER UPDATES, MILESTONES, OR STRATEGIC QUERIES..."
                  className="min-h-[160px] resize-none border-0 bg-transparent p-0 text-lg font-medium italic leading-relaxed focus-visible:ring-0 placeholder:text-muted-foreground/30 custom-scrollbar"
                />

                {/* DISCOVERY TAG REGISTRY */}
                <div className="flex flex-wrap gap-2 py-4 border-t border-border/10">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-primary/10 text-primary border-2 border-primary/20 font-black italic text-[9px] uppercase tracking-widest px-3 py-1 rounded-xl h-7 group/tag"
                    >
                      #{tag}
                      <button
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        className="ml-2 p-0.5 rounded-full hover:bg-destructive hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {tags.length < MAX_TAGS && (
                    <div className="flex items-center text-primary/40 focus-within:text-primary transition-colors">
                      <Hash className="h-4 w-4 mr-1" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={addTag}
                        placeholder="ADD-TAG"
                        className="text-[10px] bg-transparent border-0 outline-none w-24 font-black uppercase italic tracking-widest placeholder:text-muted-foreground/20"
                      />
                    </div>
                  )}
                </div>

                {/* EXECUTIVE COMMAND FOOTER */}
                <div className="flex items-center justify-between pt-4 mt-2">
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "text-[10px] font-black tabular-nums tracking-[0.2em] uppercase transition-colors",
                        text.length > MAX_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground/30",
                      )}
                    >
                      {text.length} / {MAX_LENGTH} PAYLOAD
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-black uppercase italic text-[10px] tracking-widest hover:text-destructive transition-colors opacity-40 hover:opacity-100 h-10"
                      onClick={handleReset}
                      disabled={isSubmitting}
                    >
                      Abort Sync
                    </Button>
                    <Button
                      size="sm"
                      className="h-12 px-8 gap-3 rounded-[18px] font-black uppercase italic text-xs tracking-widest shadow-2xl shadow-primary/20 active:scale-95 transition-transform"
                      disabled={!text.trim() || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 fill-current" />
                      )}
                      Deploy Artifact
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
