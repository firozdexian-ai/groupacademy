import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Briefcase,
  Sparkles,
  ChevronRight,
  FileText,
  Bookmark,
  Settings,
  Coins,
  Clock,
  CheckCircle2,
  Send,
  Eye,
  AlertCircle,
  RefreshCw,
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { JobPreferencesSheet } from "@/components/jobs/JobPreferencesSheet";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { JOB_COLLECTIONS, APPLICATION_STATUS_CONFIG } from "@/lib/constants/jobTypes";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/section-header";

interface JobPreferences {
  preferred_job_types?: string[];
  preferred_locations?: string[];
  salary_min?: number | null;
  salary_max?: number | null;
  industries?: string[];
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

export default function JobsHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { savedItems, isSaved, toggleSave } = useSavedItems();
  const { canAfford, deductCredits } = useCredits();

  const [searchQuery, setSearchQuery] = useState("");
  const [topPicks, setTopPicks] = useState<JobCardData[]>([]);
  const [personalizedJobs, setPersonalizedJobs] = useState<JobCardData[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // Count saved jobs from hook
  const savedJobsCount = savedItems.filter((item) => item.item_type === "job").length;

  useEffect(() => {
    loadAllData();
  }, [talent?.id]);

  async function loadAllData() {
    setLoading(true);
    setApplicationsLoading(true);
    setPersonalizedLoading(true);
    setError(null);

    try {
      const [topPicksResult, personalizedResult, applicationsResult, countResult] = await Promise.all([
        fetchTopPicks(),
        talent?.id ? fetchPersonalizedJobs() : Promise.resolve([]),
        talent?.id ? fetchApplications() : Promise.resolve([]),
        talent?.id ? fetchApplicationsCount() : Promise.resolve(0),
      ]);

      setTopPicks(topPicksResult);
      setPersonalizedJobs(personalizedResult);
      setApplications(applicationsResult);
      setApplicationsCount(countResult);
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message || "Failed to load jobs data");
    } finally {
      setLoading(false);
      setApplicationsLoading(false);
      setPersonalizedLoading(false);
    }
  }

