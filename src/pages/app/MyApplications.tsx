import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Calendar,
  Building2,
  Clock,
  ClipboardList,
  Loader2,
  PlayCircle,
  Trophy,
  FileText,
  SearchX,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns"; // Changed to relative time
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  created_at: string;
  updated_at?: string; // Added field
  application_status: string;
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
    <div className="w-full mt-5 mb-2 px-1">
      <div className="relative flex justify-between items-center">
        {/* Background Line */}
        <div className="absolute top-2.5 left-0 w-full h-0.5 bg-muted -z-10" />

        {/* Progress Line */}
        <div
          className="absolute top-2.5 left-0 h-0.5 bg-primary -z-10 transition-all duration-500"
          style={{
            width: isRejected ? "0%" : `${(currentIndex / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          let circleColor = "bg-background border-muted-foreground/30 text-muted-foreground";
          if (isRejected && status === step.id) {
            circleColor = "bg-destructive border-destructive text-destructive-foreground";
          } else if (isActive) {
            circleColor = "bg-primary border-primary text-primary-foreground";
          }

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 group">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                  circleColor,
                  isCurrent && !isRejected && "ring-4 ring-primary/20 scale-110",
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full bg-current")} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors absolute top-8 w-20 text-center",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-6" /> {/* Spacer for labels */}
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

  const renderAssessmentAction = () => {
    if (!application.ai_assessment_enabled) return null;

    if (application.assessment_id) {
      if (application.assessment_status === "completed") {
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400"
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

      <CardContent className="p-5 pb-3">
        {/* Top Row: Job Info & Status Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {application.job_title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 font-medium text-foreground/80">
                  <Building2 className="h-3 w-3" /> {application.company_name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge variant={isRejected ? "destructive" : "secondary"} className="capitalize font-medium">
              {application.application_status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Middle Row: Timeline */}
        <ApplicationTimeline status={application.application_status} isRejected={isRejected} />
      </CardContent>

      <CardFooter className="px-5 py-3 bg-muted/30 flex items-center justify-between border-t text-xs">
        <div className="text-muted-foreground flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 hover:bg-background">
            <FileText className="h-3.5 w-3.5 mr-1" /> Details
          </Button>
          {renderAssessmentAction()}
        </div>
      </CardFooter>
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

  useEffect(() => {
    if (!talent?.id) return;

    fetchApplications();

    const interval = setInterval(() => {
      const hasPending = applications.some(
        (a) =>
          a.ai_assessment_enabled &&
          (!a.assessment_id || a.assessment_status === "pending" || a.assessment_status === "generating"),
      );

      if (hasPending || generatingId) {
        fetchApplications(true);
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
            updated_at: app.created_at, // Use created_at as fallback since updated_at doesn't exist
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

  const EmptyState = ({ tab }: { tab: string }) => (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="py-16 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm border">
          <SearchX className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="font-semibold text-lg mb-2">
          {tab === "all" ? "No applications yet" : `No ${tab} applications`}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          {tab === "all"
            ? "Start your career journey by applying to jobs that match your skills."
            : `Applications will appear here once they move to the ${tab} stage.`}
        </p>
        {tab === "all" && (
          <Button onClick={() => navigate("/app/jobs")} className="gap-2">
            Browse Jobs <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 min-h-screen">
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
              <EmptyState tab={tab} />
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
