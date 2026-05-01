import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Coins, Eye, EyeOff, Sparkles, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";

/**
 * FeedHeader — banner with talent avatar, name and credit balance.
 */

interface FeedHeaderProps {
  talentName?: string;
  talentPhoto?: string;
  talentProfession?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FeedHeader({ talentName, talentPhoto, talentProfession, onRefresh, isRefreshing }: FeedHeaderProps) {
  const navigate = useNavigate();
  const { balance } = useCredits();
  const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(null);
  const [showCredits, setShowCredits] = useState(false);
  const [isBannerLoading, setIsBannerLoading] = useState(true);

  // Initials from name (fallback "?")
  const initials =
    talentName
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  useEffect(() => {
    const fetchHeroBanner = async () => {
      try {
        const { data } = await supabase
          .from("banners")
          .select("image_url")
          .eq("is_active", true)
          .eq("placement", "hero")
          .order("display_order", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (data?.image_url) setHeroBannerUrl(data.image_url);
      } catch (error) {
        console.error("[FeedHeader] Banner load failed:", error);
      } finally {
        setIsBannerLoading(false);
      }
    };
    fetchHeroBanner();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[32px] border-2 border-border/10 shadow-2xl aspect-[3/1] sm:aspect-[4/1] transition-all duration-700 animate-in fade-in zoom-in-95">
      {/* INFRASTRUCTURE: Multi-Layer Background Protocol */}
      <div
        className={cn(
          "absolute inset-0 z-0 transition-all duration-1000 bg-center bg-cover scale-105",
          isBannerLoading ? "opacity-0" : "opacity-100",
        )}
        style={
          heroBannerUrl
            ? { backgroundImage: `url('${heroBannerUrl}')` }
            : { background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #1e1e1e 100%)" }
        }
      />

      {/* TELEMETRY: Loading Shimmer */}
      {isBannerLoading && <div className="absolute inset-0 bg-muted/20 animate-pulse backdrop-blur-xl" />}

      {/* GEOMETRY: Modern Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-0" />

      {/* CORE CONTENT NODES */}
      <div className="relative z-10 flex items-center justify-between h-full text-white px-8 gap-6">
        <div className="flex items-center gap-5 min-w-0">
          <div className="relative group shrink-0">
            <Avatar
              className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-white/10 shadow-2xl cursor-pointer transition-all duration-500 hover:ring-primary active:scale-90"
              onClick={() => navigate("/app/profile")}
            >
              <AvatarImage src={talentPhoto} alt={talentName || "Profile"} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-white font-bold text-xl backdrop-blur-xl border-2 border-white/20">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-4 border-[#0a0a0a] shadow-lg" />
          </div>

          <div className="flex flex-col min-w-0 text-left">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-xl sm:text-2xl tracking-tight truncate drop-shadow-2xl">
                {talentName ? `Hi, ${talentName.split(" ")[0]}` : "Welcome back"}
              </h1>
              <Sparkles className="h-5 w-5 text-amber-400 hidden sm:block" />
            </div>
            {talentProfession && (
              <p className="text-white/70 text-xs sm:text-sm font-medium truncate">
                {talentProfession}
              </p>
            )}
          </div>
        </div>

        {/* FINANCIAL PROTOCOL: Wallet & Sync Telemetry */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "gap-3 px-4 py-2 transition-all duration-500 cursor-pointer select-none rounded-2xl border-2",
              "bg-black/40 backdrop-blur-xl border-white/10 hover:border-primary/50 hover:bg-black/60",
              "text-white shadow-2xl group",
            )}
            onClick={() => setShowCredits((prev) => !prev)}
          >
            {showCredits ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                <Coins className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                <span className="font-black tabular-nums tracking-tighter text-sm">
                  {balance?.toLocaleString() || 0}
                </span>
                <span className="text-[8px] font-bold opacity-40">CR</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                <ShieldCheck className="h-4 w-4 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="font-black tracking-widest text-[10px] italic">LEDGER_SECURE</span>
              </div>
            )}
          </Badge>

          {/* ASYNC SYNC INDICATOR */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 transition-opacity duration-300",
              isRefreshing ? "opacity-100" : "opacity-0",
            )}
          >
            <RefreshCw className="h-3 w-3 animate-spin text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">Syncing_Nodes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
