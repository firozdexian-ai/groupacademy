import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useApplicationBuckets } from "@/hooks/useApplicationBuckets";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Building2,
  ArrowRight,
  CheckCircle2,
  Trophy,
  XCircle,
  Trash2,
  Clock,
  Brain,
  AlertCircle,
  SearchX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Bucket = "active" | "action_needed" | "closed";

interface Row {
  id: string;
  job_id: string;
  application_status: string;
  created_at: string;
  last_status_at: string | null;
  job: {
    title: string;
    company_name: string;
    company_logo_url: string | null;
    ai_assessment_enabled: boolean | null;
  } | null;
  assessment?: { id: string; status: string } | null;
}

const ACTIVE = ["submitted", "sent_to_employer", "viewed", "shortlisted"];
const CLOSED = ["rejected", "withdrawn", "hired"];

const STATUS_PILL: Record<string, { label: string; className: string; icon: any }> = {
  submitted: { label: "Submitted", className: "bg-primary/10 text-primary border-primary/20", icon: Clock },
  sent_to_employer: { label: "Sent", className: "bg-primary/10 text-primary border-primary/20", icon: ArrowRight },
  viewed: { label: "Viewed", className: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2 },
  shortlisted: { label: "Shortlisted", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Trophy },
  hired: { label: "Hired", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Trophy },
  rejected: { label: "Not selected", className: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground border-border", icon: Trash2 },
};

export default function MyApplications() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { data: buckets } = useApplicationBuckets();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Bucket>("active");

  const fetchRows = useCallback(async () => {
    if (!talent?.id) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("job_applications")
      .select(
        `id, job_id, application_status, created_at, last_status_at,
         job:jobs(title, company_name, company_logo_url, ai_assessment_enabled),
         job_assessments(id, status)`,
      )
      .eq("talent_id", talent.id)
      .order("last_status_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    setLoading(false);
    if (error) {
      toast.error("Couldn't load your applications.");
      return;
    }
    setRows(
      (data || []).map((r: any) => ({
        ...r,
        assessment: r.job_assessments?.[0] || null,
      })),
    );
  }, [talent?.id]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const filtered = useMemo(() => {
    if (tab === "active") return rows.filter((r) => ACTIVE.includes(r.application_status));
    if (tab === "closed") return rows.filter((r) => CLOSED.includes(r.application_status));
    // action_needed
    return rows.filter(
      (r) =>
        ACTIVE.includes(r.application_status) &&
        r.job?.ai_assessment_enabled &&
        (!r.assessment || r.assessment.status !== "completed"),
    );
  }, [rows, tab]);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-3 pb-12 space-y-3 animate-in fade-in duration-300">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">My applications</h1>
        <p className="text-xs text-muted-foreground">Track every role you've applied to.</p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Bucket)}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="active" className="gap-1.5 text-xs">
            Active
            {buckets && buckets.active > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {buckets.active}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="action_needed" className="gap-1.5 text-xs">
            Action
            {buckets && buckets.action_needed > 0 && (
              <Badge className="h-4 px-1.5 text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30">
                {buckets.action_needed}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-1.5 text-xs">
            Closed
            {buckets && buckets.closed > 0 && (
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                {buckets.closed}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-3 space-y-2">
          {loading && (
            <>
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </>
          )}
          {!loading && filtered.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-2">
                <SearchX className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-medium">
                  {tab === "active" && "No active applications."}
                  {tab === "action_needed" && "Nothing needs your attention."}
                  {tab === "closed" && "No closed applications yet."}
                </p>
                {tab === "active" && (
                  <Button variant="outline" size="sm" onClick={() => navigate("/app/jobs")}>
                    <Briefcase className="h-4 w-4 mr-2" /> Browse jobs
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {!loading &&
            filtered.map((r) => {
              const pill = STATUS_PILL[r.application_status] || STATUS_PILL.submitted;
              const PillIcon = pill.icon;
              const needsAssessment =
                r.job?.ai_assessment_enabled &&
                ACTIVE.includes(r.application_status) &&
                (!r.assessment || r.assessment.status !== "completed");
              return (
                <Card
                  key={r.id}
                  className="cursor-pointer hover:border-primary/40 transition-all"
                  onClick={() => navigate(`/app/applications/${r.id}`)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/5 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
                      {r.job?.company_logo_url ? (
                        <img src={r.job.company_logo_url} alt="" className="object-cover w-full h-full" />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{r.job?.title || "Job"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {r.job?.company_name} ·{" "}
                        {formatDistanceToNow(new Date(r.last_status_at || r.created_at), { addSuffix: true })}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className={cn("text-[10px] gap-1", pill.className)}>
                          <PillIcon className="h-2.5 w-2.5" /> {pill.label}
                        </Badge>
                        {needsAssessment && (
                          <Badge className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 border-amber-500/30">
                            <Brain className="h-2.5 w-2.5" /> Assessment due
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
