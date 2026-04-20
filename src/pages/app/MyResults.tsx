import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  Mic,
  DollarSign,
  Palette,
  ChevronRight,
  Award,
  Calendar,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Performance Archive (Neural Analytics Node)
 * High-fidelity orchestrator for cross-service result telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced feedback loops.
 */

interface ServiceResult {
  id: string;
  type: "assessment" | "interview" | "salary" | "portfolio";
  title: string;
  date: string;
  status: string;
  score?: number;
}

export default function MyResults() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (talent?.email) {
      fetchResults();
    }
  }, [talent?.email]);

  async function fetchResults() {
    if (!talent?.email) return;
    setLoading(true);
    try {
      const emailLower = talent.email.toLowerCase().trim();

      const [assessments, interviews, salaries, portfolios] = await Promise.all([
        supabase
          .from("career_assessments")
          .select("id, created_at, percentage, readiness_level")
          .eq("email", emailLower)
          .order("created_at", { ascending: false }),
        supabase
          .from("mock_interviews")
          .select("id, created_at, selection_percentage, status, job_title")
          .eq("email", emailLower)
          .order("created_at", { ascending: false }),
        supabase
          .from("salary_analyses")
          .select("id, created_at, status, job_title")
          .eq("email", emailLower)
          .order("created_at", { ascending: false }),
        supabase
          .from("portfolio_requests")
          .select("id, created_at, status")
          .eq("email", emailLower)
          .order("created_at", { ascending: false }),
      ]);

      const allResults: ServiceResult[] = [];

      assessments.data?.forEach((a) =>
        allResults.push({
          id: a.id,
          type: "assessment",
          title: "Career Readiness",
          date: a.created_at,
          status: a.readiness_level,
          score: a.percentage,
        }),
      );
      interviews.data?.forEach((i) =>
        allResults.push({
          id: i.id,
          type: "interview",
          title: i.job_title || "Mock Interview",
          date: i.created_at,
          status: i.status || "pending",
          score: i.selection_percentage,
        }),
      );
      salaries.data?.forEach((s) =>
        allResults.push({
          id: s.id,
          type: "salary",
          title: s.job_title || "Salary Analysis",
          date: s.created_at,
          status: s.status || "pending",
        }),
      );
      portfolios.data?.forEach((p) =>
        allResults.push({
          id: p.id,
          type: "portfolio",
          title: "Digital Portfolio",
          date: p.created_at,
          status: p.status,
        }),
      );

      allResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setResults(allResults);
    } catch (error) {
      console.error("Telemetry Registry Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTheme = (type: string) => {
    switch (type) {
      case "assessment":
        return { icon: ClipboardCheck, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "interview":
        return { icon: Mic, color: "text-purple-500", bg: "bg-purple-500/10" };
      case "salary":
        return { icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case "portfolio":
        return { icon: Palette, color: "text-pink-500", bg: "bg-pink-500/10" };
      default:
        return { icon: Award, color: "text-slate-500", bg: "bg-slate-500/10" };
    }
  };

  const handleResultClick = (result: ServiceResult) => {
    const routes: Record<string, string> = {
      assessment: `/assessment-results/${result.id}`,
      interview: `/mock-interview/results/${result.id}`,
      salary: `/salary-analysis/results/${result.id}`,
      portfolio: "/portfolio-status",
    };
    navigate(routes[result.type]);
  };

  const ResultCard = ({ result }: { result: ServiceResult }) => {
    const theme = getTheme(result.type);
    const dateObj = new Date(result.date);
    const isClickable =
      result.status === "completed" ||
      result.type === "assessment" ||
      result.type === "portfolio" ||
      result.status === "High";

    const scoreColor =
      result.score && result.score >= 80
        ? "text-emerald-500"
        : result.score && result.score >= 50
          ? "text-amber-500"
          : "text-rose-500";

    return (
      <Card
        className={cn(
          "group transition-all duration-500 border-2 border-border/40 rounded-[32px] overflow-hidden",
          isClickable
            ? "cursor-pointer hover:border-primary/40 bg-card/30 backdrop-blur-md shadow-lg hover:shadow-primary/5"
            : "opacity-50 bg-muted/20 grayscale",
        )}
        onClick={() => isClickable && handleResultClick(result)}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0">
              <div
                className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 shadow-inner shrink-0",
                  theme.bg,
                )}
              >
                <theme.icon className={cn("h-7 w-7", theme.color)} />
              </div>
              <div className="min-w-0 space-y-1">
                <h3 className="font-black text-base uppercase tracking-tighter italic leading-none group-hover:text-primary transition-colors truncate">
                  {result.title}
                </h3>
                <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] italic">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{isValid(dateObj) ? format(dateObj, "MMM d, yyyy") : "Registry Sync Pending"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              {result.score !== undefined && (
                <div className="text-right hidden md:block space-y-1">
                  <p className={cn("text-3xl font-black italic tracking-tighter leading-none", scoreColor)}>
                    {result.score}%
                  </p>
                  <p className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-[0.3em] italic">
                    Match Logic
                  </p>
                </div>
              )}
              <div className="flex flex-col items-end gap-2">
                <Badge
                  className={cn(
                    "border-none text-[9px] font-black uppercase tracking-widest px-4 h-7 rounded-lg shadow-sm",
                    result.status === "completed" || result.status === "High"
                      ? "bg-emerald-500 text-white"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {result.status.replace("_", " ")}
                </Badge>
                {isClickable && (
                  <span className="text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                    Access Node
                  </span>
                )}
              </div>
              {isClickable && (
                <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-white">
                  <ChevronRight className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Immersive Executive Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-[24px] bg-primary/10 flex items-center justify-center border-2 border-primary/20 rotate-3 shadow-xl">
              <Target className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-[0.85]">
              Performance Archive
            </h1>
          </div>
          <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.4em] italic ml-1 relative">
            Neural Intelligence Ledger v2.6.4{" "}
            <span className="inline-block w-12 h-[1px] bg-primary/20 absolute -right-14 top-1/2" />
          </p>
        </div>

        <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 flex items-center gap-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Active Registry</p>
            <p className="text-xs font-black uppercase text-primary tracking-tighter">
              {results.length} Artifacts Sync'd
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1.5 h-16 bg-muted/30 backdrop-blur-md rounded-[32px] border border-border/40 max-w-2xl mx-auto">
          {["all", "assessment", "interview", "salary"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-[24px] font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all"
            >
              {tab === "all" ? "Global" : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {["all", "assessment", "interview", "salary"].map((tab) => (
          <TabsContent
            key={tab}
            value={tab}
            className="mt-12 space-y-6 outline-none animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[32px] bg-muted/40" />)
            ) : results.filter((r) => tab === "all" || r.type === tab).length === 0 ? (
              <Card className="rounded-[48px] border-2 border-dashed border-border/40 bg-muted/5 py-32 text-center">
                <CardContent className="space-y-8">
                  <div className="h-24 w-24 rounded-[40px] bg-muted/10 flex items-center justify-center rotate-6 border-2 border-dashed border-border/60 mx-auto">
                    <Award className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Ledger Empty</h3>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed">
                      No tactical artifacts match this query sequence. Complete a service to initialize telemetry.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate("/app/services")}
                    className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20"
                  >
                    Initialize Service Protocol
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {results
                  .filter((r) => tab === "all" || r.type === tab)
                  .map((result) => (
                    <ResultCard key={`${result.type}-${result.id}`} result={result} />
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Terminal Footer Metadata */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Archive Registry: Verified Synchronization Active
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest italic">
            Node: Global Results v2.6
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
