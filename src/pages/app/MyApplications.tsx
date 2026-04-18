import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Building2, Clock, ClipboardList, Loader2, PlayCircle, Trophy, SearchX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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
    { id: "submitted", label: "Applied" },
    { id: "screening", label: "Screening" },
    { id: "interview", label: "Interview" },
    { id: "offer", label: "Offer" },
  ];

  const statusMap: Record<string, number> = {
    submitted: 0,
    reviewed: 0,
    screening: 1,
    shortlisted: 2,
    interview: 2,
    offer: 3,
    hired: 3,
    rejected: -1,
  };

  const currentIndex = statusMap[status] ?? 0;

  return (
    <div className="w-full mt-6 mb-8">
      <div className="relative flex justify-between">
        <div className="absolute top-3 left-0 w-full h-0.5 bg-muted -z-10" />
        <div
          className="absolute top-3 left-0 h-0.5 bg-primary -z-10 transition-all duration-500"
          style={{ width: isRejected ? "0%" : `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center border-2 bg-background transition-all z-10",
                  isActive ? "border-primary text-primary" : "border-muted text-muted-foreground",
                  isCurrent && !isRejected && "ring-4 ring-primary/20 scale-110",
                  isRejected && status === step.id && "border-destructive text-destructive",
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full bg-current")} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium mt-2 absolute top-6 text-center w-full max-w-[60px] line-clamp-1",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
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
      className="group cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
      onClick={() => navigate(`/app/jobs/${application.job_id}`)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm line-clamp-1">{application.job_title}</h3>
              <p className="text-xs text-muted-foreground">{application.company_name}</p>
            </div>
          </div>
          <Badge variant={isRejected ? "destructive" : "secondary"}>
            {application.application_status.replace("_", " ")}
          </Badge>
        </div>
        <ApplicationTimeline status={application.application_status} isRejected={isRejected} />
      </CardContent>
      <CardFooter className="bg-muted/30 py-3 flex justify-between items-center border-t">
        <span className="text-[10px] text-muted-foreground">
          Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
        </span>
        <div className="flex gap-2">
          {application.ai_assessment_enabled &&
            (application.assessment_status === "completed" ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewResult(application.assessment_id);
                }}
              >
                <Trophy className="w-3 h-3 mr-1" /> Score: {application.assessment_score}%
              </Button>
            ) : application.assessment_id ? (
              <Button
                size="sm"
                className="h-7 text-xs bg-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onTake(application.assessment_id);
                }}
              >
                <PlayCircle className="w-3 h-3 mr-1" /> Take AI Assessment
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={isGenerating}
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerate(application);
                }}
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin w-3 h-3" />
                ) : (
                  <ClipboardList className="w-3 h-3 mr-1" />
                )}
                Generate Interview
              </Button>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default function MyApplications() {
  const { talent } = useTalent();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // CTO Audit Fix: Refs to prevent interval recreation and closure staleness
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
          .select(
            `id, job_id, created_at, application_status, delivery_status, jobs (title, company_name, ai_assessment_enabled)`,
          )
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false });
        const { data: assessData } = await supabase
          .from("job_assessments")
          .select("id, job_id, status, ai_score")
          .eq("talent_id", talent.id);

        const assessMap = new Map(assessData?.map((a) => [a.job_id, a]) || []);
        const formatted = appData?.map((app) => {
          const ass = assessMap.get(app.job_id);
          return {
            id: app.id,
            job_id: app.job_id,
            job_title: (app.jobs as any)?.title,
            company_name: (app.jobs as any)?.company_name,
            created_at: app.created_at,
            application_status: app.application_status || "submitted",
            delivery_status: app.delivery_status || "pending",
            ai_assessment_enabled: (app.jobs as any)?.ai_assessment_enabled,
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
      // Check ref directly to avoid effect dependency re-runs
      const needsUpdate = applicationsRef.current.some(
        (a) => a.ai_assessment_enabled && (!a.assessment_id || a.assessment_status === "generating"),
      );
      if (needsUpdate || generatingIdRef.current) {
        fetchApplications(true);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [talent?.id, fetchApplications]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 min-h-screen space-y-6">
      <header>
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-sm text-muted-foreground">Track your progress and complete AI interviews.</p>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          <TabsTrigger value="submitted" className="text-xs">
            Applied
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="text-xs">
            Reviewed
          </TabsTrigger>
          <TabsTrigger value="shortlisted" className="text-xs">
            Shortlisted
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="pt-4 space-y-4">
          {loading ? (
            [1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
          ) : applications.length === 0 ? (
            <div className="text-center py-20">
              <SearchX className="mx-auto mb-4 opacity-20" />
              <p>No applications found.</p>
            </div>
          ) : (
            applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                isGenerating={generatingId === app.id}
                onTake={(id: string) => navigate(`/app/job-assessment/${id}`)}
                onViewResult={(id: string) => navigate(`/app/job-assessment/${id}/results`)}
                onGenerate={async (a: Application) => {
                  setGeneratingId(a.id);
                  await supabase.functions.invoke("generate-job-assessment", {
                    body: { jobId: a.job_id, talentId: talent.id, jobApplicationId: a.id },
                  });
                  await fetchApplications(true);
                  setGeneratingId(null);
                }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
