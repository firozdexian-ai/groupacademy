import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Coins, Eye, EyeOff, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";

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

  // CTO Fix: Hardened initials logic
  const initials =
    talentName
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";

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

        if (data?.image_url) {
          setHeroBannerUrl(data.image_url);
        }
      } catch (error) {
        console.error("[FeedHeader] Banner fetch failed", error);
      } finally {
        setIsBannerLoading(false);
      }
    };
    fetchHeroBanner();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-md aspect-[3/1] sm:aspect-[4/1] transition-all duration-500">
      {/* Background Image Layer with smooth transition */}
      <div
        className={cn(
          "absolute inset-0 z-0 transition-opacity duration-1000 bg-center bg-cover",
          isBannerLoading ? "opacity-0" : "opacity-100",
        )}
        style={
          heroBannerUrl
            ? { backgroundImage: `url('${heroBannerUrl}')` }
            : { background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)" }
        }
      />

      {/* Loading Shimmer (displayed while banner loads) */}
      {isBannerLoading && <div className="absolute inset-0 bg-muted animate-pulse" />}

      {/* Modern Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-0" />

      {/* Content Layout */}
      <div className="relative z-10 flex items-center justify-between h-full text-white px-6 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative group shrink-0">
            <Avatar
              className="h-14 w-14 sm:h-16 sm:w-16 ring-4 ring-white/20 shadow-2xl cursor-pointer transition-transform active:scale-95"
              onClick={() => navigate("/app/profile")}
            >
              <AvatarImage src={talentPhoto} alt={talentName || "User"} className="object-cover" />
              <AvatarFallback className="bg-primary-foreground/20 text-white font-black text-lg backdrop-blur-md">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white shadow-sm" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight truncate drop-shadow-sm">
                {talentName || "Welcome back"}
              </h1>
              <Sparkles className="h-4 w-4 text-amber-300 hidden sm:block animate-pulse" />
            </div>
            {talentProfession && (
              <p className="text-white/80 text-xs sm:text-sm font-medium leading-tight truncate">{talentProfession}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "gap-2 px-3 py-1.5 transition-all duration-300 cursor-pointer select-none",
              "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20",
              "text-white shadow-lg",
            )}
            onClick={() => setShowCredits((prev) => !prev)}
          >
            {showCredits ? (
              <>
                <Coins className="h-3.5 w-3.5 text-amber-300" />
                <span className="font-black tabular-nums tracking-tighter">{balance?.toLocaleString() || 0}</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 opacity-70" />
                <span className="font-bold tracking-widest text-[9px]">WALLET</span>
              </>
            )}
          </Badge>

          {/* Refresh State Indicator */}
          {isRefreshing && (
            <div className="flex items-center gap-1.5 px-2">
              <RefreshCw className="h-3 w-3 animate-spin text-white/50" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Syncing Feed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
