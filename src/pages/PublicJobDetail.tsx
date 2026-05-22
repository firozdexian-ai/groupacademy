import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPublicActiveJobById } from "@/domains/jobs/repo/jobsRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Share2,
  ArrowLeft,
  ShieldCheck,
  LogIn as LogInIcon,
  Sparkles,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { RelatedJobs } from "@/domains/jobs/components/RelatedJobs";
import { Footer } from "@/components/Footer";
import logoIcon from "@/assets/logo-icon.png";
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

export default function PublicJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setLoading(true);
      const data = await getPublicActiveJobById(id);
      setJob(data as Job | null);
      setLoading(false);

      // SEO: dynamic title + meta + JSON-LD
      if (data) {
        document.title = `${data.title} at ${data.company_name} | GroupAcademy Jobs`;
        const meta = document.querySelector('meta[name="description"]');
        const desc = `${data.title} at ${data.company_name}${data.location ? ` in ${data.location}` : ""}. Apply now on GroupAcademy.`;
        if (meta) meta.setAttribute("content", desc.slice(0, 160));

        // JSON-LD JobPosting
        const existing = document.getElementById("job-jsonld");
        if (existing) existing.remove();
        const script = document.createElement("script");
        script.id = "job-jsonld";
        script.type = "application/ld+json";
        script.text = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: data.title,
          description: data.description,
          datePosted: data.created_at,
          validThrough: data.deadline,
          employmentType: data.job_type,
          hiringOrganization: {
            "@type": "Organization",
            name: data.company_name,
            logo: data.company_logo_url,
          },
          jobLocation: data.location
            ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: data.location } }
            : undefined,
          baseSalary:
            data.salary_range_min && data.salary_range_max
              ? {
                  "@type": "MonetaryAmount",
                  currency: "BDT",
                  value: {
                    "@type": "QuantitativeValue",
                    minValue: data.salary_range_min,
                    maxValue: data.salary_range_max,
                    unitText: "MONTH",
                  },
                }
              : undefined,
        });
        document.head.appendChild(script);
      }
    })();
    return () => {
      document.getElementById("job-jsonld")?.remove();
    };
  }, [id]);

  const handleShare = () => {
    if (navigator.share && job) {
      void navigator.share({
        title: job.title,
        text: `${job.title} at ${job.company_name}`,
        url: window.location.href,
      });
    } else {
      void navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    }
  };

  const goAuthThenApply = () => {
    sessionStorage.setItem("post_auth_redirect", `/app/jobs/${id}/apply`);
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-sm text-muted-foreground">This role isn't available.</p>
        <Link to="/jobs" className="text-primary text-sm underline">Browse all jobs</Link>
      </div>
    );
  }

  const deadlineDays = job.deadline ? differenceInDays(new Date(job.deadline), new Date()) : null;
  const deadlineTone =
    deadlineDays == null
      ? "muted"
      : deadlineDays <= 2
        ? "destructive"
        : deadlineDays <= 7
          ? "amber"
          : "muted";

  const description = showFullDescription
    ? job.ai_enhanced_description || job.description
    : (job.ai_enhanced_description || job.description).slice(0, 280);

  const requirements: string[] = Array.isArray(job.requirements)
    ? job.requirements
    : typeof job.requirements === "string"
      ? [job.requirements]
      : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b px-3 py-2 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Link to="/" className="flex items-center gap-2 flex-1 min-w-0">
          <img src={logoIcon} alt="GroupAcademy" className="h-6 w-6" />
          <span className="text-sm font-semibold truncate">GroupAcademy Jobs</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-3 space-y-3">
        {/* Hero */}
        <Card>
          <CardContent className="p-4 flex gap-3">
            <div className="h-14 w-14 rounded-xl bg-primary/5 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
              {job.company_logo_url ? (
                <img src={job.company_logo_url} alt={job.company_name} className="object-cover w-full h-full" />
              ) : (
                <Building2 className="h-7 w-7 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-tight">{job.title}</h1>
              <p className="text-xs text-muted-foreground">{job.company_name}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {job.location && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </Badge>
                )}
                {job.job_type && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Briefcase className="h-3 w-3" /> {JOB_TYPES[job.job_type] ?? job.job_type}
                  </Badge>
                )}
                {job.experience_level && (
                  <Badge variant="secondary" className="text-[10px]">
                    {job.experience_level}
                  </Badge>
                )}
                {job.salary_range_min && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <DollarSign className="h-3 w-3" />
                    {job.salary_range_min.toLocaleString()}
                    {job.salary_range_max ? `–${job.salary_range_max.toLocaleString()}` : "+"}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                {deadlineDays != null && (
                  <>
                    {" · "}
                    <span
                      className={cn(
                        deadlineTone === "destructive" && "text-destructive font-medium",
                        deadlineTone === "amber" && "text-amber-600 font-medium",
                      )}
                    >
                      {deadlineDays > 0
                        ? `Closes in ${deadlineDays}d`
                        : deadlineDays === 0
                          ? "Closes today"
                          : "Closed"}
                    </span>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sign-in to see match banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Sign in to see your match</p>
              <p className="text-[11px] text-muted-foreground">
                Get an AI match score and apply in one tap.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={goAuthThenApply}>
              <LogInIcon className="h-3.5 w-3.5 mr-1" /> Sign in
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold">About this role</p>
            <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {description}
              {!showFullDescription && (job.ai_enhanced_description || job.description).length > 280 && "…"}
            </p>
            {(job.ai_enhanced_description || job.description).length > 280 && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => setShowFullDescription((v) => !v)}
              >
                {showFullDescription ? "Show less" : "Read more"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        {requirements.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">Requirements</p>
              <div className="flex flex-wrap gap-1.5">
                {requirements.map((r, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {r}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* About the company */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              {job.company_logo_url ? (
                <img src={job.company_logo_url} alt={job.company_name} className="object-cover w-full h-full rounded-lg" />
              ) : (
                <Building2 className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate flex items-center gap-1">
                {job.company_name}
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              </p>
              <p className="text-[11px] text-muted-foreground">Verified employer</p>
            </div>
          </CardContent>
        </Card>

        {/* Similar roles */}
        <RelatedJobs currentJobId={job.id} companyName={job.company_name} location={job.location ?? ""} linkPrefix="/jobs" />
      </main>

      {/* Sticky apply bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t px-4 py-3 pb-safe flex items-center gap-3">
        {job.deadline && (
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            <Clock className="h-3 w-3 inline mr-1" />
            {format(new Date(job.deadline), "MMM d")}
          </span>
        )}
        <Button className="flex-1" size="lg" onClick={goAuthThenApply}>
          Apply now
        </Button>
      </div>

      <Footer />
    </div>
  );
}