  async function fetchTopPicks(): Promise<JobCardData[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline",
      )
      .eq("is_active", true)
      .or("deadline.is.null,deadline.gte.now()")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;
    return (data as JobCardData[]) || [];
  }

  async function fetchPersonalizedJobs(): Promise<JobCardData[]> {
    if (!talent?.id) return [];

    const { data: talentData } = await supabase
      .from("talents")
      .select("job_preferences, profession_category_id")
      .eq("id", talent.id)
      .single();

    const preferences = talentData?.job_preferences as unknown as JobPreferences | null;

    let query = supabase
      .from("jobs")
      .select(
        "id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max",
      )
      .eq("is_active", true)
      .or("deadline.is.null,deadline.gte.now()");

    if (preferences?.preferred_job_types?.length) {
      query = query.in("job_type", preferences.preferred_job_types as any);
    }

    if (preferences?.preferred_locations?.length) {
      const locationFilters = preferences.preferred_locations.map((loc) => `location.ilike.%${loc}%`).join(",");
      query = query.or(locationFilters);
    }

    if (preferences?.salary_min) {
      query = query.gte("salary_range_max", preferences.salary_min);
    }

    if (!preferences && talentData?.profession_category_id) {
      query = query.eq("profession_category_id", talentData.profession_category_id);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(6);

    if (error) throw error;
    return (data as JobCardData[]) || [];
  }

  async function fetchApplications(): Promise<JobApplication[]> {
    const { data, error } = await supabase
      .from("job_applications")
      .select(
        `
        id, created_at, application_status, delivery_status,
        jobs:job_id (id, title, company_name, company_logo_url)
      `,
      )
      .eq("talent_id", talent!.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;
    return (data as unknown as JobApplication[]) || [];
  }

  async function fetchApplicationsCount(): Promise<number> {
    const { count, error } = await supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("talent_id", talent!.id);

    if (error) return 0;
    return count || 0;
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
      navigate("/app/jobs/all?ai=true");
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      toast.error("Failed to get AI recommendations");
    } finally {
      setLoadingAI(false);
    }
  }

  const StatusIcon = ({ status }: { status: string }) => {
    const icons: Record<string, typeof Clock> = {
      pending: Clock,
      sent: Send,
      delivered: CheckCircle2,
      viewed: Eye,
      rejected: FileText,
      accepted: CheckCircle2,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-3 w-3 mr-1" />;
  };

  if (error && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-destructive/20">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Unable to load jobs</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
            <Button onClick={loadAllData} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Search Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <h1 className="text-xl font-bold mb-1">Find Your Dream Job</h1>
        <p className="text-sm text-muted-foreground mb-4">Discover opportunities tailored to your skills</p>

        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-24 h-12 text-sm rounded-xl border-2 focus:border-primary bg-background"
            />
            <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg h-9 px-4">
              Search
            </Button>
          </div>
        </form>
      </section>

      {/* Quick Access Pills */}
      <section className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 h-9 rounded-full"
          onClick={() => navigate("/app/saved?tab=jobs")}
        >
          <Bookmark className="h-4 w-4" />
          Saved
          {savedJobsCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-xs rounded-full">
              {savedJobsCount}
            </Badge>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 h-9 rounded-full"
          onClick={() => navigate("/app/applications")}
        >
          <FileText className="h-4 w-4" />
          Applied
          {applicationsCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-xs rounded-full">
              {applicationsCount > 99 ? "99+" : applicationsCount}
            </Badge>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 h-9 rounded-full"
          onClick={() => setPreferencesOpen(true)}
        >
          <Settings className="h-4 w-4" />
          Preferences
        </Button>
      </section>

      {/* Featured Jobs - Horizontal Scroll */}
      <section>
        <SectionHeader
          icon={Sparkles}
          title="Featured Jobs"
          viewAllPath="/app/jobs/all"
        />

        {loading ? (
          <div className="flex gap-4 overflow-hidden pb-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="w-[300px] shrink-0">
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : topPicks.length === 0 ? (
          <Card className="border-dashed bg-muted/50">
            <CardContent className="p-8 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No job openings available right now.</p>
              <p className="text-sm text-muted-foreground/70">Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {topPicks.map((job, index) => (
                  <div
                    key={job.id}
                    className="w-[300px] shrink-0 animate-in fade-in slide-in-from-right-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* FIX: Wrapper DIV to ensure click works */}
                    <div onClick={() => navigate(`/app/jobs/${job.id}`)} className="cursor-pointer">
                      <JobCard
                        job={job}
                        variant="default"
                        isSaved={isSaved(job.id, "job")}
                        // FIX: Remove event arg to match signature
                        onSaveToggle={() => toggleSave(job.id, "job")}
                        onClick={() => navigate(`/app/jobs/${job.id}`)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            {topPicks.length > 1 && (
              <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
          </div>
        )}

        {/* AI Recommendations Button */}
        {topPicks.length > 0 && (
          <Button variant="outline" className="w-full mt-2 gap-2 h-11" onClick={handleShowAllAI} disabled={loadingAI}>
            <Sparkles className="h-4 w-4 text-purple-500" />
            Get AI Recommendations
            <Badge variant="secondary" className="gap-1 ml-auto">
              <Coins className="h-3 w-3 text-amber-500" />
              10 credits
            </Badge>
          </Button>
        )}
      </section>

      {/* Browse by Type - Horizontal Pills */}
      <section>
        <SectionHeader icon={Briefcase} title="Browse by Type" />
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
          {JOB_COLLECTIONS.map((collection) => (
            <Button
              key={collection.filter}
              variant="outline"
              size="sm"
              className="shrink-0 gap-2 h-10 rounded-full px-4 hover:bg-primary/10 hover:border-primary/50"
              onClick={() => navigate(`/app/jobs/all?type=${collection.filter}`)}
            >
              <collection.icon className="h-4 w-4 text-primary" />
              {collection.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Recommended for You */}
      {personalizedJobs.length > 0 && (
        <section>
          <SectionHeader
            icon={Briefcase}
            title="Recommended for You"
          />

          {personalizedLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
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
              {personalizedJobs.slice(0, 4).map((job) => (
                <div key={job.id} onClick={() => navigate(`/app/jobs/${job.id}`)} className="cursor-pointer">
                  <JobCard
                    job={job}
                    variant="compact"
                    // FIX: Added required onClick prop
                    onClick={() => navigate(`/app/jobs/${job.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recent Applications */}
      <section>
        <SectionHeader
          icon={FileText}
          title="Recent Applications"
          viewAllPath={applications.length > 0 ? "/app/applications" : undefined}
        />

        {applicationsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
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
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No applications yet</p>
              <Button size="sm" onClick={() => navigate("/app/jobs/all")}>
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => {
              const status = getApplicationStatus(app);
              return (
                <Card
                  key={app.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
                  onClick={() => navigate(`/app/jobs/${app.jobs.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {app.jobs.company_logo_url ? (
                        <img
                          src={app.jobs.company_logo_url}
                          alt={app.jobs.company_name}
                          className="w-10 h-10 rounded-lg object-cover bg-muted border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Briefcase className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">{app.jobs.title}</h3>
                        <p className="text-xs text-muted-foreground">{app.jobs.company_name}</p>
                      </div>
                      <Badge className={`text-xs shrink-0 ${status.color} border-0`}>
                        <StatusIcon status={app.application_status || app.delivery_status || "pending"} />
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
