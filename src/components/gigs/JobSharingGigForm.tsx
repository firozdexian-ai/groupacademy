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
  Briefcase,
  MapPin,
  RefreshCw,
  Send,
  ExternalLink,
  Sparkles,
  Globe,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobSharingGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

const COUNTRY_ALIASES: Record<string, string[]> = {
  Bangladesh: ["bangladesh", "dhaka", "banani", "gulshan", "uttara", "chattogram"],
  UAE: ["dubai", "abu dhabi", "uae", "emirates"],
  USA: ["usa", "united states", "ny", "california", "remote"],
  UK: ["london", "uk", "manchester", "britain"],
  India: ["india", "mumbai", "bangalore", "delhi"],
  Singapore: ["singapore", "sg"],
  "Saudi Arabia": ["saudi", "riyadh", "jeddah", "ksa"],
};

function detectCountry(location: string | null): string {
  if (!location) return "Remote";
  const loc = location.toLowerCase();
  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (aliases.some((alias) => loc.includes(alias))) return country;
  }
  return "International";
}

const CHANNELS = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-green-600" },
  { key: "telegram", label: "Telegram", icon: Send, color: "text-sky-500" },
] as const;

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
        .select("id, title, company_name, location, job_type, created_at, requirements")
        .eq("is_active", true)
        .gte("deadline", new Date().toISOString())
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
      const matchesCountry = countryFilter === "all" || detectCountry(j.location) === countryFilter;
      return matchesSearch && matchesCountry;
    });
  }, [jobs, searchTerm, countryFilter]);

  const selectedJob = jobs?.find((j) => j.id === selectedJobId);
  const shareUrl = selectedJob
    ? `https://groupacademy.app/jobs/${selectedJob.id}${talentRefCode ? `?ref=${talentRefCode}` : ""}`
    : "";

  // RESTORED: Missing function definition
  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setCaptions({}); // Clear old AI captions
    setSharedChannels([]); // Reset sharing progress
    // Trigger initial caption generation for the default channel
    generateCaption(jobId, "linkedin");
  };

  const generateCaption = async (jobId: string, channel: string) => {
    const job = jobs?.find((j) => j.id === jobId);
    if (!job) return;

    setLoadingCaption(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-share-caption", {
        body: { ...job, apply_link: shareUrl, channel },
      });
      if (error) throw error;
      setCaptions((prev) => ({ ...prev, [channel]: data.caption }));
    } catch (err) {
      toast.error("AI was unable to generate a caption.");
    } finally {
      setLoadingCaption(false);
    }
  };

  const handleChannelChange = async (channel: (typeof CHANNELS)[number]["key"]) => {
    setActiveChannel(channel);
    if (!captions[channel] && selectedJobId) {
      await generateCaption(selectedJobId, channel);
    }
  };

  const handleShareTrigger = (channel: string) => {
    const caption = captions[channel] || "";
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(caption)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(caption)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };

    window.open(urls[channel], "_blank");
    if (!sharedChannels.includes(channel)) {
      setSharedChannels((prev) => [...prev, channel]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          job_id: selectedJobId,
          channels: sharedChannels,
          share_url: shareUrl,
          ref_code: talentRefCode,
        },
      });
      if (error) throw error;
      toast.success("Gig submitted! We are now tracking your referral link.");
      onSubmitted();
    } catch (err) {
      toast.error("Submission failed. Check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            1. Select Opportunity
          </Label>
          <Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20">
            {filteredJobs.length} Jobs Available
          </Badge>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Role or Company..."
              className="pl-9 rounded-xl border-border/40 h-10 text-xs font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[130px] rounded-xl h-10 text-[10px] font-black uppercase tracking-tighter">
              <Globe className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {Object.keys(COUNTRY_ALIASES).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 max-h-[180px] overflow-y-auto no-scrollbar rounded-2xl border border-border/20 p-1">
          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : (
            filteredJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => handleSelectJob(job.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between",
                  selectedJobId === job.id
                    ? "border-primary bg-primary/5 shadow-inner"
                    : "border-transparent hover:bg-muted/50",
                )}
              >
                <div className="min-w-0">
                  <p className="font-bold text-[11px] truncate">{job.company_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{job.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-5">
                    {detectCountry(job.location)}
                  </Badge>
                  {selectedJobId === job.id && <CheckCircle className="h-4 w-4 text-primary" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedJob && (
        <div className="space-y-6 pt-4 border-t border-border/40 animate-in slide-in-from-top-4">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> 2. Generate AI Caption
            </Label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => handleChannelChange(ch.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                    activeChannel === ch.key ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  <ch.icon className={cn("h-3.5 w-3.5", activeChannel === ch.key ? "text-white" : ch.color)} />
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group">
            {loadingCaption && (
              <div className="absolute inset-0 bg-card/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <Textarea
              value={captions[activeChannel] || ""}
              readOnly
              placeholder="Preparing professional social copy..."
              className="text-[11px] font-medium min-h-[120px] rounded-2xl border-border/40 bg-muted/20 resize-none italic"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 rounded-full h-8 w-8 hover:bg-primary/10"
              onClick={() => {
                navigator.clipboard.writeText(captions[activeChannel]);
                toast.success("Caption copied to clipboard");
              }}
            >
              <Copy className="h-3.5 w-3.5 text-primary" />
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]"
              onClick={() => handleShareTrigger(activeChannel)}
            >
              Launch on {activeChannel} <ExternalLink className="h-3.5 w-3.5 ml-2" />
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || sharedChannels.length === 0}
              className={cn(
                "w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all",
                sharedChannels.length > 0 ? "shadow-primary/20" : "opacity-50 grayscale",
              )}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Confirm Verified Share
            </Button>

            {sharedChannels.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 animate-in zoom-in-95">
                <CheckCircle className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Tracking Active ({sharedChannels.length} Platform)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
