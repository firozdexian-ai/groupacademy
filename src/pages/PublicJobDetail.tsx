import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Briefcase,
  Star,
  Share2,
  RefreshCw,
  AlertCircle,
  UserPlus,
  LogIn,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { RelatedJobs } from "@/components/jobs/RelatedJobs";
import { Footer } from "@/components/Footer"; // FIX: Added missing import
import logoIcon from "@/assets/logo-icon.png"; // FIX: Added missing import
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: string;
  experience_level: string;
  salary_range_min: number | null;
  salary_range_max: number | null;
  description: string;
  ai_enhanced_description: string | null;
  requirements: any;
  deadline: string | null;
  is_featured: boolean;
  created_at: string;
  source_image_url: string | null;
}

const JOB_TYPES: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
  remote: "Remote",
};

const EXPERIENCE_LEVELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior Level",
  executive: "Executive",
};

export default function PublicJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadJob();
      executeTracking();
    }
  }, [id]);

  // FIX: Wrapped tracking logic in async to handle .rpc() correctly without .catch chaining errors
  const executeTracking = async () => {
    const source = searchParams.get("source");
    const ref = searchParams.get("ref");

    if (id) {
      try {
        if (source) await supabase.rpc("track_job_click", { p_job_id: id, p_source: source });
        if (ref) await supabase.rpc("track_shared_job_click", { p_job_id: id, p_ref_code: ref });
      } catch (err) {
        console.error("Telemetry failure:", err);
      }

      if (source || ref) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("source");
        newParams.delete("ref");
        const cleanPath = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : "");
        window.history.replaceState({}, "", cleanPath);
      }
    }
  };

  const loadJob = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id).eq("is_active", true).single();
      if (error) throw error;
      setJob(data);
    } catch (err) {
      setLoadError("Opportunity node unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} — $${max.toLocaleString()}`;
    return min ? `$${min.toLocaleString()}+` : `Up to $${max?.toLocaleString()}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: job?.title,
      text: `Explore: ${job?.title} at ${job?.company_name}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Broadcast link copied to clipboard.");
      }
    } catch (e) {
      toast.error("Sharing sequence interrupted.");
    }
  };

  const handleApplyRedirect = async () => {
    if (id) {
      try {
        await supabase.rpc("track_job_apply_click", { p_job_id: id, p_talent_id: null, p_source: "public_details" });
      } catch (e) {
        console.error("Apply track failed");
      }
    }
    navigate(`/auth?returnTo=/app/jobs/${id}`);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-8 animate-pulse">
          <Skeleton className="h-12 w-2/3 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-[32px]" />
        </div>
      </div>
    );

  if (loadError || !job)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-[32px] border-border/40 shadow-2xl">
          <CardContent className="pt-12 text-center space-y-6">
            <AlertCircle className="h-16 w-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black uppercase">Handshake Failed</h2>
            <Button className="w-full h-12 rounded-2xl font-black uppercase" onClick={loadJob}>
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  const displayDescription = job.ai_enhanced_description || job.description;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logoIcon} className="h-8 w-8 transition-transform group-hover:rotate-12" alt="GroUp" />
            <span className="font-black tracking-tighter text-lg uppercase">GroUp Academy</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-xl font-black uppercase text-[9px] tracking-[0.2em]"
          >
            <Link to="/auth?returnTo=/app/jobs">
              <LogIn className="w-3.5 h-3.5 mr-2" /> Security Login
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
        <section className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-b border-border/40 pb-12">
          <div className="flex gap-6 items-start">
            <div className="w-20 h-20 rounded-[28px] shrink-0 flex items-center justify-center shadow-2xl border border-border/40 overflow-hidden bg-primary/5">
              {job.company_logo_url ? (
                <img src={job.company_logo_url} className="w-full h-full object-cover" alt={job.company_name} />
              ) : (
                <Building2 className="w-10 h-10 text-primary/40" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {job.is_featured && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black uppercase text-[8px]">
                    Featured
                  </Badge>
                )}
                <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[8px]">
                  {JOB_TYPES[job.job_type]}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">{job.title}</h1>
              <p className="text-xl font-bold text-muted-foreground uppercase">{job.company_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full h-12 w-12 bg-muted/30">
            <Share2 className="w-5 h-5" />
          </Button>
        </section>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="flex flex-wrap gap-3">
              {[
                { icon: MapPin, label: job.location || "Remote" },
                { icon: Briefcase, label: EXPERIENCE_LEVELS[job.experience_level] },
                { icon: DollarSign, label: formatSalary(job.salary_range_min, job.salary_range_max) || "Competitive" },
              ].map((item, i) => (
                <Badge key={i} variant="secondary" className="bg-muted/50 px-4 py-2 rounded-xl text-xs font-bold gap-2">
                  <item.icon className="w-3.5 h-3.5 text-primary" /> {item.label}
                </Badge>
              ))}
            </div>

            <Card className="rounded-[32px] border-border/40 shadow-xl bg-card/50">
              <CardContent className="p-8 md:p-12 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-black uppercase tracking-widest text-sm">Brief</h3>
                </div>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  {/<[a-z]/i.test(displayDescription || "") ? (
                    <div dangerouslySetInnerHTML={{ __html: displayDescription || "" }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{displayDescription}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="rounded-[32px] border-primary/20 bg-primary/5 shadow-2xl sticky top-24">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h4 className="font-black uppercase tracking-widest text-xs text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Trusted Gateway
                  </h4>
                  <p className="text-xs font-medium">Create an account to apply and receive priority vetting.</p>
                </div>
                <Button
                  className="w-full h-14 rounded-2xl font-black uppercase text-[10px]"
                  onClick={handleApplyRedirect}
                >
                  Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="pt-12 border-t border-border/40">
          <RelatedJobs
            currentJobId={job.id}
            companyName={job.company_name}
            location={job.location}
            linkPrefix="/jobs"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LogIn(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}
