import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Sparkles,
  FileText,
  Coins,
  Clock,
  CheckCircle2,
  Send,
  Eye,
  AlertCircle,
  RefreshCw,
  Loader2,
  Brain,
  Building2,
  Globe,
  Flame,
  Layers,
  FileCode,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { JobPreferencesSheet } from "@/components/jobs/JobPreferencesSheet";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { JOB_COLLECTIONS, APPLICATION_STATUS_CONFIG } from "@/lib/constants/jobTypes";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface JobPreferences {
  preferred_job_types?: string[];
  preferred_locations?: string[];
  salary_min?: number | null;
  salary_max?: number | null;
  industries?: string[];
}

interface AISuggestion {
  job_id: string;
  match_score: number;
  reason: string;
  job: JobCardData;
}

interface TopCompany {
  name: string;
  logo_url: string | null;
  count: number;
}

interface TopCountry {
  location: string;
  count: number;
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

type TabKey = "for-you" | "collection" | "company" | "country";

const TABS: { key: TabKey; label: string; icon: typeof Sparkles }[] = [
  { key: "for-you", label: "For You", icon: Sparkles },
  { key: "collection", label: "Collection", icon: Layers },
  { key: "company", label: "By Company", icon: Building2 },
  { key: "country", label: "By Country", icon: Globe },
];

export default function JobsHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { savedItems, isSaved, toggleSave } = useSavedItems();
  const { canAfford, deductCredits } = useCredits();

