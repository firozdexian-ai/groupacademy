import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Coins,
  AlertCircle,
  RefreshCw,
  Loader2,
  Brain,
  Building2,
  Globe,
  Flame,
  Layers,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Bot,
  ArrowRight,
  MessageCircle,
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
import { getIcon } from "@/lib/iconMap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AI_PROCESSING_STAGES: ProcessingStage[] = [
  { progress: 0, message: "Analyzing your profile and skills..." },
  { progress: 20, message: "Scanning 2,000+ job listings..." },
  { progress: 45, message: "Matching with job descriptions..." },
  { progress: 65, message: "Ranking best opportunities..." },
  { progress: 85, message: "Preparing your recommendations..." },
];

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
  industry: string | null;
}

interface CountryGroup {
  country: string;
  flag: string;
  totalJobs: number;
  cities: { name: string; count: number }[];
}

interface AgentWithSession {
  agent_key: string;
  name: string;
  description: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  credit_cost: number | null;
  avatar_url: string | null;
  category: string | null;
  is_featured: boolean | null;
  lastMessage?: string;
  lastMessageTime?: string;
}

type TabKey = "agents" | "collection" | "company" | "country";

const TABS: { key: TabKey; label: string; icon: typeof Sparkles }[] = [
  { key: "agents", label: "Agents", icon: Bot },
  { key: "collection", label: "Collection", icon: Layers },
  { key: "company", label: "By Company", icon: Building2 },
  { key: "country", label: "By Country", icon: Globe },
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

/**
 * CTO Optimization: Improved location parsing for global markets
 */
function parseLocation(location: string): { city: string; country: string } {
  const parts = location.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const country = parts[parts.length - 1];
    const city = parts.slice(0, -1).join(", ");
    return { city, country };
  }
  return { city: "Other", country: location || "International" };
}

