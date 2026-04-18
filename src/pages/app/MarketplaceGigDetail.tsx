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
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MarketplaceGigDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { talent } = useTalent();

  const [bidAmount, setBidAmount] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");

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
      if (!talent?.id || !id) throw new Error("Authentication required");
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
      toast.success("Proposal transmitted to employer!");
      queryClient.invalidateQueries({ queryKey: ["my-marketplace-bid", id] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-gig", id] });
    },
  });

  if (isLoading)
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-40 rounded-full" />
        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          <Skeleton className="h-[500px] rounded-[32px]" />
          <Skeleton className="h-[400px] rounded-[32px]" />
        </div>
      </div>
    );

  if (!gig) return <div className="py-20 text-center">Gig vanished or restricted.</div>;

  const isFixed = gig.pricing_type === "fixed";
  const avgRating = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700 pb-32">
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/gigs?tab=projects")}
          className="rounded-full font-bold text-xs uppercase tracking-widest px-4 h-10 hover:bg-primary/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> All Projects
        </Button>
        <Badge
          variant="outline"
          className="border-primary/20 text-primary font-black uppercase text-[10px] tracking-tighter"
        >
          Reference: {gig.id.split("-")[0]}
        </Badge>
      </header>

      <div className="grid lg:grid-cols-[1fr,380px] gap-8 items-start">
        {/* Main Content: Gig Spec */}
        <div className="space-y-8">
          <section className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">
                  {MARKETPLACE_SCHOOL_MAP[gig.skill_category]?.label}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-amber-500/10 text-amber-600 border-none text-[9px] font-black uppercase tracking-widest"
                >
                  <Zap className="h-3 w-3 mr-1" /> {isFixed ? "Fixed Budget" : "Negotiable"}
                </Badge>
                {avgRating && (
                  <Badge variant="outline" className="gap-1.5 text-[9px] font-black uppercase border-amber-200">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {avgRating} Client Rating
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-tight">{gig.title}</h1>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <Users className="h-4 w-4 text-primary/40" /> {gig.employer_name || "Academy Partner"}
              </div>
            </div>

            <Card className="rounded-[32px] border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Project Mission</h3>
                  <p className="text-sm leading-relaxed font-medium text-foreground/80 whitespace-pre-wrap">
                    {gig.description}
                  </p>
                </div>

                {gig.requirements && (
                  <div className="pt-6 border-t border-border/40 space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Candidate Requirements
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/20 italic text-xs font-medium leading-relaxed">
                      {gig.requirements}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-primary/[0.03] rounded-2xl border border-primary/10">
                    <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground mb-1">
                      Proposed Value
                    </p>
                    <div className="flex items-center gap-1.5 text-lg font-black text-primary">
                      <Coins className="h-5 w-5 text-amber-500" /> {gig.budget_amount}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/20">
                    <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground mb-1">
                      Time Horizon
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Clock className="h-4 w-4 text-primary" />{" "}
                      {gig.deadline ? format(new Date(gig.deadline), "MMM d, yyyy") : "ASAP"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Feedback Section */}
          {reviews && reviews.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Employer Reputation ({reviews.length})
              </h2>
              <div className="space-y-3">
                {reviews.map((r: any) => (
                  <div key={r.id} className="p-5 rounded-2xl bg-muted/20 border border-border/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20",
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">
                        {format(new Date(r.created_at), "MMM yyyy")}
                      </span>
                    </div>
                    <p className="text-xs font-medium italic text-muted-foreground leading-relaxed">"{r.comment}"</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: Submission Logic */}
        <aside className="sticky top-24 space-y-6">
          {existingBid ? (
            <Card className="rounded-[32px] border-emerald-500/20 bg-emerald-500/[0.02] shadow-xl overflow-hidden animate-in zoom-in-95">
              <CardContent className="p-8 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight">Proposal Active</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Status: {existingBid.status}
                  </p>
                </div>
                <div className="pt-4 border-t border-emerald-500/10 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                    Your Bid
                  </span>
                  <span className="text-sm font-black text-emerald-600">{existingBid.bid_amount} Credits</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[32px] border-primary/10 shadow-2xl overflow-hidden bg-card/80 backdrop-blur-xl">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black tracking-tighter flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" /> Apply for Gig
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                  Position your expertise
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {!isFixed && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">
                      Proposed Credits
                    </Label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-3 h-4 w-4 text-amber-500" />
                      <Input
                        type="number"
                        placeholder={`Target: ${gig.budget_amount}`}
                        className="pl-10 h-11 rounded-xl font-bold"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">
                    Project Timeline (Days)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 7"
                    className="h-11 rounded-xl font-bold"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">
                    Strategic Proposal
                  </Label>
                  <Textarea
                    placeholder="How will you deliver value on this project?"
                    className="rounded-2xl min-h-[140px] resize-none"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  onClick={() => submitProposal.mutate()}
                  disabled={!coverLetter.trim() || (!isFixed && !bidAmount) || submitProposal.isPending}
                >
                  {submitProposal.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>{isFixed ? "Accept Fixed Mission" : "Launch Proposal"}</>
                  )}
                </Button>

                <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[9px] font-medium leading-relaxed text-muted-foreground">
                    Submitting a proposal deducts 0 credits. Once accepted, a contract is generated and payment is
                    handled via platform escrow.
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
