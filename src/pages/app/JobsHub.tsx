import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Coins,
  RefreshCw,
  Loader2,
  Brain,
  Building2,
  Globe,
  Flame,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Bot,
  ArrowRight,
  Target,
  Zap,
  ShieldCheck,
  Compass,
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
import { JOB_COLLECTIONS } from "@/lib/constants/jobTypes";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProcessingCard, type ProcessingStage } from "@/components/ui/processing-card";
import { AgentAvatar } from "@/components/ai-agents/AgentAvatar";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Marketplace Intelligence Terminal
 * High-fidelity orchestrator for role discovery, agent-led search, and global market telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced AI processing states.
 */

const AI_PROCESSING_STAGES: ProcessingStage[] = [
  { progress: 0, message: "Syncing Talent Registry..." },
  { progress: 20, message: "Scanning 2,000+ Global Nodes..." },
  { progress: 45, message: "Synthesizing Neural Match..." },
  { progress: 70, message: "Ranking Best Logic Paths..." },
  { progress: 90, message: "Finalizing Recommendations..." },
];

interface CountryGroup {
  country: string;
  flag: string;
  totalJobs: number;
  cities: { name: string; count: number }[];
}

type TabKey = "agents" | "collection" | "company" | "country";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "agents", label: "Neural Agents", icon: Bot },
  { key: "collection", label: "Artifacts", icon: Layers },
  { key: "company", label: "By Entity", icon: Building2 },
  { key: "country", label: "By Registry", icon: Globe },
];

