import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETPLACE_SCHOOL_MAP } from "@/lib/constants/marketplaceCategories";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, Clock, Coins, Send, Users, Loader2, CheckCircle, Star } from "lucide-react";
import { format } from "date-fns";

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
      const { data, error } = await supabase
        .from("marketplace_gigs")
        .select("*")
        .eq("id", id)
        .single();
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

  // Reviews for this gig's contracts
  const { data: reviews } = useQuery({
    queryKey: ["marketplace-gig-reviews", id],
    queryFn: async () => {
      const { data: contracts } = await supabase
        .from("marketplace_contracts")
        .select("id")
        .eq("gig_id", id!);
      if (!contracts?.length) return [];
      const contractIds = contracts.map((c: any) => c.id);
      const { data } = await supabase
        .from("marketplace_reviews")
        .select("*")
        .in("contract_id", contractIds)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const submitBid = useMutation({
    mutationFn: async () => {
      if (!talent?.id || !id) throw new Error("Not authenticated");
      const { error } = await supabase.from("marketplace_bids").insert({
        gig_id: id,
        talent_id: talent.id,
        bid_amount: parseInt(bidAmount) || gig?.budget_amount || 0,
        cover_letter: coverLetter,
        estimated_days: parseInt(estimatedDays) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bid submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-marketplace-bid", id] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-gig", id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 pb-24">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Gig not found</p>
        <Button variant="link" onClick={() => navigate("/app/gigs?tab=projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const hasBid = !!existingBid;
  const isFixed = gig.pricing_type === "fixed";
  const avgRating = reviews?.length
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/app/gigs?tab=projects")}>
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Button>

      {/* Gig Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="outline">
              {MARKETPLACE_SCHOOL_MAP[gig.skill_category]?.label || gig.skill_category}
            </Badge>
            {gig.skill_subcategory && (
              <Badge variant="secondary" className="text-xs">{gig.skill_subcategory}</Badge>
            )}
            <Badge variant={isFixed ? "default" : "secondary"}>
              {isFixed ? "Fixed Price" : "Open to Bids"}
            </Badge>
            {avgRating && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {avgRating}
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg">{gig.title}</CardTitle>
          {gig.employer_name && (
            <p className="text-sm text-muted-foreground">Posted by {gig.employer_name}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm whitespace-pre-wrap">{gig.description}</p>

          {gig.requirements && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Requirements</p>
              <p className="text-sm">{gig.requirements}</p>
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap text-sm">
            {gig.budget_amount && (
              <div className="flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="font-semibold">{gig.budget_amount} credits</span>
                {isFixed && <span className="text-muted-foreground">(fixed)</span>}
              </div>
            )}
            {gig.deadline && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Deadline: {format(new Date(gig.deadline), "MMM d, yyyy")}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              {gig.total_bids} bid{gig.total_bids !== 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bid Form */}
      {hasBid ? (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="font-medium text-sm">You've already submitted a bid</p>
              <p className="text-xs text-muted-foreground">
                Bid: {existingBid.bid_amount} credits
                {existingBid.status === "accepted" && " — Accepted! 🎉"}
                {existingBid.status === "rejected" && " — Not selected"}
                {existingBid.status === "pending" && " — Under review"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" /> Submit Your Proposal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isFixed && (
              <div className="space-y-1.5">
                <Label>Your Bid (credits)</Label>
                <Input
                  type="number"
                  placeholder={gig.budget_amount ? `Budget: ${gig.budget_amount}` : "Enter amount"}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Cover Letter / Proposal</Label>
              <Textarea
                placeholder="Explain why you're the right person for this gig."
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated Delivery (days)</Label>
              <Input
                type="number"
                placeholder="e.g. 5"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => submitBid.mutate()}
              disabled={!coverLetter.trim() || (!isFixed && !bidAmount) || submitBid.isPending}
            >
              {submitBid.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isFixed ? `Accept & Apply (${gig.budget_amount} credits)` : "Submit Bid"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      {reviews && reviews.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" /> Reviews ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.map((review: any) => (
              <div key={review.id} className="border-b last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                {review.comment && <p className="text-sm">{review.comment}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
