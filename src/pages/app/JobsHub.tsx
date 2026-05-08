import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Coins,
  Loader2,
  Brain,
  Building2,
  Globe,
  Flame,
  ChevronRight,
  Heart,
  TrendingUp,
  Search,
  Bot,
  ArrowRight,
  Zap,
  FileText,
  MessageSquare,
  Target,
  Briefcase,
  Layers,
  SlidersHorizontal,
  RefreshCw,
  ClipboardCheck,
  Mic,
  DollarSign,
  Palette,
  Lightbulb,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useCredits } from "@/hooks/useCredits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { JobPreferencesSheet } from "@/components/jobs/JobPreferencesSheet";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { ProfileCompletenessGate } from "@/components/jobs/ProfileCompletenessGate";
import { CompanyCard } from "@/components/jobs/CompanyCard";
import { CountryCard } from "@/components/jobs/CountryCard";
import { CompanyDetailSheet } from "@/components/jobs/CompanyDetailSheet";
import { InfiniteJobsList } from "@/components/jobs/InfiniteJobsList";
import { useJobsHubDashboard } from "@/hooks/useJobsHubDashboard";
import { useFollowedCompanies } from "@/hooks/useFollowedCompanies";
import { JOB_COLLECTIONS } from "@/lib/constants/jobTypes";
import { toast } from "sonner";
import { useNextBestTool } from "@/hooks/useNextBestTool";
import { useToolRuns, type ToolKey } from "@/hooks/useToolRuns";
import { ScoreMeJobPicker } from "@/components/jobs/ScoreMeJobPicker";
import { formatDistanceToNow } from "date-fns";

import { ProcessingCard, type ProcessingStage } from "@/components/ui/processing-card";
import { AgentAvatar } from "@/components/ai-agents/AgentAvatar";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Wifi } from "lucide-react";

const AI_PROCESSING_STAGES: ProcessingStage[] = [
  { progress: 0, message: "Reading your profile..." },
  { progress: 20, message: "Scanning thousands of open roles..." },
  { progress: 45, message: "Matching against your skills..." },
  { progress: 70, message: "Ranking the best fits..." },
  { progress: 90, message: "Almost done..." },
];

type TabKey = "browse" | "company" | "country" | "tools";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "browse", label: "Browse", icon: Layers },
  { key: "company", label: "Companies", icon: Building2 },
  { key: "country", label: "Locations", icon: Globe },
  { key: "tools", label: "Tools", icon: Zap },
];

const INITIAL_SHOW = 3;
const AI_MATCH_COST = 10;

const AGENT_PURPOSE: Record<string, string> = {
  "job-hunter": "Find roles that fit your profile",
  "cv-coach": "Polish your CV to pass ATS screens",
  "application-helper": "Draft tailored cover letters & answers",
  "interview-coach": "Practice interviews with live feedback",
  "career-consultant": "Plan your next career move",
  "remote-expert": "Discover remote-first opportunities",
  "career-abroad": "Explore careers overseas",
};

const TOOL_META: Record<ToolKey, { title: string; href: string; icon: any }> = {
  cv: { title: "ATS-friendly CV", href: "/app/tools/cv-maker", icon: FileText },
  assessment: { title: "Career Assessment", href: "/app/services/assessment", icon: ClipboardCheck },
  salary: { title: "Salary Insight", href: "/app/services/salary-analysis", icon: DollarSign },
  portfolio: { title: "Portfolio Service", href: "/app/services/portfolio", icon: Palette },
  score: { title: "Score me vs job", href: "/app/jobs/all", icon: Target },
  answers: { title: "Application answers", href: "/app/tools/application-helper", icon: MessageSquare },
  interview: { title: "Mock Interview", href: "/app/services/mock-interview", icon: Mic },
};

