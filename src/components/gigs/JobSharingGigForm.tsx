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
import { JOB_TYPES, type JobType } from "@/lib/constants/jobTypes";
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
} from "lucide-react";

interface JobSharingGigFormProps {
  gig: any;
  talentId: string;
  onSubmitted: () => void;
}

// Country alias map for detecting country from location strings
const COUNTRY_ALIASES: Record<string, string[]> = {
  "Bangladesh": ["bangladesh", "dhaka", "chattogram", "chittagong", "sylhet", "rajshahi", "khulna", "rangpur", "barishal", "comilla", "gazipur", "narayanganj", "banani", "gulshan", "dhanmondi", "uttara", "mirpur", "motijheel"],
  "UAE": ["uae", "united arab emirates", "dubai", "abu dhabi", "sharjah", "ajman"],
  "Saudi Arabia": ["saudi", "saudi arabia", "riyadh", "jeddah", "dammam", "ksa"],
  "Qatar": ["qatar", "doha"],
  "Kuwait": ["kuwait"],
  "Bahrain": ["bahrain", "manama"],
  "Oman": ["oman", "muscat"],
  "India": ["india", "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata", "pune", "noida", "gurgaon", "gurugram"],
  "Pakistan": ["pakistan", "karachi", "lahore", "islamabad"],
  "Singapore": ["singapore"],
  "Malaysia": ["malaysia", "kuala lumpur"],
  "UK": ["uk", "united kingdom", "london", "manchester", "birmingham", "england", "scotland"],
  "USA": ["usa", "united states", "new york", "san francisco", "los angeles", "chicago", "texas", "california", "boston", "seattle", "washington"],
  "Canada": ["canada", "toronto", "vancouver", "montreal", "ottawa"],
  "Australia": ["australia", "sydney", "melbourne", "brisbane", "perth"],
  "Germany": ["germany", "berlin", "munich", "frankfurt", "hamburg"],
  "Netherlands": ["netherlands", "amsterdam", "rotterdam"],
  "Ireland": ["ireland", "dublin"],
  "Japan": ["japan", "tokyo", "osaka"],
  "South Korea": ["south korea", "korea", "seoul"],
  "China": ["china", "beijing", "shanghai", "shenzhen", "guangzhou"],
  "Turkey": ["turkey", "istanbul", "ankara"],
  "Egypt": ["egypt", "cairo"],
  "Nigeria": ["nigeria", "lagos", "abuja"],
  "Kenya": ["kenya", "nairobi"],
  "South Africa": ["south africa", "johannesburg", "cape town"],
  "Philippines": ["philippines", "manila"],
  "Indonesia": ["indonesia", "jakarta"],
  "Vietnam": ["vietnam", "ho chi minh", "hanoi"],
  "Thailand": ["thailand", "bangkok"],
  "Sri Lanka": ["sri lanka", "colombo"],
  "Nepal": ["nepal", "kathmandu"],
  "Remote": ["remote", "anywhere", "worldwide", "work from home", "wfh"],
};

function detectCountry(location: string | null): string {
  if (!location) return "Unknown";
  const loc = location.toLowerCase().trim();
  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    for (const alias of aliases) {
      if (loc.includes(alias)) return country;
    }
  }
  return "Other";
}

const CHANNELS = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-green-600" },
  { key: "telegram", label: "Telegram", icon: Send, color: "text-sky-500" },
] as const;

type Channel = (typeof CHANNELS)[number]["key"];

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000;
}

