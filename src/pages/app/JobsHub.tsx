import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Briefcase,
  Clock,
  MapPin,
  Building2,
  Sparkles,
  ChevronRight,
  FileText,
  ArrowRight,
  CheckCircle2,
  Send,
  Eye,
  Bookmark,
  Settings,
  ChevronDown,
  ChevronUp,
  Coins,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobPreferencesSheet } from "@/components/jobs/JobPreferencesSheet";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: string;
  created_at: string;
}

interface JobApplication {
  id: string;
  created_at: string;
  application_status: string | null;
  delivery_status: string | null;
  jobs: {
    id: string;
    title: string;
    company_name: string;
    company_logo_url: string | null;
  };
}

const JOB_COLLECTIONS = [
  { label: "Full-time", filter: "full_time", icon: Briefcase, gradient: "from-blue-500/20 to-blue-600/10" },
  { label: "Part-time", filter: "part_time", icon: Clock, gradient: "from-purple-500/20 to-purple-600/10" },
  { label: "Internship", filter: "internship", icon: Building2, gradient: "from-green-500/20 to-green-600/10" },
  { label: "Remote", filter: "remote", icon: MapPin, gradient: "from-orange-500/20 to-orange-600/10" },
];

const EXTENDED_COLLECTIONS = [
  { label: "Contract", filter: "contract" },
  { label: "Freelance", filter: "freelance" },
];

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  part_time: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  contract: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  internship: "bg-green-500/10 text-green-600 dark:text-green-400",
  freelance: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  remote: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const APPLICATION_STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Send }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-500/10 text-blue-600", icon: Send },
  delivered: { label: "Delivered", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  viewed: { label: "Viewed", color: "bg-purple-500/10 text-purple-600", icon: Eye },
  rejected: { label: "Not Selected", color: "bg-red-500/10 text-red-600", icon: FileText },
  accepted: { label: "Shortlisted", color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2 },
};

