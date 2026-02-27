import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Sparkles,
  Coins,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  Brain,
  Building2,
  Globe,
  Flame,
  Layers,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobPreferencesSheet } from "@/components/jobs/JobPreferencesSheet";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { JOB_COLLECTIONS } from "@/lib/constants/jobTypes";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

type TabKey = "for-you" | "collection" | "company" | "country";

const TABS: { key: TabKey; label: string; icon: typeof Sparkles }[] = [
  { key: "for-you", label: "For You", icon: Sparkles },
  { key: "collection", label: "Collection", icon: Layers },
  { key: "company", label: "By Company", icon: Building2 },
  { key: "country", label: "By Country", icon: Globe },
];

const INITIAL_SHOW = 3;

export default function JobsHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { savedItems, isSaved, toggleSave } = useSavedItems();
  const { canAfford, deductCredits } = useCredits();

  const [activeTab, setActiveTab] = useState<TabKey>("for-you");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // For You section states
  const [recommendations, setRecommendations] = useState<AISuggestion[]>([]);
  const [recommendationsGeneratedAt, setRecommendationsGeneratedAt] = useState<string | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<JobCardData[]>([]);
  const [expiringJobs, setExpiringJobs] = useState<JobCardData[]>([]);
  const [hotJobs, setHotJobs] = useState<JobCardData[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // Show more toggles
  const [showMore, setShowMore] = useState({
    recommended: false,
    featured: false,
    expiring: false,
    hot: false,
  });

  // Other tab states
  const [topCompanies, setTopCompanies] = useState<TopCompany[]>([]);
  const [topCountries, setTopCountries] = useState<TopCountry[]>([]);

  useEffect(() => {
    loadAllData();
  }, [talent?.id]);

  async function loadAllData() {
    setLoading(true);
    setError(null);
    try {
      const [featuredResult, expiringResult, hotResult, companiesResult, countriesResult] = await Promise.all([
        fetchFeaturedJobs(),
        fetchExpiringJobs(),
        fetchHotJobs(),
        fetchTopCompanies(),
        fetchTopCountries(),
      ]);

      setFeaturedJobs(featuredResult);
      setExpiringJobs(expiringResult);
      setHotJobs(hotResult);
      setTopCompanies(companiesResult);
      setTopCountries(countriesResult);

      if (talent?.id) {
        await fetchRecommendations();
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message || "Failed to load jobs data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecommendations() {
    if (!talent?.id) return;
    const { data, error } = await supabase
      .from("ai_job_recommendations")
      .select("job_id, match_score, reason, generated_at")
      .eq("talent_id", talent.id)
      .order("match_score", { ascending: false });

    if (error) {
      console.error("Error fetching recommendations:", error);
      return;
    }
    if (!data || data.length === 0) {
      setRecommendations([]);
      setRecommendationsGeneratedAt(null);
      return;
    }

    setRecommendationsGeneratedAt(data[0].generated_at);

    // Fetch job details for all recommended job IDs
    const jobIds = data.map((r) => r.job_id);
    const { data: jobsData, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
      .in("id", jobIds)
      .eq("is_active", true);

    if (jobsError) {
      console.error("Error fetching recommendation jobs:", jobsError);
      return;
    }

    const jobMap = new Map((jobsData || []).map((j) => [j.id, j]));
    const suggestions: AISuggestion[] = data
      .filter((r) => jobMap.has(r.job_id))
      .map((r) => ({
        job_id: r.job_id,
        match_score: r.match_score,
        reason: r.reason || "",
        job: jobMap.get(r.job_id) as JobCardData,
      }));

    setRecommendations(suggestions);
  }

  async function fetchFeaturedJobs(): Promise<JobCardData[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
      .eq("is_active", true)
      .eq("is_featured", true)
      .or("deadline.is.null,deadline.gte.now()")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data as JobCardData[]) || [];
  }

  async function fetchExpiringJobs(): Promise<JobCardData[]> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
      .eq("is_active", true)
      .not("deadline", "is", null)
      .gte("deadline", new Date().toISOString())
      .lte("deadline", sevenDaysFromNow.toISOString())
      .order("deadline", { ascending: true })
      .limit(10);
    if (error) throw error;
    return (data as JobCardData[]) || [];
  }

  async function fetchHotJobs(): Promise<JobCardData[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();

    // Fetch click counts and application counts in parallel
    const [clicksResult, appsResult] = await Promise.all([
      supabase
        .from("job_analytics")
        .select("job_id")
        .gte("clicked_at", since),
      supabase
        .from("job_applications")
        .select("job_id")
        .gte("created_at", since),
    ]);

    // Aggregate counts
    const engagementMap = new Map<string, number>();
    for (const row of clicksResult.data || []) {
      engagementMap.set(row.job_id, (engagementMap.get(row.job_id) || 0) + 1);
    }
    for (const row of appsResult.data || []) {
      if (row.job_id) {
        engagementMap.set(row.job_id, (engagementMap.get(row.job_id) || 0) + 2); // applications weigh more
      }
    }

    if (engagementMap.size === 0) return [];

    // Sort by engagement, take top 10
    const topJobIds = Array.from(engagementMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
      .in("id", topJobIds)
      .eq("is_active", true);

    if (error) throw error;

    // Re-sort by engagement score
    const result = (data as JobCardData[]) || [];
    result.sort((a, b) => (engagementMap.get(b.id) || 0) - (engagementMap.get(a.id) || 0));
    return result;
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

  async function handleGetAIRecommendations() {
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

      if (suggestions.length === 0) {
        toast.info("No strong matches found. Try updating your profile with more skills.");
        setLoadingAI(false);
        return;
      }

      // Persist to database: delete old, insert new
      if (talent?.id) {
        await supabase
          .from("ai_job_recommendations")
          .delete()
          .eq("talent_id", talent.id);

        const rows = suggestions.map((s: AISuggestion) => ({
          talent_id: talent.id,
          job_id: s.job_id,
          match_score: s.match_score,
          reason: s.reason,
        }));

        await supabase.from("ai_job_recommendations").insert(rows);
      }

      // Reload from DB
      await fetchRecommendations();
      toast.success(`Found ${suggestions.length} recommended jobs for you!`);
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      toast.error("Failed to get AI recommendations. Please try again.");
    } finally {
      setLoadingAI(false);
    }
  }

  const toggleShowMore = (key: keyof typeof showMore) => {
    setShowMore((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // -- Reusable vertical job list section --
  function renderJobSection(
    jobs: JobCardData[],
    sectionKey: keyof typeof showMore,
    maxExpanded = 12,
  ) {
    const isExpanded = showMore[sectionKey];
    const visibleJobs = isExpanded ? jobs.slice(0, maxExpanded) : jobs.slice(0, INITIAL_SHOW);
    const hasMore = jobs.length > INITIAL_SHOW;

    return (
      <>
        <div className="space-y-2">
          {visibleJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              variant="compact"
              isSaved={isSaved(job.id, "job")}
              onSaveToggle={() => toggleSave(job.id, "job")}
              onClick={() => navigate(`/app/jobs/${job.id}`)}
            />
          ))}
        </div>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 gap-1 text-xs text-muted-foreground"
            onClick={() => toggleShowMore(sectionKey)}
          >
            {isExpanded ? (
              <>Show Less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Show More ({jobs.length - INITIAL_SHOW} more) <ChevronDown className="h-3 w-3" /></>
            )}
          </Button>
        )}
      </>
    );
  }

  if (error && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-destructive/20">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-semibold text-base mb-2">Unable to load jobs</h3>
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
    <div className="max-w-4xl mx-auto px-4 py-2 space-y-2">
      {/* Tab Navigation */}
      <nav className="flex items-stretch border-b border-border">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors relative ${
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
          {/* Section 1: Recommended for You (AI-powered) */}
          <section className="space-y-2">
            <SectionHeader icon={Brain} title="Recommended for You" />

            {/* AI Recommendation Button */}
            <Button
              variant="outline"
              className="w-full gap-2 h-9"
              onClick={handleGetAIRecommendations}
              disabled={loadingAI}
            >
              {loadingAI ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
              {loadingAI
                ? "Analyzing your profile..."
                : recommendations.length > 0
                  ? "Refresh Recommendations"
                  : "Get AI Recommendations"}
              <Badge variant="secondary" className="gap-1 ml-auto">
                <Coins className="h-3 w-3 text-amber-500" />
                10 credits
              </Badge>
            </Button>

            {/* AI Loading Skeleton */}
            {loadingAI && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">Finding your best matches...</span>
                </div>
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Timestamp */}
            {recommendationsGeneratedAt && !loadingAI && (
              <p className="text-[10px] text-muted-foreground">
                Last updated: {new Date(recommendationsGeneratedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}

            {/* Recommendation Results */}
            {!loadingAI && recommendations.length > 0 && (
              <>
                <div className="space-y-2">
                  {(showMore.recommended ? recommendations.slice(0, 12) : recommendations.slice(0, INITIAL_SHOW)).map((suggestion) => (
                    <JobCard
                      key={suggestion.job_id}
                      job={suggestion.job}
                      variant="compact"
                      matchInfo={{ match_score: suggestion.match_score, reason: suggestion.reason }}
                      onClick={() => navigate(`/app/jobs/${suggestion.job_id}`)}
                    />
                  ))}
                </div>
                {recommendations.length > INITIAL_SHOW && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 gap-1 text-xs text-muted-foreground"
                    onClick={() => toggleShowMore("recommended")}
                  >
                    {showMore.recommended ? (
                      <>Show Less <ChevronUp className="h-3 w-3" /></>
                    ) : (
                      <>Show More ({recommendations.length - INITIAL_SHOW} more) <ChevronDown className="h-3 w-3" /></>
                    )}
                  </Button>
                )}
              </>
            )}

            {/* Empty state for first-time users */}
            {!loadingAI && recommendations.length === 0 && !loading && (
              <Card className="border-dashed bg-muted/30">
                <CardContent className="p-6 text-center">
                  <Brain className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Tap "Get AI Recommendations" to discover jobs matched to your profile.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Section 2: Featured / Promoted Jobs */}
          {!loading && featuredJobs.length > 0 && (
            <section className="space-y-2">
              <SectionHeader icon={Sparkles} title="Featured Jobs" viewAllPath="/app/jobs/all" />
              {renderJobSection(featuredJobs, "featured", 10)}
            </section>
          )}

          {/* Section 3: Expiring Soon */}
          {!loading && expiringJobs.length > 0 && (
            <section className="space-y-2">
              <SectionHeader icon={AlertTriangle} title="Expiring Soon" />
              {renderJobSection(expiringJobs, "expiring", 10)}
            </section>
          )}

          {/* Section 4: Hot Jobs (Most Popular) */}
          {!loading && hotJobs.length > 0 && (
            <section className="space-y-2">
              <SectionHeader icon={TrendingUp} title="Hot Jobs" />
              {renderJobSection(hotJobs, "hot", 10)}
            </section>
          )}

          {/* Loading skeleton for all sections */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
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
          )}
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
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
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
                  <CardContent className="p-3 flex flex-col items-center gap-2">
                    <Skeleton className="h-11 w-11 rounded-full" />
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
                  <CardContent className="p-3 flex flex-col items-center gap-2">
                    <Avatar className="h-11 w-11 border-2 border-border group-hover:border-primary transition-colors">
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
