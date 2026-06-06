import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateJobShareCaption } from "@/domains/jobs/api/jobsApi";
import { getActiveJobsForSharing } from "@/domains/jobs/repo/jobsRepo";
import { getTalentRefCode } from "@/domains/talent/repo/talentRepo";
import { insertGigSubmission } from "@/domains/gigs/repo/gigsRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  MessageSquare,
  Linkedin,
  Facebook,
  Copy,
  RefreshCw,
  Send,
  ExternalLink,
  Sparkles,
  Globe,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Job Distribution & Attribution Node
 * CTO Reference: Authoritative interface for viral recruitment and referral tracking.
 * Version: Launch Candidate · Phase Z0 Hardened
 */

const COUNTRY_ALIASES: Record<string, string[]> = {
  Bangladesh: ["bangladesh", "dhaka", "banani", "gulshan", "uttara", "chattogram"],
  UAE: ["dubai", "abu dhabi", "uae", "emirates"],
  USA: ["usa", "united states", "ny", "california", "remote"],
  UK: ["london", "uk", "manchester", "britain"],
  India: ["india", "mumbai", "bangalore", "delhi"],
  Singapore: ["singapore", "sg"],
  "Saudi Arabia": ["saudi", "riyadh", "jeddah", "ksa"],
};

const CHANNELS = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600 dark:text-blue-400" },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500 dark:text-blue-400" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-green-600 dark:text-green-400" },
  { key: "telegram", label: "Telegram", icon: Send, color: "text-sky-500 dark:text-sky-400" },
] as const;

interface JobSharingGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

