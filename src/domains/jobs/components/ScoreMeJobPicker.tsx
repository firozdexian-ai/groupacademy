import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Search, Briefcase, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface JobLite {
  id: string;
  title: string;
  company_name: string | null;
  source: "saved" | "recent";
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

/**
 * GroUp Academy: Arbitration Picker Pipeline Node (ScoreMeJobPicker)
 * CTO Reference: Authoritative slide-up sheet aggregating saved and trending job roles for AI scoring vectors.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ScoreMeJobPicker({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobLite[]>([]);
  const [q, setQ] = useState("");

  // Monitor asset orchestrator visibility metrics across active event channels
  useEffect(() => {
    if (open) {
      trackEvent("score_me_job_picker_mounted");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let alive = true;

    const compileScoringOpportunities = async () => {
      setLoading(true);
      trackEvent("score_me_job_picker_data_fetch_initiated");

      try {
        const uid = await getCurrentUserId();
        const out: JobLite[] = [];
        const seen = new Set<string>();

        if (uid) {
          // Pull raw item ids cleanly from relational saved listings tables
          const { data: savedData, error: savedError } = await (supabase
            .from("saved_items") as any)
            .select("item_id")
            .eq("user_id", uid)
            .eq("item_type", "job")
            .order("created_at", { ascending: false })
            .limit(20);

          if (savedError) throw savedError;

          const savedIds = (savedData || []).map((r: any) => r.item_id).filter(Boolean);

          if (savedIds.length > 0) {
            const { data: savedJobs, error: jobsError } = await supabase
              .from("jobs")
              .select("id, title, company_name")
              .in("id", savedIds);

            if (jobsError) throw jobsError;

            (savedJobs || []).forEach((j: any) => {
              if (j?.id && !seen.has(j.id)) {
                seen.add(j.id);
                out.push({
                  id: j.id,
                  title: j.title,
                  company_name: j.company_name || null,
                  source: "saved",
                });
              }
            });
          }
        }

        // Fetch recent active positions concurrently to supplement fallback view stacks
        const { data: recentJobs, error: recentError } = await supabase
          .from("jobs")
          .select("id, title, company_name")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20);

        if (recentError) throw recentError;

        (recentJobs || []).forEach((j: any) => {
          if (j?.id && !seen.has(j.id)) {
            seen.add(j.id);
            out.push({
              id: j.id,
              title: j.title,
              company_name: j.company_name || null,
              source: "recent",
            });
          }
        });

        if (alive) {
          setJobs(out);
          trackEvent("score_me_job_picker_data_fetch_success", { compiledCount: out.length });
        }
      } catch (err: any) {
        trackError(err, {
          component: "ScoreMeJobPicker",
          action: "compile_scoring_opportunities_api",
        });
        toast.error("Ecosystem transaction timeout. Re-trigger alignment lookup.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    compileScoringOpportunities();

    return () => {
      alive = false;
    };
  }, [open]);

  // Optimize filtered lookups using memoized computational blocks cleanly
  const filtered = useMemo(() => {
    const sanitizedQuery = q.trim().toLowerCase();
    if (!sanitizedQuery) return jobs;

    return jobs.filter(
      (jobItem) =>
        jobItem?.title?.toLowerCase().includes(sanitizedQuery) ||
        (jobItem?.company_name || "").toLowerCase().includes(sanitizedQuery),
    );
  }, [jobs, q]);

  const handleSelectionPickProtocol = (id: string) => {
    if (!id) return;

    trackEvent("score_me_job_picker_item_selected", { targetJobId: id });
    onOpenChange(false);

    // Automated Efficiency: Broadcast client invalidations over query blocks cleanly
    queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

    navigate(`/app/jobs/${id}?score=1`);
    setQ("");
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          trackEvent("score_me_job_picker_dismissed");
          setQ("");
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[85vh] max-h-[85svh] h-[85vh] p-0 flex flex-col rounded-t-3xl bg-background/98 backdrop-blur-xl border-t border-border/40 select-none sm:select-text transform-gpu shadow-2xl transition-all duration-300 overflow-hidden"
        style={{ contentVisibility: "auto" }}
      >
        {/* STRUCTURAL INTERACTIVE DRAG HANDLE GRAPHEME */}
        <div className="mx-auto w-12 h-1 bg-muted/60 rounded-full mt-2.5 shrink-0 select-none" />

        {/* HUD LEVEL 1: OVERLAY PRESENTATION BRANDING HEADER */}
        <SheetHeader className="px-5 pt-3 pb-2 text-left select-none shrink-0 w-full">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4.5 w-4.5 text-primary fill-primary/10 animate-pulse shrink-0 stroke-[2.2]" />
            <SheetTitle className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wide">
              Analyze Profile Matching Alignment
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground/90 leading-normal mt-0.5 select-none">
            Select an occupational tracking target node to calculate predictive alignment scores. Processing invokes a
            ledger debit of <span className="font-bold text-primary tabular-nums">10 credits</span> per assessment run.
          </SheetDescription>
        </SheetHeader>

        {/* HUD LEVEL 2: DYNAMIC FILTER INPUT STRIP */}
        <div className="px-5 pt-2 pb-1 shrink-0 select-none w-full relative group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 stroke-[2.2]" />
          <Input
            placeholder="Search matching staged portfolio or recent role targets..."
            value={q}
            disabled={loading}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10 h-10 rounded-xl border border-border/40 bg-card/40 focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm font-medium w-full shadow-sm"
          />
        </div>

        {/* HUD LEVEL 3: SCROLLABLE MATRIX LIST WORKSPACE */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 pb-safe-bottom w-full">
          {loading ? (
            <div className="space-y-2.5 w-full select-none animate-pulse">
              <Skeleton className="h-12 w-full rounded-xl opacity-60" />
              <Skeleton className="h-12 w-full rounded-xl opacity-40" />
              <Skeleton className="h-12 w-full rounded-xl opacity-20" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 italic tracking-tight py-12 text-center select-text max-w-xs mx-auto leading-normal">
              No occupational tracking entries compiled inside selection filters right now.
            </p>
          ) : (
            filtered.map((jobItem) => {
              if (!jobItem || !jobItem.id) return null;
              const isSavedNode = jobItem.source === "saved";

              return (
                <Button
                  key={jobItem.id}
                  variant="outline"
                  type="button"
                  onClick={() => handleSelectionPickProtocol(jobItem.id)}
                  className="w-full justify-between h-auto py-3 px-3.5 border border-border/40 bg-background/40 backdrop-blur-md rounded-xl hover:border-primary/30 hover:bg-background transition-all duration-200 transform-gpu cursor-pointer flex items-center gap-4 text-left group shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {/* Identity branding brief wrapper */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-primary/15 transition-colors">
                      <Briefcase className="h-4 w-4 text-primary stroke-[2.2] transition-transform group-hover:scale-105" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs sm:text-sm font-bold text-foreground/90 tracking-tight truncate leading-none pr-1">
                        {jobItem.title}
                      </p>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 truncate tracking-tight pr-1 italic leading-none">
                        {jobItem.company_name || "Ecosystem Organization"}
                      </p>
                    </div>
                  </div>

                  {/* Operational source indicator ribbon */}
                  <div className="flex items-center gap-2 shrink-0 select-none tabular-nums text-xs">
                    {isSavedNode && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-extrabold h-4.5 px-2 bg-muted/40 text-muted-foreground/90 uppercase border-none tracking-wide rounded"
                      >
                        Staged Path
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all stroke-[2.5]" />
                  </div>
                </Button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
