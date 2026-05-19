import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Mic, DollarSign, Palette, Award, ChevronRight, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

// --- Types ---
interface ServiceResult {
  id: string;
  type: "assessment" | "interview" | "salary" | "portfolio";
  title: string;
  date: string;
  status: string;
  score?: number;
}

// --- Memoized Components ---
const ResultCard = React.memo(({ result, onClick }: { result: ServiceResult; onClick: () => void }) => {
  const isClickable =
    result.status === "completed" ||
    result.type === "assessment" ||
    result.type === "portfolio" ||
    result.status === "High";
  const themes = {
    assessment: { icon: ClipboardCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
    interview: { icon: Mic, color: "text-purple-500", bg: "bg-purple-500/10" },
    salary: { icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    portfolio: { icon: Palette, color: "text-pink-500", bg: "bg-pink-500/10" },
  };
  const theme = themes[result.type] || { icon: Award, color: "text-slate-500", bg: "bg-slate-500/10" };
  const Icon = theme.icon;

  return (
    <Card
      className={cn(CARD, "p-4 cursor-pointer hover:border-primary/40 transition-colors", !isClickable && "opacity-60")}
      onClick={() => isClickable && onClick()}
    >
      <CardContent className="p-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", theme.bg)}>
            <Icon className={cn("h-6 w-6", theme.color)} />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase">{result.title}</h3>
            <p className={META_TEXT}>{new Date(result.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="capitalize">
            {result.status}
          </Badge>
          {result.score !== undefined && <div className="text-sm font-bold mt-1">{result.score}%</div>}
        </div>
      </CardContent>
    </Card>
  );
});

export default function MyResults() {
  const navigate = useNavigate();
  const { talent } = useTalent();

  const {
    data: results = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["talent-results", talent?.email],
    enabled: !!talent?.email,
    queryFn: async () => {
      const email = talent!.email!.toLowerCase();
      // Parallelize fetches to reduce waterfall
      const [assessments, interviews, salaries, portfolios] = await Promise.all([
        supabase.from("career_assessments").select("id, created_at, percentage, readiness_level").eq("email", email),
        supabase
          .from("mock_interviews")
          .select("id, created_at, selection_percentage, status, job_title")
          .eq("email", email),
        supabase.from("salary_analyses").select("id, created_at, status, job_title").eq("email", email),
        supabase.from("portfolio_requests").select("id, created_at, status").eq("email", email),
      ]);

      return [
        ...(assessments.data?.map((a) => ({
          id: a.id,
          type: "assessment" as const,
          title: "Career Readiness",
          date: a.created_at,
          status: a.readiness_level,
          score: a.percentage,
        })) || []),
        ...(interviews.data?.map((i) => ({
          id: i.id,
          type: "interview" as const,
          title: i.job_title || "Mock Interview",
          date: i.created_at,
          status: i.status || "pending",
          score: i.selection_percentage,
        })) || []),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

  const navigateTo = (result: ServiceResult) => {
    const routes: Record<string, string> = {
      assessment: `/assessment-results/${result.id}`,
      interview: `/mock-interview/results/${result.id}`,
      salary: `/salary-analysis/results/${result.id}`,
      portfolio: "/portfolio-status",
    };
    navigate(routes[result.type]);
  };

  return (
    <div className={cn(PAGE_SHELL, "max-w-3xl mx-auto space-y-6")}>
      <header>
        <h1 className={PAGE_TITLE}>Performance Archive</h1>
        <p className={PAGE_SUBTITLE}>Telemetry from your career assessments and mocks.</p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center border-dashed border rounded-xl">
          <AlertTriangle className="mx-auto mb-2 text-destructive" /> Failed to load results.
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <ResultCard key={r.id} result={r} onClick={() => navigateTo(r)} />
          ))}
        </div>
      )}
    </div>
  );
}
