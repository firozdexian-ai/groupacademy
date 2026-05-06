import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, RefreshCw } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useTalent } from "@/hooks/useTalent";
import { cn } from "@/lib/utils";

interface FeedHeaderProps {
  talentName?: string;
  talentPhoto?: string;
  talentProfession?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Slim identity strip at the top of the feed.
 * Avatar → profile · Credits chip → transactions · Completion bar → profile edit.
 */
export function FeedHeader({ talentName, talentPhoto, talentProfession, onRefresh, isRefreshing }: FeedHeaderProps) {
  const navigate = useNavigate();
  const { balance } = useCredits();
  const { talent } = useTalent();

  const initials =
    talentName
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  // Lightweight completion estimate based on key talent fields
  const completion = (() => {
    if (!talent) return 0;
    const checks = [
      !!talent.fullName,
      !!talent.profilePhotoUrl,
      !!talent.customProfession,
      !!talent.country,
      !!(talent as any).phone || !!(talent as any).whatsapp,
      !!(talent as any).cvUrl || !!(talent as any).resumeUrl,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  })();

  const country = talent?.country;
  const subtitle = [talentProfession, country].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl bg-card border border-border/40 px-3 py-2.5 flex items-center gap-3">
      <button
        onClick={() => navigate("/app/profile")}
        aria-label="Open profile"
        className="shrink-0 active:scale-95 transition-transform"
      >
        <Avatar className="h-11 w-11 ring-2 ring-border/40">
          <AvatarImage src={talentPhoto} alt={talentName || "Profile"} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-foreground truncate">
            {talentName || "Welcome"}
          </h1>
          {isRefreshing && <RefreshCw className="h-3 w-3 text-primary animate-spin shrink-0" />}
        </div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => navigate("/app/transactions")}
            className="flex items-center gap-1 text-[11px] font-semibold text-foreground hover:text-primary transition-colors"
            aria-label="View credits"
          >
            <Coins className="h-3 w-3 text-amber-500" />
            <span className="tabular-nums">{balance != null ? Number(balance).toFixed(1) : "0.0"}</span>
            <span className="text-muted-foreground font-normal">cr</span>
          </button>
          <button
            onClick={() => navigate("/app/profile/edit")}
            className="flex-1 flex items-center gap-1.5 min-w-0 group"
            aria-label="Profile completion"
          >
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  completion >= 80 ? "bg-emerald-500" : completion >= 50 ? "bg-primary" : "bg-amber-500",
                )}
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground tabular-nums">
              {completion}%
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
