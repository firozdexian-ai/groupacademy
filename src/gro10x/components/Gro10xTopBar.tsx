/**
 * Compact top bar for the Gro10x app shell — credit balance pill + notifications bell.
 * Hidden on full-bleed pages (auth, landing) since those bypass the shell.
 */
import { Link, useLocation } from "react-router-dom";
import { Bell, Coins } from "lucide-react";
import { useCompanyCredits } from "../hooks/useCompanyCredits";
import { GRO10X_PANEL } from "../lib/tokens";

export function Gro10xTopBar() {
  const { pathname } = useLocation();
  const { balance, companyId } = useCompanyCredits();

  // Don't show on chat threads (chat has its own header) or pages without a company
  if (pathname.startsWith("/gro10x/c/") || !companyId) return null;

  const low = balance < 50;

  return (
    <div className="sticky top-0 z-40 bg-[#06121A]/85 backdrop-blur-md border-b border-white/5 px-3 py-2 flex items-center justify-between">
      <Link
        to="/gro10x/billing"
        className={`inline-flex items-center gap-1.5 ${GRO10X_PANEL} border ${low ? "border-amber-500/40" : "border-white/10"} rounded-full px-2.5 py-1`}
      >
        <Coins className={`h-3.5 w-3.5 ${low ? "text-amber-400" : "text-[#33E1E4]"}`} />
        <span className="text-xs font-semibold">{balance.toLocaleString()}</span>
        <span className="text-[10px] text-slate-400">credits</span>
      </Link>
      <Link
        to="/gro10x/notifications"
        aria-label="Notifications"
        className="relative h-8 w-8 grid place-items-center rounded-full hover:bg-white/5"
      >
        <Bell className="h-4 w-4 text-slate-300" />
      </Link>
    </div>
  );
}
