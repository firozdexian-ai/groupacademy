import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETPLACE_SCHOOL_MAP } from "@/lib/constants/marketplaceCategories";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Coins,
  Send,
  Users,
  Loader2,
  CheckCircle2,
  Star,
  ShieldCheck,
  Zap,
  Info,
  Target,
  FileSearch,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BidCoachDialog } from "@/components/gigs/BidCoachDialog";
import { RecommendedBiddersPanel } from "@/components/gigs/RecommendedBiddersPanel";
import { Sparkles } from "lucide-react";

/**
 * Platform Logic: Mission List & Proposal Connection
 * High-fidelity orchestrator for project interrogation and contractual bidding.
 * 2026 Standard: Executive Logic geometry with reinforced reputation guards.
 */

export default function MarketplaceGigDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { talent } = useTalent();

  const [bidAmount, setBidAmount] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [coachOpen, setCoachOpen] = useState(false);

  const { data: gig, isLoading } = useQuery({
    queryKey: ["marketplace-gig", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketplace_gigs").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: existingBid } = useQuery({
    queryKey: ["my-marketplace-bid", id],
    queryFn: async () => {
      if (!talent?.id) return null;
      const { data } = await supabase
        .from("marketplace_bids")
        .select("*")
        .eq("gig_id", id)
        .eq("talent_id", talent.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!talent?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["marketplace-gig-reviews", id],
    queryFn: async () => {
      const { data: contracts } = await supabase.from("marketplace_contracts").select("id").eq("gig_id", id!);
      if (!contracts?.length) return [];
      const { data } = await supabase
        .from("marketplace_reviews")
        .select("*")
        .in(
          "contract_id",
          contracts.map((c) => c.id),
        )
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const submitProposal = useMutation({
    mutationFn: async () => {
      if (!talent?.id || !id) throw new Error("Sign in required");
      const { error } = await supabase.from("marketplace_bids").insert({
        gig_id: id,
        talent_id: talent.id,
        bid_amount: gig?.pricing_type === "fixed" ? gig.budget_amount : parseInt(bidAmount) || 0,
        cover_letter: coverLetter,
        estimated_days: parseInt(estimatedDays) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proposal sent.");
      queryClient.invalidateQueries({ queryKey: ["my-marketplace-bid", id] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-gig", id] });
    },
  });

  if (isLoading)
    return (
      <div className="max-w-6xl mx-auto p-12 space-y-10 animate-pulse">
        <Skeleton className="h-10 w-48 rounded-xl bg-muted/40" />
        <div className="grid lg:grid-cols-[1fr,380px] gap-10">
          <Skeleton className="h-[600px] rounded-[40px] bg-muted/40" />
          <Skeleton className="h-[400px] rounded-[40px] bg-muted/40" />
        </div>
      </div>
    );

  if (!gig)
    return (
      <div className="max-w-2xl mx-auto py-32 text-center animate-in fade-in zoom-in-95">
        <FileSearch className="mx-auto h-16 w-16 text-destructive/20 mb-6" />
        <h2 className="text-3xl font-black uppercase tracking-tighter">List Error</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 italic mt-2">
          Node vanished or restricted by protocol.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/app/gigs?tab=projects")}
          className="mt-8 rounded-xl px-10 h-12 font-black uppercase text-[10px] tracking-widest border-2"
        >
          Return to Hub
        </Button>
      </div>
    );

  const isFixed = gig.pricing_type === "fixed";
  const avgRating = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/gigs?tab=projects")}
          className="group rounded-xl h-11 px-4 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 -ml-4"
        >
          <ArrowLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Project Hub
        </Button>
        <Badge
          variant="outline"
          className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] px-3 py-1.5 tracking-widest"
        >
          PROJECT_ID: {gig.id.split("-")[0].toUpperCase()}
        </Badge>
      </header>

      <div className="grid lg:grid-cols-[1fr,380px] gap-12 items-start">
        {/* Project Mission Specification */}
        <div className="space-y-12">
          <section className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {MARKETPLACE_SCHOOL_MAP[gig.skill_category]?.label}
                </Badge>
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  <Zap className="h-3 w-3 mr-1.5 fill-current" /> {isFixed ? "Fixed Unit" : "Competition"}
                </Badge>
                {avgRating && (
                  <Badge
                    variant="outline"
                    className="bg-background/50 border-amber-200 text-amber-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2"
                  >
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {avgRating} Logic Trust
                  </Badge>
                )}
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9] selection:bg-primary/20">
                {gig.title}
              </h1>
              <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                <Users className="h-4 w-4 text-primary" /> Entity: {gig.employer_name || "Platform Architect"}
              </div>
            </div>

            <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Target className="h-48 w-48" />
              </div>
              <CardContent className="p-10 space-y-10">
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Briefing Summary</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground font-medium leading-relaxed italic text-base">
                    <p className="whitespace-pre-wrap">{gig.description}</p>
                  </div>
                </div>

                {gig.requirements && (
                  <div className="pt-10 border-t border-border/10 space-y-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                      Setup Requirements
                    </h3>
                    <Card className="rounded-[28px] bg-muted/20 border-2 border-dashed border-border/60">
                      <CardContent className="p-8 text-sm font-medium leading-relaxed whitespace-pre-wrap italic opacity-80">
                        {gig.requirements}
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                  <div className="bg-primary/5 rounded-[28px] p-8 border border-primary/10 shadow-inner group/val transition-all hover:bg-primary/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-3 italic">
                      Economic Value
                    </p>
                    <div className="flex items-center gap-3 text-3xl font-black italic tracking-tighter text-primary">
                      <Coins className="h-7 w-7 text-amber-500" /> {gig.budget_amount}
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-[28px] p-8 border border-border/40 shadow-inner group/time transition-all hover:bg-muted/50">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 italic">
                      Temporal Deadline
                    </p>
                    <div className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
                      <Clock className="h-7 w-7 text-muted-foreground/40" />
                      {gig.deadline ? format(new Date(gig.deadline), "MMM d, yyyy") : "OPEN_PROTOCOL"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Reputation Ledger */}
          {reviews && reviews.length > 0 && (
            <section className="space-y-8">
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-4">
                <ShieldCheck className="h-5 w-5 text-emerald-500" /> Trust Tracking List ({reviews.length})
              </h2>
              <div className="grid gap-6">
                {reviews.map((r: any) => (
                  <Card
                    key={r.id}
                    className="rounded-[32px] border-border/40 bg-card/50 backdrop-blur-sm p-8 shadow-sm group hover:border-amber-500/20 transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/10",
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest italic">
                          SYNC_DATE: {format(new Date(r.created_at), "MMM yyyy")}
                        </span>
                      </div>
                      <p className="text-base font-medium italic text-foreground/80 leading-relaxed">"{r.comment}"</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: Upload Connection */}
        <aside className="sticky top-24 space-y-8 animate-in slide-in-from-right-8 duration-700 delay-150">
          {existingBid ? (
            <Card className="rounded-[40px] border-emerald-500/20 bg-emerald-500/5 shadow-2xl overflow-hidden py-12 text-center border-t-8 border-t-emerald-500">
              <CardContent className="space-y-8">
                <div className="h-20 w-20 rounded-[28px] bg-emerald-500/10 flex items-center justify-center mx-auto border-2 border-emerald-500/20 rotate-3 shadow-xl">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic">Connection Active</h3>
                  <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-[0.3em] italic">
                    Protocol: {existingBid.status}
                  </p>
                </div>
                <div className="pt-8 border-t border-emerald-500/10 flex flex-col gap-2 items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                    Committed Artifact Value
                  </span>
                  <span className="text-4xl font-black tracking-tighter text-emerald-600 italic leading-none">
                    {existingBid.bid_amount} Credits
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[40px] border-2 border-primary/20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden bg-background/80 backdrop-blur-3xl">
              <CardHeader className="p-10 pb-6 text-center">
                <CardTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none flex items-center justify-center gap-4">
                  Initialize Connection
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-3 italic">
                  Proposal Upload Node
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-10">
                <div className="space-y-8">
                  {!isFixed && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">
                        Economic Proposal
                      </Label>
                      <div className="relative group">
                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500 transition-transform group-focus-within:scale-110" />
                        <Input
                          type="number"
                          placeholder={`Target: ${gig.budget_amount}`}
                          className="pl-12 h-16 rounded-2xl border-2 border-border/40 bg-card/50 text-xl font-black tracking-tighter focus:border-primary/50 transition-all"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">
                      Temporal Commitment (Days)
                    </Label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                      <Input
                        type="number"
                        placeholder="Expected Logic Sync Time"
                        className="pl-12 h-16 rounded-2xl border-2 border-border/40 bg-card/50 font-bold"
                        value={estimatedDays}
                        onChange={(e) => setEstimatedDays(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">
                        Strategic Narrative
                      </Label>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setCoachOpen(true)} className="h-7 text-xs gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-primary" /> Improve with AI
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Articulate your technical value proposition..."
                      className="rounded-3xl min-h-[220px] bg-muted/10 border-2 border-border/40 p-6 italic font-medium leading-relaxed resize-none focus:border-primary/40 transition-all"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    />
                  </div>
                </div>
                <BidCoachDialog
                  open={coachOpen}
                  onOpenChange={setCoachOpen}
                  gigId={id!}
                  gigKind="marketplace"
                  initialDraft={coverLetter}
                  onAccept={(r) => setCoverLetter(r.text)}
                />

                {gig?.posted_by && talent?.userId === gig.posted_by && (
                  <div className="my-4">
                    <RecommendedBiddersPanel gigId={id!} gigKind="marketplace" />
                  </div>
                )}


                <Button
                  className="w-full h-20 rounded-[32px] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden"
                  onClick={() => submitProposal.mutate()}
                  disabled={!coverLetter.trim() || (!isFixed && !bidAmount) || submitProposal.isPending}
                >
                  <span className="relative z-10 flex items-center gap-4">
                    {submitProposal.isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Zap className="h-6 w-6 fill-current" />
                        {isFixed ? "Execute Mission" : "Authorize Proposal"}
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>

                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-[10px] font-bold leading-relaxed text-primary/60 uppercase tracking-widest italic">
                    Protocol: 0 Credit Upload Node. Escrow logic activates upon handshake acceptance.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
