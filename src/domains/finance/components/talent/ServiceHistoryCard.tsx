import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { formatDistanceToNow, isValid } from "date-fns";
import { cn } from "@/lib/utils";

// UI Primitive Matrix Registries
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Mic, DollarSign, Calendar, ArrowRight, Loader2, Zap, ShieldCheck } from "lucide-react";

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

/**
 * GroUp Academy: Trajectory Activity Ledger Feed (V5.6.0)
 * CTO Reference: Authoritative overview component tracking candidate utility tool completions.
 * Architecture: Handled via memoized TanStack lookup nodes blocking row time-drift compilation thrashing.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function ServiceHistoryCard() {
  const navigate = useNavigate();
  const { talent } = useTalent();

  // --- SENSOR: PIPELINE_TRAJECTORY_MULTI_TABLE_QUERY ---
  const { data: rawHistoryNodes = [], isLoading } = useQuery<ServiceHistoryItem[], Error>({
    queryKey: ["talent-trajectory-history", talent?.id],
    enabled: !!talent?.id,
    staleTime: 45 * 1000, // 45-second aggregate caching window locks remote postgrest hits tight
    queryFn: async (): Promise<ServiceHistoryItem[]> => {
      if (!talent?.id) return [];

      // HUD: ATOMIC_PARALLEL_LEDGER_INGRESS_FETCH
      const [assessmentsRes, interviewsRes, salaryAnalysesRes] = await Promise.all([
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

      const compiledBuffer: ServiceHistoryItem[] = [];

      // Safe hydration mapping routines seal data logs defensively
      assessmentsRes.data?.forEach((a) => {
        compiledBuffer.push({
          id: String(a.id),
          type: "career_assessment",
          title: `SYNC: ${a.percentage}% - ${String(a.readiness_level).toUpperCase()}`,
          date: String(a.created_at),
          status: "completed",
          score: Number(a.percentage || 0),
          href: `/assessment-results/${a.id}`,
        });
      });

      interviewsRes.data?.forEach((i) => {
        compiledBuffer.push({
          id: String(i.id),
          type: "mock_interview",
          title: String(i.job_title || "NEURAL_SIMULATION")
            .toUpperCase()
            .trim(),
          date: String(i.created_at),
          status: String(i.status),
          score: i.selection_percentage ? Number(i.selection_percentage) : undefined,
          href: `/mock-interview/results/${i.id}`,
        });
      });

      salaryAnalysesRes.data?.forEach((s) => {
        compiledBuffer.push({
          id: String(s.id),
          type: "salary_analysis",
          title: String(s.job_title || "FISCAL_PROJECTION")
            .toUpperCase()
            .trim(),
          date: String(s.created_at),
          status: String(s.status),
          href: `/salary-analysis/results/${s.id}`,
        });
      });

      return compiledBuffer;
    },
  });

  // --- PHASE: TOTAL_LEDGER_NORMALIZATION_MATRIX ---
  // Architecture Fix: Pre-parse relative distance times completely outside layout returns to prevent row heap leaks
  const optimizedHistoryList = useMemo(() => {
    if (!rawHistoryNodes || !Array.isArray(rawHistoryNodes)) return [];

    return [...rawHistoryNodes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
      .map((node) => {
        const rawDateObj = new Date(node.date);
        let humanizedTimeDistance = "ACTIVE_NODE";

        if (isValid(rawDateObj)) {
          try {
            humanizedTimeDistance = formatDistanceToNow(rawDateObj, { addSuffix: true });
          } catch {
            // Guard captures anomalies cleanly during text rendering blocks
          }
        }

        return {
          ...node,
          humanizedTimeDistance,
        };
      });
  }, [rawHistoryNodes]);

  if (isLoading) {
    return (
      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl select-none">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-40 bg-muted/20 rounded-md mb-2" />
          {[1, 2, 3].map((idx) => (
            <Skeleton key={`ledger-skeleton-${idx}`} className="h-16 w-full bg-muted/10 rounded-[22px] border" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Defensively return null or an implicit trace element if records evaluate completely unassigned
  if (optimizedHistoryList.length === 0) return null;

  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden text-left select-none animate-in fade-in duration-500">
      {/* HUD: SECTION_HEADER */}
      <CardHeader className="pb-4 px-6 pt-6 border-b border-border/10 bg-muted/5">
        <CardTitle className="text-sm font-black uppercase italic tracking-[0.2em] flex items-center gap-3 text-foreground">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          Trajectory_Audit_Feed
        </CardTitle>
      </CardHeader>

      {/* VIEWPORT: CHRONOLOGICAL_ROW_MAP */}
      <CardContent className="p-4 space-y-3">
        {optimizedHistoryList.map((item) => {
          const config = SERVICE_REGISTRY[item.type] || SERVICE_REGISTRY.career_assessment;
          const TargetRowIcon = config.icon;

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(item.href)}
              onKeyDown={(e) => e.key === "Enter" && navigate(item.href)}
              className="group flex items-center gap-4 p-4 rounded-[22px] bg-muted/20 border-2 border-transparent hover:border-primary/20 hover:bg-muted/40 transition-all duration-300 cursor-pointer relative overflow-hidden outline-none focus:border-primary/20 focus:bg-muted/30"
            >
              {/* ACCENT_ATMOSPHERIC_GLOW: Contextual backdrop indicator */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none",
                  config.bgColor,
                )}
              />

              <div
                className={cn(
                  "p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-500 shrink-0",
                  config.bgColor,
                )}
              >
                <TargetRowIcon className={cn("h-5 w-5 shrink-0", config.color)} />
              </div>

              {/* DATA_FIELDS: DESCRIPTIVE TEXT BLOCKS */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[11px] font-black uppercase tracking-tight text-foreground/90 truncate leading-none font-mono">
                    {item.title}
                  </p>
                  <Zap className="h-3 w-3 text-primary opacity-40 shrink-0 animate-pulse" />
                </div>
                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic font-mono leading-none">
                  {item.humanizedTimeDistance}
                </p>
              </div>

              {/* OUTCOMES: BADGES AND CALLS TO ACTION */}
              <div className="flex items-center gap-3 shrink-0">
                {item.score !== undefined && (
                  <Badge
                    variant="outline"
                    className="h-6 rounded-lg bg-background border-2 border-emerald-500/20 text-emerald-500 font-black italic text-[10px] tracking-wide shrink-0 font-mono"
                  >
                    {item.score}%_YIELD
                  </Badge>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500 ease-out shrink-0" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
