/**
 * Gro10x billing screen — balance, 90-day ledger, top-up CTA.
 * USD-base display with localized equivalent (per platform currency model).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Plus, Loader2, AlertTriangle, GraduationCap } from "lucide-react";
import { useCompanyCredits } from "../hooks/useCompanyCredits";
import { useCurrencyRates } from "@/hooks/useCurrencyRates";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { creditsToUSD, formatMoney, formatUSD } from "@/lib/currency";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { toast } from "sonner";

const TOPUP_PACKS = [
  { credits: 100, popular: false },
  { credits: 500, popular: true },
  { credits: 2000, popular: false },
];

export default function Gro10xBilling() {
  const { user } = useAuth();
  const { companyId, balance, ledger, isLoading } = useCompanyCredits();
  const { rates } = useCurrencyRates();
  const [country, setCountry] = useState<string | null>(null);
  const [topupPending, setTopupPending] = useState<number | null>(null);
  const [instructorEarnings, setInstructorEarnings] = useState<{ available: number; lifetime: number } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void supabase.rpc("get_instructor_earnings_summary" as any).then(({ data }) => {
      if (cancelled || !data) return;
      const d = data as any;
      if ((d?.lifetime_credits ?? 0) > 0) {
        setInstructorEarnings({ available: Number(d.available_credits ?? 0), lifetime: Number(d.lifetime_credits ?? 0) });
      }
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Pull country from talents (best-effort) so we can localize.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void supabase
      .from("talents")
      .select("country")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setCountry((data?.country as string | null) ?? "");
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const lowBalance = balance < 50;

  const startTopup = async (credits: number) => {
    if (!companyId) return;
    setTopupPending(credits);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          mode: "company_credit",
          company_id: companyId,
          credits,
          usd_amount: creditsToUSD(credits),
        },
      });
      if (error) throw error;
      const url = (data as any)?.url;
      if (url) window.open(url, "_blank");
      else toast.error("Could not open checkout");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Top-up failed");
    } finally {
      setTopupPending(null);
    }
  };

  if (isLoading) {
    return <div className="max-w-md md:max-w-5xl mx-auto p-6 text-center text-slate-400 text-sm">Loading billing…</div>;
  }

  return (
    <div className="max-w-md md:max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-3">
        <Link to="/gro10x/me" className="text-slate-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Billing</h1>
      </div>

      {/* Balance card */}
      <div className="px-4 mt-3">
        <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-5`}>
          <p className={`text-[11px] uppercase tracking-wider ${GRO10X_MUTED}`}>Available credits</p>
          <p className="text-3xl font-bold mt-1">{balance.toLocaleString()} <span className="text-sm font-normal text-slate-400">credits</span></p>
          <p className="text-sm text-slate-300 mt-1">
            {formatMoney(creditsToUSD(balance), country, rates)}
          </p>
          {lowBalance && (
            <div className="mt-3 flex items-center gap-2 text-amber-300 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Low balance — top up to keep your agents running.</span>
            </div>
          )}
        </div>
      </div>

      {/* Top-up packs */}
      <section className="px-4 mt-4">
        <h2 className="text-sm font-semibold mb-2">Top up</h2>
        <div className="space-y-2">
          {TOPUP_PACKS.map((p) => {
            const usd = creditsToUSD(p.credits);
            return (
              <button
                key={p.credits}
                disabled={topupPending !== null}
                onClick={() => startTopup(p.credits)}
                className={`w-full text-left ${GRO10X_PANEL} border ${p.popular ? "border-[#33E1E4]/40" : "border-white/10"} rounded-2xl p-3 flex items-center gap-3 hover:bg-white/5 disabled:opacity-50`}
              >
                <div className="h-10 w-10 rounded-full bg-[#33E1E4]/10 grid place-items-center text-[#33E1E4]">
                  {topupPending === p.credits ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      </div>

      {instructorEarnings && (
        <section className="px-4 mt-3">
          <Link to="/app/instructor?tab=earnings" className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-3 flex items-center gap-3 hover:bg-white/5`}>
            <div className="h-9 w-9 rounded-full bg-primary/10 grid place-items-center text-primary">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">Instructor earnings</p>
              <p className="text-[11px] text-slate-400">Available {instructorEarnings.available.toFixed(1)} cr · lifetime {instructorEarnings.lifetime.toFixed(0)}</p>
            </div>
            <span className="text-xs text-[#33E1E4]">Open →</span>
          </Link>
        </section>
      )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{p.credits.toLocaleString()} credits</p>
                    {p.popular && (
                      <span className="text-[9px] uppercase tracking-wider bg-[#33E1E4]/15 text-[#33E1E4] px-1.5 py-0.5 rounded-full">Popular</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{formatMoney(usd, country, rates)}</p>
                </div>
                <span className="text-xs text-[#33E1E4] font-medium">Buy →</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Ledger */}
      <section className="px-4 mt-6">
        <h2 className="text-sm font-semibold mb-2">Last 90 days</h2>
        {ledger.length === 0 ? (
          <p className="text-xs text-slate-500">No transactions yet.</p>
        ) : (
          <div className="space-y-1.5">
            {ledger.map((t) => {
              const isCredit = t.amount > 0;
              return (
                <div
                  key={t.id}
                  className={`${GRO10X_PANEL} border border-white/10 rounded-xl p-2.5 flex items-center gap-2.5`}
                >
                  <div
                    className={`h-8 w-8 rounded-full grid place-items-center shrink-0 ${
                      isCredit ? "bg-[#10D576]/15 text-[#10D576]" : "bg-slate-500/15 text-slate-300"
                    }`}
                  >
                    {isCredit ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {t.description || t.service_type || t.transaction_type}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(t.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${isCredit ? "text-[#10D576]" : "text-slate-200"}`}>
                      {isCredit ? "+" : ""}
                      {t.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500">{formatUSD(creditsToUSD(Math.abs(t.amount)), { fractionDigits: 2 })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
