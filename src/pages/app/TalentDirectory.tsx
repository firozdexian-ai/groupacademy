import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Lock, Unlock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TalentRow {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  custom_profession: string | null;
  country: string | null;
  inbox_unlocked: boolean;
}

export default function TalentDirectory() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<TalentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      let query = supabase
        .from("talents")
        .select("id, full_name, profile_photo_url, custom_profession, country")
        .not("full_name", "is", null)
        .order("updated_at", { ascending: false })
        .limit(40);
      if (q.trim()) query = query.ilike("full_name", `%${q.trim()}%`);
      const { data: talents } = await query;
      const ids = (talents ?? []).map((t: any) => t.id);
      const { data: settings } = ids.length
        ? await supabase
            .from("talent_inbox_settings")
            .select("talent_id, unlocked")
            .in("talent_id", ids)
        : { data: [] as any[] };
      const unlockedSet = new Set(
        (settings ?? []).filter((s: any) => s.unlocked).map((s: any) => s.talent_id),
      );
      if (cancelled) return;
      setRows(
        (talents ?? []).map((t: any) => ({
          ...t,
          inbox_unlocked: unlockedSet.has(t.id),
        })),
      );
      setLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Talent Directory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover creators across the platform. Connect with unlocked inboxes — pricing scales with their activity.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No talents found.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map((t) => (
            <Link key={t.id} to={`/app/talents/${t.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={t.profile_photo_url ?? undefined} />
                  <AvatarFallback>{t.full_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.custom_profession || "Talent"}{t.country ? ` · ${t.country}` : ""}
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
