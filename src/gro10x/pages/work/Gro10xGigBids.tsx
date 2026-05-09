import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGro10xCompanyId } from "../../hooks/useGro10xCompanyId";
import { GRO10X_MUTED } from "../../lib/tokens";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Award, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Bid {
  id: string;
  talent_id: string;
  bid_amount: number;
  cover_letter: string;
  coached_text: string | null;
  estimated_days: number | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  talent_name: string | null;
  talent_headline: string | null;
  talent_avatar: string | null;
  trust_score: number | null;
  created_at: string;
}

interface Gig {
  id: string;
  title: string;
  description: string;
  budget_amount: number | null;
  budget_currency: string | null;
  status: string;
  selected_bid_id: string | null;
  total_bids: number | null;
}

export default function Gro10xGigBids() {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: companyId } = useGro10xCompanyId();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["employer-gig-bids", gigId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_employer_gig_bids", { p_gig_id: gigId! });
      if (error) throw error;
      return (data ?? {}) as { gig?: Gig; bids?: Bid[] };
    },
    enabled: !!gigId,
  });

  const accept = useMutation({
    mutationFn: async (bidId: string) => {
      if (!companyId) throw new Error("No active company");
      const { data, error } = await supabase.rpc("accept_gig_bid", {
        p_bid_id: bidId,
        p_company_id: companyId,
      });
      if (error) throw error;
      const res = data as { ok: boolean; error?: string; balance?: number; required?: number };
      if (!res.ok) throw new Error(res.error ?? "Failed");
      return res;
    },
    onSuccess: () => {
      toast.success("Bid accepted — contract created and credits escrowed.");
      qc.invalidateQueries({ queryKey: ["employer-gig-bids", gigId] });
      qc.invalidateQueries({ queryKey: ["company-credits"] });
      void refetch();
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not accept bid"),
  });

  const gig = data?.gig;
  const bids = data?.bids ?? [];

  return (
    <div className="max-w-3xl mx-auto pb-safe">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-3 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/gro10x/work")}
          className="rounded-full p-2 hover:bg-white/5"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{gig?.title ?? "Gig"}</p>
          <p className={`text-[11px] ${GRO10X_MUTED}`}>
            {bids.length} bid{bids.length === 1 ? "" : "s"} · {gig?.status ?? "—"}
          </p>
        </div>
      </header>

      <div className="px-3 py-3 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !gig ? (
          <p className="text-sm text-muted-foreground text-center py-12">Gig not found or access denied.</p>
        ) : bids.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No bids yet.</p>
        ) : (
          bids.map((b) => {
            const isWinner = b.id === gig.selected_bid_id;
            const awarded = !!gig.selected_bid_id;
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-3 space-y-2 ${
                  isWinner ? "border-[#10D576]/50 bg-[#10D576]/5" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs">
                    {b.talent_avatar ? (
                      <img src={b.talent_avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (b.talent_name ?? "?").slice(0, 1)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{b.talent_name ?? "Talent"}</p>
                      {b.trust_score != null && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          {Math.round(b.trust_score)}
                        </Badge>
                      )}
                      <Badge
                        variant={b.status === "accepted" ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {b.status}
                      </Badge>
                    </div>
                    {b.talent_headline && (
                      <p className={`text-[11px] truncate ${GRO10X_MUTED}`}>{b.talent_headline}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold">{b.bid_amount.toLocaleString()}</p>
                    <p className={`text-[10px] ${GRO10X_MUTED}`}>credits</p>
                    {b.estimated_days != null && (
                      <p className={`text-[10px] ${GRO10X_MUTED}`}>{b.estimated_days}d</p>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-slate-300 whitespace-pre-line">
                  {b.coached_text || b.cover_letter}
                </p>
                {!awarded && b.status === "pending" && (
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs gap-1"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("marketplace_bids")
                          .update({ status: "rejected" })
                          .eq("id", b.id);
                        if (error) toast.error(error.message);
                        else {
                          toast.success("Bid rejected");
                          void refetch();
                        }
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs gap-1 bg-[#10D576] hover:bg-[#10D576]/90 text-[#06121A]"
                      disabled={accept.isPending || !companyId}
                      onClick={() => accept.mutate(b.id)}
                    >
                      {accept.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Accept & escrow {b.bid_amount}cr
                    </Button>
                  </div>
                )}
                {isWinner && (
                  <p className="text-[11px] text-[#10D576] flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" /> Awarded — contract active.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