// Extract last message text from agent_chat_sessions messages JSON
function extractLastMessage(messages: any): { text: string; time: string } | null {
  if (!messages || !Array.isArray(messages) || messages.length === 0) return null;
  const last = messages[messages.length - 1];
  const text = typeof last.content === "string" ? last.content : last.text || "";
  return { text: text.slice(0, 80), time: last.timestamp || last.created_at || "" };
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
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  const [showMore, setShowMore] = useState({
    recommended: false,
    featured: false,
    expiring: false,
    hot: false,
  });

  /**
   * CTO Audit Fix: Wrapping heavy fetches in useQuery with 5m staleTime
   */
  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["all-job-locations"],
    queryFn: async () => {
      let allData: { location: string }[] = [];
      const pageSize = 1000;
      let page = 0;
      while (true) {
        const { data, error } = await supabase
          .from("jobs")
          .select("location")
          .eq("is_active", true)
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        if (!data?.length) break;
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        page++;
      }
      const map = new Map<string, number>();
      allData.forEach((row) => {
        if (row.location) map.set(row.location, (map.get(row.location) || 0) + 1);
      });
      return Array.from(map.entries()).map(([location, count]) => ({ location, count }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allCompanies = [], isLoading: loadingCompanies } = useQuery({
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
        industry: null,
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
      return {
        featured: (featured.data || []) as JobCardData[],
        expiring: (expiring.data || []) as JobCardData[],
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: recommendations = [], refetch: refetchRecs } = useQuery({
    queryKey: ["ai-recs", talent?.id],
    queryFn: async () => {
      if (!talent?.id) return [];
      const { data: recs } = await supabase
        .from("ai_job_recommendations")
        .select("*, job:jobs(*)")
        .eq("talent_id", talent.id)
        .order("match_score", { ascending: false });
      return (recs || []).map((r) => ({ ...r, job: r.job as JobCardData }));
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
    if (!canAfford("SUGGESTED_JOBS")) return toast.error("Need 10 credits");
    setLoadingAI(true);
    try {
      await deductCredits("SUGGESTED_JOBS", undefined, "AI Recommendations");
      const { data, error } = await supabase.functions.invoke("suggest-jobs-for-talent");
      if (error) throw error;
      await refetchRecs();
      toast.success("Recommendations updated!");
    } catch (err) {
      toast.error("AI Analysis failed");
    } finally {
      setLoadingAI(false);
    }
  }

  const renderJobSection = (jobs: JobCardData[], key: keyof typeof showMore) => (
    <div className="space-y-2">
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
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowMore((p) => ({ ...p, [key]: !p[key] }))}
        >
          {showMore[key] ? "Show Less" : `Show More (${jobs.length - INITIAL_SHOW})`}
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-2 space-y-2 min-h-screen">
      <nav className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition-all ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            <tab.icon className="h-4 w-4 mx-auto mb-1" />
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "agents" && (
        <div className="divide-y rounded-xl border bg-card overflow-hidden">
          {careerAgents.map((agent) => (
            <button
              key={agent.agent_key}
              onClick={() => navigate(`/app/agents/${agent.agent_key}`)}
              className="w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors text-left"
            >
              <AgentAvatar name={agent.name} avatarUrl={agent.avatar_url} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{agent.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {activeTab === "collection" && (
        <div className="space-y-6">
          <div className="space-y-2 pt-2">
            <SectionHeader icon={Brain} title="AI Matchmaking" />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGetAIRecommendations}
              disabled={loadingAI}
            >
              {loadingAI ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4 text-primary" />}
              {recommendations.length > 0 ? "Refresh AI Matches" : "Generate Best Matches (10 cr)"}
            </Button>
            {loadingAI && <ProcessingCard title="Analyzing Pipeline" stages={AI_PROCESSING_STAGES} duration={20000} />}
            {recommendations.length > 0 &&
              renderJobSection(
                recommendations.map((r) => r.job),
                "recommended",
              )}
          </div>

          <div className="space-y-2">
            <SectionHeader icon={Flame} title="Trending Now" />
            {collectionData?.featured && renderJobSection(collectionData.featured, "featured")}
          </div>

          <div className="grid grid-cols-2 gap-3 pb-20">
            {JOB_COLLECTIONS.map((c) => (
              <Card
                key={c.filter}
                className="cursor-pointer hover:border-primary active:scale-95 transition-all"
                onClick={() => navigate(`/app/jobs/all?type=${c.filter}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <c.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{c.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "company" && (
        <div className="space-y-4">
          <Input
            placeholder="Search top companies..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-3">
            {allCompanies.slice(0, 30).map((c) => (
              <Card
                key={c.name}
                className="cursor-pointer hover:shadow-md"
                onClick={() => navigate(`/app/jobs/all?company=${encodeURIComponent(c.name)}`)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Avatar className="h-10 w-10 border">
                    {c.logo_url && <AvatarImage src={c.logo_url} />}
                    {!c.logo_url && <AvatarFallback>{c.name.slice(0, 2)}</AvatarFallback>}
                  </Avatar>
                  <p className="text-[10px] font-bold truncate w-full">{c.name}</p>
                  <Badge variant="secondary" className="text-[9px]">
                    {c.count} openings
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "country" && (
        <div className="space-y-2">
          {countryGroups.map((g) => (
            <Card key={g.country} className="overflow-hidden">
              <button
                onClick={() => setExpandedCountry(expandedCountry === g.country ? null : g.country)}
                className="w-full flex items-center p-4 hover:bg-accent text-left"
              >
                <span className="text-xl mr-3">{g.flag}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold">{g.country}</p>
                  <p className="text-xs text-muted-foreground">{g.totalJobs} listings</p>
                </div>
                {expandedCountry === g.country ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedCountry === g.country && (
                <div className="bg-muted/30 p-2 space-y-1">
                  {g.cities.slice(0, 10).map((city) => (
                    <button
                      key={city.name}
                      onClick={() => navigate(`/app/jobs/all?location=${encodeURIComponent(city.name)}`)}
                      className="w-full flex justify-between p-2 text-xs hover:bg-accent rounded"
                    >
                      <span>{city.name}</span>
                      <Badge variant="secondary">{city.count}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <JobPreferencesSheet open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </div>
  );
}
