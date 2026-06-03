import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTalentServiceHistorySnapshot } from "@/domains/finance/repo/financeRepo";
import { useTalent } from "@/hooks/useTalent";
import { formatDistanceToNow, isValid } from "date-fns";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Mic, DollarSign, Calendar, ArrowRight, Zap } from "lucide-react";

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
    label: "Career Assessment",
  },
  mock_interview: {
    icon: Mic,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    label: "Mock Interview",
  },
  salary_analysis: {
    icon: DollarSign,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    label: "Salary Analysis",
  },
};

/**
 * GroUp Academy: Service History Card
 * Aggregates and tracks candidate completions for specialized platform career tools.
 */
export function ServiceHistoryCard() {
  const navigate = useNavigate();
  const { talent } = useTalent();

  // Queries transactional database records matching specific candidate tool runs
  const { data: rawHistoryNodes = [], isLoading } = useQuery<ServiceHistoryItem[], Error>({
    queryKey: ["talent-trajectory-history", talent?.id],
    enabled: !!talent?.id,
    staleTime: 45 * 1000, // 45-second cache consistency boundary locks remote lookups tight
    queryFn: async (): Promise<ServiceHistoryItem[]> => {
      if (!talent?.id) return [];

      const { assessments, interviews, salaryAnalyses } = await getTalentServiceHistorySnapshot(talent.id);
      const compiledBuffer: ServiceHistoryItem[] = [];

      // Safe fallback formatting preserves rows from breaking if records arrive empty
      assessments.forEach((a: any) => {
        compiledBuffer.push({
          id: String(a.id),
          type: "career_assessment",
          title: `Assessment: ${a.percentage}% - ${String(a.readiness_level || "Completed")}`,
          date: String(a.created_at),
          status: "completed",
          score: Number(a.percentage || 0),
          href: `/assessment-results/${a.id}`,
        });
      });

      interviews.forEach((i: any) => {
        compiledBuffer.push({
          id: String(i.id),
          type: "mock_interview",
          title: String(i.job_title || "Mock Interview").trim(),
          date: String(i.created_at),
          status: String(i.status),
          score: i.selection_percentage ? Number(i.selection_percentage) : undefined,
          href: `/mock-interview/results/${i.id}`,
        });
      });

      salaryAnalyses.forEach((s: any) => {
        compiledBuffer.push({
          id: String(s.id),
          type: "salary_analysis",
          title: String(s.job_title || "Salary Analysis").trim(),
          date: String(s.created_at),
          status: String(s.status),
          href: `/salary-analysis/results/${s.id}`,
        });
      });

      return compiledBuffer;
    },
  });

  // Sort and filter top results cleanly to prevent layout shifting glitches
  const optimizedHistoryList = useMemo(() => {
    if (!rawHistoryNodes || !Array.isArray(rawHistoryNodes)) return [];

    return [...rawHistoryNodes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
      .map((node) => {
        const rawDateObj = new Date(node.date);
        let humanizedTimeDistance = "Just now";

        if (isValid(rawDateObj)) {
          try {
            humanizedTimeDistance = formatDistanceToNow(rawDateObj, { addSuffix: true });
          } catch {
            // Contextual guard isolates dynamic runtime string rendering flaws
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
      <Card className="rounded-[32px] border border-border/40 bg-card/30 backdrop-blur-xl select-none">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-40 bg-muted/20 rounded-md mb-2" />
          {[1, 2, 3].map((idx) => (
            <Skeleton key={`ledger-skeleton-${idx}`} className="h-16 w-full bg-muted/10 rounded-[22px] border border-border/10" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (optimizedHistoryList.length === 0) return null;

  return (
    <Card className="rounded-[32px] border border-border/40 bg-card/30 backdrop-blur-xl shadow-sm overflow-hidden text-left select-none animate-in fade-in duration-300">
      <CardHeader className="pb-4 px-6 pt-6 border-b border-border/10 bg-muted/5">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-3 text-foreground">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          Activity History
        </CardTitle>
      </CardHeader>

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
              className="group flex items-center gap-4 p-4 rounded-[22px] bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-muted/40 transition-all duration-200 cursor-pointer relative overflow-hidden outline-none focus:border-primary/20 focus:bg-muted/30"
            >
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-200 pointer-events-none",
                  config.bgColor,
                )}
              />

              <div
                className={cn(
                  "p-3 rounded-xl shadow-sm transition-transform duration-300 shrink-0",
                  config.bgColor,
                )}
              >
                <TargetRowIcon className={cn("h-5 w-5 shrink-0", config.color)} />
              </div>

              {/* SERVICE ITEM CONTENT DETAIL CORES */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground/90 truncate leading-none">
                    {item.title}
                  </p>
                  <Zap className="h-3 w-3 text-primary opacity-40 shrink-0 animate-pulse" />
                </div>
                <p className="text-[11px] font-medium text-muted-foreground/60 tracking-normal leading-none">
                  {item.humanizedTimeDistance}
                </p>
              </div>

              {/* PERFORMANCE ACTION OUTCOME INDICATOR CHIPS */}
              <div className="flex items-center gap-3 shrink-0">
                {item.score !== undefined && (
                  <Badge
                    variant="outline"
                    className="h-6 rounded-lg bg-background border border-emerald-500/20 text-emerald-600 font-semibold text-[11px] tracking-normal shrink-0"
                  >
                    Score: {item.score}%
                  </Badge>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-transform duration-200 shrink-0" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}