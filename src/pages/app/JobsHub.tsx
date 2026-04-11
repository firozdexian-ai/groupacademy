import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Country flag emoji map
const COUNTRY_FLAGS: Record<string, string> = {
  "Bangladesh": "🇧🇩", "India": "🇮🇳", "Singapore": "🇸🇬", "Japan": "🇯🇵",
  "United Arab Emirates": "🇦🇪", "Saudi Arabia": "🇸🇦", "Ireland": "🇮🇪",
  "New Zealand": "🇳🇿", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
  "Canada": "🇨🇦", "Australia": "🇦🇺", "Germany": "🇩🇪", "France": "🇫🇷",
  "Netherlands": "🇳🇱", "Sweden": "🇸🇪", "Norway": "🇳🇴", "Denmark": "🇩🇰",
  "Finland": "🇫🇮", "Switzerland": "🇨🇭", "Malaysia": "🇲🇾", "Qatar": "🇶🇦",
  "Kuwait": "🇰🇼", "Bahrain": "🇧🇭", "Oman": "🇴🇲", "Pakistan": "🇵🇰",
  "Sri Lanka": "🇱🇰", "Nepal": "🇳🇵", "Philippines": "🇵🇭", "Indonesia": "🇮🇩",
  "Thailand": "🇹🇭", "Vietnam": "🇻🇳", "South Korea": "🇰🇷", "China": "🇨🇳",
  "Italy": "🇮🇹", "Spain": "🇪🇸", "Portugal": "🇵🇹", "Austria": "🇦🇹",
  "Belgium": "🇧🇪", "Poland": "🇵🇱",
};

function parseLocation(location: string): { city: string; country: string } {
  const parts = location.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const country = parts[parts.length - 1];
    const city = parts.slice(0, -1).join(", ");
    return { city, country };
  }
  return { city: "", country: location };
}

