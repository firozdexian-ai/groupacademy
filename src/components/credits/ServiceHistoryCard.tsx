import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Mic, DollarSign, Calendar, ArrowRight, Loader2, Zap, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Service History Card
 * CTO Reference: Authoritative activity ledger for specialized talent services.
 */

interface ServiceHistoryItem {
  id: string;
  type: "career_assessment" | "mock_interview" | "salary_analysis";
  title: string;
  date: string;
  status: string;
  score?: number;
  href: string;
}

const SERVICE_REGISTRY = {
  career_assessment: {
    icon: ClipboardCheck,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "ASSESSMENT_NODE",
  },
  mock_interview: {
    icon: Mic,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    label: "NEURAL_INTERVIEW",
  },
  salary_analysis: {
    icon: DollarSign,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    label: "FISCAL_ANALYSIS",
  },
};

export function ServiceHistoryCard() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [history, setHistory] = useState<ServiceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (talent?.id) {
      fetchTrajectoryHistory();
    } else {
      setIsLoading(false);
    }
  }, [talent?.id]);

  const fetchTrajectoryHistory = async () => {
    if (!talent?.id) return;

    try {
      // INGRESS: Parallel data fetch across specialized service tables
      const [assessments, interviews, salaryAnalyses] = await Promise.all([
        supabase
          .from("career_assessments")
          .select("id, created_at, percentage, readiness_level")
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("mock_interviews")
          .select("id, created_at, status, selection_percentage, job_title")
          .eq("talent_id", talent.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("salary_analyses")
          .select("id, created_at, status, job_title")
          .eq("talent_id", talent.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const trajectoryNodes: ServiceHistoryItem[] = [];

      assessments.data?.forEach((a) => {
        trajectoryNodes.push({
          id: a.id,
          type: "career_assessment",
          title: `SYNC: ${a.percentage}% - ${a.readiness_level}`,
          date: a.created_at,
          status: "completed",
          score: a.percentage,
          href: `/assessment-results/${a.id}`,
        });
      });

      interviews.data?.forEach((i) => {
        trajectoryNodes.push({
          id: i.id,
          type: "mock_interview",
          title: i.job_title?.toUpperCase() || "NEURAL_SIMULATION",
          date: i.created_at,
          status: i.status,
          score: i.selection_percentage || undefined,
          href: `/mock-interview/results/${i.id}`,
        });
      });

      salaryAnalyses.data?.forEach((s) => {
        trajectoryNodes.push({
          id: s.id,
          type: "salary_analysis",
          title: s.job_title?.toUpperCase() || "FISCAL_PROJECTION",
          date: s.created_at,
          status: s.status,
          href: `/salary-analysis/results/${s.id}`,
        });
      });

      // SORT: Chronological priority (most recent first)
      trajectoryNodes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(trajectoryNodes.slice(0, 3));
    } catch (error) {
      console.error("LEDGER_SYNC_FAULT:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl">
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
            Syncing_Ledger...
          </span>
        </CardContent>
      </Card>
    );

  if (history.length === 0) return null;

  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500">
      <CardHeader className="pb-4 px-6 pt-6 border-b border-border/10">
        <CardTitle className="text-sm font-black uppercase italic tracking-[0.2em] flex items-center gap-3">
          <Calendar className="h-4 w-4 text-primary" />
          Trajectory_Audit_Feed
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {history.map((item) => {
          const config = SERVICE_REGISTRY[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="group flex items-center gap-4 p-4 rounded-[22px] bg-muted/20 border-2 border-transparent hover:border-primary/20 hover:bg-muted/40 transition-all duration-300 cursor-pointer relative overflow-hidden"
              onClick={() => navigate(item.href)}
            >
              {/* ATMOSPHERIC_NODE: Subtle background glow */}
              <div
                className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity", config.bgColor)}
              />

              <div
                className={cn(
                  "p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-500",
                  config.bgColor,
                )}
              >
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[11px] font-black uppercase tracking-tight text-foreground/90 truncate leading-none">
                    {item.title}
                  </p>
                  <Zap className="h-3 w-3 text-primary opacity-40" />
                </div>
                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                  {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {item.score !== undefined && (
                  <Badge
                    variant="outline"
                    className="h-6 rounded-lg bg-background border-2 border-emerald-500/20 text-emerald-500 font-black italic text-[10px]"
                  >
                    {item.score}%_YIELD
                  </Badge>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
