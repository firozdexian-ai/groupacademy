import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Sparkles, Lock, Unlock, Rocket, Flame } from "lucide-react";

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
  const { talent: me } = useTalent();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("boosted");
  const [rows, setRows] = useState<TalentRow[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);
  const [boostUntil, setBoostUntil] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("talents")
        .select("country")
        .not("country", "is", null);
      const uniq = Array.from(new Set((data ?? []).map((r: any) => r.country).filter(Boolean))).sort();
      setCountries(uniq);
    })();
  }, []);

  useEffect(() => {
    if (!me?.id) return;
    (async () => {
      const { data } = await supabase
        .from("talent_inbox_settings")
        .select("boost_until")
        .eq("talent_id", me.id)
        .maybeSingle();
      setBoostUntil((data as any)?.boost_until ?? null);
    })();
  }, [me?.id, boosting]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      let query = supabase
        .from("talents")
        .select("id, full_name, profile_photo_url, custom_profession, country")
        .not("full_name", "is", null)
        .limit(60);
      if (q.trim()) query = query.ilike("full_name", `%${q.trim()}%`);
      if (country !== "all") query = query.eq("country", country);
      const { data: talents } = await query;
      const ids = (talents ?? []).map((t: any) => t.id);
      const [settingsRes, volRes, hypeRes] = await Promise.all([
        ids.length
          ? supabase.from("talent_inbox_settings").select("talent_id, unlocked, boost_until").in("talent_id", ids)
          : Promise.resolve({ data: [] as any[] }),
        ids.length
          ? supabase.from("v_talent_transaction_volume").select("talent_id, volume").in("talent_id", ids)
          : Promise.resolve({ data: [] as any[] }),
        ids.length
          ? supabase.from("post_hypes").select("recipient_talent_id").in("recipient_talent_id", ids)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const settingsMap = new Map(((settingsRes as any).data ?? []).map((s: any) => [s.talent_id, s]));
      const volMap = new Map(((volRes as any).data ?? []).map((v: any) => [v.talent_id, Number(v.volume ?? 0)]));
      const hypeMap = new Map<string, number>();
      ((hypeRes as any).data ?? []).forEach((h: any) => {
        hypeMap.set(h.recipient_talent_id, (hypeMap.get(h.recipient_talent_id) ?? 0) + 1);
      });
      let merged: TalentRow[] = (talents ?? []).map((t: any) => {
        const s: any = settingsMap.get(t.id);
        const boostedActive = s?.boost_until && new Date(s.boost_until) > new Date();
        return {
          ...t,
          inbox_unlocked: Boolean(s?.unlocked),
          boosted: Boolean(boostedActive),
          hype_count: hypeMap.get(t.id) ?? 0,
          volume: volMap.get(t.id) ?? 0,
        };
      });
      if (openOnly) merged = merged.filter((m) => m.inbox_unlocked);
      merged.sort((a, b) => {
        if (sortBy === "boosted") {
          if (a.boosted !== b.boosted) return a.boosted ? -1 : 1;
          return b.hype_count - a.hype_count;
        }
        if (sortBy === "hype") return b.hype_count - a.hype_count;
        if (sortBy === "volume") return b.volume - a.volume;
        return 0;
      });
      if (!cancelled) {
        setRows(merged);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, country, openOnly, sortBy]);

  const isBoosted = useMemo(() => boostUntil && new Date(boostUntil) > new Date(), [boostUntil]);

  const boost = async () => {
    setBoosting(true);
    const { error } = await supabase.rpc("boost_profile");
    setBoosting(false);
    if (error) {
      toast({ title: "Couldn't boost", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Boosted!", description: "Your profile is pinned for 24 hours." });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Talent Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover creators across the platform. Boosted profiles appear first.
          </p>
        </div>
        {me?.id && (
          <Button onClick={boost} disabled={boosting || !!isBoosted} variant={isBoosted ? "secondary" : "default"} className="gap-2">
            <Rocket className="h-4 w-4" />
            {isBoosted ? "Boosted (24h)" : boosting ? "Boosting…" : "Boost me · 100 cr"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="boosted">Boosted first</SelectItem>
            <SelectItem value="hype">Most hyped</SelectItem>
            <SelectItem value="volume">Top volume</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 px-3 rounded-md border">
          <Switch id="openOnly" checked={openOnly} onCheckedChange={setOpenOnly} />
          <Label htmlFor="openOnly" className="text-sm cursor-pointer">Open inbox</Label>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No talents found.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map((t) => (
            <Link key={t.id} to={`/app/talents/${t.id}`}>
              <Card className={`p-4 hover:shadow-md transition-shadow flex items-center gap-3 ${t.boosted ? "ring-2 ring-primary/40" : ""}`}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={t.profile_photo_url ?? undefined} />
                  <AvatarFallback>{t.full_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-1.5">
                    {t.full_name}
                    {t.boosted && <Rocket className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.custom_profession || "Talent"}{t.country ? ` · ${t.country}` : ""}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {t.hype_count > 0 && (
                      <span className="text-xs text-orange-500 flex items-center gap-0.5">
                        <Flame className="h-3 w-3" />{t.hype_count}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={t.inbox_unlocked ? "default" : "secondary"} className="gap-1">
                  {t.inbox_unlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {t.inbox_unlocked ? "Open" : "Closed"}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