async function fetchAllLocations(): Promise<{ location: string; count: number }[]> {
  const pageSize = 1000;
  let allData: { location: string }[] = [];
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from("jobs").select("location").eq("is_active", true)
      .or("deadline.is.null,deadline.gte.now()")
      .not("location", "is", null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    hasMore = data.length === pageSize;
    page++;
  }
  const map = new Map<string, number>();
  for (const row of allData) {
    const loc = row.location?.trim();
    if (!loc) continue;
    map.set(loc, (map.get(loc) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);
}

async function fetchAllCompanies(): Promise<TopCompany[]> {
  const pageSize = 1000;
  let allData: { company_name: string; company_logo_url: string | null }[] = [];
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from("jobs").select("company_name, company_logo_url").eq("is_active", true)
      .or("deadline.is.null,deadline.gte.now()")
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    hasMore = data.length === pageSize;
    page++;
  }
  const { data: companiesData } = await supabase.from("companies").select("name, logo_url, industry").limit(5000);
  const companyDetailsMap = new Map<string, { logo_url: string | null; industry: string | null }>();
  for (const c of companiesData || []) {
    companyDetailsMap.set(c.name.toLowerCase(), { logo_url: c.logo_url, industry: c.industry });
  }
  const map = new Map<string, { logo_url: string | null; count: number; industry: string | null }>();
  for (const job of allData) {
    if (!job.company_name) continue;
    const existing = map.get(job.company_name);
    const details = companyDetailsMap.get(job.company_name.toLowerCase());
    if (existing) {
      existing.count++;
      if (!existing.logo_url && (job.company_logo_url || details?.logo_url)) {
        existing.logo_url = details?.logo_url || job.company_logo_url;
      }
      if (!existing.industry && details?.industry) existing.industry = details.industry;
    } else {
      map.set(job.company_name, {
        logo_url: details?.logo_url || job.company_logo_url,
        count: 1,
        industry: details?.industry || null,
      });
    }
  }
  return Array.from(map.entries())
    .map(([name, info]) => ({ name, logo_url: info.logo_url, count: info.count, industry: info.industry }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Extract last message text from agent_chat_sessions messages JSON
function extractLastMessage(messages: any): { text: string; time: string } | null {
  if (!messages || !Array.isArray(messages) || messages.length === 0) return null;
  const last = messages[messages.length - 1];
  if (!last) return null;
  const text = typeof last.content === "string" ? last.content : (last.text || "");
  return { text: text.slice(0, 80), time: last.timestamp || last.created_at || "" };
}

export default function JobsHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { savedItems, isSaved, toggleSave } = useSavedItems();
  const { canAfford, deductCredits } = useCredits();

  const [activeTab, setActiveTab] = useState<TabKey>("agents");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Collection tab states (recommendations + featured + expiring + hot)
  const [recommendations, setRecommendations] = useState<AISuggestion[]>([]);
  const [recommendationsGeneratedAt, setRecommendationsGeneratedAt] = useState<string | null>(null);
  const [featuredJobs, setFeaturedJobs] = useState<JobCardData[]>([]);
  const [expiringJobs, setExpiringJobs] = useState<JobCardData[]>([]);
  const [hotJobs, setHotJobs] = useState<JobCardData[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const [showMore, setShowMore] = useState({
    recommended: false,
    featured: false,
    expiring: false,
    hot: false,
  });

  // Company tab states
  const [allCompanies, setAllCompanies] = useState<TopCompany[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");

  // Country tab states
  const [countryGroups, setCountryGroups] = useState<CountryGroup[]>([]);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  const [expiringCount, setExpiringCount] = useState(0);
  const [hotCount, setHotCount] = useState(0);

  // Career Development Agents from DB
  const { data: careerAgents = [] } = useQuery({
    queryKey: ["career-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("agent_key, name, description, icon, color, bg_color, credit_cost, avatar_url, category, is_featured")
        .eq("is_active", true)
        .in("category", ["career", "career-tools", "education"])
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's recent agent sessions in a single query
  const { data: recentSessions = [] } = useQuery({
    queryKey: ["agent-sessions-preview", talent?.id],
    queryFn: async () => {
      if (!talent?.id) return [];
      const { data, error } = await supabase
        .from("agent_chat_sessions")
        .select("agent_key, messages, updated_at")
        .eq("talent_id", talent.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!talent?.id,
    staleTime: 60 * 1000,
  });

  // Merge agents with session data
  const agentsWithSessions: AgentWithSession[] = useMemo(() => {
    const sessionMap = new Map<string, { messages: any; updated_at: string }>();
    for (const s of recentSessions) {
      if (!sessionMap.has(s.agent_key)) {
        sessionMap.set(s.agent_key, { messages: s.messages, updated_at: s.updated_at || "" });
      }
    }
    return careerAgents.map((agent) => {
      const session = sessionMap.get(agent.agent_key);
      const lastMsg = session ? extractLastMessage(session.messages) : null;
      return {
        ...agent,
        lastMessage: lastMsg?.text,
        lastMessageTime: session?.updated_at || lastMsg?.time,
      };
    });
  }, [careerAgents, recentSessions]);

  useEffect(() => {
    loadAllData();
  }, [talent?.id]);

  async function loadAllData() {
    setLoading(true);
    setError(null);
    try {
      const [featuredResult, expiringResult, hotResult, companiesResult, locationsResult] = await Promise.all([
        fetchFeaturedJobs(),
        fetchExpiringJobs(),
        fetchHotJobs(),
        fetchAllCompanies(),
        fetchAllLocations(),
      ]);
      setFeaturedJobs(featuredResult);
      setExpiringJobs(expiringResult);
      setExpiringCount(expiringResult.length);
      setHotJobs(hotResult);
      setHotCount(hotResult.length);
      setAllCompanies(companiesResult);

      const countryMap = new Map<string, { totalJobs: number; cities: Map<string, number> }>();
      for (const loc of locationsResult) {
        const { city, country } = parseLocation(loc.location);
        const existing = countryMap.get(country);
        if (existing) {
          existing.totalJobs += loc.count;
          if (city) existing.cities.set(city, (existing.cities.get(city) || 0) + loc.count);
        } else {
          const cities = new Map<string, number>();
          if (city) cities.set(city, loc.count);
          countryMap.set(country, { totalJobs: loc.count, cities });
        }
      }
      const groups: CountryGroup[] = Array.from(countryMap.entries())
        .map(([country, data]) => ({
          country,
          flag: COUNTRY_FLAGS[country] || "🌍",
          totalJobs: data.totalJobs,
          cities: Array.from(data.cities.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count),
        }))
        .sort((a, b) => b.totalJobs - a.totalJobs);
      setCountryGroups(groups);

      if (talent?.id) await fetchRecommendations();
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
    if (error) { console.error(error); return; }
    if (!data || data.length === 0) { setRecommendations([]); setRecommendationsGeneratedAt(null); return; }
    setRecommendationsGeneratedAt(data[0].generated_at);
    const jobIds = data.map((r) => r.job_id);
    const { data: jobsData, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
      .in("id", jobIds).eq("is_active", true);
    if (jobsError) { console.error(jobsError); return; }
    const jobMap = new Map((jobsData || []).map((j) => [j.id, j]));
    setRecommendations(
      data.filter((r) => jobMap.has(r.job_id)).map((r) => ({
        job_id: r.job_id, match_score: r.match_score, reason: r.reason || "",
        job: jobMap.get(r.job_id) as JobCardData,
      }))
    );
  }

  async function fetchFeaturedJobs(): Promise<JobCardData[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
      .eq("is_active", true).eq("is_featured", true)
      .or("deadline.is.null,deadline.gte.now()")
      .order("created_at", { ascending: false }).limit(10);
    if (error) throw error;
    return (data as JobCardData[]) || [];
  }

  async function fetchExpiringJobs(): Promise<JobCardData[]> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
      .eq("is_active", true).not("deadline", "is", null)
      .gte("deadline", new Date().toISOString()).lte("deadline", sevenDaysFromNow.toISOString())
      .order("deadline", { ascending: true }).limit(10);
    if (error) throw error;
    return (data as JobCardData[]) || [];
  }

  async function fetchHotJobs(): Promise<JobCardData[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();
    const [clicksResult, appsResult] = await Promise.all([
      supabase.from("job_analytics").select("job_id").gte("clicked_at", since),
      supabase.from("job_applications").select("job_id").gte("created_at", since),
    ]);
    const engagementMap = new Map<string, number>();
    for (const row of clicksResult.data || []) engagementMap.set(row.job_id, (engagementMap.get(row.job_id) || 0) + 1);
    for (const row of appsResult.data || []) if (row.job_id) engagementMap.set(row.job_id, (engagementMap.get(row.job_id) || 0) + 2);
    if (engagementMap.size === 0) return [];
    const topJobIds = Array.from(engagementMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max")
      .in("id", topJobIds).eq("is_active", true);
    if (error) throw error;
    const result = (data as JobCardData[]) || [];
    result.sort((a, b) => (engagementMap.get(b.id) || 0) - (engagementMap.get(a.id) || 0));
    return result;
  }

  async function handleGetAIRecommendations() {
    if (!canAfford("SUGGESTED_JOBS")) {
      toast.error("Insufficient credits. You need 10 credits for AI recommendations.");
      return;
    }
    setLoadingAI(true);
    try {
      const success = await deductCredits("SUGGESTED_JOBS", undefined, "AI Job Recommendations");
      if (!success) { toast.error("Failed to process credits"); return; }
      const { data, error: fnError } = await supabase.functions.invoke("suggest-jobs-for-talent");
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const suggestions = data?.suggestions || [];
      if (suggestions.length === 0) {
        toast.info("No strong matches found. Try updating your profile with more skills.");
        setLoadingAI(false);
        return;
      }
      if (talent?.id) {
        await supabase.from("ai_job_recommendations").delete().eq("talent_id", talent.id);
        await supabase.from("ai_job_recommendations").insert(
          suggestions.map((s: AISuggestion) => ({
            talent_id: talent.id, job_id: s.job_id, match_score: s.match_score, reason: s.reason,
          }))
        );
      }
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

  const filteredCompanies = useMemo(() => {
    let result = allCompanies;
    if (selectedLetter) result = result.filter((c) => c.name.toUpperCase().startsWith(selectedLetter));
    if (selectedIndustry && selectedIndustry !== "all") result = result.filter((c) => c.industry === selectedIndustry);
    if (companySearch) {
      const q = companySearch.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    return result;
  }, [allCompanies, selectedLetter, selectedIndustry, companySearch]);

  const industries = useMemo(() => {
    const set = new Set<string>();
    for (const c of allCompanies) if (c.industry) set.add(c.industry);
    return Array.from(set).sort();
  }, [allCompanies]);

  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    for (const c of allCompanies) {
      const first = c.name.charAt(0).toUpperCase();
      if (/[A-Z]/.test(first)) set.add(first);
    }
    return Array.from(set).sort();
  }, [allCompanies]);

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
              key={job.id} job={job} variant="compact"
              isSaved={isSaved(job.id, "job")}
              onSaveToggle={() => toggleSave(job.id, "job")}
              onClick={() => navigate(`/app/jobs/${job.id}`)}
            />
          ))}
        </div>
        {hasMore && (
          <Button variant="ghost" size="sm" className="w-full mt-1 gap-1 text-xs text-muted-foreground"
            onClick={() => toggleShowMore(sectionKey)}>
            {isExpanded ? (<>Show Less <ChevronUp className="h-3 w-3" /></>) : (<>Show More ({jobs.length - INITIAL_SHOW} more) <ChevronDown className="h-3 w-3" /></>)}
          </Button>
        )}
      </>
    );
  }

  // Format time ago
  function formatTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return `${Math.floor(diffDays / 7)}w`;
  }

  // Category label mapping
  function getCategoryLabel(category: string | null): string {
    switch (category) {
      case "career": return "Career Agent";
      case "career-tools": return "Career Tools";
      case "education": return "Education";
      default: return "Agent";
    }
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

      {/* ===== Tab: Agents (Messenger-style) ===== */}
      {activeTab === "agents" && (
        <section className="space-y-1">
          {agentsWithSessions.length === 0 && !loading ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-8 text-center">
                <Bot className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No agents available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
              {agentsWithSessions.map((agent) => {
                const IconComponent = agent.icon ? getIcon(agent.icon) : null;
                return (
                  <button
                    key={agent.agent_key}
                    onClick={() => navigate(`/app/agents/${agent.agent_key}`)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 active:bg-accent transition-colors text-left"
                  >
                    {/* Avatar */}
                    <AgentAvatar
                      name={agent.name}
                      avatarUrl={agent.avatar_url}
                      icon={IconComponent || undefined}
                      bgColor={agent.bg_color || undefined}
                      iconColor={agent.color || undefined}
                      size="lg"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {agent.lastMessageTime && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimeAgo(agent.lastMessageTime)}
                            </span>
                          )}
                        </div>
                      </div>
                      {agent.lastMessage ? (
                        <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1.5 mt-0.5">
                          <MessageCircle className="h-3 w-3 shrink-0" />
                          <span className="truncate">{agent.lastMessage}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {getCategoryLabel(agent.category)} · {agent.credit_cost ?? 1} cr/msg
                        </p>
                      )}
                    </div>

                    {/* Credit badge when no conversation */}
                    {!agent.lastMessage && (
                      <Badge variant="secondary" className="shrink-0 text-[10px] gap-0.5 px-1.5 h-5">
                        <Coins className="h-3 w-3 text-amber-500" />
                        {agent.credit_cost ?? 1}
                      </Badge>
                    )}

                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-50" />
                  </button>
                );
              })}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground gap-1"
            onClick={() => navigate("/app/agents")}
          >
            View All Agents <ArrowRight className="h-3 w-3" />
          </Button>
        </section>
      )}

      {/* ===== Tab: Collection ===== */}
      {activeTab === "collection" && (
        <section className="space-y-4">
          {/* Recommended for You (AI-powered) — moved from Agents tab */}
          <div className="space-y-2">
            <SectionHeader icon={Brain} title="Recommended for You" />
            <Button
              variant="outline" className="w-full gap-2 h-9"
              onClick={handleGetAIRecommendations} disabled={loadingAI}
            >
              {loadingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              {loadingAI ? "Analyzing your profile..." : recommendations.length > 0 ? "Refresh Recommendations" : "Get AI Recommendations"}
              <Badge variant="secondary" className="gap-1 ml-auto">
                <Coins className="h-3 w-3 text-amber-500" /> 10 credits
              </Badge>
            </Button>
            {loadingAI && (
              <ProcessingCard title="Finding Your Best Matches" stages={AI_PROCESSING_STAGES} duration={25000} />
            )}
            {recommendationsGeneratedAt && !loadingAI && (
              <p className="text-[10px] text-muted-foreground">
                Last updated: {new Date(recommendationsGeneratedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {!loadingAI && recommendations.length > 0 && (
              <>
                <div className="space-y-2">
                  {(showMore.recommended ? recommendations.slice(0, 12) : recommendations.slice(0, INITIAL_SHOW)).map((suggestion) => (
                    <JobCard key={suggestion.job_id} job={suggestion.job} variant="compact"
                      matchInfo={{ match_score: suggestion.match_score, reason: suggestion.reason }}
                      onClick={() => navigate(`/app/jobs/${suggestion.job_id}`)} />
                  ))}
                </div>
                {recommendations.length > INITIAL_SHOW && (
                  <Button variant="ghost" size="sm" className="w-full mt-1 gap-1 text-xs text-muted-foreground"
                    onClick={() => toggleShowMore("recommended")}>
                    {showMore.recommended ? (<>Show Less <ChevronUp className="h-3 w-3" /></>) : (<>Show More ({recommendations.length - INITIAL_SHOW} more) <ChevronDown className="h-3 w-3" /></>)}
                  </Button>
                )}
              </>
            )}
            {!loadingAI && recommendations.length === 0 && !loading && (
              <Card className="border-dashed bg-muted/30">
                <CardContent className="p-4 text-center">
                  <Brain className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">
                    Tap "Get AI Recommendations" to discover jobs matched to your profile.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Featured Jobs */}
          {!loading && featuredJobs.length > 0 && (
            <div className="space-y-2">
              <SectionHeader icon={Sparkles} title="Featured Jobs" viewAllPath="/app/jobs/all" />
              {renderJobSection(featuredJobs, "featured", 10)}
            </div>
          )}

          {/* Special Collections */}
          <div>
            <SectionHeader icon={Flame} title="Special Collections" />
            <div className="grid grid-cols-2 gap-3">
              <Card className="cursor-pointer hover:border-destructive/50 hover:shadow-md transition-all group border-destructive/20 bg-destructive/5"
                onClick={() => navigate("/app/jobs/all?sort=hot")}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 group-hover:bg-destructive/20 transition-colors">
                    <Flame className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <span className="text-sm font-medium group-hover:text-destructive transition-colors">Hot Jobs</span>
                    {hotCount > 0 && <p className="text-[10px] text-muted-foreground">{hotCount} trending</p>}
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-amber-500/50 hover:shadow-md transition-all group border-amber-500/20 bg-amber-500/5"
                onClick={() => navigate("/app/jobs/all?sort=expiring")}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium group-hover:text-amber-600 transition-colors">Expiring Soon</span>
                    {expiringCount > 0 && <p className="text-[10px] text-muted-foreground">{expiringCount} closing</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Browse by Type */}
          <div>
            <SectionHeader icon={Layers} title="Browse by Type" />
            <div className="grid grid-cols-2 gap-3">
              {JOB_COLLECTIONS.map((collection) => (
                <Card key={collection.filter} className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                  onClick={() => navigate(`/app/jobs/all?type=${collection.filter}`)}>
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
          </div>
        </section>
      )}

      {/* ===== Tab: By Company ===== */}
      {activeTab === "company" && (
        <section className="space-y-3">
          <SectionHeader icon={Building2} title={`Companies (${allCompanies.length})`} />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search companies..." value={companySearch}
                onChange={(e) => { setCompanySearch(e.target.value); setSelectedLetter(null); }}
                className="pl-8 h-9" />
            </div>
            {industries.length > 0 && (
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="w-[140px] h-9">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setSelectedLetter(null)}
              className={`h-7 w-7 rounded text-xs font-medium transition-colors ${!selectedLetter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
              All
            </button>
            {availableLetters.map((letter) => (
              <button key={letter} onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                className={`h-7 w-7 rounded text-xs font-medium transition-colors ${selectedLetter === letter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                {letter}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}><CardContent className="p-3 flex flex-col items-center gap-2">
                  <Skeleton className="h-11 w-11 rounded-full" /><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-10" />
                </CardContent></Card>
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-8 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {companySearch || selectedLetter || selectedIndustry !== "all" ? "No companies match your filters." : "No company data available yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredCompanies.slice(0, 60).map((company, index) => (
                <Card key={company.name} className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group animate-in fade-in"
                  style={{ animationDelay: `${Math.min(index, 10) * 20}ms` }}
                  onClick={() => navigate(`/app/jobs/all?company=${encodeURIComponent(company.name)}`)}>
                  <CardContent className="p-3 flex flex-col items-center gap-2">
                    <Avatar className="h-11 w-11 border-2 border-border group-hover:border-primary transition-colors">
                      {company.logo_url ? <AvatarImage src={company.logo_url} alt={company.name} className="object-cover" /> : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {company.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">{company.name}</p>
                      {company.industry && <p className="text-[9px] text-primary/70 line-clamp-1">{company.industry}</p>}
                      <p className="text-[10px] text-muted-foreground">{company.count} {company.count === 1 ? "job" : "jobs"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {filteredCompanies.length > 60 && (
            <p className="text-xs text-muted-foreground text-center">
              Showing 60 of {filteredCompanies.length} companies. Use search or filters to find specific companies.
            </p>
          )}
        </section>
      )}

      {/* ===== Tab: By Country ===== */}
      {activeTab === "country" && (
        <section className="space-y-3">
          <SectionHeader icon={Globe} title="Jobs by Country" />
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}><CardContent className="p-4 flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" /><div className="space-y-1.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-14" /></div>
                </CardContent></Card>
              ))}
            </div>
          ) : countryGroups.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-8 text-center">
                <Globe className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No location data available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {countryGroups.map((group) => (
                <Card key={group.country} className="overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-0">
                    <button className="w-full p-3 px-4 flex items-center gap-3 hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        if (group.cities.length > 0) setExpandedCountry(expandedCountry === group.country ? null : group.country);
                        else navigate(`/app/jobs/all?location=${encodeURIComponent(group.country)}`);
                      }}>
                      <span className="text-2xl">{group.flag}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{group.country}</p>
                        <p className="text-xs text-muted-foreground">{group.totalJobs.toLocaleString()} {group.totalJobs === 1 ? "job" : "jobs"}</p>
                      </div>
                      {group.cities.length > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="text-[10px]">{group.cities.length} cities</span>
                          {expandedCountry === group.country ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      )}
                    </button>
                    {expandedCountry === group.country && group.cities.length > 0 && (
                      <div className="border-t bg-muted/30 px-4 py-2 space-y-1">
                        <button className="w-full flex items-center justify-between py-1.5 px-2 rounded hover:bg-accent transition-colors text-sm font-medium text-primary"
                          onClick={() => navigate(`/app/jobs/all?location=${encodeURIComponent(group.country)}`)}>
                          All {group.country} jobs
                          <Badge variant="secondary" className="text-[10px] h-5">{group.totalJobs}</Badge>
                        </button>
                        {group.cities.slice(0, 15).map((city) => (
                          <button key={city.name} className="w-full flex items-center justify-between py-1.5 px-2 rounded hover:bg-accent transition-colors"
                            onClick={() => navigate(`/app/jobs/all?location=${encodeURIComponent(city.name)}`)}>
                            <span className="text-sm text-foreground">{city.name}</span>
                            <Badge variant="secondary" className="text-[10px] h-5">{city.count}</Badge>
                          </button>
                        ))}
                        {group.cities.length > 15 && (
                          <p className="text-[10px] text-muted-foreground text-center py-1">+{group.cities.length - 15} more cities</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      <JobPreferencesSheet open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </div>
  );
}
