import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Building2, MapPin, Clock, DollarSign, Calendar, 
  ExternalLink, Briefcase, Star, Share2, Loader2, FileText, MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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
  application_type: string;
  application_email: string | null;
  application_url: string | null;
  deadline: string | null;
  is_featured: boolean;
  created_at: string;
  profession_category_id: string | null;
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

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setJob(data);

      // Load related jobs
      if (data?.profession_category_id) {
        const { data: related } = await supabase
          .from("jobs")
          .select("*")
          .eq("is_active", true)
          .eq("profession_category_id", data.profession_category_id)
          .neq("id", id)
          .limit(3);
        setRelatedJobs(related || []);
      }
    } catch (error) {
      console.error("Error loading job:", error);
      toast.error("Job not found");
      navigate("/jobs");
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `BDT ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `BDT ${min.toLocaleString()}+`;
    if (max) return `Up to BDT ${max.toLocaleString()}`;
    return null;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `${job?.title} at ${job?.company_name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleApply = () => {
    if (job?.application_type === "link" && job.application_url) {
      window.open(job.application_url, "_blank");
    } else {
      // Navigate to application flow
      navigate(`/jobs/${id}/apply`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const displayDescription = job.ai_enhanced_description || job.description;
  const isDeadlinePassed = job.deadline && new Date(job.deadline) < new Date();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-8">
          <div className="container mx-auto px-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/jobs")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
            </Button>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Company Logo */}
              {job.company_logo_url ? (
                <img 
                  src={job.company_logo_url} 
                  alt={job.company_name}
                  className="w-20 h-20 rounded-xl object-cover bg-muted"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-start gap-2 flex-wrap">
                  {job.is_featured && (
                    <Badge className="gap-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                      <Star className="w-3 h-3 fill-current" /> Featured
                    </Badge>
                  )}
                  {isDeadlinePassed && (
                    <Badge variant="destructive">Deadline Passed</Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mt-2">{job.title}</h1>
                <p className="text-lg text-muted-foreground mt-1">{job.company_name}</p>

                <div className="flex flex-wrap gap-3 mt-4">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {JOB_TYPES[job.job_type] || job.job_type}
                  </Badge>
                  <Badge variant="secondary">
                    {EXPERIENCE_LEVELS[job.experience_level] || job.experience_level}
                  </Badge>
                  {job.location && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </Badge>
                  )}
                  {formatSalary(job.salary_range_min, job.salary_range_max) && (
                    <Badge variant="outline" className="gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatSalary(job.salary_range_min, job.salary_range_max)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button 
                  size="lg" 
                  className="flex-1 md:flex-none"
                  onClick={handleApply}
                  disabled={isDeadlinePassed}
                >
                  {job.application_type === "link" ? (
                    <>Apply Now <ExternalLink className="w-4 h-4 ml-2" /></>
                  ) : (
                    "Apply Now"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Job Description</h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {displayDescription}
                    </div>
                  </CardContent>
                </Card>

                {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Requirements</h2>
                      <ul className="space-y-2">
                        {job.requirements.map((req: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Job Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Job Type</p>
                          <p className="font-medium">{JOB_TYPES[job.job_type] || job.job_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Experience</p>
                          <p className="font-medium">{EXPERIENCE_LEVELS[job.experience_level] || job.experience_level}</p>
                        </div>
                      </div>
                      {job.deadline && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Deadline</p>
                            <p className="font-medium">{format(new Date(job.deadline), "MMMM d, yyyy")}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Posted</p>
                          <p className="font-medium">{format(new Date(job.created_at), "MMMM d, yyyy")}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Career Services CTA */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3">Boost Your Application</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Stand out from other candidates with our career services
                    </p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => navigate("/portfolio-request")}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Build Digital Portfolio
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => navigate("/mock-interview")}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Practice Interview
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Related Jobs */}
                {relatedJobs.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Similar Jobs</h3>
                      <div className="space-y-3">
                        {relatedJobs.map(rJob => (
                          <div 
                            key={rJob.id}
                            className="p-3 rounded-lg border hover:border-primary/30 cursor-pointer transition-colors"
                            onClick={() => navigate(`/jobs/${rJob.id}`)}
                          >
                            <p className="font-medium text-sm line-clamp-1">{rJob.title}</p>
                            <p className="text-xs text-muted-foreground">{rJob.company_name}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default JobDetail;
