import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  BookOpen,
  MessageSquare,
  Copy,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Share2,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Affiliate Distribution Node
 * CTO Reference: Authoritative interface for course referral and network reselling.
 */

interface CourseResellGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

export function CourseResellGigForm({ gig, talentId, onSubmitted }: CourseResellGigFormProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // REGISTRY_SYNC: Fetch authorized courses for distribution
  const { data: courses, isLoading } = useQuery({
    queryKey: ["active-courses-for-resell"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug, price, currency")
        .eq("is_published", true)
        .in("content_type", ["batch_class", "recorded_course", "live_webinar"])
        .order("display_order", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const selectedCourse = courses?.find((c: any) => c.id === selectedCourseId);
  const referralLink = selectedCourse
    ? `https://groupacademy.app/app/courses/${selectedCourse.slug}?ref=${talentId}`
    : "";

  const shareMessage = selectedCourse
    ? `🚀 PROTOCOL_UPGRADE: Accelerate your trajectory with "${selectedCourse.title}"!\n\nJoin the 2026 Executive cohort at GroUp Academy. ${selectedCourse.price ? `Entry: $${selectedCourse.price}` : "Limited_Free_Ingress"}\n\nInitialize_Sync: ${referralLink}`
    : "";

  const handleExecutiveAction = (type: "whatsapp" | "copy") => {
    if (type === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
    } else {
      navigator.clipboard.writeText(shareMessage);
      toast.success("LINK_SYNCED_TO_CLIPBOARD");
    }
    setShared(true);
  };

  const executeCompletionSync = async () => {
    if (!shared) {
      toast.error("PROTOCOL_ERROR: Distribution sequence not detected.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .from("gig_submissions")
        .insert({
          gig_id: gig.id,
          talent_id: talentId,
          status: "pending",
          submission_data: {
            type: "course_referral",
            course_id: selectedCourseId,
            course_title: selectedCourse?.title,
            referral_link: referralLink,
            attribution_meta: { timestamp: new Date().toISOString(), protocol_v: "2.0_AFFILIATE" },
          },
        })
        .select("id")
        .single();

      if (error) throw error;
      const { triggerAutoReview } = await import("@/lib/gigAutoReview");
      triggerAutoReview(inserted.id);
      toast.success("Referral logged — credits unlock on first click");
      onSubmitted();
    } catch (err: any) {
      toast.error("SYNC_FAULT: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* HUD: CAMPAIGN_SELECTOR */}
      <div className="space-y-4">
        <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground ml-1">
          Active_Campaign_Registry
        </Label>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-[28px] border-2 border-dashed border-border/40 gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground italic">
              Synchronizing_Market_Nodes...
            </p>
          </div>
        ) : (
          <div className="grid gap-3 max-h-60 overflow-y-auto pr-2 no-scrollbar">
            {courses?.map((course: any) => (
              <button
                key={course.id}
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setShared(false);
                }}
                className={cn(
                  "group w-full text-left p-5 rounded-[22px] border-2 transition-all duration-500 flex items-center gap-5 relative overflow-hidden",
                  selectedCourseId === course.id
                    ? "border-primary bg-primary/5 shadow-[0_0_25px_-5px_rgba(var(--primary),0.2)] scale-[1.02]"
                    : "border-border/40 hover:border-primary/20 bg-card/50",
                )}
              >
                {selectedCourseId === course.id && <div className="absolute inset-y-0 left-0 w-1 bg-primary" />}
                <div
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700 shadow-lg",
                    selectedCourseId === course.id
                      ? "bg-primary text-white rotate-6"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-black text-sm uppercase italic tracking-tighter truncate leading-none">
                    {course.title.replace(" ", "_")}
                  </p>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" />
                    <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">
                      {course.price ? `${course.currency}_${course.price}` : "ACCESS_GRANT"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CAMPAIGN_HUD: ASSETS & DISTRIBUTION */}
      {selectedCourse && (
        <div className="space-y-6 pt-2 animate-in slide-in-from-bottom-4 duration-1000">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-violet-500/20 to-primary/30 rounded-[32px] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000" />
            <div className="relative bg-card/40 backdrop-blur-xl rounded-[28px] border-2 border-border/40 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary italic">
                    Live_Sync_Artifact
                  </span>
                </div>
                <Share2 className="h-3.5 w-3.5 text-muted-foreground opacity-40" />
              </div>
              <p className="text-[11px] font-medium leading-relaxed bg-background/50 p-5 rounded-2xl border border-border/20 italic text-foreground/80 shadow-inner">
                "{shareMessage.substring(0, 120)}..."
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="rounded-2xl h-14 gap-3 font-black text-[10px] uppercase tracking-widest border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all shadow-lg active:scale-95"
              onClick={() => handleExecutiveAction("whatsapp")}
            >
              <MessageSquare className="h-5 w-5 fill-current" /> WHATSAPP_DIST
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl h-14 gap-3 font-black text-[10px] uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all shadow-lg active:scale-95"
              onClick={() => handleExecutiveAction("copy")}
            >
              <Copy className="h-5 w-5" /> COPY_PROTOCOL
            </Button>
          </div>

          <div className="pt-6 border-t-2 border-border/10">
            <Button
              onClick={executeCompletionSync}
              disabled={isSubmitting}
              className={cn(
                "w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-2xl transition-all duration-700 active:scale-[0.98] gap-3",
                shared
                  ? "bg-primary text-white shadow-primary/30"
                  : "bg-muted text-muted-foreground/30 border-2 border-dashed border-border/60 grayscale cursor-not-allowed",
              )}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              {shared ? "AUTHORIZE_COMPLETION" : "AWAITING_SHARE_VERIFICATION"}
            </Button>

            {shared && (
              <div className="flex items-center justify-center gap-2 mt-4 text-emerald-500 animate-in zoom-in-95 duration-500">
                <CheckCircle className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">
                  DISTRIBUTION_VERIFIED_PROTOCOL_STAGED
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