export function JobSharingGigForm({ gig, talentId, onSubmitted }: JobSharingGigFormProps) {
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [activeChannel, setActiveChannel] = useState<(typeof CHANNELS)[number]["key"]>("linkedin");
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [sharedChannels, setSharedChannels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track initial interactive workspace orchestration configurations via telemetry hooks
  useEffect(() => {
    if (gig?.id) {
      trackEvent("job_sharing_form_mounted", { gigId: gig.id, talentId });
    }
  }, [gig, talentId]);

  if (!gig || !gig.id || !talentId) {
    trackError("JobSharingGigForm mounted without valid structural properties.", {
      component: "JobSharingGigForm",
      action: "null_pointer_assertion",
    });
    return null;
  }

  // 1. Referral Parameters Synchronization Node
  const { data: talentRefCode } = useQuery({
    queryKey: ["talent-ref-code", talentId],
    enabled: !!talentId,
    refetchOnWindowFocus: false,
    queryFn: () => getTalentRefCode(talentId),
  });

  // 2. Active Employment Tracking Query Pipeline
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["active-jobs-for-sharing"],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: () => getActiveJobsForSharing(),
  });

  function detectCountry(location: string | null): string {
    if (!location) return "Remote";
    const loc = location.toLowerCase();
    for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
      if (aliases.some((alias) => loc.includes(alias))) return country;
    }
    return "International";
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const country = detectCountry(j.location);
      const matchesCountry = countryFilter === "all" || country === countryFilter;
      return matchesSearch && matchesCountry;
    });
  }, [jobs, searchTerm, countryFilter]);

  const handleSelectJob = (jobId: string) => {
    if (!jobId) return;
    setSelectedJobId(jobId);
    setCaptions({});
    setSharedChannels([]);
    trackEvent("job_sharing_target_node_selected", { jobId, gigId: gig.id });
    executeCaptionSynthesis(jobId, "linkedin");
  };

  const linkForJob = (jobId: string): string => {
    const originScope =
      typeof window !== "undefined" && window.location?.origin ? window.location.origin : "https://groupacademy.app";
    return `${originScope}/jobs/${jobId}${talentRefCode ? `?ref=${talentRefCode}` : ""}`;
  };

  const executeCaptionSynthesis = async (jobId: string, channel: string) => {
    const job = jobs?.find((j) => j.id === jobId);
    if (!job) return;

    const shareUrl = linkForJob(job.id);
    setLoadingCaption(true);

    trackEvent("job_sharing_caption_synthesis_started", { jobId, channel });

    try {
      const data = await generateJobShareCaption({ ...job, apply_link: shareUrl, channel } as any);
      setCaptions((prev) => ({ ...prev, [channel]: (data as any)?.caption || "" }));
      trackEvent("job_sharing_caption_synthesis_success", { jobId, channel });
    } catch (err: any) {
      trackError(err, {
        component: "JobSharingGigForm",
        action: "execute_caption_synthesis",
        jobId,
        channel,
      });
      toast.error("Failed to generate caption. Please try again.");
    } finally {
      setLoadingCaption(false);
    }
  };

  const handleChannelHandshake = async (channel: (typeof CHANNELS)[number]["key"]) => {
    setActiveChannel(channel);
    trackEvent("job_sharing_channel_swapped", { channel, jobId: selectedJobId });
    if (!captions[channel] && selectedJobId) {
      await executeCaptionSynthesis(selectedJobId, channel);
    }
  };

  const handleExternalLaunch = (channel: string) => {
    const job = jobs?.find((j) => j.id === selectedJobId);
    if (!job) return;

    const shareUrl = linkForJob(job.id);
    const caption = captions[channel] || "";

    trackEvent("job_sharing_external_node_launched", { channel, jobId: job.id });

    const protocols: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(caption)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(caption)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };

    if (protocols[channel]) {
      window.open(protocols[channel], "_blank", "noopener,noreferrer");
      if (!sharedChannels.includes(channel)) {
        setSharedChannels((prev) => [...prev, channel]);
      }
    }
  };

  const finalizeGigSubmission = async () => {
    if (!selectedJobId) return;
    const job = jobs?.find((j) => j.id === selectedJobId);
    const shareUrl = linkForJob(selectedJobId);

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting referral details...");

    trackEvent("job_sharing_submission_finalizing", { gigId: gig.id, selectedJobId, talentId });

    try {
      const inserted = await insertGigSubmission({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          job_id: selectedJobId,
          channels: sharedChannels,
          share_url: shareUrl,
          ref_code: talentRefCode,
          protocol_v: "2.0_VIRAL",
          timestamp: new Date().toISOString(),
        },
      });

      // Load auto-review scripts dynamically within clean sandbox execution layers
      const { triggerAutoReview } = await import("@/lib/gigAutoReview");
      await triggerAutoReview(inserted.id);

      // Automated Efficiency: Broadcast explicit cache updates across shared pools instantly
      queryClient.invalidateQueries({ queryKey: ["gig-submission-counts", talentId] });
      queryClient.invalidateQueries({ queryKey: ["my-gig-submissions", talentId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      toast.success("Referral submitted successfully!", { id: toastId });
      onSubmitted();
    } catch (err: any) {
      const parsedMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedMsg, {
        component: "JobSharingGigForm",
        action: "finalize_gig_submission",
        gigId: gig.id,
        talentId,
      });

      toast.error("Failed to submit referral. Please try again.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left select-none sm:select-text antialiased max-w-full w-full">
      {/* SECTION 1: Dynamic Node Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5 select-none">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            1. Select a job to share
          </Label>
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-wider px-2.5 h-5 rounded-md shadow-sm"
          >
            {filteredJobs.length} jobs available
          </Badge>
        </div>

        <div className="flex gap-2 w-full select-none">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 stroke-[2.2]" />
            <Input
              placeholder="Search roles or companies..."
              className="pl-10 h-10 rounded-xl border border-border/40 bg-background/50 focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[130px] rounded-xl border border-border/40 bg-background/40 h-10 text-[10px] font-bold uppercase tracking-wide shrink-0">
              <Globe className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border/40 shadow-xl bg-background/95 backdrop-blur-md">
              <SelectItem value="all" className="text-xs font-bold uppercase tracking-wide">
                All Regions
              </SelectItem>
              {Object.keys(COUNTRY_ALIASES).map((country) => (
                <SelectItem key={country} value={country} className="text-xs font-bold uppercase tracking-wide">
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 max-h-40 overflow-y-auto rounded-xl border border-border/40 p-2 bg-muted/10 shadow-inner w-full">
          {isLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-11 w-full rounded-xl opacity-60" />
              <Skeleton className="h-11 w-full rounded-xl opacity-40" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground/80 font-medium leading-normal text-center py-4 select-text">
              No active jobs found in this region.
            </p>
          ) : (
            filteredJobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => handleSelectJob(job.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer transform-gpu active:scale-[0.99] outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent bg-background/40 hover:border-border/30 hover:bg-background",
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-bold text-xs sm:text-sm text-foreground/90 truncate leading-none group-hover:text-primary transition-colors pr-1">
                      {job.company_name}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground truncate leading-tight pr-1 italic">
                      {job.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 select-none">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-extrabold px-2 py-0 h-4.5 rounded-md tracking-wider border-border/40 text-muted-foreground/70 bg-background/50"
                    >
                      {detectCountry(job.location)}
                    </Badge>
                    {isSelected && <Zap className="h-3.5 w-3.5 text-primary fill-primary/10 animate-pulse" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: Dynamic Copywriting Synthesis Panel */}
      {selectedJobId && (
        <div className="space-y-4 pt-1 border-t border-border/20 animate-in slide-in-from-bottom-3 duration-500 w-full min-w-0">
          <div className="space-y-2 select-none w-full">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 pl-0.5">
              <Sparkles className="h-3.5 w-3.5 text-primary fill-primary/10 shrink-0" />
              <span>2. Generated Share Caption</span>
            </Label>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar p-0.5 w-full max-w-full">
              {CHANNELS.map((ch) => {
                const isActiveChannel = activeChannel === ch.key;
                return (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() => handleChannelHandshake(ch.key)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 border transform-gpu active:scale-95 outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      isActiveChannel
                        ? "bg-primary border-primary text-white shadow-sm font-extrabold"
                        : "bg-background/40 border-border/40 text-muted-foreground/90 hover:border-primary/30",
                    )}
                  >
                    <ch.icon
                      className={cn("h-3.5 w-3.5 shrink-0", isActiveChannel ? "text-white fill-current" : ch.color)}
                    />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative group w-full min-w-0">
            {loadingCaption && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl gap-2 select-none border border-border/10 animate-in fade-in duration-200">
                <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic animate-pulse">
                  Generating caption...
                </p>
              </div>
            )}

            <div className="bg-card/40 border border-border/40 backdrop-blur-md rounded-2xl p-4 shadow-inner overflow-hidden relative w-full min-w-0 text-left">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none select-none" />
              <Textarea
                value={captions[activeChannel] || ""}
                readOnly
                placeholder="Awaiting AI generation..."
                className="text-xs font-medium min-h-[120px] border-0 bg-transparent resize-none leading-relaxed text-foreground/80 p-0 focus-visible:ring-0 break-words w-full"
              />
              <Button
                variant="outline"
                size="icon" aria-label="Copy"
                type="button"
                className="absolute top-3 right-3 rounded-xl h-8 w-8 border border-border/40 bg-background/60 hover:bg-primary/5 cursor-pointer active:scale-90 transition-transform shadow-sm"
                onClick={() => {
                  if (!captions[activeChannel]) return;
                  navigator.clipboard.writeText(captions[activeChannel]);
                  trackEvent("job_sharing_copy_clipboard_clicked", { channel: activeChannel });
                  toast.success("Caption copied to clipboard");
                }}
                disabled={!captions[activeChannel]}
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground/80" />
              </Button>
            </div>
          </div>

          {/* Action Ribbon Execution Control Strip */}
          <div className="flex flex-col gap-3 w-full select-none pt-1">
            <Button
              variant="outline"
              type="button"
              disabled={loadingCaption || !captions[activeChannel]}
              className="w-full h-10 rounded-xl border-primary/20 text-primary font-bold text-xs tracking-wide hover:bg-primary/5 transition-all shadow-sm active:scale-[0.98] gap-2 cursor-pointer"
              onClick={() => handleExternalLaunch(activeChannel)}
            >
              <span>Open App to Share</span>
              <ExternalLink className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
            </Button>

            <div className="pt-4 border-t border-border/20 w-full">
              <Button
                onClick={finalizeGigSubmission}
                disabled={isSubmitting || sharedChannels.length === 0}
                type="button"
                className={cn(
                  "w-full h-11 rounded-xl font-bold text-xs tracking-wide shadow-md active:scale-[0.99] transition-all gap-2 cursor-pointer",
                  sharedChannels.length > 0
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground/30 border border-dashed border-border/50 grayscale cursor-not-allowed pointer-events-none",
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                <span>
                  {sharedChannels.length > 0 ? "Submit for review" : "Share to at least one channel first"}
                </span>
              </Button>

              {sharedChannels.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-emerald-500 animate-in zoom-in-95 duration-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 tabular-nums">
                    Tracking referral ({sharedChannels.length} shared)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
