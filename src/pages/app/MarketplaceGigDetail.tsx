import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMarketplaceGigById,
  getMyMarketplaceBidForGig,
  listMarketplaceReviewsForGig,
  insertMarketplaceBid,
} from "@/domains/gigs/repo/gigsRepo";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PAGE_SHELL, CARD, META_TEXT } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface GigRecord {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  skill_category: string;
  pricing_type: "fixed" | "competitive";
  budget_amount: number;
  deadline: string | null;
  employer_name: string | null;
  is_featured: boolean | null;
}

interface BidRecord {
  id: string;
  status: string;
  bid_amount: number;
}

interface ReviewRecord {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
}

/**
 * GroUp Academy: Marketplace Mission Detail View (MarketplaceGigDetail)
 * Hardened responsive gateway orchestrating proposal submission, trust registry visualization, and contractual bonding.
 * Version: Launch Candidate · Phase Z1 Production Contract Sealed
 */
export default function MarketplaceGigDetail() {
  const { id: gigIdStr } = useParams<{ id: string }>();
  const navigateHook = useNavigate();
  const queryClient = useQueryClient();
  const { talent: talentProfileRecord } = useTalent();

  const [bidAmountInput, setBidAmountInput] = React.useState<string>("");
  const [coverLetterInput, setCoverLetterInput] = React.useState<string>("");
  const [estimatedDaysInput, setEstimatedDaysInput] = React.useState<string>("");
  const [isSubmitPending, setIsSubmitPending] = React.useState<boolean>(false);

  // =========================================================================
  // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
  // =========================================================================
  const { data: gigRecord, isLoading: isGigCacheResolving } = useQuery({
    queryKey: ["app-marketplace-gig-detail", gigIdStr],
    enabled: !!gigIdStr,
    queryFn: async (): Promise<GigRecord> => {
      const data = await getMarketplaceGigById(gigIdStr!);
      if (!data) throw new Error("Gig not found.");
      return data as unknown as GigRecord;
    },
  });

  const { data: existingBidRecord } = useQuery({
    queryKey: ["app-talent-marketplace-bid", gigIdStr, talentProfileRecord?.id],
    enabled: !!gigIdStr && !!talentProfileRecord?.id,
    queryFn: async (): Promise<BidRecord | null> => {
      return (await getMyMarketplaceBidForGig(gigIdStr!, talentProfileRecord!.id)) as BidRecord | null;
    },
  });

  // Consolidated review fetch using inner-join relation rather than serial calls
  const { data: reviewManifestCollection = [] } = useQuery({
    queryKey: ["app-marketplace-gig-reviews", gigIdStr],
    enabled: !!gigIdStr,
    queryFn: async (): Promise<ReviewRecord[]> => {
      return (await listMarketplaceReviewsForGig(gigIdStr!)) as ReviewRecord[];
    },
  });

  const handleProposalSubmissionSequence = async () => {
    if (!talentProfileRecord?.id || !gigRecord) return;
    setIsSubmitPending(true);

    try {
      const { error } = await insertMarketplaceBid({
        gig_id: gigRecord.id,
        talent_id: talentProfileRecord.id,
        bid_amount: gigRecord.pricing_type === "fixed" ? gigRecord.budget_amount : parseInt(bidAmountInput) || 0,
        cover_letter: coverLetterInput,
        estimated_days: parseInt(estimatedDaysInput) || null,
      });

      if (error) throw error;
      toast.success("Proposal submitted.");
      queryClient.invalidateQueries({ queryKey: ["app-talent-marketplace-bid", gigIdStr] });
    } catch (e: any) {
      toast.error(e.message || "Couldn't submit your proposal.");
    } finally {
      setIsSubmitPending(false);
    }
  };

  if (isGigCacheResolving) {
    return (
      <div className={cn(PAGE_SHELL, "max-w-4xl mx-auto space-y-6 pt-10")}>
        <Skeleton className="h-8 w-1/3 rounded-lg" />
        <div className="grid lg:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (!gigRecord) return <div className="text-center py-20">Gig not found.</div>;

  const averageTrustRating = reviewManifestCollection.length
    ? (reviewManifestCollection.reduce((s, r) => s + r.rating, 0) / reviewManifestCollection.length).toFixed(1)
    : null;

  return (
    <div className={cn(PAGE_SHELL, "max-w-5xl mx-auto py-10 space-y-8")}>
      <Button variant="ghost" size="sm" onClick={() => navigateHook(-1)} className="gap-2 mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid lg:grid-cols-[1fr,400px] gap-8">
        {/* Main Mission Content */}
        <div className="space-y-6">
          <div className="flex gap-3">
            <Badge variant="outline" className="text-[10px]">
              {gigRecord.skill_category}
            </Badge>
            {gigRecord.is_featured && (
              <Badge variant="secondary" className="text-[10px]">
                Featured
              </Badge>
            )}
          </div>

          <h1 className="text-4xl font-black uppercase tracking-tight">{gigRecord.title}</h1>

          <Card className={CARD}>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{gigRecord.description}</p>
              {gigRecord.requirements && (
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-bold uppercase tracking-wide mb-2">Requirements</h4>
                  <p className="text-sm text-muted-foreground italic">{gigRecord.requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {reviewManifestCollection.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Client reviews
              </h3>
              <div className="grid gap-3">
                {reviewManifestCollection.map((r) => (
                  <Card key={r.id} className={cn(CARD, "p-4")}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("h-3 w-3", i < r.rating ? "fill-current" : "opacity-20")} />
                        ))}
                      </div>
                      <span className={META_TEXT}>{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                    </div>
                    <p className="text-xs italic">"{r.comment}"</p>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Action Panel */}
        <aside className="lg:sticky lg:top-24 h-fit">
          {existingBidRecord ? (
            <Card className={cn(CARD, "border-emerald-500/20 bg-emerald-500/5")}>
              <CardContent className="p-6 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <div>
                  <h3 className="font-bold">Proposal Active</h3>
                  <p className={META_TEXT}>Status: {existingBidRecord.status}</p>
                </div>
                <div className="text-2xl font-black">{existingBidRecord.bid_amount} CR</div>
              </CardContent>
            </Card>
          ) : (
            <Card className={cn(CARD, "p-6 space-y-6")}>
              <CardTitle className="text-base">Initialize Proposal</CardTitle>
              {gigRecord.pricing_type !== "fixed" && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wide">Bid Amount</Label>
                  <Input
                    type="number"
                    value={bidAmountInput}
                    onChange={(e) => setBidAmountInput(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide">Estimated Days</Label>
                <Input
                  type="number"
                  value={estimatedDaysInput}
                  onChange={(e) => setEstimatedDaysInput(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide">Strategic Narrative</Label>
                <Textarea
                  value={coverLetterInput}
                  onChange={(e) => setCoverLetterInput(e.target.value)}
                  placeholder="Your pitch..."
                  className="min-h-[150px]"
                />
              </div>
              <Button
                className="w-full h-11"
                onClick={handleProposalSubmissionSequence}
                disabled={isSubmitPending || !coverLetterInput.trim()}
              >
                {isSubmitPending ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Transmit Proposal
              </Button>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
