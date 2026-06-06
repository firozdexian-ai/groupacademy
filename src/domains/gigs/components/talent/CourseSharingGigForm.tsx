import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTalentRefCode } from "@/domains/talent/repo/talentRepo";
import { listShareableActiveContent, insertGigSubmission } from "@/domains/gigs/repo/gigsRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { Copy, Loader2, Linkedin, Facebook, MessageSquare, Send, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "telegram", label: "Telegram", icon: Send },
] as const;

/**
 * GroUp Academy: Marketing Infrastructure Form (CourseSharingGigForm)
 * Hardened according to Phase Z0 Code Freeze specifications, incorporating
 * single-pass consolidated table lookups and structured telemetry logging.
 */
export function CourseSharingGigForm({ gig, talentId, onSubmitted }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shared, setShared] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Monitor form interaction impressions under Automated Efficiency parameters
  useEffect(() => {
    if (gig?.id) {
      trackEvent("course_sharing_form_rendered", { gigId: gig.id, talentId });
    }
  }, [gig, talentId]);

  // 1. Referral Parameters Synchronization Node
  const { data: refCode } = useQuery({
    queryKey: ["talent-ref-code", talentId],
    enabled: !!talentId,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const code = await getTalentRefCode(talentId);
      return code || talentId;
    },
  });

  // 2. High-Performance Consolidated Core Lookup Engine (Single-pass replacement)
  const {
    data: courses = [],
    isLoading,
    error: contentLoadError,
  } = useQuery({
    queryKey: ["share-active-courses"],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: async () => listShareableActiveContent(),
  });

  // Observe content lifecycle loading errors transparently
  useEffect(() => {
    if (contentLoadError) {
      trackError(contentLoadError, {
        component: "CourseSharingGigForm",
        action: "consolidated_content_fetch",
        talentId,
      });
    }
  }, [contentLoadError, talentId]);

  const filtered = useMemo(() => {
    return courses.filter((c) => !search || c.title?.toLowerCase().includes(search.toLowerCase()));
  }, [courses, search]);

  const selected = useMemo(() => courses.find((c) => c.id === selectedId), [courses, selectedId]);

  // SSR Safe Guard String Resolution
  const linkFor = (contentItem: any): string => {
    if (!contentItem) return "";
    const pathSegment =
      contentItem.content_type === "live_webinar" || contentItem.content_type === "batch_class"
        ? `/webinar/${contentItem.slug}`
        : `/courses/${contentItem.slug}`;

    const originScope = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";

    return `${originScope}${pathSegment}?ref=${refCode || talentId}`;
  };

  const launch = (channelKey: string) => {
    if (!selected) return;
    const computedTargetUrl = linkFor(selected);
    const standardPromoText = `${selected.title} — ${computedTargetUrl}`;

    trackEvent("course_sharing_channel_launched", { channel: channelKey, courseId: selected.id });

    const configurations: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(standardPromoText)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(computedTargetUrl)}&text=${encodeURIComponent(selected.title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(computedTargetUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(computedTargetUrl)}`,
    };

    if (configurations[channelKey]) {
      window.open(configurations[channelKey], "_blank", "noopener,noreferrer");
      if (!shared.includes(channelKey)) {
        setShared((prev) => [...prev, channelKey]);
      }
    }
  };

  const handleSubmissionProtocol = async () => {
    if (!selected) return;
    setSubmitting(true);

    trackEvent("course_sharing_submission_initiated", { gigId: gig.id, courseId: selected.id });

    try {
      const recordPayload = await insertGigSubmission({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          course_id: selected.id,
          share_url: linkFor(selected),
          channels: shared,
          ref_code: refCode,
          timestamp: new Date().toISOString(),
        },
      });


      // Dynamically load automated verification scripts inside a safe sandboxed container
      const { triggerAutoReview } = await import("@/lib/gigAutoReview");
      await triggerAutoReview(recordPayload.id);

      // Automated Efficiency: Synchronize caching pools instantly across active structures
      queryClient.invalidateQueries({ queryKey: ["share-active-courses"] });
      queryClient.invalidateQueries({ queryKey: ["gig_submissions", talentId] });

      toast.success("Referral tracking active!");
      onSubmitted();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);

      trackError(msg, {
        component: "CourseSharingGigForm",
        action: "submit_affiliate_form_mutation",
        gigId: gig.id,
        courseId: selected.id,
      });

      toast.error(msg || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-left select-none sm:select-text antialiased max-w-full w-full">
      {/* SECTION 1: Product Taxonomy Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider pl-0.5">
          1. Pick an active course
        </Label>
        <div className="relative select-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80 stroke-[2.2]" />
          <Input
            className="pl-9.5 h-10 rounded-xl border border-border/40 bg-background/50 focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm font-medium"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-2 max-h-48 overflow-y-auto mt-2 rounded-xl border border-border/40 p-2 bg-muted/10 shadow-inner w-full">
          {isLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-12 w-full rounded-xl opacity-60" />
              <Skeleton className="h-12 w-full rounded-xl opacity-40" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground/90 text-center py-4 font-medium leading-normal">
              No active courses found.
            </p>
          ) : (
            filtered.map((course) => {
              const isSelected = selectedId === course.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(course.id);
                    trackEvent("course_sharing_catalog_selected", { courseId: course.id });
                  }}
                  className={cn(
                    "text-left p-2.5 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 w-full cursor-pointer transform-gpu active:scale-[0.99] outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent bg-background/40 hover:border-border/30 hover:bg-background",
                  )}
                >
                  {course.cover_image_url ? (
                    <img
                      src={course.cover_image_url}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover shrink-0 border border-border/20 shadow-sm"
                      loading="eager"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary border border-primary/5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-bold text-foreground/90 truncate tracking-tight w-full">
                      {course.title}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-extrabold h-4 px-2 uppercase tracking-wide bg-background/50 border-border/40 text-muted-foreground/80 rounded-md"
                    >
                      {course.content_type?.replace("_", " ")}
                    </Badge>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Dynamic Promotion Execution Flow Tracks */}
      {selected && (
        <div className="space-y-4 pt-1 animate-in fade-in zoom-in-98 duration-200">
          {/* SECTION 2: Unique Link Registry Display */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider pl-0.5">
              2. Your Referral Link
            </Label>
            <div className="flex gap-2 w-full">
              <Input
                value={linkFor(selected)}
                readOnly
                className="text-[11px] h-10 rounded-xl font-mono border border-border/40 bg-muted/20 text-foreground/80 shadow-inner truncate select-all"
              />
              <Button
                variant="outline"
                size="icon" aria-label="Copy"
                type="button"
                className="h-10 w-10 rounded-xl border-border/60 hover:bg-accent shrink-0 active:scale-90 transition-transform cursor-pointer shadow-sm"
                onClick={() => {
                  navigator.clipboard.writeText(linkFor(selected));
                  trackEvent("course_sharing_link_copied_manual", { courseId: selected.id });
                  toast.success("Referral link copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground leading-normal pl-0.5 pt-0.5">
              Earn <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">10 credits</span>{" "}
              settled directly into your wallet for every signup through this link.
            </p>
          </div>

          {/* SECTION 3: Social Outreach Handshake Array */}
          <div className="space-y-2 select-none">
            <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider pl-0.5">
              3. Share to Channels
            </Label>
            <div className="grid grid-cols-2 gap-2 w-full">
              {CHANNELS.map((ch) => {
                const hasSharedToChannel = shared.includes(ch.key);
                return (
                  <Button
                    key={ch.key}
                    variant="outline"
                    type="button"
                    className={cn(
                      "h-10 rounded-xl text-xs font-bold justify-start gap-2.5 px-3 border-border/40 bg-background/40 hover:bg-accent cursor-pointer active:scale-95 transition-all w-full",
                      hasSharedToChannel && "border-emerald-500/20 bg-emerald-500/[0.02]",
                    )}
                    onClick={() => launch(ch.key)}
                  >
                    <ch.icon className="h-4 w-4 text-muted-foreground/80 group-hover:text-foreground shrink-0" />
                    <span className="truncate pr-1">{ch.label}</span>
                    {hasSharedToChannel && (
                      <ShieldCheck className="h-3.5 w-3.5 ml-auto text-emerald-500 shrink-0 animate-in zoom-in duration-200" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Core Transaction Confirmation Ribbon Trigger */}
          <Button
            onClick={handleSubmissionProtocol}
            disabled={submitting || shared.length === 0}
            className="w-full h-11 rounded-xl font-bold text-xs tracking-wide shadow-sm active:scale-[0.99] transition-all select-none cursor-pointer gap-2 mt-2"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 anonymity-spin animate-spin stroke-[2.5]" />
            ) : (
              <span>Confirm referral</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
