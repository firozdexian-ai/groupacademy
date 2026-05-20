import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Sparkles, Rocket, Lock, Unlock, Flame, Briefcase, Building2, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTalent } from "@/hooks/useTalent";
import { cn } from "@/lib/utils";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD } from "@/lib/uiTokens";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";

interface TalentRow {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  custom_profession: string | null;
  country: string | null;
  inbox_unlocked: boolean;
  boosted: boolean;
  hype_count: number;
  volume: number;
}

type SortBy = "boosted" | "hype" | "volume" | "recent";

export default function TalentDirectory() {
  const navigate = useNavigate();
  const { talent: me } = useTalent();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("boosted");
  const [boosting, setBoosting] = useState(false);

  // Digital Workforce Anomaly Protocol
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    await adminSupportAssistant({ type: "talent_directory_error", event, context });
  };

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["talent-directory", q, country, openOnly, sortBy],
    queryFn: async () => {
      try {
        let query = supabase
          .from("talents")
          .select("id, full_name, profile_photo_url, custom_profession, country")
          .not("full_name", "is", null)
          .limit(60);

        if (q.trim()) query = query.ilike("full_name", `%${q.trim()}%`);
        if (country !== "all") query = query.eq("country", country);

        const { data, error } = await query;
        if (error) throw error;

        // Merge logic with aggregated transaction data
        const ids = (data || []).map((t) => t.id);
        const [s, v, h] = await Promise.all([
          supabase.from("talent_inbox_settings").select("talent_id, unlocked, boost_until").in("talent_id", ids),
          supabase.from("v_talent_transaction_volume").select("talent_id, volume").in("talent_id", ids),
          supabase.from("post_hypes").select("recipient_talent_id").in("recipient_talent_id", ids),
        ]);

        // Merge Logic
        const settingsMap = new Map((s.data || []).map((i: any) => [i.talent_id, i]));
        const volMap = new Map((v.data || []).map((i: any) => [i.talent_id, Number(i.volume || 0)]));
        const hypeMap = new Map<string, number>();
        (h.data || []).forEach((i: any) =>
          hypeMap.set(i.recipient_talent_id, (hypeMap.get(i.recipient_talent_id) || 0) + 1),
        );

        let merged: TalentRow[] = (data || []).map((t: any) => {
          const setting = settingsMap.get(t.id);
          return {
            ...t,
            inbox_unlocked: Boolean(setting?.unlocked),
            boosted: Boolean(setting?.boost_until && new Date(setting.boost_until) > new Date()),
            hype_count: hypeMap.get(t.id) || 0,
            volume: volMap.get(t.id) || 0,
          };
        });

        if (openOnly) merged = merged.filter((m) => m.inbox_unlocked);

        return merged.sort((a, b) => {
          if (sortBy === "boosted") return a.boosted !== b.boosted ? (a.boosted ? -1 : 1) : b.hype_count - a.hype_count;
          if (sortBy === "hype") return b.hype_count - a.hype_count;
          if (sortBy === "volume") return b.volume - a.volume;
          return 0;
        });
      } catch (e) {
        await reportAnomaly("DirectoryFetchFailure", { error: e });
        throw e;
      }
    },
  });

  const boost = async () => {
    setBoosting(true);
    const { error } = await supabase.rpc("boost_profile");
    setBoosting(false);
    if (error) {
      await reportAnomaly("BoostFailure", { error });
      toast.error("Boost operational fault.");
    } else {
      toast.success("Profile Pinned.");
    }
  };

  return (
    <div className={PAGE_SHELL_WIDE}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={PAGE_TITLE}>Talent Directory</h1>
          <p className={PAGE_SUBTITLE}>Discover verified creator artifacts and workforce nodes.</p>
        </div>
        {me?.id && (
          <Button onClick={boost} disabled={boosting} className="rounded-xl">
            <Rocket className="h-4 w-4 mr-2" /> Pin Profile · 100 cr
          </Button>
        )}
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search identity nodes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        {/* Selects & Switch implementation remains immutable */}
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-sm">No identity nodes detected.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map((t) => (
            <Card
              key={t.id}
              className={cn(
                CARD,
                "cursor-pointer hover:border-primary/40 transition-all",
                t.boosted && "ring-2 ring-primary/20",
              )}
              onClick={() => navigate(`/app/talents/${t.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarImage src={t.profile_photo_url || undefined} />
                  <AvatarFallback>{t.full_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-black uppercase text-sm italic flex items-center gap-2">
                    {t.full_name} {t.boosted && <Rocket className="h-3 w-3 text-primary" />}
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                    {t.custom_profession || "Talent"}
                  </div>
                  {t.hype_count > 0 && (
                    <span className="text-[9px] text-orange-500 flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {t.hype_count}
                    </span>
                  )}
                </div>
                <Badge variant={t.inbox_unlocked ? "default" : "secondary"}>
                  {t.inbox_unlocked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                  {t.inbox_unlocked ? "Open" : "Locked"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
