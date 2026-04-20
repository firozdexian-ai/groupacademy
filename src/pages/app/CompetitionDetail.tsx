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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/**
 * Platform Logic: Championship Registry Viewport
 * High-fidelity orchestrator for competitive skill validation and reward distribution.
 * 2026 Standard: Executive Logic typography with kinetic submission sequences.
 */

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  upcoming: { label: "Scheduled", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Calendar },
  active: { label: "Live Protocol", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Zap },
  judging: { label: "In Evaluation", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Target },
  completed: { label: "Finalized", color: "bg-muted text-muted-foreground border-border", icon: CheckCircle },
  cancelled: { label: "Aborted", color: "bg-destructive/10 text-destructive border-destructive/20", icon: ShieldCheck },
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

  const isInline = !!inlineSlug;
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
      if (!competition || !talent) throw new Error("Auth Handshake Failed");
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
      toast.success("Registry Sync Successful: Entry Ingested");
      setIsSubmitDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-competition-submission"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Transmission Interrupted");
    },
  });

  if (isLoading)
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 animate-pulse">
        <Skeleton className="h-12 w-48 rounded-xl bg-muted/40" />
        <Skeleton className="h-[400px] w-full rounded-[40px] bg-muted/40" />
      </div>
    );

  if (!competition)
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center animate-in fade-in zoom-in-95">
        <div className="h-20 w-20 rounded-[32px] bg-muted/10 flex items-center justify-center mx-auto mb-8 border border-border/40 rotate-3">
          <Target className="h-10 w-10 text-muted-foreground/20" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Registry Node Missing</h2>
        <Button
          variant="outline"
          className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-3 h-4 w-4" /> Revert to Registry
        </Button>
      </div>
    );

  const status = STATUS_CONFIG[competition.status] || STATUS_CONFIG.upcoming;
  const prizes = Array.isArray(competition.prizes) ? competition.prizes : [];
  const canSubmit = competition.status === "active" && talent && !mySubmission;
  const daysLeft = competition.submission_deadline
    ? differenceInDays(new Date(competition.submission_deadline), new Date())
    : null;

  return (
    <div
      className={cn(
        "space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000",
        !isInline && "max-w-5xl mx-auto px-6 py-10 pb-40",
      )}
    >
      {/* Navigation & Identity Handshake */}
      <header className="space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="group rounded-xl px-4 h-11 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 -ml-4"
        >
          <ArrowLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Arena
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic",
                  status.color,
                )}
              >
                <status.icon className="h-3 w-3 mr-1.5 fill-current" /> {status.label}
              </Badge>
              {competition.is_featured && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">
                  <Zap className="h-3 w-3 mr-1.5 fill-current" /> Elite Tier
                </Badge>
              )}
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">
              {competition.title}
            </h1>
          </div>
          <Trophy className="h-16 w-16 text-primary/20 rotate-12 mb-2 hidden md:block" />
        </div>
      </header>

      {/* Hero Image Node */}
      {competition.featured_image && (
        <div className="aspect-[21/9] relative rounded-[40px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] bg-black border border-border/40 group">
          <img
            src={competition.featured_image}
            alt={competition.title}
            className="w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Operation Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            icon: Calendar,
            label: "Duration",
            val: `${format(new Date(competition.start_date), "MMM d")} – ${format(new Date(competition.end_date), "MMM d")}`,
          },
          {
            icon: Clock,
            label: "Deadline",
            val: format(new Date(competition.submission_deadline), "MMM d, yyyy"),
            sub:
              daysLeft !== null && daysLeft >= 0 ? `${daysLeft === 0 ? "Ends Today" : `${daysLeft}d Remaining`}` : null,
          },
          { icon: Users, label: "Capacity", val: `${competition.max_participants || "Unlimited"} Units` },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-card/30 backdrop-blur-sm border border-border/40 rounded-[28px] p-6 flex items-center gap-5 shadow-sm"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/20 shrink-0">
              <item.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 italic mb-0.5">
                {item.label}
              </p>
              <p className="text-sm font-black uppercase tracking-tight truncate">{item.val}</p>
              {item.sub && (
                <p className="text-[9px] font-bold text-amber-500 uppercase mt-1 italic tracking-widest">{item.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-12">
        <div className="space-y-12">
          {/* Detailed Narrative */}
          <section className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
              <ShieldCheck className="h-4 w-4" /> Briefing & Directives
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground font-medium leading-relaxed italic text-base">
              <p className="whitespace-pre-wrap">
                {competition.description || "Registry entry pending detailed sync."}
              </p>
            </div>
          </section>

          {/* Operational Rules */}
          {competition.rules && (
            <section className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Protocol Guidelines</h3>
              <Card className="rounded-[32px] bg-muted/20 border-2 border-dashed border-border/60">
                <CardContent className="p-8 text-sm font-medium leading-relaxed whitespace-pre-wrap italic opacity-80">
                  {competition.rules}
                </CardContent>
              </Card>
            </section>
          )}
        </div>

        {/* Tactical Aside: Prizes & Status */}
        <aside className="space-y-8 sticky top-10">
          {prizes.length > 0 && (
            <Card className="rounded-[32px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden">
              <CardHeader className="p-8 border-b border-primary/10">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                  <Gift className="h-4 w-4" /> Reward Tiering
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                {prizes.map((prize: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-black transition-transform group-hover:rotate-6">
                      {(index + 1).toString().padStart(2, "0")}
                    </div>
                    <span className="text-sm font-black uppercase tracking-tight leading-tight">
                      {typeof prize === "string" ? prize : prize.name || prize.description}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Submit Action Node */}
          {canSubmit && (
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all hidden sm:flex">
                  <Upload className="mr-3 h-5 w-5" /> Initialize Submission
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[40px] bg-background/80 backdrop-blur-2xl border-2 border-border/40 max-w-md">
                <DialogHeader className="p-4">
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                    Entry Handshake
                  </DialogTitle>
                </DialogHeader>
                <div className="p-6 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Submission URL
                    </Label>
                    <Input
                      placeholder="https://registry-link.com/..."
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      className="h-12 rounded-xl border-2 bg-background/50 font-bold"
                    />
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic text-center">
                      Portfolio, Github, or Artifact URL
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Briefing (Optional)</Label>
                    <Textarea
                      placeholder="Contextualize your artifact..."
                      value={submissionDescription}
                      onChange={(e) => setSubmissionDescription(e.target.value)}
                      rows={4}
                      className="rounded-xl bg-muted/10 border-2 italic font-medium"
                    />
                  </div>
                  <Button
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl"
                    onClick={() => submitMutation.mutate()}
                    disabled={!submissionUrl || submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <Zap className="h-4 w-4 animate-ping mr-2" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    {submitMutation.isPending ? "Syncing..." : "Finalize Handshake"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {mySubmission && (
            <Card className="rounded-[32px] border-emerald-500/20 bg-emerald-500/5 shadow-inner overflow-hidden">
              <CardHeader className="p-6 border-b border-emerald-500/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Active Entry
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 text-[8px] font-black uppercase"
                  >
                    {mySubmission.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <a
                  href={mySubmission.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline flex items-center gap-2 text-xs font-black uppercase tracking-widest italic"
                >
                  View Artifact <ExternalLink className="h-3 w-3" />
                </a>
                {mySubmission.description && (
                  <p className="text-xs text-muted-foreground/80 leading-relaxed italic">{mySubmission.description}</p>
                )}
                {mySubmission.feedback && (
                  <div className="mt-4 p-4 rounded-2xl bg-background/50 border border-emerald-500/10 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary">Registry Feedback</p>
                    <p className="text-xs font-medium italic text-foreground/70 leading-relaxed">
                      {mySubmission.feedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* Kinetic Sticky Action Node (Mobile) */}
      {canSubmit && (
        <div className="fixed bottom-16 left-0 right-0 p-6 bg-background/80 backdrop-blur-2xl border-t-2 border-border/10 sm:hidden z-30 animate-in slide-in-from-bottom-full">
          <Button
            className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20"
            onClick={() => setIsSubmitDialogOpen(true)}
          >
            <Upload className="mr-3 h-5 w-5" /> Initialize Entry
          </Button>
        </div>
      )}
    </div>
  );
}
