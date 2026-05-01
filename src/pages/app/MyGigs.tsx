import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MARKETPLACE_SCHOOL_MAP } from "@/lib/constants/marketplaceCategories";
import { toast } from "sonner";
import {
  Coins,
  Clock,
  Briefcase,
  Upload,
  Send,
  Star,
  Loader2,
  CheckCircle2,
  ChevronRight,
  History,
  ShieldCheck,
  Zap,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Gig Lifecycle List
 * High-fidelity orchestrator for proposal tracking, active execution, and reputation ledger.
 * 2026 Standard: Executive Logic geometry with reinforced deliverable handshakes.
 */

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

  const { data: myBids, isLoading: bidsLoading } = useQuery({
    queryKey: ["my-marketplace-bids", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_bids")
        .select("*, marketplace_gigs(title, skill_category, employer_name)")
        .eq("talent_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!talent?.id,
  });

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

  const { data: myDeliverables } = useQuery({
    queryKey: ["my-deliverables", deliverableDialog],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_deliverables")
        .select("*")
        .eq("contract_id", deliverableDialog!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!deliverableDialog,
  });

  const { data: myReviews } = useQuery({
    queryKey: ["my-reviews", talent?.id],
    queryFn: async () => {
      const contractIds = myContracts?.map((c) => c.id) || [];
      if (!contractIds.length) return [];
      const { data } = await supabase.from("marketplace_reviews").select("*").in("contract_id", contractIds);
      return data || [];
    },
    enabled: !!myContracts?.length,
  });

  const submitDeliverable = useMutation({
    mutationFn: async () => {
      if (!deliverableDialog) throw new Error("Logic Context Lost");
      let fileUrl = null;
      if (delivFile) {
        const path = `artifacts/${talent!.id}/${Date.now()}-${delivFile.name}`;
        const { error: uploadErr } = await supabase.storage.from("marketplace-deliverables").upload(path, delivFile);
        if (uploadErr) throw uploadErr;
        fileUrl = supabase.storage.from("marketplace-deliverables").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("marketplace_deliverables").insert({
        contract_id: deliverableDialog,
        title: delivTitle,
        description: delivDesc,
        file_url: fileUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Performance Artifact Ingested.");
      setDeliverableDialog(null);
      setDelivTitle("");
      setDelivDesc("");
      setDelivFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-deliverables"] });
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("marketplace_reviews").insert({
        contract_id: reviewDialog,
        reviewer_type: "freelancer",
        rating: reviewRating,
        comment: reviewComment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trust Tracking Updated.");
      setReviewDialog(null);
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    },
  });

  const activeContracts = myContracts?.filter((c) => c.status === "active") || [];
  const completedContracts = myContracts?.filter((c) => c.status === "completed") || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-12 pb-40 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-[0.9]">Output Hub</h1>
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
            Professional Pipeline Management v2.6
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">List Sync: Active</span>
        </div>
      </header>

      <Tabs defaultValue="bids" className="w-full">
        <TabsList className="grid w-full grid-cols-3 p-1.5 h-16 bg-muted/30 backdrop-blur-md rounded-[32px] border border-border/40 max-w-2xl mx-auto">
          <TabsTrigger
            value="bids"
            className="rounded-[24px] font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            Proposals
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="rounded-[24px] font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            Active Logic ({activeContracts.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="rounded-[24px] font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            Archive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bids" className="mt-12 space-y-4 animate-in slide-in-from-bottom-4 duration-700">
          {bidsLoading ? (
            [...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />)
          ) : !myBids?.length ? (
            <div className="py-24 text-center border-2 border-dashed rounded-[48px] border-border/40 bg-muted/5">
              <Send className="h-12 w-12 text-muted-foreground/10 mx-auto mb-6 rotate-12" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                Upload Queue Empty
              </p>
            </div>
          ) : (
            myBids.map((bid) => (
              <Card
                key={bid.id}
                className="group rounded-[32px] border-2 border-border/40 hover:border-primary/40 transition-all duration-500 bg-card/30 backdrop-blur-sm shadow-sm hover:shadow-2xl"
              >
                <CardContent className="p-8 flex items-center justify-between gap-6">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-black text-xl tracking-tighter uppercase italic truncate group-hover:text-primary transition-colors">
                        {bid.marketplace_gigs?.title}
                      </h4>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                        {MARKETPLACE_SCHOOL_MAP[bid.marketplace_gigs?.skill_category]?.label} •{" "}
                        {bid.marketplace_gigs?.employer_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-500/10 rounded-lg">
                          <Coins className="h-4 w-4 text-amber-500" />
                        </div>
                        <span className="text-sm font-black italic tracking-tighter">{bid.bid_amount} Credits</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        <Clock className="h-3.5 w-3.5" /> {format(new Date(bid.created_at), "MMM d")}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "rounded-xl px-4 py-2 font-black uppercase text-[9px] tracking-widest border-none shadow-lg transition-all",
                      bid.status === "accepted" ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary",
                    )}
                  >
                    {bid.status === "accepted" ? "Verified" : bid.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-12 space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          {activeContracts.map((contract) => (
            <Card
              key={contract.id}
              className="rounded-[40px] border-2 border-primary/20 bg-primary/[0.02] shadow-2xl overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Zap className="h-40 w-40" />
              </div>
              <CardContent className="p-10 space-y-10">
                <div className="flex justify-between items-start gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary text-white text-[8px] font-black uppercase tracking-widest">
                        Live Protocol
                      </Badge>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
                        Execution Phase
                      </span>
                    </div>
                    <h4 className="font-black text-3xl tracking-tighter uppercase italic leading-[0.9]">
                      {contract.marketplace_gigs?.title}
                    </h4>
                  </div>
                  <div className="text-right bg-background/50 backdrop-blur-md p-4 rounded-2xl border border-border/40">
                    <p className="text-2xl font-black italic tracking-tighter text-emerald-600 leading-none">
                      {contract.agreed_amount}
                    </p>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em] mt-1.5">
                      Agreed Artifact Value
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden"
                  onClick={() => setDeliverableDialog(contract.id)}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Upload className="h-5 w-5" /> Initialize Deliverable Upload
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="mt-12 space-y-4 animate-in slide-in-from-bottom-4 duration-700">
          {completedContracts.map((contract) => {
            const reviewed = myReviews?.some((r) => r.contract_id === contract.id);
            return (
              <Card
                key={contract.id}
                className="rounded-[32px] border-2 border-border/40 bg-muted/10 opacity-70 group hover:opacity-100 transition-opacity"
              >
                <CardContent className="p-8 flex items-center justify-between gap-6">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="font-black text-lg tracking-tight uppercase italic truncate">
                      {contract.marketplace_gigs?.title}
                    </h4>
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                      Deployed artifact sync: {format(new Date(contract.completed_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2.5 text-emerald-600 font-black text-xl italic tracking-tighter">
                      <Coins className="h-5 w-5 text-amber-500" /> +{contract.agreed_amount}
                    </div>
                    {!reviewed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-12 rounded-2xl px-6 border-2 font-black uppercase tracking-widest text-[9px] gap-3"
                        onClick={() => setReviewDialog(contract.id)}
                      >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Reputation Connection
                      </Button>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* High-Fidelity Deliverable Connection */}
      <Dialog open={!!deliverableDialog} onOpenChange={(o) => !o && setDeliverableDialog(null)}>
        <DialogContent className="rounded-[48px] border-2 border-border/40 bg-background/80 backdrop-blur-3xl p-10 max-w-xl">
          <DialogHeader className="mb-10 text-center">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
              Deliver Performance
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 mt-3 italic">
              Artifact Ingestion Node
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-10">
            {myDeliverables?.length ? (
              <div className="space-y-4 p-6 bg-muted/20 rounded-[32px] border-2 border-dashed border-border/40">
                <div className="flex items-center justify-between border-b border-border/10 pb-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                    <History className="h-4 w-4" /> Upload List
                  </p>
                  <Badge className="bg-primary/10 text-primary text-[8px] px-2">{myDeliverables.length} Nodes</Badge>
                </div>
                <div className="space-y-2 max-h-[120px] overflow-y-auto no-scrollbar">
                  {myDeliverables.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between text-[11px] bg-background/50 p-3 rounded-xl border border-border/10"
                    >
                      <span className="font-black uppercase tracking-tight italic truncate max-w-[180px]">
                        {d.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[8px] font-black uppercase border-primary/20 text-primary"
                      >
                        {d.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">
                  Artifact Title
                </Label>
                <Input
                  value={delivTitle}
                  onChange={(e) => setDelivTitle(e.target.value)}
                  placeholder="Node Sync V1.0"
                  className="h-14 rounded-2xl border-2 bg-card/50 font-bold tracking-tight"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">
                  Logical Documentation
                </Label>
                <Textarea
                  value={delivDesc}
                  onChange={(e) => setDelivDesc(e.target.value)}
                  placeholder="Define technical parameters achieved..."
                  className="rounded-[32px] border-2 bg-muted/10 min-h-[160px] p-6 italic font-medium leading-relaxed resize-none"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">
                  Source Artifact
                </Label>
                <div className="relative group">
                  <Input
                    type="file"
                    onChange={(e) => setDelivFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-16 rounded-2xl border-2 border-dashed border-border/60 bg-muted/5 flex items-center justify-center gap-4 transition-all group-hover:border-primary/40 group-hover:bg-primary/[0.02]">
                    <Layers className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                      {delivFile ? delivFile.name : "Inject File Evidence"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-20 rounded-[32px] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
              onClick={() => submitDeliverable.mutate()}
              disabled={submitDeliverable.isPending || !delivTitle}
            >
              {submitDeliverable.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : "Send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mission Review Node */}
      <Dialog open={!!reviewDialog} onOpenChange={(o) => !o && setReviewDialog(null)}>
        <DialogContent className="rounded-[48px] bg-background/90 backdrop-blur-2xl border-2 border-border/40 max-w-md p-10">
          <DialogHeader className="text-center mb-8">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">Trust Protocol</DialogTitle>
          </DialogHeader>
          <div className="space-y-10">
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setReviewRating(n)}
                  className="transition-all active:scale-90 hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-10 w-10 transition-colors duration-300",
                      n <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/10",
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-center block">
                Connection Experience
              </Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Log employer interaction metrics..."
                className="rounded-[28px] border-2 bg-muted/10 p-6 italic font-medium leading-relaxed resize-none"
                rows={4}
              />
            </div>
            <Button
              className="w-full h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20"
              onClick={() => submitReview.mutate()}
              disabled={submitReview.isPending}
            >
              {submitReview.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Broadcast Reputation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
