import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  ChevronRight,
  Calendar,
  Building2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
  Loader2,
  PlayCircle,
  Brain,
  Trophy,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  created_at: string;
  application_status: string; // 'submitted' | 'reviewed' | 'screening' | 'interview' | 'offer' | 'rejected'
  delivery_status: string;
  ai_assessment_enabled: boolean;
  assessment_id: string | null;
  assessment_status: string | null;
  assessment_score: number | null;
}

// --- Components ---

const ApplicationTimeline = ({ status, isRejected }: { status: string; isRejected: boolean }) => {
  const steps = [
    { id: "submitted", label: "Applied" },
    { id: "screening", label: "Screening" }, // Maps to AI Assessment usually
    { id: "interview", label: "Interview" },
    { id: "offer", label: "Offer" },
  ];

  // Helper to determine step state
  const getStepState = (stepId: string, index: number) => {
    // Map current status to an index
    const statusMap: Record<string, number> = {
      submitted: 0,
      reviewed: 0,
      screening: 1,
      shortlisted: 2,
      interview: 2,
      offer: 3,
      hired: 3,
      rejected: -1, // Handled separately
    };

    const currentIndex = statusMap[status] ?? 0;

    if (isRejected) return "rejected"; // Special case could be added if needed
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="flex items-center justify-between w-full mt-4 relative">
      {/* Connector Line */}
      <div className="absolute top-2.5 left-0 w-full h-0.5 bg-muted -z-10" />

      {steps.map((step, index) => {
        const state = getStepState(status, index);
        const isCompleted = state === "completed";
        const isCurrent = state === "current";

        return (
          <div key={step.id} className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors bg-background",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                isCurrent && !isRejected && "border-primary",
                isRejected && status === step.id && "border-destructive bg-destructive text-destructive-foreground",
                state === "pending" && "border-muted-foreground/30",
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : isRejected && status === step.id ? (
                <XCircle className="w-3 h-3" />
              ) : (
                <div className={cn("w-1.5 h-1.5 rounded-full", isCurrent ? "bg-primary" : "bg-transparent")} />
              )}
            </div>
            <span className={cn("text-[10px] font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const ApplicationCard = ({
  application,
  onGenerate,
  onTake,
  onViewResult,
  isGenerating,
}: {
  application: Application;
  onGenerate: (app: Application) => void;
  onTake: (id: string) => void;
  onViewResult: (id: string) => void;
  isGenerating: boolean;
}) => {
  const navigate = useNavigate();
  const isRejected = application.application_status === "rejected";

  // Determine Assessment Button State
  const renderAssessmentAction = () => {
    if (!application.ai_assessment_enabled) return null;

    if (application.assessment_id) {
      if (application.assessment_status === "completed") {
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400"
            onClick={(e) => {
              e.stopPropagation();
              onViewResult(application.assessment_id!);
            }}
          >
            <Trophy className="h-3.5 w-3.5" />
            Score: {application.assessment_score || 0}%
          </Button>
        );
      }
      return (
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 animate-pulse"
          onClick={(e) => {
            e.stopPropagation();
            onTake(application.assessment_id!);
          }}
        >
          <PlayCircle className="h-3.5 w-3.5" />
          Take Assessment
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs gap-1.5"
        onClick={(e) => {
          e.stopPropagation();
          onGenerate(application);
        }}
        disabled={isGenerating}
      >
        {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardList className="h-3.5 w-3.5" />}
        {isGenerating ? "Generating..." : "Generate Task"}
      </Button>
    );
  };

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-all relative overflow-hidden border-border/60"
      onClick={() => navigate(`/app/jobs/${application.job_id}`)}
    >
      {isGenerating && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] z-20 flex items-center justify-center flex-col gap-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-primary animate-pulse">Preparing your assessment...</p>
        </div>
      )}

      <CardContent className="p-5">
        {/* Top Row: Job Info & Status Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm line-clamp-1">{application.job_title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {application.company_name}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {format(new Date(application.created_at), "MMM d")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge variant={isRejected ? "destructive" : "secondary"} className="capitalize">
              {application.application_status.replace("_", " ")}
            </Badge>
            {application.delivery_status === "pending" && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Sending...
              </span>
            )}
          </div>
        </div>

        {/* Middle Row: Timeline */}
        <ApplicationTimeline status={application.application_status} isRejected={isRejected} />

        {/* Bottom Row: Actions */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t">
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            View Details
          </Button>

          <div className="flex gap-2">{renderAssessmentAction()}</div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Page Component ---

export default function MyApplications() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Polling Logic: Check for updates if we have pending items
  useEffect(() => {
    if (!talent?.id) return;

    fetchApplications();

    // Poll every 5 seconds if there are pending assessments or generating
    const interval = setInterval(() => {
      const hasPending = applications.some(
        (a) =>
          a.ai_assessment_enabled &&
          (!a.assessment_id || a.assessment_status === "pending" || a.assessment_status === "generating"),
      );

      if (hasPending || generatingId) {
        fetchApplications(true); // silent refresh
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [talent?.id, applications.length, generatingId]);

  const fetchApplications = async (silent = false) => {
    if (!talent?.id) return;

    if (!silent) setLoading(true);
    try {
      const { data: appData, error: appError } = await supabase
        .from("job_applications")
        .select(
          `
          id, job_id, created_at, application_status, delivery_status,
          jobs (title, company_name, ai_assessment_enabled)
        `,
        )
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false });

      if (appError) throw appError;

      const { data: assessmentData } = await supabase
        .from("job_assessments")
        .select("id, job_id, status, ai_score")
        .eq("talent_id", talent.id);

      const assessmentMap = new Map(
        assessmentData?.map((a) => [a.job_id, { id: a.id, status: a.status, score: a.ai_score }]) || [],
      );

      const formatted =
        appData?.map((app) => {
          const assessment = assessmentMap.get(app.job_id);
          return {
            id: app.id,
            job_id: app.job_id,
            job_title: (app.jobs as any)?.title || "Unknown Job",
            company_name: (app.jobs as any)?.company_name || "Unknown Company",
            created_at: app.created_at,
            application_status: app.application_status || "submitted",
            delivery_status: app.delivery_status || "pending",
            ai_assessment_enabled: (app.jobs as any)?.ai_assessment_enabled || false,
            assessment_id: assessment?.id || null,
            assessment_status: assessment?.status || null,
            assessment_score: assessment?.score || null,
          };
        }) || [];

      setApplications(formatted);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleGenerateAssessment = async (app: Application) => {
    if (!talent?.id) return;

    setGeneratingId(app.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-assessment", {
        body: {
          jobId: app.job_id,
          talentId: talent.id,
          jobApplicationId: app.id,
        },
      });

      if (error) throw error;

      if (data?.assessmentId) {
        toast.success("Assessment generated!");
        // Immediate fetch to update UI
        fetchApplications(true);
      }
    } catch (error) {
      console.error("Error generating assessment:", error);
      toast.error("Could not generate assessment. Please try again.");
    } finally {
      setGeneratingId(null);
    }
  };

  const filterByStatus = (status: string) => {
    if (status === "all") return applications;
    return applications.filter((a) => a.application_status === status);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-muted-foreground">Track and manage your job journey</p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pb-2 -mx-4 px-4 overflow-x-auto">
          <TabsList className="w-max p-1 bg-muted/50">
            <TabsTrigger value="all" className="text-xs h-7 px-3">
              All
            </TabsTrigger>
            <TabsTrigger value="submitted" className="text-xs h-7 px-3">
              Submitted
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="text-xs h-7 px-3">
              Reviewed
            </TabsTrigger>
            <TabsTrigger value="shortlisted" className="text-xs h-7 px-3">
              Shortlisted
            </TabsTrigger>
          </TabsList>
        </div>

        {["all", "submitted", "reviewed", "shortlisted"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0 space-y-4">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
            ) : filterByStatus(tab).length === 0 ? (
              <Card className="border-dashed bg-muted/30">
                <CardContent className="py-16 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <Briefcase className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {tab === "all" ? "No applications yet" : `No ${tab} applications`}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                    {tab === "all"
                      ? "Start your career journey by applying to jobs that match your skills."
                      : `Applications will appear here once they move to the ${tab} stage.`}
                  </p>
                  {tab === "all" && <Button onClick={() => navigate("/app/jobs")}>Browse Jobs</Button>}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterByStatus(tab).map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onGenerate={handleGenerateAssessment}
                    onTake={(id) => navigate(`/app/job-assessment/${id}`)}
                    onViewResult={(id) => navigate(`/app/job-assessment/${id}/results`)}
                    isGenerating={generatingId === app.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
