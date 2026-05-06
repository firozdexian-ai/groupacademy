import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Building2,
  ArrowRight,
  FileText,
  Brain,
  CheckCircle2,
  Clock,
  XCircle,
  Trophy,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Detail {
  id: string;
  job_id: string;
  application_status: string;
  delivery_status: string | null;
  cover_letter: string | null;
  cv_url: string | null;
  ai_match_score: number | null;
  ai_match_rationale: string | null;
  withdrawn_at: string | null;
  last_status_at: string | null;
  created_at: string | null;
  job: {
    id: string;
    title: string;
    company_name: string;
    company_logo_url: string | null;
    location: string | null;
    ai_assessment_enabled: boolean | null;
  } | null;
  assessment?: { id: string; status: string } | null;
}

const STATUS_META: Record<string, { label: string; tone: "muted" | "primary" | "success" | "destructive"; icon: any }> = {
  submitted: { label: "Submitted", tone: "primary", icon: Clock },
  sent_to_employer: { label: "Sent to employer", tone: "primary", icon: ArrowRight },
  viewed: { label: "Viewed", tone: "primary", icon: CheckCircle2 },
  shortlisted: { label: "Shortlisted", tone: "success", icon: Trophy },
  hired: { label: "Hired", tone: "success", icon: Trophy },
  rejected: { label: "Not selected", tone: "destructive", icon: XCircle },
  withdrawn: { label: "Withdrawn", tone: "muted", icon: Trash2 },
};

const TIMELINE_STEPS = [
  { id: "submitted", label: "Submitted" },
  { id: "viewed", label: "Reviewed" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "hired", label: "Hired" },
];

const STATUS_INDEX: Record<string, number> = {
  submitted: 0,
  sent_to_employer: 0,
  viewed: 1,
  shortlisted: 2,
  hired: 3,
};

export default function AppApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("job_applications")
        .select(
          `id, job_id, application_status, delivery_status, cover_letter, cv_url, ai_match_score, ai_match_rationale,
           withdrawn_at, last_status_at, created_at,
           job:jobs(id, title, company_name, company_logo_url, location, ai_assessment_enabled),
           job_assessments(id, status)`,
        )
        .eq("id", id)
        .maybeSingle();
      if (!alive) return;
      if (error || !data) {
        toast.error("Couldn't load application.");
        setLoading(false);
        return;
      }
      const assessment = (data as any).job_assessments?.[0] || null;
      setDetail({ ...(data as any), assessment });
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const handleViewCV = async () => {
    if (!detail?.cv_url) return;
    if (detail.cv_url.startsWith("http")) {
      window.open(detail.cv_url, "_blank");
      return;
    }
    const { data, error } = await supabase.storage.from("talent-cvs").createSignedUrl(detail.cv_url, 60);
    if (error || !data) return toast.error("Couldn't open CV.");
    window.open(data.signedUrl, "_blank");
  };

  const handleWithdraw = async () => {
    if (!detail) return;
    setWithdrawing(true);
    const { error } = await (supabase as any)
      .from("job_applications")
      .update({ application_status: "withdrawn", withdrawn_at: new Date().toISOString() })
      .eq("id", detail.id);
    setWithdrawing(false);
    if (error) return toast.error("Couldn't withdraw.");
    toast.success("Application withdrawn");
    setDetail({ ...detail, application_status: "withdrawn", withdrawn_at: new Date().toISOString() });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!detail || !detail.job) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Application not found.</div>;
  }

  const statusMeta = STATUS_META[detail.application_status] || STATUS_META.submitted;
  const StatusIcon = statusMeta.icon;
  const isClosed = ["rejected", "withdrawn", "hired"].includes(detail.application_status);
  const stepIdx = STATUS_INDEX[detail.application_status] ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-3 pb-12 space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="h-9 px-2" onClick={() => navigate("/app/applications")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> All applications
        </Button>
        <Badge
          className={cn(
            statusMeta.tone === "primary" && "bg-primary/10 text-primary border-primary/20",
            statusMeta.tone === "success" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            statusMeta.tone === "destructive" && "bg-destructive/10 text-destructive border-destructive/20",
            statusMeta.tone === "muted" && "bg-muted text-muted-foreground border-border",
          )}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusMeta.label}
        </Badge>
      </div>

      {/* Job snapshot */}
      <Card
        className="cursor-pointer hover:border-primary/40 transition-all"
        onClick={() => navigate(`/app/jobs/${detail.job!.id}`)}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/5 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
            {detail.job.company_logo_url ? (
              <img src={detail.job.company_logo_url} alt={detail.job.company_name} className="object-cover w-full h-full" />
            ) : (
              <Building2 className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold truncate">{detail.job.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {detail.job.company_name} · {detail.job.location || "Remote"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Applied {detail.created_at ? formatDistanceToNow(new Date(detail.created_at), { addSuffix: true }) : "—"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Timeline */}
      {!isClosed && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold mb-3">Status</p>
            <div className="relative flex justify-between">
              <div className="absolute top-2 left-0 right-0 h-px bg-border" />
              <div
                className="absolute top-2 left-0 h-0.5 bg-primary transition-all"
                style={{ width: `${(stepIdx / (TIMELINE_STEPS.length - 1)) * 100}%` }}
              />
              {TIMELINE_STEPS.map((s, i) => {
                const active = i <= stepIdx;
                return (
                  <div key={s.id} className="flex flex-col items-center flex-1 relative z-10">
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2 bg-background",
                        active ? "border-primary" : "border-muted-foreground/30",
                      )}
                    >
                      {active && <div className="w-full h-full rounded-full bg-primary scale-50" />}
                    </div>
                    <span className={cn("text-[10px] mt-1.5", active ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI assessment nudge */}
      {detail.job.ai_assessment_enabled &&
        !isClosed &&
        detail.assessment &&
        detail.assessment.status !== "completed" && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-3 flex items-center gap-3">
              <Brain className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Finish your AI assessment</p>
                <p className="text-[11px] text-muted-foreground">Required to be considered.</p>
              </div>
              <Button size="sm" onClick={() => navigate(`/app/job-assessment/${detail.assessment!.id}`)}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

      {/* AI match */}
      {detail.ai_match_score != null && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">AI match · {Math.round(Number(detail.ai_match_score))}%</p>
            </div>
            {detail.ai_match_rationale && (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{detail.ai_match_rationale}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submitted package */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">What you submitted</p>
          {detail.cv_url ? (
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleViewCV}>
              <FileText className="h-4 w-4 mr-2" /> View submitted CV
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">No CV on file for this submission.</p>
          )}
          {detail.cover_letter && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Cover letter</p>
              <p className="text-xs whitespace-pre-wrap text-foreground/80 leading-relaxed bg-muted/30 rounded-lg p-3">
                {detail.cover_letter}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdraw */}
      {!isClosed && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Withdraw application
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Withdraw application?</AlertDialogTitle>
              <AlertDialogDescription>
                The employer will no longer consider your application. You can re-apply later if the role is still open.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleWithdraw} disabled={withdrawing}>
                Withdraw
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
