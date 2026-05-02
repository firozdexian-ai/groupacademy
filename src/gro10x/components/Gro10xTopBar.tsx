/**
 * Compact top bar for the Gro10x app shell.
 *
 * Layout: [credits pill] · [avatar → /gro10x/me]
 * - Owner/Admin: pill shows the company credit pool, links to /gro10x/billing.
 * - Member:      pill shows personal + Gro10x bonus credits, links to /gro10x/billing too.
 * - Notifications are surfaced via the "concierge" agent thread (Atlas), not a separate bell.
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCompany } from "../hooks/useActiveCompany";
import { useCompanyCredits } from "../hooks/useCompanyCredits";
import { useContactCredits } from "../hooks/useContactCredits";
import { GRO10X_PANEL } from "../lib/tokens";

export function Gro10xTopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyId, role } = useActiveCompany();
  const { balance: companyBalance } = useCompanyCredits();
  const { balance, earned, bonus, total } = useContactCredits();
  const [photo, setPhoto] = useState<string | null>(null);
  const [initial, setInitial] = useState<string>("?");

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("talents")
        .select("full_name, profile_photo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setPhoto(data?.profile_photo_url ?? null);
      setInitial(((data?.full_name || user.email || "?") as string).charAt(0).toUpperCase());
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Hide on chat threads (chat has its own header) or before workspace exists
  if (pathname.startsWith("/gro10x/c/") || !companyId) return null;

  const isCompanyController = role === "owner" || role === "admin";
  const shown = isCompanyController ? companyBalance : total;
  const low = shown < 50;

  return (
    <div className="sticky top-0 z-40 bg-[#06121A]/85 backdrop-blur-md border-b border-white/5 px-3 py-2 flex items-center justify-between">
      <Link
        to="/gro10x/billing"
        className={`inline-flex items-center gap-1.5 ${GRO10X_PANEL} border ${low ? "border-amber-500/40" : "border-white/10"} rounded-full px-2.5 py-1`}
        title={
          isCompanyController
            ? `Company pool · $${(companyBalance * 0.02).toFixed(2)}`
            : `Free ${balance} · Bonus ${bonus} · Earned ${earned}`
        }
      >
        <Coins className={`h-3.5 w-3.5 ${low ? "text-amber-400" : "text-[#33E1E4]"}`} />
        <span className="text-xs font-semibold">{Math.floor(shown).toLocaleString()}</span>
        <span className="text-[10px] text-slate-400">
          {isCompanyController ? "co. credits" : "credits"}
        </span>
      </Link>
      <button
        type="button"
        onClick={() => navigate("/gro10x/me")}
        aria-label="My profile"
        className="h-8 w-8 grid place-items-center rounded-full bg-[#0F172A] border border-white/10 overflow-hidden"
      >
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-slate-200">{initial}</span>
        )}
      </button>
    </div>
  );
}