export default function JobsHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { isSaved, toggleSave } = useSavedItems();
  const { canAfford, deductCredits } = useCredits();

  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "browse";
  const [activeTab, setActiveTab] = useState<TabKey>(
    ["browse", "company", "country", "tools"].includes(initialTab) ? initialTab : "browse",
  );
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [hiringNowOnly, setHiringNowOnly] = useState(false);
  const [activeCompany, setActiveCompany] = useState<string | null>(null);
  const [scorePickerOpen, setScorePickerOpen] = useState(false);

  const { data: nextBest } = useNextBestTool();
  const { data: recentRuns = [] } = useToolRuns(5);

  const [showMore, setShowMore] = useState({
    recommended: false,
    featured: false,
    expiring: false,
    hot: false,
  });

  // ── Single consolidated dashboard fetch (replaces 6 hooks) ──
  const { data: dashboard, isLoading: loadingDashboard } = useJobsHubDashboard(talent?.id);
  const trendingJobs = dashboard?.trending ?? [];
  const loadingTrending = loadingDashboard;
  const jobsInField = dashboard?.in_field ?? [];
  const jobTypeCounts = dashboard?.type_counts ?? {};
  const companiesSignal = dashboard?.companies ?? [];
  const countriesSignal = dashboard?.countries ?? [];
  const loadingCountries = loadingDashboard;
  const remoteSummary = dashboard?.remote;
  const { followed, isFollowing, toggle: toggleFollow } = useFollowedCompanies();

  const { data: collectionData, isLoading: loadingCollection } = useQuery({
    queryKey: ["jobs-collection"],
    queryFn: async () => {
      const [featured, expiring] = await Promise.all([
        supabase.from("jobs").select("*").eq("is_active", true).eq("is_featured", true).limit(10),
        supabase
          .from("jobs")
          .select("*")
          .eq("is_active", true)
          .not("deadline", "is", null)
          .gte("deadline", new Date().toISOString())
          .order("deadline")
          .limit(10),
      ]);
      return { featured: (featured.data || []) as JobCardData[], expiring: (expiring.data || []) as JobCardData[] };
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: recommendations = [], refetch: refetchRecs } = useQuery({
    queryKey: ["ai-recs", talent?.id],
    queryFn: async () => {
      if (!talent?.id) return [];
      const { data } = await supabase
        .from("ai_job_recommendations")
        .select("*, job:jobs(*)")
        .eq("talent_id", talent.id)
        .order("match_score", { ascending: false });
      return (data || []).map((r) => ({ ...r, job: r.job as JobCardData }));
    },
    enabled: !!talent?.id,
  });

  const { data: careerAgents = [] } = useQuery({
    queryKey: ["career-agents-jobshub"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_agents")
        .select("agent_key, name, description, avatar_url, connection_fee, message_credit_cost")
        .eq("is_active", true)
        .eq("category", "career")
        .order("display_order");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const filteredCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    let list = companiesSignal;
    if (q) list = list.filter((c) => c.company_name.toLowerCase().includes(q));
    if (hiringNowOnly) list = list.filter((c) => c.jobs_last_14d > 0);
    return list.slice(0, 60);
  }, [companiesSignal, companySearch, hiringNowOnly]);

  const followedRail = useMemo(
    () => companiesSignal.filter((c) => followed.includes(c.company_name)),
    [companiesSignal, followed],
  );

  const sortedCountries = useMemo(() => {
    const list = [...countriesSignal];
    const userCountry = talent?.country;
    if (userCountry) {
      const idx = list.findIndex((g) => g.country.toLowerCase() === userCountry.toLowerCase());
      if (idx > 0) {
        const [pinned] = list.splice(idx, 1);
        list.unshift(pinned);
      }
    }
    return list;
  }, [countriesSignal, talent?.country]);

  const userCountryRow = useMemo(
    () => (talent?.country ? sortedCountries.find((c) => c.country.toLowerCase() === talent.country!.toLowerCase()) : null),
    [sortedCountries, talent?.country],
  );

  const abroadCountries = useMemo(
    () => sortedCountries.filter((c) => !talent?.country || c.country.toLowerCase() !== talent.country.toLowerCase()).slice(0, 5),
    [sortedCountries, talent?.country],
  );

  const visibleRecommendations = useMemo(
    () =>
      (recommendations || []).filter((r: any) => {
        const j = r?.job;
        if (!j) return false;
        if (j.is_active === false) return false;
        if (j.deadline && new Date(j.deadline) < new Date()) return false;
        return true;
      }),
    [recommendations],
  );

  const smartCollections = useMemo(
    () =>
      JOB_COLLECTIONS.map((c) => ({ ...c, count: jobTypeCounts[c.filter] || 0 }))
        .filter((c) => c.count > 0 || Object.keys(jobTypeCounts).length === 0)
        .sort((a, b) => b.count - a.count),
    [jobTypeCounts],
  );

  function timeAgo(iso?: string | null) {
    if (!iso) return "just now";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  async function handleGetAIRecommendations() {
    if (!talent?.id) {
      return toast.error("Identity verification required to process matches.");
    }

    if (!canAfford("SUGGESTED_JOBS")) {
      return toast.error(`Need ${AI_MATCH_COST} credits to run AI matching. Top up your wallet to continue.`);
    }

    setLoadingAI(true);
    try {
      await deductCredits("SUGGESTED_JOBS", undefined, "AI Job Suggestions");

      const { error } = await supabase.functions.invoke("suggest-jobs-for-talent");
      if (error) throw error;
      await refetchRecs();
      toast.success("Done! Here are your top matches.");
    } catch {
      toast.error("Couldn't fetch matches right now. Try again in a moment.");
    } finally {
      setLoadingAI(false);
    }
  }

  const renderJobSection = (jobs: JobCardData[], key: keyof typeof showMore) => (
    <div className="space-y-3">
      {(showMore[key] ? jobs : jobs.slice(0, INITIAL_SHOW)).map((job) => (
        <JobCard
          key={job.id}
          job={job}
          variant="compact"
          isSaved={isSaved(job.id, "job")}
          onSaveToggle={() => toggleSave(job.id, "job")}
          onClick={() => navigate(`/app/jobs/${job.id}`)}
        />
      ))}
      {jobs.length > INITIAL_SHOW && (
        <Button
          variant="ghost"
          className="w-full h-9 rounded-lg text-xs font-medium text-muted-foreground"
          onClick={() => setShowMore((p) => ({ ...p, [key]: !p[key] }))}
        >
          {showMore[key] ? "Show less" : `Show ${jobs.length - INITIAL_SHOW} more`}
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-3 py-3 pb-28 space-y-5">
      {/* Tabs */}
      <nav className="flex p-1 h-12 bg-muted/50 rounded-xl border border-border/50 sticky top-14 z-30">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === tab.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Browse tab */}
      {activeTab === "browse" && (
        <div className="space-y-7 animate-in fade-in duration-300">
          {/* Profile completeness gate */}
          {talent && <ProfileCompletenessGate talent={talent} />}

          {/* AI matching CTA */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> AI job matches
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => setPreferencesOpen(true)}
                >
                  <SlidersHorizontal className="h-3 w-3" /> Tune
                </Button>
                <Badge variant="outline" className="gap-1 text-[10px] text-amber-500 border-amber-500/30">
                  <Coins className="h-3 w-3" /> {AI_MATCH_COST} CREDITS
                </Badge>
              </div>
            </div>

            {recommendations.length > 0 && !loadingAI && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <RefreshCw className="h-2.5 w-2.5" />
                Updated {timeAgo((recommendations[0] as any)?.generated_at)}
              </p>
            )}

            <Button
              className="w-full h-12 rounded-xl text-sm font-semibold"
              onClick={handleGetAIRecommendations}
              disabled={loadingAI}
            >
              {loadingAI ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {recommendations.length > 0 ? "Refresh AI matches" : "Get AI job matches"}
            </Button>

            {loadingAI && (
              <ProcessingCard title="Finding jobs for you" stages={AI_PROCESSING_STAGES} duration={20000} />
            )}

            {visibleRecommendations.length > 0 && !loadingAI && (
              <div className="pt-2 space-y-3">
                {visibleRecommendations.slice(0, showMore.recommended ? visibleRecommendations.length : INITIAL_SHOW).map((r: any) => (
                  <JobCard
                    key={r.id}
                    job={r.job}
                    variant="compact"
                    isSaved={isSaved(r.job.id, "job")}
                    onSaveToggle={() => toggleSave(r.job.id, "job")}
                    onClick={() => navigate(`/app/jobs/${r.job.id}`)}
                    matchInfo={{
                      match_score: r.match_score,
                      reason: r.reason || "",
                      match_reason: r.match_reason,
                      verified_match: r.verified_match,
                    }}
                    whyChip={r.reason || undefined}
                  />
                ))}
                {visibleRecommendations.length > INITIAL_SHOW && (
                  <Button
                    variant="ghost"
                    className="w-full h-9 rounded-lg text-xs font-medium text-muted-foreground"
                    onClick={() => setShowMore((p) => ({ ...p, recommended: !p.recommended }))}
                  >
                    {showMore.recommended ? "Show less" : `Show ${visibleRecommendations.length - INITIAL_SHOW} more`}
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* For You — open in your field/country */}
          {jobsInField.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {(talent as any)?.professionCategoryId || (talent as any)?.customProfession
                  ? "Open in your field"
                  : `Open in ${talent?.country || "your area"}`}
              </h2>
              <div className="space-y-2">
                {jobsInField.slice(0, 5).map((job) => (
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
            </section>
          )}

          {/* Trending */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500" /> Trending this week
            </h2>
            {loadingTrending ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[64px] w-full rounded-xl" />
                ))}
              </div>
            ) : trendingJobs.length > 0 ? (
              renderJobSection(trendingJobs, "featured")
            ) : (
              <div className="h-[120px] flex items-center justify-center border border-dashed rounded-xl bg-muted/20">
                <p className="text-sm text-muted-foreground italic">No trending jobs right now.</p>
              </div>
            )}
          </section>

          {/* Categories */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Browse by type</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {smartCollections.map((c) => (
                <Card
                  key={c.filter}
                  className="hover:border-primary/40 transition-all cursor-pointer relative"
                  onClick={() => navigate(`/app/jobs/all?type=${c.filter}`)}
                >
                  <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                    <c.icon className="h-5 w-5 text-primary" />
                    <span className="text-[11px] font-medium leading-tight">{c.label}</span>
                    {c.count > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 mt-0.5">
                        {c.count}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Zero-latency matched feed (infinite scroll) */}
          {talent?.id && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Matched for you
                <Badge variant="secondary" className="text-[9px] ml-1">Free · instant</Badge>
              </h2>
              <InfiniteJobsList talentId={talent.id} />
            </section>
          )}
        </div>
      )}

      {/* Companies tab */}
      {activeTab === "company" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                className="h-10 pl-9 rounded-lg"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Switch checked={hiringNowOnly} onCheckedChange={setHiringNowOnly} />
                <span>Hiring now</span>
                <span className="text-[10px] text-muted-foreground">(last 14 days)</span>
              </label>
              {followed.length > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
                  {followed.length} following
                </Badge>
              )}
            </div>
          </div>

          {followedRail.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> Following
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {followedRail.map((c) => (
                  <CompanyCard
                    key={c.company_name}
                    company={c}
                    isFollowing={true}
                    onToggleFollow={() => toggleFollow(c.company_name)}
                    onClick={() => setActiveCompany(c.company_name)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              {hiringNowOnly ? "Hiring now" : "Top hiring employers"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredCompanies.map((c) => (
                <CompanyCard
                  key={c.company_name}
                  company={c}
                  isFollowing={isFollowing(c.company_name)}
                  onToggleFollow={() => toggleFollow(c.company_name)}
                  onClick={() => setActiveCompany(c.company_name)}
                />
              ))}
              {filteredCompanies.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground text-center py-8 italic">
                  No companies found.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Locations tab */}
      {activeTab === "country" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {userCountryRow && (
            <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-background/60 flex items-center justify-center text-3xl">
                    🌍
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Your country</p>
                    <p className="text-base font-bold">{userCountryRow.country}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {userCountryRow.active_jobs} open {userCountryRow.active_jobs === 1 ? "role" : "roles"}
                      {userCountryRow.jobs_last_14d > 0 && ` · +${userCountryRow.jobs_last_14d} this fortnight`}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full h-9 text-xs"
                  onClick={() => navigate(`/app/jobs/all?location=${encodeURIComponent(userCountryRow.country)}`)}
                >
                  Browse all in {userCountryRow.country}
                </Button>
              </CardContent>
            </Card>
          )}

          {remoteSummary && remoteSummary.active_jobs > 0 && (
            <Card
              className="cursor-pointer hover:border-primary/40 transition-all"
              onClick={() => navigate(`/app/jobs/all?type=remote`)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
                  <Wifi className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Remote-friendly</p>
                  <p className="text-[11px] text-muted-foreground">
                    {remoteSummary.active_jobs} open roles · work from anywhere
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          )}

          {abroadCountries.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" /> Working abroad
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {abroadCountries.map((c) => (
                  <CountryCard
                    key={c.country}
                    country={c}
                    onCityClick={(city) => navigate(`/app/jobs/all?location=${encodeURIComponent(city)}`)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">All locations</h2>
            {loadingCountries ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sortedCountries.map((c) => (
                  <CountryCard
                    key={c.country}
                    country={c}
                    isUserCountry={!!talent?.country && c.country.toLowerCase() === talent.country.toLowerCase()}
                    onCityClick={(city) => navigate(`/app/jobs/all?location=${encodeURIComponent(city)}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tools tab */}
      {activeTab === "tools" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Up next for you */}
          {nextBest && (
            <section>
              <Card
                className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => {
                  const t = TOOL_META[nextBest.tool_key];
                  if (!t) return;
                  if (nextBest.tool_key === "score") {
                    if (nextBest.job_id) navigate(`/app/jobs/${nextBest.job_id}?score=1`);
                    else setScorePickerOpen(true);
                  } else if (nextBest.tool_key === "answers" && nextBest.job_id) {
                    navigate(`${t.href}?job=${nextBest.job_id}`);
                  } else {
                    navigate(t.href);
                  }
                }}
              >
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">Up next for you</Badge>
                    </div>
                    <p className="text-sm font-semibold truncate mt-0.5">
                      {TOOL_META[nextBest.tool_key]?.title || nextBest.tool_key}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{nextBest.reason}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                </CardContent>
              </Card>
            </section>
          )}

          {/* Profile builders */}
          <section className="space-y-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Profile builders
            </h2>
            <p className="text-xs text-muted-foreground">Sharpen who you are — your CV, skills, market value, portfolio.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ToolCard icon={FileText} title="ATS-friendly CV" desc="Generate a clean, scanner-safe CV PDF from your profile." cost="15 credits" onClick={() => navigate("/app/tools/cv-maker")} />
              <ToolCard icon={ClipboardCheck} title="Career Assessment" desc="Multi-modal readiness & skills gap report card." cost="Paid" onClick={() => navigate("/app/services/assessment")} />
              <ToolCard icon={DollarSign} title="Salary Insight" desc="Benchmark your market worth with negotiation logic." cost="50 credits" onClick={() => navigate("/app/services/salary-analysis")} />
              <ToolCard icon={Palette} title="Portfolio Service" desc="Build and share a polished professional portfolio." cost="Paid" onClick={() => navigate("/app/services/portfolio")} />
            </div>
          </section>

          {/* Job-specific tools */}
          <section className="space-y-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Job-specific tools
            </h2>
            <p className="text-xs text-muted-foreground">Win this role — score, answers, interview prep.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ToolCard icon={Target} title="Score me vs job" desc="Pick a job and see your match score & gaps." cost="10 credits" onClick={() => setScorePickerOpen(true)} />
              <ToolCard icon={MessageSquare} title="Application answers" desc="Paste questions, get tailored answers grounded in your profile." cost="10 credits" onClick={() => navigate("/app/tools/application-helper")} />
              <ToolCard icon={Mic} title="Mock Interview" desc="Practice with high-fidelity AI-driven scenarios." cost="Paid" onClick={() => navigate("/app/services/mock-interview")} />
            </div>
          </section>

          {/* Recent results */}
          {recentRuns.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Recent results
              </h2>
              <div className="space-y-2">
                {recentRuns.map((run) => {
                  const meta = TOOL_META[run.tool_key];
                  const Icon = meta?.icon || Sparkles;
                  return (
                    <Card
                      key={run.id}
                      className="cursor-pointer hover:border-primary/40 transition-all"
                      onClick={() => meta && navigate(`${meta.href}?run=${run.id}`)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{meta?.title || run.tool_key}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                            {run.cost_credits > 0 && ` · ${run.cost_credits} cr`}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {careerAgents.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> Talk to a career agent
              </h2>
              <p className="text-xs text-muted-foreground">
                Prefer a conversation? Career agents go deeper, step-by-step.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {careerAgents.map((agent) => (
                  <Card
                    key={agent.agent_key}
                    className="hover:border-primary/40 transition-all cursor-pointer"
                    onClick={() => navigate(`/app/agents/${agent.agent_key}`)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <AgentAvatar name={agent.name} avatarUrl={agent.avatar_url} size="md" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{agent.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {AGENT_PURPOSE[agent.agent_key] || agent.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <ScoreMeJobPicker open={scorePickerOpen} onOpenChange={setScorePickerOpen} />

      <JobPreferencesSheet open={preferencesOpen} onOpenChange={setPreferencesOpen} onSaved={() => refetchRecs()} />
      <CompanyDetailSheet
        companyName={activeCompany}
        open={!!activeCompany}
        onOpenChange={(o) => !o && setActiveCompany(null)}
      />
    </div>
  );
}

function ToolCard({
  icon: Icon,
  title,
  desc,
  cost,
  onClick,
}: {
  icon: any;
  title: string;
  desc: string;
  cost: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-3 rounded-2xl border border-border/40 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
    >
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-semibold leading-tight flex-1">{title}</p>
      </div>
      <p className="text-[11px] text-muted-foreground line-clamp-2">{desc}</p>
      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Coins className="h-3 w-3 text-amber-500" /> {cost}
        </Badge>
        <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
          Open <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}
