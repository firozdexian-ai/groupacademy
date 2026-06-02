import { useState, useRef, useEffect } from "react";
import { Send, X, Loader2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { insertFeedPost } from "@/domains/feed/repo/feedRepo";
import { useTalent } from "@/hooks/useTalent";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ComposePostProps {
  onPostCreated: () => void;
}

const MAX_LENGTH = 1000;
const MAX_TAGS = 5;

/**
 * Premium, performance-optimized User Content Composition panel.
 * Built according to GroUp Academy Phase Z0 highly professional SAAS UI specifications
 * and Digital Workforce automated content telemetry guidelines.
 */
export function ComposePost({ onPostCreated }: ComposePostProps) {
  const { talent } = useTalent();
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (talent?.id) {
      trackEvent("feed_compose_opened", {
        talentId: talent.id,
      });
    }
  }, [talent]);

  if (!talent) return null;

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
    const toastId = toast.loading("Publishing to community feed…");

    // Telemetry: Multiplex transaction metadata securely to track layout trends
    trackEvent("feed_post_submission_attempt", {
      talentId: talent.id,
      contentLength: trimmed.length,
      tagsCount: tags.length,
    });

    try {
      const { error } = await insertFeedPost({
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

      toast.success("Post published successfully", { id: toastId });

      // Fire-and-forget success metrics hook to help track organic growth velocity
      trackEvent("feed_post_submission_success", { talentId: talent.id });

      handleReset();
      onPostCreated();
    } catch (err: any) {
      // Digital Workforce Escalation: Route write errors directly to error utilities for admin diagnostics
      trackError(err instanceof Error ? err : String(err), {
        component: "ComposePost",
        action: "submit_database_mutation",
        talentId: talent.id,
        payloadTextSnippet: trimmed.slice(0, 60),
      });

      toast.error("Couldn't publish your post right now.", { id: toastId });
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
    const cleanTag = tagInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (cleanTag && tags.length < MAX_TAGS && !tags.includes(cleanTag)) {
      setTags((p) => [...p, cleanTag]);
      setTagInput("");
      trackEvent("feed_post_tag_added", { tag: cleanTag, currentCount: tags.length + 1 });
    } else if (tags.length >= MAX_TAGS) {
      toast.info("Maximum of 5 tags allowed per post.");
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

  const expand = () => {
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex gap-3 items-start">
            <Avatar className="h-9 w-9 shrink-0 border border-border/40 shadow-sm select-none">
              <AvatarImage src={talent.profilePhotoUrl} alt={talent.fullName || "User Profile Photo"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {!isExpanded ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={expand}
                    className="flex-1 text-left bg-muted/30 hover:bg-muted/50 rounded-full px-4 h-9 flex items-center transition-colors border border-border/10 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span className="text-xs sm:text-sm text-muted-foreground/80 select-none">
                      What's on your mind, {firstName}?
                    </span>
                  </button>

                  <div className="flex items-center gap-0.5 shrink-0 select-none" />

                </div>
              ) : (
                <div className="space-y-3 transition-all duration-200">
                  <Textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                    placeholder="Share an update with your community…"
                    className="min-h-[110px] w-full resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60 text-foreground leading-relaxed selection:bg-primary/20"
                  />

                  {/* Badges and Tags Layout Frame Matrix */}
                  {(tags.length > 0 || showTagInput) && (
                    <div className="flex flex-wrap gap-1.5 items-center pt-1">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-muted/60 text-foreground hover:bg-muted rounded-full pl-2.5 pr-1.5 py-0.5 text-xs font-semibold gap-1 select-none border border-border/20"
                        >
                          #{tag}
                          <button
                            onClick={() => setTags((p) => p.filter((t) => t !== tag))}
                            className="rounded-full hover:bg-foreground/10 p-0.5 transition-colors cursor-pointer"
                            aria-label={`Remove tag ${tag}`}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}

                      {showTagInput && tags.length < MAX_TAGS && (
                        <div className="flex items-center bg-muted/40 rounded-full px-2.5 py-0.5 text-xs border border-border/30 shadow-inner animate-in fade-in zoom-in-95 duration-150">
                          <Hash className="h-3 w-3 text-muted-foreground/60 mr-0.5 shrink-0" />
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
                            placeholder="tag..."
                            className="bg-transparent border-0 outline-none w-20 text-foreground text-xs p-0 focus:ring-0"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toolbar & Submission Control Bar */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-2 pt-2 border-t border-border/30 select-none">
                    <div className="flex items-center gap-1 min-w-0">
                      <button
                        onClick={() => tags.length < MAX_TAGS && setShowTagInput(true)}
                        disabled={tags.length >= MAX_TAGS}
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer",
                          tags.length >= MAX_TAGS
                            ? "text-muted-foreground/30 cursor-not-allowed"
                            : "text-muted-foreground hover:text-primary hover:bg-muted/50",
                        )}
                        aria-label="Add tag"
                      >
                        <Hash className="h-4 w-4" />
                      </button>



                      <span
                        className={cn(
                          "ml-2 text-[11px] font-bold tracking-tight tabular-nums shrink-0",
                          text.length > MAX_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground/70",
                        )}
                      >
                        {text.length}/{MAX_LENGTH}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        disabled={isSubmitting}
                        className="h-8 px-3 rounded-xl text-xs hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!text.trim() || isSubmitting}
                        className="h-8 px-3.5 gap-1.5 rounded-xl font-semibold text-xs active:scale-[0.98] transition-all shadow-sm"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
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