  const [activeTab, setActiveTab] = useState<TabKey>("for-you");
  const [topPicks, setTopPicks] = useState<JobCardData[]>([]);
  const [personalizedJobs, setPersonalizedJobs] = useState<JobCardData[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  const [topCompanies, setTopCompanies] = useState<TopCompany[]>([]);
  const [topCountries, setTopCountries] = useState<TopCountry[]>([]);
  const [promotedJobs, setPromotedJobs] = useState<JobCardData[]>([]);

  useEffect(() => {
    loadAllData();
  }, [talent?.id]);

  async function loadAllData() {
    setLoading(true);
    setApplicationsLoading(true);
    setPersonalizedLoading(true);
    setError(null);

    try {
      const [topPicksResult, personalizedResult, applicationsResult, , companiesResult, countriesResult, promotedResult] = await Promise.all([
        fetchTopPicks(),
        talent?.id ? fetchPersonalizedJobs() : Promise.resolve([]),
        talent?.id ? fetchApplications() : Promise.resolve([]),
        Promise.resolve(0),
        fetchTopCompanies(),
        fetchTopCountries(),
        fetchPromotedJobs(),
      ]);

      setTopPicks(topPicksResult);
      setPersonalizedJobs(personalizedResult);
      setApplications(applicationsResult);
      setTopCompanies(companiesResult);
      setTopCountries(countriesResult);
      setPromotedJobs(promotedResult);
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

  async function fetchTopCompanies(): Promise<TopCompany[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("company_name, company_logo_url")
      .eq("is_active", true)
      .or("deadline.is.null,deadline.gte.now()")
      .limit(500);

    if (error) throw error;
    if (!data) return [];

    const map = new Map<string, { logo_url: string | null; count: number }>();
    for (const job of data) {
      if (!job.company_name) continue;
      const existing = map.get(job.company_name);
      if (existing) {
        existing.count++;
        if (!existing.logo_url && job.company_logo_url) existing.logo_url = job.company_logo_url;
      } else {
        map.set(job.company_name, { logo_url: job.company_logo_url, count: 1 });
      }
    }

    return Array.from(map.entries())
      .map(([name, info]) => ({ name, logo_url: info.logo_url, count: info.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  async function fetchTopCountries(): Promise<TopCountry[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("location")
      .eq("is_active", true)
      .or("deadline.is.null,deadline.gte.now()")
      .not("location", "is", null)
      .limit(500);

    if (error) throw error;
    if (!data) return [];

    const map = new Map<string, number>();
    for (const job of data) {
      const loc = job.location?.trim();
      if (!loc) continue;
      map.set(loc, (map.get(loc) || 0) + 1);
    }

    return Array.from(map.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  async function fetchPromotedJobs(): Promise<JobCardData[]> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const deadlineStr = sevenDaysFromNow.toISOString();

    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline",
      )
      .eq("is_active", true)
      .or("deadline.is.null,deadline.gte.now()")
      .or(`is_featured.eq.true,deadline.lte.${deadlineStr}`)
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(8);

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

      const { data, error: fnError } = await supabase.functions.invoke("suggest-jobs-for-talent");

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const suggestions = data?.suggestions || [];
      setAiSuggestions(suggestions);

      if (suggestions.length === 0) {
        toast.info("No strong matches found. Try updating your profile with more skills.");
      } else {
        toast.success(`Found ${suggestions.length} recommended jobs for you!`);
      }
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      toast.error("Failed to get AI recommendations. Please try again.");
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
      rejected: FileCode,
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
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-5">
      {/* Tab Navigation */}
      <nav className="flex items-stretch border-b border-border">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[11px] font-medium leading-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ===== Tab: For You ===== */}
      {activeTab === "for-you" && (
        <>
          {/* Featured Jobs */}
          <section>
            <SectionHeader icon={Sparkles} title="Featured Jobs" viewAllPath="/app/jobs/all" />
            {loading ? (
              <div className="flex gap-4 overflow-hidden pb-2">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="w-[260px] shrink-0">
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
                        className="w-[260px] shrink-0 animate-in fade-in slide-in-from-right-4"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div onClick={() => navigate(`/app/jobs/${job.id}`)} className="cursor-pointer">
                          <JobCard
                            job={job}
                            variant="default"
                            isSaved={isSaved(job.id, "job")}
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
            {topPicks.length > 0 && aiSuggestions.length === 0 && (
              <Button variant="outline" className="w-full mt-2 gap-2 h-11" onClick={handleShowAllAI} disabled={loadingAI}>
                {loadingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                {loadingAI ? "Analyzing your profile..." : "Get AI Recommendations"}
                <Badge variant="secondary" className="gap-1 ml-auto">
                  <Coins className="h-3 w-3 text-amber-500" />
                  10 credits
                </Badge>
              </Button>
            )}
          </section>

          {/* AI Loading Skeleton */}
          {loadingAI && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary animate-pulse" />
                <h2 className="font-semibold text-base">Finding your best matches...</h2>
              </div>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* AI Recommended Jobs */}
          {aiSuggestions.length > 0 && (
            <section>
              <SectionHeader icon={Brain} title="AI Recommended for You" />
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.job_id}
                    className="animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <JobCard
                      job={suggestion.job}
                      variant="compact"
                      matchInfo={{ match_score: suggestion.match_score, reason: suggestion.reason }}
                      onClick={() => navigate(`/app/jobs/${suggestion.job_id}`)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommended for You */}
          {personalizedJobs.length > 0 && (
            <section>
              <SectionHeader icon={Briefcase} title="Recommended for You" />
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
                      <JobCard job={job} variant="compact" onClick={() => navigate(`/app/jobs/${job.id}`)} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Promoted / Expiring Soon */}
          {!loading && promotedJobs.length > 0 && (
            <section>
              <SectionHeader icon={Flame} title="Promoted / Expiring Soon" viewAllPath="/app/jobs/all" />
              <div className="relative">
                <ScrollArea className="w-full">
                  <div className="flex gap-4 pb-4">
                    {promotedJobs.map((job, index) => (
                      <div
                        key={job.id}
                        className="w-[260px] shrink-0 animate-in fade-in slide-in-from-right-4"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div onClick={() => navigate(`/app/jobs/${job.id}`)} className="cursor-pointer">
                          <JobCard
                            job={job}
                            variant="default"
                            isSaved={isSaved(job.id, "job")}
                            onSaveToggle={() => toggleSave(job.id, "job")}
                            onClick={() => navigate(`/app/jobs/${job.id}`)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
                {promotedJobs.length > 1 && (
                  <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                )}
              </div>
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
        </>
      )}

      {/* ===== Tab: Job Collection ===== */}
      {activeTab === "collection" && (
        <section>
          <SectionHeader icon={Layers} title="Browse by Type" />
          <div className="grid grid-cols-2 gap-3">
            {JOB_COLLECTIONS.map((collection) => (
              <Card
                key={collection.filter}
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => navigate(`/app/jobs/all?type=${collection.filter}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <collection.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {collection.label}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ===== Tab: By Company ===== */}
      {activeTab === "company" && (
        <section>
          <SectionHeader icon={Building2} title="Job by Company" />
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-10" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : topCompanies.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-8 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No company data available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {topCompanies.map((company, index) => (
                <Card
                  key={company.name}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group animate-in fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => navigate(`/app/jobs/all?company=${encodeURIComponent(company.name)}`)}
                >
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <Avatar className="h-14 w-14 border-2 border-border group-hover:border-primary transition-colors">
                      {company.logo_url ? (
                        <AvatarImage src={company.logo_url} alt={company.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {company.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {company.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {company.count} {company.count === 1 ? "job" : "jobs"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===== Tab: By Country ===== */}
      {activeTab === "country" && (
        <section>
          <SectionHeader icon={Globe} title="Job by Location" />
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : topCountries.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-8 text-center">
                <Globe className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No location data available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {topCountries.map((country, index) => (
                <Card
                  key={country.location}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group animate-in fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => navigate(`/app/jobs/all?location=${encodeURIComponent(country.location)}`)}
                >
                  <CardContent className="p-3 px-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {country.location}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {country.count} {country.count === 1 ? "job" : "jobs"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Job Preferences Sheet */}
      <JobPreferencesSheet open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </div>
  );
}
