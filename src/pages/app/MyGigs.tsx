import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MARKETPLACE_SCHOOL_MAP } from "@/lib/constants/marketplaceCategories";
import { toast } from "sonner";
import { Coins, Clock, Briefcase, Upload, Send, Star, Loader2, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function MyGigs() {
  const { talent } = useTalent();
  const queryClient = useQueryClient();
  const [deliverableDialog, setDeliverableDialog] = useState<string | null>(null);
  const [reviewDialog, setReviewDialog] = useState<string | null>(null);
  const [delivTitle, setDelivTitle] = useState("");
  const [delivDesc, setDelivDesc] = useState("");
  const [delivFile, setDelivFile] = useState<File | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // My bids
  const { data: myBids, isLoading: bidsLoading } = useQuery({
    queryKey: ["my-marketplace-bids", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_bids")
        .select("*, marketplace_gigs(title, skill_category, status, employer_name)")
        .eq("talent_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!talent?.id,
  });

  // My contracts
  const { data: myContracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["my-marketplace-contracts", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_contracts")
        .select("*, marketplace_gigs:gig_id(title, skill_category)")
        .eq("freelancer_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!talent?.id,
  });

  // My deliverables for active contract
  const { data: myDeliverables } = useQuery({
    queryKey: ["my-deliverables", deliverableDialog],
    queryFn: async () => {
      if (!deliverableDialog) return [];
      const { data, error } = await supabase
        .from("marketplace_deliverables")
        .select("*")
        .eq("contract_id", deliverableDialog)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!deliverableDialog,
  });

  // Existing reviews
  const { data: myReviews } = useQuery({
    queryKey: ["my-reviews", talent?.id],
    queryFn: async () => {
      if (!talent?.id) return [];
      const contractIds = myContracts?.filter((c: any) => c.status === "completed").map((c: any) => c.id) || [];
      if (!contractIds.length) return [];
      const { data } = await supabase
        .from("marketplace_reviews")
        .select("*")
        .in("contract_id", contractIds);
      return data || [];
    },
    enabled: !!myContracts,
  });

  const submitDeliverable = useMutation({
    mutationFn: async () => {
      if (!deliverableDialog) throw new Error("No contract");
      let fileUrl: string | null = null;
      if (delivFile) {
        const ext = delivFile.name.split(".").pop();
        const path = `${talent!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("marketplace-deliverables")
          .upload(path, delivFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage
          .from("marketplace-deliverables")
          .getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("marketplace_deliverables").insert({
        contract_id: deliverableDialog,
        title: delivTitle,
        description: delivDesc || null,
        file_url: fileUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deliverable submitted!");
      setDelivTitle("");
      setDelivDesc("");
      setDelivFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-deliverables"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!reviewDialog) throw new Error("No contract");
      const { error } = await supabase.from("marketplace_reviews").insert({
        contract_id: reviewDialog,
        reviewer_type: "freelancer",
        rating: reviewRating,
        comment: reviewComment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted!");
      setReviewDialog(null);
      setReviewRating(5);
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const activeContracts = myContracts?.filter((c: any) => c.status === "active") || [];
  const completedContracts = myContracts?.filter((c: any) => c.status === "completed") || [];
  const hasReview = (contractId: string) => myReviews?.some((r: any) => r.contract_id === contractId);

  const bidStatusColor = (s: string) => {
    if (s === "accepted") return "default" as const;
    if (s === "rejected") return "destructive" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" /> My Gigs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track your bids, contracts, and deliverables</p>
      </div>

      <Tabs defaultValue="bids">
        <TabsList className="w-full">
          <TabsTrigger value="bids" className="flex-1">My Bids</TabsTrigger>
          <TabsTrigger value="active" className="flex-1">Active ({activeContracts.length})</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
        </TabsList>

        {/* MY BIDS */}
        <TabsContent value="bids" className="mt-4 space-y-3">
          {bidsLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : !myBids?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No bids submitted yet</p>
            </div>
          ) : (
            myBids.map((bid: any) => (
              <Card key={bid.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{bid.marketplace_gigs?.title || "Unknown Gig"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {MARKETPLACE_SCHOOL_MAP[bid.marketplace_gigs?.skill_category]?.label}
                        {bid.marketplace_gigs?.employer_name && ` · ${bid.marketplace_gigs.employer_name}`}
                      </p>
                    </div>
                    <Badge variant={bidStatusColor(bid.status)}>{bid.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-amber-500" />{bid.bid_amount} credits
                    </span>
                    {bid.estimated_days && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{bid.estimated_days} days</span>
                    )}
                    <span>{format(new Date(bid.created_at), "MMM d, yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ACTIVE CONTRACTS */}
        <TabsContent value="active" className="mt-4 space-y-3">
          {contractsLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : !activeContracts.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No active contracts</p>
            </div>
          ) : (
            activeContracts.map((contract: any) => (
              <Card key={contract.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{contract.marketplace_gigs?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {MARKETPLACE_SCHOOL_MAP[contract.marketplace_gigs?.skill_category]?.label}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 font-semibold text-sm">
                      <Coins className="h-3.5 w-3.5 text-amber-500" />{contract.agreed_amount}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => setDeliverableDialog(contract.id)}
                  >
                    <Upload className="h-3.5 w-3.5" /> Submit Deliverable
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* COMPLETED */}
        <TabsContent value="completed" className="mt-4 space-y-3">
          {!completedContracts.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No completed contracts yet</p>
            </div>
          ) : (
            completedContracts.map((contract: any) => (
              <Card key={contract.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{contract.marketplace_gigs?.title}</p>
                      <p className="text-xs text-muted-foreground">Completed {contract.completed_at && format(new Date(contract.completed_at), "MMM d, yyyy")}</p>
                    </div>
                    <span className="flex items-center gap-1 font-semibold text-sm text-green-600">
                      <Coins className="h-3.5 w-3.5" />+{contract.agreed_amount}
                    </span>
                  </div>
                  {!hasReview(contract.id) && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setReviewDialog(contract.id)}>
                      <Star className="h-3.5 w-3.5" /> Leave Review
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Deliverable Dialog */}
      <Dialog open={!!deliverableDialog} onOpenChange={(o) => !o && setDeliverableDialog(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Deliverable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing deliverables */}
            {myDeliverables?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Previous submissions</p>
                {myDeliverables.map((d: any) => (
                  <div key={d.id} className="border rounded-lg p-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{d.title}</span>
                      <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                    </div>
                    {d.admin_notes && <p className="text-xs text-muted-foreground mt-1">Admin: {d.admin_notes}</p>}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={delivTitle} onChange={(e) => setDelivTitle(e.target.value)} placeholder="e.g. Final Logo Design" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={delivDesc} onChange={(e) => setDelivDesc(e.target.value)} placeholder="Describe what you're submitting..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>File (optional)</Label>
              <Input type="file" onChange={(e) => setDelivFile(e.target.files?.[0] || null)} />
            </div>
            <Button
              className="w-full"
              disabled={!delivTitle.trim() || submitDeliverable.isPending}
              onClick={() => submitDeliverable.mutate()}
            >
              {submitDeliverable.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(o) => !o && setReviewDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setReviewRating(n)}>
                    <Star className={`h-6 w-6 ${n <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comment (optional)</Label>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} />
            </div>
            <Button className="w-full" onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
              {submitReview.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
