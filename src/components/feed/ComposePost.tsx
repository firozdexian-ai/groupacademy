import { useState, useRef } from "react";
import { Send, X, Loader2, Hash, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [showTagInput, setShowTagInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initials =
    talent?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const firstName = talent?.fullName?.split(" ")[0] || "there";

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
      toast.success("Posted", { id: toastId });
      handleReset();
      onPostCreated();
    } catch (err: any) {
      toast.error("Couldn't publish your post.", { id: toastId });
      console.error("[ComposePost] error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setText("");
    setTags([]);
    setTagInput("");
    setShowTagInput(false);
    setIsExpanded(false);
  };

  const addTag = () => {
    const cleanTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanTag && tags.length < MAX_TAGS && !tags.includes(cleanTag)) {
      setTags((p) => [...p, cleanTag]);
      setTagInput("");
    } else if (tags.length >= MAX_TAGS) {
      toast.info("Up to 5 tags.");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((p) => p.slice(0, -1));
    }
  };

  if (!talent) return null;

  const expand = () => {
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="rounded-2xl border border-border/40 bg-card">
        <CardContent className="p-3">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={talent.profilePhotoUrl} alt={talent.fullName || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {!isExpanded ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={expand}
                    className="flex-1 text-left bg-muted/40 hover:bg-muted/60 rounded-full px-4 py-2 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      What's on your mind, {firstName}?
                    </span>
                  </button>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={expand}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors"
                          aria-label="Add image"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Images coming soon</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={expand}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors"
                          aria-label="Rewrite with AI"
                        >
                          <Sparkles className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>AI rewrite coming soon</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                    placeholder="Share an update with your community…"
                    className="min-h-[110px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
                  />

                  {(tags.length > 0 || showTagInput) && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-muted text-foreground rounded-full pl-2 pr-1 py-0.5 text-xs font-medium gap-1"
                        >
                          #{tag}
                          <button
                            onClick={() => setTags((p) => p.filter((t) => t !== tag))}
                            className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                            aria-label={`Remove ${tag}`}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                      {showTagInput && tags.length < MAX_TAGS && (
                        <div className="flex items-center bg-muted/60 rounded-full px-2 py-0.5 text-xs">
                          <Hash className="h-3 w-3 text-muted-foreground mr-0.5" />
                          <input
                            type="text"
                            autoFocus
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={() => {
                              addTag();
                              setShowTagInput(false);
                            }}
                            placeholder="add-tag"
                            className="bg-transparent border-0 outline-none w-20"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-2 pt-1">
                    <div className="flex items-center gap-0.5 min-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            disabled
                            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground/60 cursor-not-allowed shrink-0"
                            aria-label="Add image"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Images coming soon</TooltipContent>
                      </Tooltip>
                      <button
                        onClick={() => setShowTagInput(true)}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors shrink-0"
                        aria-label="Add tag"
                      >
                        <Hash className="h-4 w-4" />
                      </button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            disabled
                            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground/60 cursor-not-allowed shrink-0"
                            aria-label="Rewrite with AI"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>AI rewrite coming soon</TooltipContent>
                      </Tooltip>
                      <span
                        className={cn(
                          "ml-1 text-[11px] tabular-nums shrink-0",
                          text.length > MAX_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {text.length}/{MAX_LENGTH}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto shrink-0">
                      <Button variant="ghost" size="sm" onClick={handleReset} disabled={isSubmitting} className="h-8 px-2.5">
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!text.trim() || isSubmitting}
                        className="h-8 px-3 gap-1.5"
                      >
                        {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
