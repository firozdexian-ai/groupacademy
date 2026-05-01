import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/contexts/TalentContext";
import {
  Trophy,
  Calendar,
  Users,
  ArrowLeft,
  Clock,
  Gift,
  CheckCircle,
  Upload,
  ExternalLink,
  Zap,
  Target,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL, PAGE_TITLE, SECTION_TITLE, META_TEXT, CARD } from "@/lib/uiTokens";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  upcoming: { label: "Upcoming", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Calendar },
  active: { label: "Live", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Zap },
  judging: { label: "Judging", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Target },
  completed: { label: "Completed", color: "bg-muted text-muted-foreground border-border", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20", icon: ShieldCheck },
};

interface CompetitionDetailProps {
  inlineSlug?: string;
  onBack?: () => void;
}

export default function CompetitionDetail({ inlineSlug, onBack }: CompetitionDetailProps) {
  const params = useParams();
  const slug = inlineSlug || params.slug;
  const navigate = useNavigate();
  const { talent } = useTalent();
  const queryClient = useQueryClient();
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionDescription, setSubmissionDescription] = useState("");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const handleBack = onBack || (() => navigate("/app/learning/competitions"));

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: mySubmission } = useQuery({
    queryKey: ["my-competition-submission", competition?.id, talent?.id],
    queryFn: async () => {
      if (!competition?.id || !talent?.id) return null;
      const { data, error } = await supabase
        .from("competition_submissions")
        .select("*")
        .eq("competition_id", competition.id)
        .eq("talent_id", talent.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!competition?.id && !!talent?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!competition || !talent) throw new Error("Sign in required");
      const { error } = await supabase.from("competition_submissions").upsert({
        competition_id: competition.id,
        talent_id: talent.id,
        submission_url: submissionUrl,
        description: submissionDescription,
        status: "submitted",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry submitted");
      setIsSubmitDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-competition-submission"] });
    },
    onError: (error: Error) => toast.error(error.message || "Submission failed"),
  });

  if (isLoading)
    return (
      <div className={PAGE_SHELL}>
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );

  if (!competition)
    return (
      <div className={PAGE_SHELL}>
        <EmptyState
          icon={Target}
          title="Competition not found"
          action={{ label: "Back to competitions", onClick: handleBack }}
        />
      </div>
    );

  const status = STATUS_CONFIG[competition.status] || STATUS_CONFIG.upcoming;
  const prizes = Array.isArray(competition.prizes) ? competition.prizes : [];
  const canSubmit = competition.status === "active" && talent && !mySubmission;
  const daysLeft = competition.submission_deadline
    ? differenceInDays(new Date(competition.submission_deadline), new Date())
    : null;

  return (
    <div className={PAGE_SHELL}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className={META_TEXT}>Back</span>
      </div>

      {/* Hero image */}
      {competition.featured_image && (
        <div className="aspect-[16/9] relative rounded-2xl overflow-hidden bg-muted border border-border/40">
          <img src={competition.featured_image} alt={competition.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] h-5", status.color)}>
            <status.icon className="h-3 w-3 mr-1" /> {status.label}
          </Badge>
          {competition.is_featured && (
            <Badge variant="secondary" className="text-[10px] h-5">
              <Trophy className="h-3 w-3 mr-1" /> Featured
            </Badge>
          )}
        </div>
        <h1 className={PAGE_TITLE}>{competition.title}</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: Calendar,
            label: "Duration",
            val: `${format(new Date(competition.start_date), "MMM d")} – ${format(new Date(competition.end_date), "MMM d")}`,
          },
          {
            icon: Clock,
            label: "Deadline",
            val: format(new Date(competition.submission_deadline), "MMM d"),
            sub: daysLeft !== null && daysLeft >= 0 ? (daysLeft === 0 ? "Today" : `${daysLeft}d left`) : null,
          },
          { icon: Users, label: "Slots", val: competition.max_participants ? String(competition.max_participants) : "∞" },
        ].map((item, idx) => (
          <div key={idx} className="rounded-xl border border-border/40 p-2.5 bg-muted/20">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <item.icon className="h-3 w-3" />
              {item.label}
            </div>
            <p className="text-sm font-semibold mt-1 leading-tight truncate">{item.val}</p>
            {item.sub && <p className="text-[10px] text-amber-600 mt-0.5">{item.sub}</p>}
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h3 className={SECTION_TITLE}>About</h3>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {competition.description || "No description provided yet."}
        </p>
      </div>

      {/* Rules */}
      {competition.rules && (
        <div className="space-y-2">
          <h3 className={SECTION_TITLE}>Rules</h3>
          <Card className={CARD}>
            <CardContent className="p-3">
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{competition.rules}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prizes */}
      {prizes.length > 0 && (
        <div className="space-y-2">
          <h3 className={`${SECTION_TITLE} flex items-center gap-1.5`}>
            <Gift className="h-4 w-4 text-primary" /> Prizes
          </h3>
          <Card className={`${CARD} bg-primary/5 border-primary/20`}>
            <CardContent className="p-3 space-y-2">
              {prizes.map((prize: any, index: number) => (
                <div key={index} className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium leading-tight">
                    {typeof prize === "string" ? prize : prize.name || prize.description}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* My submission */}
      {mySubmission && (
        <Card className={`${CARD} border-emerald-500/30 bg-emerald-500/5`}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-600" /> Your entry
              </span>
              <Badge variant="outline" className="text-[10px] h-5">
                {mySubmission.status}
              </Badge>
            </div>
            <a
              href={mySubmission.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline flex items-center gap-1 text-xs"
            >
              View submission <ExternalLink className="h-3 w-3" />
            </a>
            {mySubmission.feedback && (
              <div className="rounded-xl bg-background/50 border border-border/40 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-primary font-semibold mb-1">Feedback</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{mySubmission.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit dialog */}
      {canSubmit && (
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogTrigger asChild>
            <div
              className="fixed bottom-16 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t border-border/40 z-30"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
              <div className="max-w-2xl mx-auto">
                <Button className="w-full h-11 rounded-xl text-sm">
                  <Upload className="mr-2 h-4 w-4" /> Submit entry
                </Button>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Submit your entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Submission URL</Label>
                <Input
                  placeholder="https://..."
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  className="h-10 rounded-xl text-sm"
                />
                <p className={META_TEXT}>Portfolio, GitHub, or any public link.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description (optional)</Label>
                <Textarea
                  placeholder="Brief context about your work..."
                  value={submissionDescription}
                  onChange={(e) => setSubmissionDescription(e.target.value)}
                  rows={4}
                  className="rounded-xl text-sm"
                />
              </div>
              <Button
                className="w-full h-11 rounded-xl text-sm"
                onClick={() => submitMutation.mutate()}
                disabled={!submissionUrl || submitMutation.isPending}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
