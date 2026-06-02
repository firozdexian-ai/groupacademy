import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, RefreshCw, Trophy } from "lucide-react";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { useTalent } from "@/hooks/useTalent";
import { useCareerLevel } from "@/hooks/useCareerLevel";
import { ProfileCardBackdrop } from "./ProfileCardBackdrop";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FeedHeaderProps {
  talentName?: string;
  talentPhoto?: string;
  talentProfession?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Premium, performance-optimized user profile and account balance header.
 * Displays fractional credit updates and experience leveling indicators.
 */
export function FeedHeader({ talentName, talentPhoto, talentProfession, onRefresh, isRefreshing }: FeedHeaderProps) {
  const navigate = useNavigate();
  const { balance } = useCredits();
  const { talent } = useTalent();
  const { info: career, volume } = useCareerLevel();
  const [textMode, setTextMode] = useState<"light" | "dark" | "auto">("auto");
  const [levelOpen, setLevelOpen] = useState(false);

  // Guard account metrics boundaries and dispatch status alerts for top performers
  useEffect(() => {
    if (talent?.id) {
      if (isNaN(volume) || volume < 0) {
        trackError(`Lifetime credit volume calculation out of bounds: [${volume}]`, {
          component: "FeedHeader",
          action: "validate_financial_telemetry",
          talentId: talent.id,
        });
        return;
      }

      if (career?.level >= 5) {
        trackEvent("elite_talent_header_mounted", { talentId: talent.id, currentLevel: career.level });
      }
    }
  }, [talent, career, volume, talentName]);

  const initials =
    talentName
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const country = talent?.country;
  const subtitle = [talentProfession, country].filter(Boolean).join(" · ");

  const isLight = textMode === "light";
  const textCls = isLight ? "text-white" : "text-foreground";
  const mutedCls = isLight ? "text-white/75" : "text-muted-foreground";

  const handleLevelSheetOpen = (isOpen: boolean) => {
    setLevelOpen(isOpen);
    if (isOpen) {
      trackEvent("career_level_sheet_inspected", {
        talentId: talent?.id,
        currentLevel: career?.level,
        lifetimeVolume: volume,
      });
    }
  };

  return (
    <>
      <div className="relative rounded-2xl border border-border/40 overflow-hidden bg-card/70 backdrop-blur-md shadow-sm transition-all duration-300">
        <ProfileCardBackdrop onTextColor={setTextMode} />

        <div className="relative px-3 py-2.5 flex items-center justify-between gap-3 selection:bg-primary/20">
          {/* Profile Details Navigation Trigger */}
          <button
            onClick={() => navigate("/app/profile")}
            aria-label="Open your professional profile"
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 transition-transform cursor-pointer"
          >
            <Avatar
              className={cn(
                "h-11 w-11 ring-2 transition-all duration-300",
                isLight ? "ring-white/30 hover:ring-white/60" : "ring-border/40 hover:ring-primary/40",
              )}
            >
              <AvatarImage
                src={talentPhoto}
                alt={talentName || "User profile photo"}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm select-none">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Account Title & Balance Telemetry */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className={cn("text-sm font-bold truncate tracking-tight w-full", textCls)}>
                {talentName || "Welcome"}
              </h1>
              {isRefreshing ? (
                <RefreshCw className={cn("h-3 w-3 animate-spin shrink-0 text-primary")} />
              ) : (
                <button
                  onClick={onRefresh}
                  aria-label="Refresh community recommendation feed"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted/50 text-muted-foreground cursor-pointer shrink-0"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}
            </div>
            {subtitle && (
              <p className={cn("text-[11px] font-medium truncate leading-normal select-text", mutedCls)}>{subtitle}</p>
            )}

            {/* Credit Balance & Rank Tracking Bar */}
            <div className="flex items-center gap-3 mt-1.5 select-none">
              <button
                onClick={() => navigate("/app/transactions")}
                className={cn(
                  "flex items-center gap-1.5 text-[11px] font-bold tracking-tight hover:opacity-80 transition focus-visible:outline-none rounded px-0.5 cursor-pointer",
                  textCls,
                )}
                aria-label={`Wallet balance: ${balance != null ? Number(balance).toFixed(1) : "0.0"} credits`}
              >
                <Coins className="h-3 w-3 text-amber-400 shrink-0 drop-shadow-[0_1px_4px_rgba(251,191,36,0.2)]" />
                <span className="tabular-nums tracking-wide">
                  {balance != null ? Number(balance).toFixed(1) : "0.0"}
                </span>
                <span className={cn("font-normal text-[10px]", mutedCls)}>cr</span>
              </button>

              <button
                onClick={() => handleLevelSheetOpen(true)}
                className="flex-1 flex items-center gap-2 min-w-0 group focus-visible:outline-none rounded py-0.5 cursor-pointer"
                aria-label={`Experience progress: ${career?.progressPct || 0}% toward next rank`}
              >
                <div
                  className={cn(
                    "flex-1 h-1.5 rounded-full overflow-hidden border border-transparent shadow-inner transition-all",
                    isLight ? "bg-white/20" : "bg-muted",
                  )}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary/70 transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${career?.progressPct || 0}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold tabular-nums shrink-0 transition-colors group-hover:text-primary",
                    mutedCls,
                  )}
                >
                  {career?.progressPct || 0}%
                </span>
              </button>
            </div>
          </div>

          {/* Level Badge Metric Shortcut */}
          <button
            onClick={() => handleLevelSheetOpen(true)}
            aria-label={`Career level ${career?.level || 1}: ${career?.label || "Member"}`}
            className="shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xl active:scale-95 transition-all cursor-pointer"
          >
            <div
              className={cn(
                "rounded-xl px-2.5 py-1.5 flex flex-col items-center justify-center border shadow-sm min-w-[52px] h-[44px] transition-all",
                isLight
                  ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  : "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10",
              )}
            >
              <div className="flex items-center gap-1 leading-none select-none">
                <Trophy className="h-3 w-3 shrink-0" />
                <span className="text-xs font-extrabold tracking-tight tabular-nums">Lv {career?.level || 1}</span>
              </div>
              <span
                className={cn(
                  "text-[9px] font-bold mt-0.5 leading-none truncate max-w-[64px] tracking-tight uppercase",
                  isLight ? "text-white/90" : "text-primary/80",
                )}
              >
                {career?.label || "Member"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Experience Breakdown Sheet */}
      <Sheet open={levelOpen} onOpenChange={handleLevelSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-border/40 bg-background/98 backdrop-blur-xl pt-safe pb-safe-bottom"
        >
          <SheetHeader className="text-left pb-2 border-b border-border/20">
            <SheetTitle className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
              <Trophy className="h-4 w-4 text-primary shrink-0" />
              Career Level {career?.level || 1} &bull; {career?.label || "Member"}
            </SheetTitle>
            <SheetTitle></SheetTitle> {/* Accessibility requirements layout filler element */}
            <SheetDescription className="text-xs text-muted-foreground leading-relaxed">
              Your level reflects your total lifetime credit activity (balance spent or earned)[cite: 5]. This reflects your ongoing contribution and platform usage independently of your fluid wallet balances[cite: 5].
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4 max-h-[40vh] overflow-y-auto">
            <div className="rounded-xl border border-border/40 bg-muted/20 dark:bg-muted/5 p-4 shadow-inner animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span className="font-medium">Lifetime Activity Volume</span>
                <span className="tabular-nums font-bold text-foreground tracking-wide">
                  {Math.round(volume || 0).toLocaleString()} cr
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden border border-transparent shadow-inner">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${career?.progressPct || 0}%` }}
                />
              </div>
              {career?.nextLabel && (
                <div className="mt-2.5 text-xs text-muted-foreground font-medium leading-none tracking-tight">
                  Earn or use{" "}
                  <span className="font-bold text-foreground tabular-nums">
                    {Math.round(career.toNext || 0).toLocaleString()} cr
                  </span>{" "}
                  more to reach rank{" "}
                  <span className="font-bold text-foreground tracking-tight">{career.nextLabel}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground/90 leading-relaxed pl-1 select-text selection:bg-primary/20">
              Earn platform credits across global categories by participating in community interaction polls, posting verified job listings, or providing peer CV uploads[cite: 4, 5]. Use your balances to activate specialized AI advisor sessions, premium recorded courses, or custom digital profile builders[cite: 4].
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}