import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTalentProjectWorkload } from "@/domains/gigs/repo/gigsRepo";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Calendar, Coins, ShieldAlert, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface ProjectRecord {
  id: string;
  title: string;
}

interface MilestoneRecord {
  title: string;
  status: string;
  budget_credits: number;
  due_at: string | null;
}

interface ProjectMilestoneAgg {
  project: ProjectRecord;
  milestone: MilestoneRecord;
  split_pct: number;
}

/**
 * GroUp Academy: Talent Project Workload Ledger (MyProjects)
 * Hardened responsive milestone tracker.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function MyProjects() {
  const { talent } = useTalent();

  // Optimized parallel server-state fetching
  const { data: projectWorkload = [], isLoading: isRegistryLoading } = useQuery<ProjectMilestoneAgg[]>({
    queryKey: ["app-talent-project-workload", talent?.id],
    enabled: !!talent?.id,
    queryFn: async (): Promise<ProjectMilestoneAgg[]> => {
      return await getTalentProjectWorkload<ProjectMilestoneAgg>(talent!.id);
    },
  });

  return (
    <div className={cn(PAGE_SHELL, "max-w-3xl mx-auto space-y-6")}>
      <header className="space-y-1 block">
        <h1 className={PAGE_TITLE}>My Projects</h1>
        <p className={PAGE_SUBTITLE}>Milestones awarded across managed operational streams.</p>
      </header>

      {isRegistryLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : projectWorkload.length === 0 ? (
        <Card className={cn(CARD, "p-12 text-center border-dashed")}>
          <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">No project milestones currently assigned.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {projectWorkload.map((it, idx) => (
            <Link
              key={`milestone-row-${it.project.id}-${idx}`}
              to={`/app/projects/${it.project.id}`}
              className="block group"
            >
              <Card className={cn(CARD, "p-4 hover:border-primary/40 transition-colors shadow-sm")}>
                <CardContent className="p-0 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                        {it.project.title}
                      </h3>
                      <p className={cn(META_TEXT, "mt-0.5")}>{it.milestone.title}</p>
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0 text-[10px] font-bold">
                      {it.milestone.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground/80 pt-2 border-t border-border/10">
                    <span className="flex items-center gap-1.5">
                      <Coins className="h-3 w-3 text-emerald-600" /> {it.milestone.budget_credits} cr
                    </span>
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-primary" /> {it.split_pct}% Share
                    </span>
                    {it.milestone.due_at && (
                      <span className="flex items-center gap-1.5 ml-auto">
                        <Calendar className="h-3 w-3" /> Due {new Date(it.milestone.due_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
