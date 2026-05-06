import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Coins,
  Loader2,
  Brain,
  Building2,
  Globe,
  Flame,
  ChevronDown,
  ChevronUp,
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
import { useTrendingJobs } from "@/hooks/useTrendingJobs";
import { useJobsInField } from "@/hooks/useJobsInField";
import { useJobTypeCounts } from "@/hooks/useJobTypeCounts";
import { JOB_COLLECTIONS } from "@/lib/constants/jobTypes";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProcessingCard, type ProcessingStage } from "@/components/ui/processing-card";
import { AgentAvatar } from "@/components/ai-agents/AgentAvatar";
import { cn } from "@/lib/utils";

const AI_PROCESSING_STAGES: ProcessingStage[] = [
  { progress: 0, message: "Reading your profile..." },
  { progress: 20, message: "Scanning thousands of open roles..." },
  { progress: 45, message: "Matching against your skills..." },
  { progress: 70, message: "Ranking the best fits..." },
  { progress: 90, message: "Almost done..." },
];

interface CountryGroup {
  country: string;
  flag: string;
  totalJobs: number;
  cities: { name: string; count: number }[];
}

type TabKey = "browse" | "company" | "country" | "tools";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "browse", label: "Browse", icon: Layers },
  { key: "company", label: "Companies", icon: Building2 },
  { key: "country", label: "Locations", icon: Globe },
  { key: "tools", label: "Tools", icon: Zap },
];

const INITIAL_SHOW = 3;
const AI_MATCH_COST = 10;

const COUNTRY_FLAGS: Record<string, string> = {
  Bangladesh: "🇧🇩",
  India: "🇮🇳",
  Singapore: "🇸🇬",
  Japan: "🇯🇵",
  "United Arab Emirates": "🇦🇪",
  "Saudi Arabia": "🇸🇦",
  Ireland: "🇮🇪",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  Canada: "🇨🇦",
};

const AGENT_PURPOSE: Record<string, string> = {
  "job-hunter": "Find roles that fit your profile",
  "cv-coach": "Polish your CV to pass ATS screens",
  "application-helper": "Draft tailored cover letters & answers",
  "interview-coach": "Practice interviews with live feedback",
  "career-consultant": "Plan your next career move",
  "remote-expert": "Discover remote-first opportunities",
  "career-abroad": "Explore careers overseas",
};

function parseLocation(location: string): { city: string; country: string } {
  const parts = location.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const country = parts[parts.length - 1];
    const city = parts.slice(0, -1).join(", ");
    return { city, country };
  }
  return { city: "Global", country: location || "International" };
}

