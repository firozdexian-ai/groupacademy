import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, RefreshCw, Trophy } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useTalent } from "@/hooks/useTalent";
import { useCareerLevel } from "@/hooks/useCareerLevel";
import { ProfileCardBackdrop } from "./ProfileCardBackdrop";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FeedHeaderProps {
  talentName?: string;
  talentPhoto?: string;
  talentProfession?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FeedHeader({ talentName, talentPhoto, talentProfession, isRefreshing }: FeedHeaderProps) {
  const navigate = useNavigate();
  const { balance } = useCredits();
  const { talent } = useTalent();
  const { info: career, volume } = useCareerLevel();
  const [textMode, setTextMode] = useState<"light" | "dark" | "auto">("auto");
  const [levelOpen, setLevelOpen] = useState(false);

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

  return (
    <>
      <div className="relative rounded-2xl border border-border/40 overflow-hidden bg-card">
        <ProfileCardBackdrop onTextColor={setTextMode} />
        <div className="relative px-3 py-2.5 flex items-center gap-3">
          <button
            onClick={() => navigate("/app/profile")}
            aria-label="Open profile"
            className="shrink-0 active:scale-95 transition-transform"
          >
            <Avatar className={cn("h-11 w-11 ring-2", isLight ? "ring-white/40" : "ring-border/40")}>
              <AvatarImage src={talentPhoto} alt={talentName || "Profile"} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={cn("text-sm font-semibold truncate", textCls)}>
                {talentName || "Welcome"}
              </h1>
              {isRefreshing && <RefreshCw className={cn("h-3 w-3 animate-spin shrink-0", isLight ? "text-white" : "text-primary")} />}
            </div>
            {subtitle && (
              <p className={cn("text-[11px] truncate", mutedCls)}>{subtitle}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => navigate("/app/transactions")}
                className={cn("flex items-center gap-1 text-[11px] font-semibold hover:opacity-80 transition", textCls)}
                aria-label="Wallet credits"
              >
                <Coins className="h-3 w-3 text-amber-400" />
                <span className="tabular-nums">{balance != null ? Number(balance).toFixed(1) : "0.0"}</span>
                <span className={cn("font-normal", mutedCls)}>cr</span>
              </button>

              <button
                onClick={() => setLevelOpen(true)}
                className="flex-1 flex items-center gap-1.5 min-w-0 group"
                aria-label="Career level"
              >
                <Trophy className={cn("h-3 w-3 shrink-0", isLight ? "text-white" : "text-primary")} />
                <span className={cn("text-[10px] font-semibold whitespace-nowrap", textCls)}>
                  Lv {career.level}
                </span>
                <div className={cn("flex-1 h-1.5 rounded-full overflow-hidden", isLight ? "bg-white/25" : "bg-muted")}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                    style={{ width: `${career.progressPct}%` }}
                  />
                </div>
                <span className={cn("text-[10px] font-semibold tabular-nums", mutedCls)}>
                  {career.progressPct}%
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setLevelOpen(true)}
            aria-label={`Career level ${career.level} ${career.label}`}
            className="shrink-0 active:scale-95 transition-transform"
          >
            <div
              className={cn(
                "rounded-xl px-2.5 py-1.5 flex flex-col items-center justify-center border min-w-[48px]",
                isLight
                  ? "bg-white/15 border-white/30 text-white"
                  : "bg-primary/10 border-primary/20 text-primary",
              )}
            >
              <div className="flex items-center gap-1 leading-none">
                <Trophy className="h-3 w-3" />
                <span className="text-xs font-bold tabular-nums">Lv {career.level}</span>
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium mt-0.5 leading-none truncate max-w-[60px]",
                  isLight ? "text-white/80" : "text-primary/70",
                )}
              >
                {career.label}
              </span>
            </div>
          </button>
        </div>
      </div>

      <Sheet open={levelOpen} onOpenChange={setLevelOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Career Level {career.level} · {career.label}
            </SheetTitle>
            <SheetDescription>
              Your level is based on lifetime credits transacted (earned + spent), not your current wallet balance.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border/40 bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Lifetime volume</span>
                <span className="tabular-nums font-semibold text-foreground">{Math.round(volume).toLocaleString()} cr</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${career.progressPct}%` }} />
              </div>
              {career.nextLabel && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {Math.round(career.toNext).toLocaleString()} cr to <span className="font-semibold text-foreground">{career.nextLabel}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Earn credits via streaks, referrals, and contributions. Spend credits on AI agents, courses, and services. Both count toward your level.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
