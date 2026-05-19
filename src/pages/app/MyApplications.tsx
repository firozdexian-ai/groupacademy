import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  SearchX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PAGE_TITLE, PAGE_SUBTITLE, CARD } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface JobRecord {
  title: string;
  company_name: string;
  company_logo_url: string | null;
  ai_assessment_enabled: boolean | null;
}

interface AssessmentRecord {
  id: string;
  status: string;
}

interface ApplicationRecord {
  id: string;
  job_id: string;
  application_status: string;
  created_at: string;
  last_status_at: string | null;
  job: JobRecord | null;
  assessment: AssessmentRecord | null;
}

type BucketType = "active" | "action_needed" | "closed";

const STATUS_PILL: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  submitted: { label: "Submitted", className: "bg-primary/10 text-primary border-primary/20", icon: Clock },
  sent_to_employer: { label: "Sent", className: "bg-primary/10 text-primary border-primary/20", icon: ArrowRight },
  viewed: { label: "Viewed", className: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2 },
  shortlisted: {
    label: "Shortlisted",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: Trophy,
  },
  hired: { label: "Hired", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Trophy },
  rejected: {
    label: "Not selected",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
  },
  withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground border-border", icon: Trash2 },
};

/**
 * GroUp Academy: Candidate Application Ledger (MyApplications)
 * Hardened responsive viewer for application lifecycle tracking and assessment management.
 * Version: Launch Candidate · Phase Z1 Production Contract Sealed
 */
export default function MyApplications() {
  const navigate = useNavigate();
  const [rows, setRows] = React.useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [activeBucket, setActiveBucket] = React.useState<BucketType>("active");

  const fetchApplicationsRegistry = React.useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("job_applications")
      .select(
        `
        id, job_id, application_status, created_at, last_status_at,
        job:jobs(title, company_name, company_logo_url, ai_assessment_enabled),
        job_assessments(id, status)
      `,
      )
      .eq("talent_id", user.id)
      .order("last_status_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to synchronize application ledger.");
      return;
    }

    const normalizedRows: ApplicationRecord[] = (data || []).map((r: any) => ({
      ...r,
      job: r.job,
      assessment: r.job_assessments?.[0] || null,
    }));

    setRows(normalizedRows);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void fetchApplicationsRegistry();
  }, [fetchApplicationsRegistry]);

  const filteredApplicationNodes = React.useMemo(() => {
    const activeStatuses = ["submitted", "sent_to_employer", "viewed", "shortlisted"];
    const closedStatuses = ["rejected", "withdrawn", "hired"];

    if (activeBucket === "active") return rows.filter((r) => activeStatuses.includes(r.application_status));
    if (activeBucket === "closed") return rows.filter((r) => closedStatuses.includes(r.application_status));

    // Action Needed Logic
    return rows.filter(
      (r) =>
        activeStatuses.includes(r.application_status) &&
        r.job?.ai_assessment_enabled &&
        (!r.assessment || r.assessment.status !== "completed"),
    );
  }, [rows, activeBucket]);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-3 pb-24 space-y-4">
      <header className="space-y-1">
        <h1 className={PAGE_TITLE}>My Applications</h1>
        <p className={PAGE_SUBTITLE}>Track lifecycle status for every role submission.</p>
      </header>

      <Tabs value={activeBucket} onValueChange={(v) => setActiveBucket(v as BucketType)}>
        <TabsList className="w-full grid grid-cols-3 h-10">
          <TabsTrigger value="active" className="text-xs">
            Active
          </TabsTrigger>
          <TabsTrigger value="action_needed" className="text-xs">
            Action Needed
          </TabsTrigger>
          <TabsTrigger value="closed" className="text-xs">
            Closed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeBucket} className="mt-4 space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
          ) : filteredApplicationNodes.length === 0 ? (
            <Card className="border-dashed py-12 text-center">
              <SearchX className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium">No applications found in this category.</p>
            </Card>
          ) : (
            filteredApplicationNodes.map((app) => {
              const pill = STATUS_PILL[app.application_status] || STATUS_PILL.submitted;
              const PillIcon = pill.icon;
              const needsAssessment = app.job?.ai_assessment_enabled && app.assessment?.status !== "completed";

              return (
                <Card
                  key={app.id}
                  className={cn(CARD, "cursor-pointer hover:border-primary/40 transition-colors p-4")}
                  onClick={() => navigateHook(`/app/applications/${app.id}`)}
                >
                  <CardContent className="p-0 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 border border-border/20">
                      {app.job?.company_logo_url ? (
                        <img
                          src={app.job.company_logo_url}
                          alt="Company"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-bold text-sm truncate">{app.job?.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate italic">
                        {app.job?.company_name} •{" "}
                        {formatDistanceToNow(new Date(app.last_status_at || app.created_at), { addSuffix: true })}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className={cn("text-[9px] gap-1 px-1.5", pill.className)}>
                          <PillIcon className="h-2.5 w-2.5" /> {pill.label}
                        </Badge>
                        {needsAssessment && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] gap-1 px-1.5 bg-amber-500/10 text-amber-600 border-none"
                          >
                            <Brain className="h-2.5 w-2.5" /> Assessment Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