export default function JobsHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { isSaved, toggleSave } = useSavedItems();
  const { canAfford, deductCredits } = useCredits();

  const [activeTab, setActiveTab] = useState<TabKey>("browse");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  const [showMore, setShowMore] = useState({
    recommended: false,
    featured: false,
    expiring: false,
    hot: false,
  });

  const { data: trendingJobs = [], isLoading: loadingTrending } = useTrendingJobs(10);
  const { data: jobsInField = [] } = useJobsInField(talent?.id, 5);
  const { data: jobTypeCounts = {} } = useJobTypeCounts(talent?.country);

  const { data: locations = [] } = useQuery({
    queryKey: ["all-job-locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("location").eq("is_active", true);
      if (error) throw error;
      const map = new Map<string, number>();
      data.forEach((row) => {
        if (row.location) map.set(row.location, (map.get(row.location) || 0) + 1);
      });
      return Array.from(map.entries()).map(([location, count]) => ({ location, count }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ["all-job-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("company_name, company_logo_url")
        .eq("is_active", true);
      if (error) throw error;
      const map = new Map<string, { logo: string | null; count: number }>();
      data.forEach((j) => {
        if (!j.company_name) return;
        const ex = map.get(j.company_name);
        map.set(j.company_name, { logo: j.company_logo_url || ex?.logo || null, count: (ex?.count || 0) + 1 });
      });
      return Array.from(map.entries()).map(([name, info]) => ({
        name,
        logo_url: info.logo,
        count: info.count,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

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
    const list = q ? allCompanies.filter((c) => c.name.toLowerCase().includes(q)) : allCompanies;
    return list.slice(0, 24);
  }, [allCompanies, companySearch]);

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

  const countryGroups = useMemo(() => {
    const map = new Map<string, CountryGroup>();
    locations.forEach((loc) => {
      const { city, country } = parseLocation(loc.location);
      const ex = map.get(country);
      if (ex) {
        ex.totalJobs += loc.count;
        if (city) ex.cities.push({ name: city, count: loc.count });
      } else {
        map.set(country, {
          country,
          flag: COUNTRY_FLAGS[country] || "🌍",
          totalJobs: loc.count,
          cities: city ? [{ name: city, count: loc.count }] : [],
        });
      }
    });
    const list = Array.from(map.values()).sort((a, b) => b.totalJobs - a.totalJobs);
    const userCountry = talent?.country;
    if (userCountry) {
      const idx = list.findIndex((g) => g.country.toLowerCase() === userCountry.toLowerCase());
      if (idx > 0) {
        const [pinned] = list.splice(idx, 1);
        list.unshift(pinned);
      }
    }
    return list;
  }, [locations, talent?.country]);

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
        </div>
      )}

      {/* Companies tab */}
      {activeTab === "company" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              className="h-10 pl-9 rounded-lg"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredCompanies.map((c) => (
              <Card
                key={c.name}
                className="hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => navigate(`/app/jobs/all?company=${encodeURIComponent(c.name)}`)}
              >
                <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                  <Avatar className="h-10 w-10">
                    {c.logo_url && <AvatarImage src={c.logo_url} />}
                    {!c.logo_url && (
                      <AvatarFallback className="text-xs font-semibold">
                        {c.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <p className="text-[11px] font-semibold line-clamp-1 w-full">{c.name}</p>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                    {c.count} {c.count === 1 ? "role" : "roles"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {filteredCompanies.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground text-center py-8">No companies found.</p>
            )}
          </div>
        </div>
      )}

      {/* Locations tab */}
      {activeTab === "country" && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-primary" /> Jobs by country
          </h2>
          {countryGroups.map((g) => {
            const isUserCountry = !!talent?.country && g.country.toLowerCase() === talent.country.toLowerCase();
            return (
              <Card key={g.country} className={cn(isUserCountry && "border-primary/40 bg-primary/5")}>
                <button
                  onClick={() => setExpandedCountry(expandedCountry === g.country ? null : g.country)}
                  className="w-full flex items-center p-3 hover:bg-muted/40 text-left transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center text-lg mr-3">
                    {g.flag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{g.country}</p>
                      {isUserCountry && (
                        <Badge className="bg-primary/15 text-primary border-0 text-[9px] px-1.5 py-0">
                          Your country
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {g.totalJobs} open {g.totalJobs === 1 ? "role" : "roles"}
                    </p>
                  </div>
                  {expandedCountry === g.country ? (
                    <ChevronUp className="text-primary h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {expandedCountry === g.country && (
                  <div className="bg-muted/20 p-2 grid grid-cols-2 gap-1.5 border-t">
                    {g.cities.slice(0, 10).map((city) => (
                      <button
                        key={city.name}
                        onClick={() => navigate(`/app/jobs/all?location=${encodeURIComponent(city.name)}`)}
                        className="flex justify-between items-center px-3 py-2 rounded-md bg-background hover:bg-primary/5 transition-all border border-border/40"
                      >
                        <span className="text-xs font-medium truncate">{city.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {city.count}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Tools tab */}
      {activeTab === "tools" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <section className="space-y-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Career tools
            </h2>
            <p className="text-xs text-muted-foreground">Practical AI tools to ship a stronger application — fast.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ToolCard
                icon={FileText}
                title="ATS-friendly CV"
                desc="Generate a clean, scanner-safe CV PDF from your profile."
                cost="15 credits"
                onClick={() => navigate("/app/tools/cv-maker")}
              />
              <ToolCard
                icon={MessageSquare}
                title="Application answers"
                desc="Paste questions, get tailored answers grounded in your profile."
                cost="10 credits"
                onClick={() => navigate("/app/tools/application-helper")}
              />
              <ToolCard
                icon={Sparkles}
                title="AI job matches"
                desc="Rank your best-fit open roles against your profile."
                cost="10 credits"
                onClick={handleGetAIRecommendations}
              />
              <ToolCard
                icon={Target}
                title="Score me vs job"
                desc="See your match score for any specific role."
                cost="10 credits"
                onClick={() => navigate("/app/jobs/all")}
              />
            </div>
          </section>

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

      <JobPreferencesSheet open={preferencesOpen} onOpenChange={setPreferencesOpen} onSaved={() => refetchRecs()} />
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
