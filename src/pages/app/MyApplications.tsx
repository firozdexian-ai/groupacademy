import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Clock,
  ClipboardList,
  Loader2,
  Trophy,
  SearchX,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  created_at: string;
  application_status: string;
  delivery_status: string;
  ai_assessment_enabled: boolean;
  assessment_id: string | null;
  assessment_status: string | null;
  assessment_score: number | null;
}

const ApplicationTimeline = ({ status, isRejected }: { status: string; isRejected: boolean }) => {
  const steps = [
    { id: "submitted", label: "Submitted" },
    { id: "screening", label: "Reviewed" },
    { id: "interview", label: "Interview" },
    { id: "offer", label: "Offer" },
  ];

  const statusMap: Record<string, number> = {
    submitted: 0, reviewed: 1, screening: 1, shortlisted: 2,
    interview: 2, offer: 3, hired: 3, rejected: -1,
  };
  const currentIndex = statusMap[status] ?? 0;

  return (
    <div className="w-full mt-4 mb-2">
      <div className="relative flex justify-between">
        <div className="absolute top-2 left-0 w-full h-px bg-muted -z-10" />
        <div
          className="absolute top-2 left-0 h-0.5 bg-primary -z-10 transition-all duration-700"
          style={{ width: isRejected ? "0%" : `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 bg-background transition-all z-10",
                  isActive ? "border-primary" : "border-muted-foreground/30",
                  isRejected && status === step.id && "border-destructive",
                )}
              >
                {isActive && <div className="w-full h-full rounded-full bg-primary scale-50" />}
              </div>
              <span className={cn("text-[10px] font-medium mt-1.5 absolute top-5 text-center w-full", isActive ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ApplicationCard = ({ application, onGenerate, onTake, onViewResult, isGenerating }: any) => {
  const navigate = useNavigate();
  const isRejected = application.application_status === "rejected";

  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-all"
      onClick={() => navigate(`/app/jobs/${application.job_id}`)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-3 mb-2">
          <div className="flex gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{application.job_title}</h3>
              <p className="text-xs text-muted-foreground truncate">{application.company_name}</p>
            </div>
          </div>
          <Badge
            className={cn(
              "text-[10px] capitalize shrink-0",
              isRejected ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20",
            )}
            variant="outline"
          >
            {application.application_status.replace("_", " ")}
          </Badge>
        </div>
        <ApplicationTimeline status={application.application_status} isRejected={isRejected} />
      </CardContent>

      <CardFooter className="bg-muted/30 px-4 py-3 flex justify-between items-center border-t">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
        </div>

        <div className="flex gap-2">
          {application.ai_assessment_enabled &&
            (application.assessment_status === "completed" ? (
              <Button
                size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                onClick={(e) => { e.stopPropagation(); onViewResult(application.assessment_id); }}
              >
                <Trophy className="w-3 h-3 text-amber-500" /> View result · {application.assessment_score}%
              </Button>
            ) : application.assessment_id ? (
              <Button
                size="sm" className="h-8 text-xs gap-1.5"
                onClick={(e) => { e.stopPropagation(); onTake(application.assessment_id); }}
              >
                <Zap className="w-3 h-3" /> Take assessment
              </Button>
            ) : (
              <Button
                size="sm" variant="outline" className="h-8 text-xs gap-1.5" disabled={isGenerating}
                onClick={(e) => { e.stopPropagation(); onGenerate(application); }}
              >
                {isGenerating ? <Loader2 className="animate-spin w-3 h-3" /> : <ShieldCheck className="w-3 h-3 text-primary" />}
                Generate AI interview
              </Button>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
};

const STATUS_BUCKETS: Record<string, (s: string) => boolean> = {
  all: () => true,
  active: (s) => !["rejected", "hired", "offer"].includes(s),
  shortlisted: (s) => ["shortlisted", "interview"].includes(s),
  closed: (s) => ["rejected", "hired", "offer"].includes(s),
};

export default function MyApplications() {
  const { talent } = useTalent();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<keyof typeof STATUS_BUCKETS>("all");

  const applicationsRef = useRef<Application[]>([]);
  const generatingIdRef = useRef<string | null>(null);
  applicationsRef.current = applications;
  generatingIdRef.current = generatingId;

  const fetchApplications = useCallback(
    async (silent = false) => {
      if (!talent?.id) return;
      if (!silent) setLoading(true);
      try {
        const { data: appData } = await supabase
          .from("job_applications")
          .select(`id, job_id, created_at, application_status, delivery_status, jobs (title, company_name, ai_assessment_enabled)`)
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false });

        const { data: assessData } = await supabase
          .from("job_assessments")
          .select("id, job_id, status, ai_score")
          .eq("talent_id", talent.id);

        const assessMap = new Map(assessData?.map((a) => [a.job_id, a]) || []);
        const formatted = appData?.map((app: any) => {
          const ass = assessMap.get(app.job_id);
          return {
            id: app.id,
            job_id: app.job_id,
            job_title: app.jobs?.title,
            company_name: app.jobs?.company_name,
            created_at: app.created_at,
            application_status: app.application_status || "submitted",
            delivery_status: app.delivery_status || "pending",
            ai_assessment_enabled: app.jobs?.ai_assessment_enabled,
            assessment_id: ass?.id || null,
            assessment_status: ass?.status || null,
            assessment_score: ass?.ai_score || null,
          };
        });
        setApplications(formatted || []);
      } finally {
        setLoading(false);
      }
    },
    [talent?.id],
  );

  useEffect(() => {
    if (!talent?.id) return;
    fetchApplications();
    const pollInterval = setInterval(() => {
      const needsUpdate = applicationsRef.current.some(
        (a) => a.ai_assessment_enabled && (!a.assessment_id || a.assessment_status === "generating"),
      );
      if (needsUpdate || generatingIdRef.current) fetchApplications(true);
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [talent?.id, fetchApplications]);

  const filtered = useMemo(
    () => applications.filter((a) => STATUS_BUCKETS[activeTab](a.application_status)),
    [applications, activeTab],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const k of Object.keys(STATUS_BUCKETS)) c[k] = applications.filter((a) => STATUS_BUCKETS[k](a.application_status)).length;
    return c;
  }, [applications]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28 space-y-4">
      <header className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">My applications</h1>
          <p className="text-sm text-muted-foreground">Track your job applications and assessments.</p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="all" className="text-xs">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="active" className="text-xs">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="shortlisted" className="text-xs">Shortlisted ({counts.shortlisted})</TabsTrigger>
          <TabsTrigger value="closed" className="text-xs">Closed ({counts.closed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {loading ? (
            [1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
          ) : filtered.length === 0 ? (
            <Card className="py-12 text-center border-dashed">
              <CardContent className="space-y-3">
                <SearchX className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <div>
                  <h3 className="font-semibold">No applications here</h3>
                  <p className="text-sm text-muted-foreground mt-1">Apply to jobs and they'll show up here.</p>
                </div>
                <Button onClick={() => navigate("/app/jobs")} size="sm">Browse jobs</Button>
              </CardContent>
            </Card>
          ) : (
            filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                isGenerating={generatingId === app.id}
                onTake={(id: string) => navigate(`/app/job-assessment/${id}`)}
                onViewResult={(id: string) => navigate(`/app/job-assessment/${id}/results`)}
                onGenerate={async (a: Application) => {
                  setGeneratingId(a.id);
                  try {
                    await supabase.functions.invoke("generate-job-assessment", {
                      body: { jobId: a.job_id, talentId: talent!.id, jobApplicationId: a.id },
                    });
                    await fetchApplications(true);
                  } catch {
                    toast.error("Couldn't generate the assessment. Try again.");
                  } finally {
                    setGeneratingId(null);
                  }
                }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