const INITIAL_SHOW = 3;

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

  const [activeTab, setActiveTab] = useState<TabKey>("agents");
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

  // Telemetry Fetch: Locations
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

  // Telemetry Fetch: Companies
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

  const { data: collectionData } = useQuery({
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
    queryKey: ["career-agents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("is_active", true)
        .in("category", ["career", "education"])
        .order("display_order");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

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
    return Array.from(map.values()).sort((a, b) => b.totalJobs - a.totalJobs);
  }, [locations]);

  async function handleGetAIRecommendations() {
    if (!canAfford("SUGGESTED_JOBS")) return toast.error("Need 10 Credits.");
    setLoadingAI(true);
    try {
      await deductCredits("SUGGESTED_JOBS", undefined, "AI Hub Synthesis");
      const { error } = await supabase.functions.invoke("suggest-jobs-for-talent");
      if (error) throw error;
      await refetchRecs();
      toast.success("Synthesis Finalized: Results Consumed");
    } catch (err) {
      toast.error("Neural handshake saturation.");
    } finally {
      setLoadingAI(false);
    }
  }

  const renderJobSection = (jobs: JobCardData[], key: keyof typeof showMore) => (
    <div className="space-y-4">
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
          className="w-full h-12 rounded-xl font-black uppercase text-[9px] tracking-widest text-muted-foreground/60 hover:bg-primary/5"
          onClick={() => setShowMore((p) => ({ ...p, [key]: !p[key] }))}
        >
          {showMore[key] ? "Terminate List" : `Expand Protocol (${jobs.length - INITIAL_SHOW})`}
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 pb-40 space-y-10 animate-in fade-in duration-1000">
      {/* Immersive Navigation HUD */}
      <nav className="flex p-1.5 h-16 bg-muted/30 backdrop-blur-xl rounded-[28px] border border-border/40">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-3 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab.key
                ? "bg-background shadow-lg text-primary scale-[0.98]"
                : "text-muted-foreground/60 hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Agents Protocol Viewport */}
      {activeTab === "agents" && (
        <div className="grid gap-4 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
              <Zap className="h-4 w-4" /> Active Neural Nodes
            </h2>
            <Badge
              variant="outline"
              className="text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary"
            >
              v2.6 Synchronized
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {careerAgents.map((agent) => (
              <Card
                key={agent.agent_key}
                className="group cursor-pointer rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:shadow-2xl overflow-hidden"
                onClick={() => navigate(`/app/agents/${agent.agent_key}`)}
              >
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 rotate-3 transition-transform group-hover:rotate-0">
                    <AgentAvatar name={agent.name} avatarUrl={agent.avatar_url} size="lg" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-black uppercase tracking-tight text-lg leading-none">{agent.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase italic line-clamp-1">
                      {agent.description}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Artifacts (Collection) Viewport */}
      {activeTab === "collection" && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <SectionHeader icon={Brain} title="Neural Matchmaking" />
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">10 Credit Execution</span>
              </div>
            </div>

            <Button
              className="w-full h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all group overflow-hidden"
              onClick={handleGetAIRecommendations}
              disabled={loadingAI}
            >
              <span className="relative z-10 flex items-center gap-3">
                {loadingAI ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <Sparkles className="h-5 w-5 fill-current" />
                )}
                {recommendations.length > 0 ? "Re-Initialize Synthesis" : "Initialize Neural Discovery"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>

            {loadingAI && (
              <ProcessingCard title="Synthesizing Career Artifacts" stages={AI_PROCESSING_STAGES} duration={20000} />
            )}

            {recommendations.length > 0 && !loadingAI && (
              <div className="pt-6 animate-in zoom-in-95">
                {renderJobSection(
                  recommendations.map((r) => r.job),
                  "recommended",
                )}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <SectionHeader icon={Flame} title="Active Logic (Trending)" />
            {collectionData?.featured && renderJobSection(collectionData.featured, "featured")}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {JOB_COLLECTIONS.map((c) => (
              <Card
                key={c.filter}
                className="group rounded-[28px] border-2 border-border/40 bg-card/30 hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                onClick={() => navigate(`/app/jobs/all?type=${c.filter}`)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner">
                    <c.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{c.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Entity (Company) Viewport */}
      {activeTab === "company" && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Query corporate entities..."
              className="h-14 pl-12 rounded-2xl border-2 border-border/40 bg-card/50 backdrop-blur-sm font-bold tracking-tight shadow-inner"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allCompanies.slice(0, 24).map((c) => (
              <Card
                key={c.name}
                className="group rounded-[32px] border-2 border-border/40 bg-card/30 hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                onClick={() => navigate(`/app/jobs/all?company=${encodeURIComponent(c.name)}`)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-background shadow-lg transition-transform group-hover:scale-110">
                      {c.logo_url && <AvatarImage src={c.logo_url} />}
                      {!c.logo_url && (
                        <AvatarFallback className="font-black text-xs">
                          {c.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                      <ShieldCheck className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-tight line-clamp-1">{c.name}</p>
                    <Badge
                      variant="secondary"
                      className="bg-primary/5 text-primary border-none text-[8px] font-black uppercase italic tracking-widest"
                    >
                      {c.count} Active Nodes
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Registry (Country) Viewport */}
      {activeTab === "country" && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3 px-2 mb-6">
            <Compass className="h-5 w-5 text-primary" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Geospatial Registry</h2>
          </div>
          {countryGroups.map((g) => (
            <Card
              key={g.country}
              className="rounded-[28px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden transition-all hover:border-primary/20"
            >
              <button
                onClick={() => setExpandedCountry(expandedCountry === g.country ? null : g.country)}
                className="w-full flex items-center p-6 hover:bg-primary/[0.02] text-left transition-colors"
              >
                <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center text-2xl shadow-inner mr-5">
                  {g.flag}
                </div>
                <div className="flex-1">
                  <p className="text-base font-black uppercase tracking-tight leading-none mb-1">{g.country}</p>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                    {g.totalJobs} Integrated Listings
                  </p>
                </div>
                {expandedCountry === g.country ? (
                  <ChevronUp className="text-primary h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5 opacity-20" />
                )}
              </button>
              {expandedCountry === g.country && (
                <div className="bg-muted/10 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-300">
                  {g.cities.slice(0, 10).map((city) => (
                    <button
                      key={city.name}
                      onClick={() => navigate(`/app/jobs/all?location=${encodeURIComponent(city.name)}`)}
                      className="flex justify-between items-center px-4 py-3 rounded-xl bg-background/50 hover:bg-primary/5 group transition-all border border-border/40"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-tight group-hover:text-primary transition-colors">
                        {city.name}
                      </span>
                      <Badge variant="outline" className="text-[9px] font-mono border-primary/20 text-primary">
                        {city.count.toString().padStart(2, "0")}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Control Overlays */}
      <JobPreferencesSheet open={preferencesOpen} onOpenChange={setPreferencesOpen} />

      {/* Operational Metadata Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Market Intelligence Node: Active</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Protocol Version: Executive Logic 2026.4
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