export default function JobsHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { savedItems } = useSavedItems();
  const { canAfford, deductCredits } = useCredits();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [topPicks, setTopPicks] = useState<Job[]>([]);
  const [personalizedJobs, setPersonalizedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [showExtendedCollections, setShowExtendedCollections] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // Count saved jobs
  const savedJobsCount = savedItems.filter(item => item.item_type === 'job').length;

  useEffect(() => {
    fetchTopPicks();
    fetchPersonalizedJobs();
  }, [talent?.id]);

  useEffect(() => {
    if (talent?.id) {
      fetchApplications();
    } else {
      setApplicationsLoading(false);
    }
  }, [talent?.id]);

  async function fetchTopPicks() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, company_name, company_logo_url, location, job_type, created_at")
        .eq("is_active", true)
        .or("deadline.is.null,deadline.gte.now()")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setTopPicks((data as Job[]) || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPersonalizedJobs() {
    if (!talent?.id) return;
    
    setPersonalizedLoading(true);
    try {
      // Simple personalization based on profession category
      let query = supabase
        .from("jobs")
        .select("id, title, company_name, company_logo_url, location, job_type, created_at")
        .eq("is_active", true)
        .or("deadline.is.null,deadline.gte.now()")
        .order("created_at", { ascending: false })
        .limit(5);

      // If user has profession category, filter by it
      if (talent.professionCategoryId) {
        query = query.eq("profession_category_id", talent.professionCategoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPersonalizedJobs((data as Job[]) || []);
    } catch (error) {
      console.error("Error fetching personalized jobs:", error);
    } finally {
      setPersonalizedLoading(false);
    }
  }

  async function fetchApplications() {
    setApplicationsLoading(true);
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select(
          `
          id,
          created_at,
          application_status,
          delivery_status,
          jobs:job_id (
            id,
            title,
            company_name,
            company_logo_url
          )
        `,
        )
        .eq("talent_id", talent!.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setApplications((data as unknown as JobApplication[]) || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setApplicationsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/app/jobs/all?search=${encodeURIComponent(searchQuery)}`);
  }

  function getApplicationStatus(app: JobApplication) {
    const status = app.application_status || app.delivery_status || "pending";
    return APPLICATION_STATUS_CONFIG[status] || APPLICATION_STATUS_CONFIG.pending;
  }

  async function handleShowAllAI() {
    if (!canAfford("SUGGESTED_JOBS")) {
      toast.error("Insufficient credits. You need 10 credits for AI recommendations.");
      return;
    }

    setLoadingAI(true);
    try {
      const success = await deductCredits("SUGGESTED_JOBS", undefined, "AI Job Recommendations");
      if (!success) {
        toast.error("Failed to process credits");
        return;
      }
      
      // Navigate to all jobs with AI flag
      navigate("/app/jobs/all?ai=true");
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      toast.error("Failed to get AI recommendations");
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Hero Section - Compact */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-4">
        <h1 className="text-lg font-bold mb-0.5">Find Your Dream Job</h1>
        <p className="text-sm text-muted-foreground mb-3">Discover opportunities that match your skills</p>

        {/* Search Bar - Compact */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-20 h-11 text-sm rounded-xl border-2 focus:border-primary bg-background"
            />
            <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg h-8">
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Quick Access Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        <Button 
          variant="outline" 
          size="sm" 
          className="shrink-0 gap-1.5"
          onClick={() => navigate('/app/saved?tab=jobs')}
        >
          <Bookmark className="h-4 w-4" />
          Saved Jobs
          {savedJobsCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {savedJobsCount}
            </Badge>
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="shrink-0 gap-1.5"
          onClick={() => navigate('/app/applications')}
        >
          <FileText className="h-4 w-4" />
          Applied
          {applications.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {applications.length}
            </Badge>
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="shrink-0 gap-1.5"
          onClick={() => setPreferencesOpen(true)}
        >
          <Settings className="h-4 w-4" />
          Preferences
        </Button>
      </div>

      {/* Top Picks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold">Top Picks for You</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-medium hover:bg-primary/5"
            onClick={() => navigate("/app/jobs/all")}
          >
            See all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : topPicks.length === 0 ? (
          <Card className="border-dashed bg-muted/50">
            <CardContent className="p-6 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No job openings available right now.</p>
              <p className="text-sm text-muted-foreground/70">Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {topPicks.map((job, index) => (
              <Card
                key={job.id}
                className="cursor-pointer overflow-hidden animate-bounce-in press-scale card-lift hover:border-primary/50 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/app/jobs/${job.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Company Logo */}
                    {job.company_logo_url ? (
                      <img
                        src={job.company_logo_url}
                        alt={job.company_name}
                        className="w-11 h-11 rounded-xl object-cover bg-muted shrink-0 border"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                    )}

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base line-clamp-1">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{job.company_name}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-xs font-medium border-0 ${JOB_TYPE_COLORS[job.job_type] || ""}`}
                        >
                          {job.job_type.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="self-center">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <ArrowRight className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Show All AI Button */}
        {topPicks.length > 0 && (
          <Button
            variant="outline"
            className="w-full mt-3 gap-2"
            onClick={handleShowAllAI}
            disabled={loadingAI}
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            Show AI Recommendations
            <Badge variant="secondary" className="gap-1 ml-auto">
              <Coins className="h-3 w-3 text-amber-500" />
              10 credits
            </Badge>
          </Button>
        )}
      </section>

      {/* Job Categories - 2x2 Grid with expand */}
      <section>
        <h2 className="text-lg font-bold mb-3">Browse by Type</h2>
        <div className="grid grid-cols-2 gap-3">
          {JOB_COLLECTIONS.map((collection, index) => (
            <Card
              key={collection.filter}
              className={`cursor-pointer border-0 bg-gradient-to-br ${collection.gradient} animate-bounce-in press-scale hover:shadow-md transition-all`}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/app/jobs/all?type=${collection.filter}`)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-11 h-11 bg-background/80 rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <collection.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold text-sm">{collection.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5">View jobs</span>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Extended Collections */}
        {showExtendedCollections && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {EXTENDED_COLLECTIONS.map((collection) => (
              <Button
                key={collection.filter}
                variant="outline"
                className="h-auto py-3"
                onClick={() => navigate(`/app/jobs/all?type=${collection.filter}`)}
              >
                {collection.label}
              </Button>
            ))}
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-muted-foreground"
          onClick={() => setShowExtendedCollections(!showExtendedCollections)}
        >
          {showExtendedCollections ? (
            <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
          ) : (
            <>More Types <ChevronDown className="h-4 w-4 ml-1" /></>
          )}
        </Button>
      </section>

      {/* More Jobs for You */}
      {personalizedJobs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">More Jobs for You</h2>
            </div>
          </div>

          {personalizedLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {personalizedJobs.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer press-scale hover:shadow-md transition-all hover:border-primary/30"
                  onClick={() => navigate(`/app/jobs/${job.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {job.company_logo_url ? (
                        <img
                          src={job.company_logo_url}
                          alt={job.company_name}
                          className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0 border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">{job.title}</h3>
                        <p className="text-xs text-muted-foreground">{job.company_name}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs shrink-0 ${JOB_TYPE_COLORS[job.job_type] || ""}`}
                      >
                        {job.job_type.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* My Applications - Inline Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">My Applications</h2>
            {applications.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {applications.length}
              </Badge>
            )}
          </div>
          {applications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary font-medium hover:bg-primary/5"
              onClick={() => navigate("/app/applications")}
            >
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {applicationsLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="p-5 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No applications yet</p>
              <Button size="sm" onClick={() => navigate("/app/jobs/all")}>
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {applications.map((app) => {
              const status = getApplicationStatus(app);
              const StatusIcon = status.icon;
              return (
                <Card
                  key={app.id}
                  className="cursor-pointer press-scale hover:shadow-md transition-all hover:border-primary/30"
                  onClick={() => navigate(`/app/jobs/${app.jobs.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {app.jobs.company_logo_url ? (
                        <img
                          src={app.jobs.company_logo_url}
                          alt={app.jobs.company_name}
                          className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0 border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">{app.jobs.title}</h3>
                        <p className="text-xs text-muted-foreground">{app.jobs.company_name}</p>
                      </div>
                      <Badge className={`text-xs shrink-0 ${status.color} border-0`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Job Preferences Sheet */}
      <JobPreferencesSheet open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </div>
  );
}
