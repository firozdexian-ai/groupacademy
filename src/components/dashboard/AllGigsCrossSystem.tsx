import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Coins, RotateCcw, Sparkles, Briefcase, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

type Source = "quick" | "project" | "content";

interface UnifiedGig {
  id: string;
  source: Source;
  title: string;
  facet: string | null;
  reward: number;
  status: string;
  claimed_by: string | null;
  created_at: string;
}

const SOURCE_META: Record<Source, { label: string; icon: any; tone: string }> = {
  quick: { label: "Quick", icon: Sparkles, tone: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  project: { label: "Project", icon: Briefcase, tone: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  content: { label: "Content", icon: Hammer, tone: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
};

export function AllGigsCrossSystem() {
  const [items, setItems] = useState<UnifiedGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");

  const load = async () => {
    setLoading(true);
    const [quick, project, content] = await Promise.all([
      supabase.from("gigs").select("id, title, category, credit_reward, is_active, created_at"),
      supabase.from("marketplace_gigs").select("id, title, skill_category, budget_amount, status, created_at"),
      supabase
        .from("content_gigs" as any)
        .select("id, title, school_id, resource_type, credit_reward, status, claimed_by, created_at"),
    ]);

    const all: UnifiedGig[] = [];

    (quick.data || []).forEach((g: any) =>
      all.push({
        id: g.id,
        source: "quick",
        title: g.title,
        facet: g.category,
        reward: Number(g.credit_reward) || 0,
        status: g.is_active ? "active" : "inactive",
        claimed_by: null,
        created_at: g.created_at,
      }),
    );
    (project.data || []).forEach((g: any) =>
      all.push({
        id: g.id,
        source: "project",
        title: g.title,
        facet: g.skill_category,
        reward: Number(g.budget_amount) || 0,
        status: g.status,
        claimed_by: null,
        created_at: g.created_at,
      }),
    );
    (content.data as any[] || []).forEach((g) =>
      all.push({
        id: g.id,
        source: "content",
        title: g.title,
        facet: g.resource_type,
        reward: Number(g.credit_reward) || 0,
        status: g.status,
        claimed_by: g.claimed_by,
        created_at: g.created_at,
      }),
    );

    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(all);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((g) => {
      if (sourceFilter !== "all" && g.source !== sourceFilter) return false;
      if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, search, sourceFilter]);

  const counts = useMemo(() => {
    const c = { quick: 0, project: 0, content: 0 } as Record<Source, number>;
    items.forEach((g) => (c[g.source] += 1));
    return c;
  }, [items]);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold">All gigs (cross-system)</h2>
          <p className="text-xs text-muted-foreground">
            Unified view across Quick gigs, Marketplace projects, and Content Studio.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load}>
          <RotateCcw className="h-3.5 w-3.5 mr-2" /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9"
        />
        {(["all", "quick", "project", "content"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={sourceFilter === s ? "default" : "outline"}
            onClick={() => setSourceFilter(s as any)}
            className="h-8 text-[11px] capitalize"
          >
            {s === "all" ? `All (${items.length})` : `${s} (${counts[s as Source]})`}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.map((g) => {
          const meta = SOURCE_META[g.source];
          const Icon = meta.icon;
          return (
            <Card key={`${g.source}-${g.id}`} className="p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className={cn("text-[10px] font-bold border", meta.tone)}>
                      <Icon className="h-3 w-3 mr-1" />
                      {meta.label}
                    </Badge>
                    {g.facet && (
                      <Badge variant="secondary" className="text-[10px] font-bold capitalize">
                        {String(g.facet).replace(/_/g, " ")}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {g.status}
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm mt-1 truncate">{g.title}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-primary">
                  <Coins className="h-3.5 w-3.5" />
                  <span className="text-sm font-bold tabular-nums">{g.reward}</span>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground col-span-full">No gigs match these filters.</Card>
        )}
      </div>
    </div>
  );
}

export default AllGigsCrossSystem;