export function JobSharingGigForm({ gig, talentId, onSubmitted }: JobSharingGigFormProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");

  const [activeChannel, setActiveChannel] = useState<Channel>("linkedin");
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [sharedChannels, setSharedChannels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch talent's ref_code for unique share links
  const { data: talentRefCode } = useQuery({
    queryKey: ["talent-ref-code", talentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talents")
        .select("ref_code")
        .eq("id", talentId)
        .single();
      if (error) throw error;
      return data?.ref_code as string;
    },
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["active-jobs-for-sharing"],
    queryFn: async () => {
      // Fetch all active jobs (no limit) - paginate to get past 1000 row default
      let allJobs: any[] = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("jobs")
          .select("id, title, company_name, location, job_type, created_at, is_featured, requirements")
          .eq("is_active", true)
          .gte("deadline", new Date().toISOString())
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .range(from, from + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allJobs = allJobs.concat(data);
        if (data.length < batchSize) break;
        from += batchSize;
      }
      return allJobs;
    },
  });

  // Build dynamic country list with counts
  const countryOptions = useMemo(() => {
    if (!jobs) return [];
    const counts: Record<string, number> = {};
    for (const job of jobs) {
      const country = detectCountry(job.location);
      counts[country] = (counts[country] || 0) + 1;
    }
    // Sort by count descending, but keep Bangladesh and Remote at top
    const entries = Object.entries(counts).sort((a, b) => {
      if (a[0] === "Bangladesh") return -1;
      if (b[0] === "Bangladesh") return 1;
      if (a[0] === "Remote") return -1;
      if (b[0] === "Remote") return 1;
      return b[1] - a[1];
    });
    return entries;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((j: any) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || j.title.toLowerCase().includes(term) || (j.company_name || "").toLowerCase().includes(term);
      
      // Country filter
      let matchesCountry = true;
      if (countryFilter !== "all") {
        if (countryFilter === "international") {
          const country = detectCountry(j.location);
          matchesCountry = country !== "Bangladesh";
        } else {
          matchesCountry = detectCountry(j.location) === countryFilter;
        }
      }

      // Job type filter
      let matchesType = true;
      if (jobTypeFilter !== "all") {
        matchesType = (j.job_type || "").toLowerCase() === jobTypeFilter;
      }

      return matchesSearch && matchesCountry && matchesType;
    });
  }, [jobs, searchTerm, countryFilter, jobTypeFilter]);

  const selectedJob = jobs?.find((j: any) => j.id === selectedJobId);
  const shareUrl = selectedJob
    ? `https://groupacademy.lovable.app/jobs/${selectedJob.id}${talentRefCode ? `?ref=${talentRefCode}` : ""}`
    : "";

  const generateCaption = async (channel: Channel) => {
    if (!selectedJob) return;
    setLoadingCaption(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-share-caption", {
        body: {
          title: selectedJob.title,
          company: selectedJob.company_name,
          location: selectedJob.location,
          job_type: selectedJob.job_type,
          requirements: selectedJob.requirements,
          apply_link: shareUrl,
          channel,
        },
      });
      if (error) throw error;
      if (data?.caption) {
        setCaptions((prev) => ({ ...prev, [channel]: data.caption }));
      } else {
        throw new Error(data?.error || "No caption returned");
      }
    } catch (err: any) {
      toast.error("Failed to generate caption");
      console.error(err);
    } finally {
      setLoadingCaption(false);
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    setActiveChannel(channel);
    if (!captions[channel]) {
      generateCaption(channel);
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setCaptions({});
    setSharedChannels([]);
    setTimeout(() => {
      const job = jobs?.find((j: any) => j.id === jobId);
      if (job) generateCaption("linkedin");
    }, 0);
  };

  const handleCopy = async () => {
    const caption = captions[activeChannel];
    if (!caption) return;
    await navigator.clipboard.writeText(caption);
    toast.success("Caption copied!");
  };

  const handleShare = async (channel: Channel) => {
    const caption = captions[channel] || "";
    let url = "";
    switch (channel) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(caption)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(caption)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
    }
    if (url) window.open(url, "_blank");

    if (!sharedChannels.includes(channel)) {
      setSharedChannels((prev) => [...prev, channel]);
      await supabase.from("gig_share_logs").insert({
        talent_id: talentId,
        job_id: selectedJobId,
        channel,
      });
    }
  };

  const handleSubmit = async () => {
    if (sharedChannels.length === 0) {
      toast.error("Please share the job on at least one platform");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          job_id: selectedJobId,
          job_title: selectedJob?.title,
          job_company: selectedJob?.company_name,
          channels_shared: sharedChannels,
          share_url: shareUrl,
        },
      });
      if (error) throw error;
      toast.success("Share submitted! You'll earn credits automatically once your link gets 10+ clicks.");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const jobTypeOptions = [
    { key: "all", label: "All Types" },
    ...Object.entries(JOB_TYPES).map(([key, val]) => ({ key, label: val.shortLabel })),
  ];

  return (
    <div className="space-y-4">
      {/* ── Step 1: Search & Filter ── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Find a Job to Share</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Country dropdown + Job type chips */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="h-8 text-xs w-full sm:w-[200px]">
              <Globe className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries ({jobs?.length || 0})</SelectItem>
              <SelectItem value="international">🌍 International (non-BD)</SelectItem>
              {countryOptions.map(([country, count]) => (
                <SelectItem key={country} value={country}>
                  {country} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1 flex-wrap flex-1">
            {jobTypeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setJobTypeFilter(opt.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  jobTypeFilter === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {jobs && (
          <p className="text-[10px] text-muted-foreground">
            {filteredJobs.length} of {jobs.length} jobs
          </p>
        )}
      </div>

      {/* ── Step 2: Job List ── */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto rounded-lg border border-border p-1">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading jobs...
          </div>
        ) : !filteredJobs.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No jobs match your filters.</p>
        ) : (
          filteredJobs.slice(0, 200).map((job: any) => (
            <button
              key={job.id}
              onClick={() => handleSelectJob(job.id)}
              className={`w-full text-left p-2.5 rounded-md border transition-colors ${
                selectedJobId === job.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-transparent hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-2">
                {selectedJobId === job.id ? (
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                ) : (
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{job.company_name}</p>
                    {isNew(job.created_at) && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-green-600 hover:bg-green-600">
                        NEW
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{job.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {job.location && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {job.location}
                      </span>
                    )}
                    {job.job_type && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {job.job_type.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* ── Step 3: AI Caption & Share ── */}
      {selectedJob && (
        <div className="space-y-3 border-t pt-3">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> AI Caption
          </Label>
          <div className="flex gap-1">
            {CHANNELS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => handleChannelSelect(key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeChannel === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${activeChannel === key ? "" : color}`} />
                {label}
              </button>
            ))}
          </div>

          {loadingCaption && !captions[activeChannel] ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : captions[activeChannel] ? (
            <Textarea
              readOnly
              value={captions[activeChannel]}
              className="text-sm min-h-[120px] resize-none bg-muted/30"
            />
          ) : (
            <p className="text-xs text-muted-foreground italic py-3 text-center">
              Generating caption...
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 flex-1"
              onClick={handleCopy}
              disabled={!captions[activeChannel]}
            >
              <Copy className="h-3.5 w-3.5" /> Copy Caption
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => generateCaption(activeChannel)}
              disabled={loadingCaption}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingCaption ? "animate-spin" : ""}`} />
            </Button>
            <Button
              size="sm"
              className="gap-1.5 flex-1"
              onClick={() => handleShare(activeChannel)}
              disabled={!captions[activeChannel]}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Share on {CHANNELS.find((c) => c.key === activeChannel)?.label}
            </Button>
          </div>

          {sharedChannels.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              Shared on {sharedChannels.length} platform{sharedChannels.length > 1 ? "s" : ""}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || sharedChannels.length === 0}
            className="w-full"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit for Review
          </Button>
        </div>
      )}
    </div>
  );
}
