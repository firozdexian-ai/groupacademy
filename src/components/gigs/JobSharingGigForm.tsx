import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  MessageSquare,
  Linkedin,
  Facebook,
  Copy,
  CheckCircle,
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
  { key: "linkedin", label: "LINKEDIN", icon: Linkedin, color: "text-blue-600" },
  { key: "facebook", label: "FACEBOOK", icon: Facebook, color: "text-blue-500" },
  { key: "whatsapp", label: "WHATSAPP", icon: MessageSquare, color: "text-green-600" },
  { key: "telegram", label: "TELEGRAM", icon: Send, color: "text-sky-500" },
] as const;

interface JobSharingGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

export function JobSharingGigForm({ gig, talentId, onSubmitted }: JobSharingGigFormProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [activeChannel, setActiveChannel] = useState<(typeof CHANNELS)[number]["key"]>("linkedin");
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [sharedChannels, setSharedChannels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: talentRefCode } = useQuery({
    queryKey: ["talent-ref-code", talentId],
    queryFn: async () => {
      const { data } = await supabase.from("talents").select("ref_code").eq("id", talentId).single();
      return data?.ref_code;
    },
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["active-jobs-for-sharing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, company_name, location")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((j) => {
      const matchesSearch =
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.company_name.toLowerCase().includes(searchTerm.toLowerCase());
      const country = detectCountry(j.location);
      const matchesCountry = countryFilter === "all" || country === countryFilter;
      return matchesSearch && matchesCountry;
    });
  }, [jobs, searchTerm, countryFilter]);

  function detectCountry(location: string | null): string {
    if (!location) return "Remote";
    const loc = location.toLowerCase();
    for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
      if (aliases.some((alias) => loc.includes(alias))) return country;
    }
    return "International";
  }

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setCaptions({});
    setSharedChannels([]);
    executeCaptionSynthesis(jobId, "linkedin");
  };

  const executeCaptionSynthesis = async (jobId: string, channel: string) => {
    const job = jobs?.find((j) => j.id === jobId);
    if (!job) return;
    const shareUrl = `https://groupacademy.app/jobs/${job.id}${talentRefCode ? `?ref=${talentRefCode}` : ""}`;

    setLoadingCaption(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-share-caption", {
        body: { ...job, apply_link: shareUrl, channel },
      });
      if (error) throw error;
      setCaptions((prev) => ({ ...prev, [channel]: data.caption }));
    } catch (err) {
      toast.error("NEURAL_SYNC_FAULT: Artifact generation failed.");
    } finally {
      setLoadingCaption(false);
    }
  };

  const handleChannelHandshake = async (channel: (typeof CHANNELS)[number]["key"]) => {
    setActiveChannel(channel);
    if (!captions[channel] && selectedJobId) {
      await executeCaptionSynthesis(selectedJobId, channel);
    }
  };

  const handleExternalLaunch = (channel: string) => {
    const job = jobs?.find((j) => j.id === selectedJobId);
    const shareUrl = `https://groupacademy.app/jobs/${job?.id}${talentRefCode ? `?ref=${talentRefCode}` : ""}`;
    const caption = captions[channel] || "";

    const protocols: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(caption)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(caption)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };

    window.open(protocols[channel], "_blank");
    if (!sharedChannels.includes(channel)) setSharedChannels((prev) => [...prev, channel]);
  };

  const finalizeGigSubmission = async () => {
    const job = jobs?.find((j) => j.id === selectedJobId);
    const shareUrl = `https://groupacademy.app/jobs/${job?.id}${talentRefCode ? `?ref=${talentRefCode}` : ""}`;

    setIsSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .from("gig_submissions")
        .insert({
          gig_id: gig.id,
          talent_id: talentId,
          status: "pending",
          submission_data: {
            job_id: selectedJobId,
            channels: sharedChannels,
            share_url: shareUrl,
            ref_code: talentRefCode,
            protocol_v: "2.0_VIRAL",
          },
        })
        .select("id")
        .single();
      if (error) throw error;
      const { triggerAutoReview } = await import("@/lib/gigAutoReview");
      triggerAutoReview(inserted.id);
      toast.success("Tracking link active — credits unlock on first verified click");
      onSubmitted();
    } catch (err) {
      toast.error("SUBMISSION_FAULT: Check registry status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* HUD: OPPORTUNITY_SELECTOR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground">
            1. Select_Target_Node
          </Label>
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black uppercase italic tracking-widest px-3"
          >
            {filteredJobs.length} NODES_ONLINE
          </Badge>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input
              placeholder="Search Role/Parent_Org..."
              className="pl-12 rounded-2xl border-2 bg-background/50 h-12 font-bold italic text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[150px] rounded-2xl border-2 h-12 text-[10px] font-black uppercase italic">
              <Globe className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2">
              <SelectItem value="all">ALL_REGIONS</SelectItem>
              {Object.keys(COUNTRY_ALIASES).map((c) => (
                <SelectItem key={c} value={c}>
                  {c.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 max-h-48 overflow-y-auto no-scrollbar rounded-[28px] border-2 border-border/40 p-2 bg-muted/20">
          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl opacity-20" />
          ) : (
            filteredJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => handleSelectJob(job.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all duration-500 flex items-center justify-between group",
                  selectedJobId === job.id
                    ? "border-primary bg-primary/5 shadow-inner scale-[1.01]"
                    : "border-transparent hover:bg-background",
                )}
              >
                <div className="min-w-0">
                  <p className="font-black text-[11px] uppercase italic tracking-tighter truncate leading-none group-hover:text-primary">
                    {job.company_name}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground truncate mt-1 italic">{job.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-border/60">
                    {detectCountry(job.location)}
                  </Badge>
                  {selectedJobId === job.id && <Zap className="h-4 w-4 text-primary fill-current" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedJobId && (
        <div className="space-y-8 pt-4 border-t-2 border-border/10 animate-in slide-in-from-bottom-4 duration-1000">
          {/* HUD: ARTIFACT_SYNTHESIS */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-primary flex items-center gap-2 ml-1">
              <Sparkles className="h-4 w-4 fill-current" /> 2. Artifact_Synthesis
            </Label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar p-1">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => handleChannelHandshake(ch.key)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border-2",
                    activeChannel === ch.key
                      ? "bg-primary border-primary text-white shadow-xl scale-105"
                      : "bg-muted/40 border-border/40 text-muted-foreground hover:border-primary/20",
                  )}
                >
                  <ch.icon className={cn("h-4 w-4", activeChannel === ch.key ? "text-white" : ch.color)} />
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group">
            {loadingCaption && (
              <div className="absolute inset-0 bg-card/60 backdrop-blur-md z-10 flex flex-col items-center justify-center rounded-[32px] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[9px] font-black uppercase tracking-widest italic">
                  Neural_Synthesis_In_Progress...
                </p>
              </div>
            )}
            <div className="bg-card/40 backdrop-blur-xl rounded-[32px] border-2 border-border/40 p-6 shadow-2xl overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-3xl opacity-50" />
              <Textarea
                value={captions[activeChannel] || ""}
                readOnly
                placeholder="Awaiting artifact ingress..."
                className="text-xs font-medium min-h-[140px] border-0 bg-transparent resize-none italic leading-relaxed text-foreground/80 p-0 focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 rounded-xl h-10 w-10 border border-border/10 bg-background/50 hover:bg-primary/10 transition-all"
                onClick={() => {
                  navigator.clipboard.writeText(captions[activeChannel]);
                  toast.success("ARTIFACT_SYNCED_TO_CLIPBOARD");
                }}
              >
                <Copy className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full h-16 rounded-[24px] border-primary/20 text-primary font-black uppercase italic tracking-[0.2em] text-xs hover:bg-primary/5 transition-all shadow-lg active:scale-95 gap-3"
              onClick={() => handleExternalLaunch(activeChannel)}
            >
              LAUNCH_EXTERNAL_NODE <ExternalLink className="h-5 w-5" />
            </Button>

            <div className="pt-6 border-t-2 border-border/10">
              <Button
                onClick={finalizeGigSubmission}
                disabled={isSubmitting || sharedChannels.length === 0}
                className={cn(
                  "w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-2xl transition-all duration-700 active:scale-[0.98] gap-4",
                  sharedChannels.length > 0
                    ? "bg-primary text-white shadow-primary/30"
                    : "bg-muted text-muted-foreground/30 border-2 border-dashed border-border/60 grayscale cursor-not-allowed",
                )}
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
                {sharedChannels.length > 0 ? "VERIFY_DISTRIBUTION" : "AWAITING_LAUNCH_VERIFICATION"}
              </Button>

              {sharedChannels.length > 0 && (
                <div className="flex items-center justify-center gap-3 mt-5 text-emerald-500 animate-in zoom-in-95 duration-1000">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                    TRACKING_SYNCHRONIZED ({sharedChannels.length}_PLATS)
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
