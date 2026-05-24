import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";

/**
 * B6 — Demand Signals widget.
 * Aggregates feature_waitlist rows to rank deferred surfaces by demand.
 * Read-only; relies on admin RLS on feature_waitlist.
 */

type Row = {
  feature_key: string;
  user_id: string | null;
  email: string | null;
  created_at: string;
};

type Aggregate = {
  key: string;
  total: number;
  unique: number;
  last7d: number;
  last24h: number;
};

const HOT_THRESHOLD = 10;

function aggregate(rows: Row[]): Aggregate[] {
  const now = Date.now();
  const D1 = 24 * 60 * 60 * 1000;
  const D7 = 7 * D1;
  const byKey = new Map<string, Row[]>();
  for (const r of rows) {
    // Group abroad-country-* under a single bucket per country slug
    const key = r.feature_key;
    const list = byKey.get(key) ?? [];
    list.push(r);
    byKey.set(key, list);
  }
  const out: Aggregate[] = [];
  for (const [key, list] of byKey) {
    const seen = new Set<string>();
    let last7d = 0;
    let last24h = 0;
    for (const r of list) {
      const id = r.user_id ?? r.email ?? `anon-${r.created_at}`;
      seen.add(id);
      const age = now - new Date(r.created_at).getTime();
      if (age <= D7) last7d++;
      if (age <= D1) last24h++;
    }
    out.push({ key, total: list.length, unique: seen.size, last7d, last24h });
  }
  return out.sort((a, b) => b.last7d - a.last7d || b.total - a.total);
}

export function DemandSignalsTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-feature-waitlist-signals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_waitlist")
        .select("feature_key,user_id,email,created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data as Row[];
    },
  });

  const aggregates = useMemo(() => (data ? aggregate(data) : []), [data]);

  return (
    <div className="space-y-3 p-3">
      <div>
        <h2 className="text-lg font-semibold">Demand signals</h2>
        <p className="text-sm text-muted-foreground">
          Waitlist signups across deferred (coming-soon) surfaces. Use to prioritise what to ship next.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-4 text-sm text-destructive">
          Failed to load signals. {(error as Error).message}
        </Card>
      ) : aggregates.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No waitlist signups yet.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-5">Feature</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-2 text-right">Unique</div>
            <div className="col-span-2 text-right">7d</div>
            <div className="col-span-1 text-right">24h</div>
          </div>
          <div className="divide-y">
            {aggregates.map((a) => (
              <div key={a.key} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm items-center">
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs truncate">{a.key}</span>
                  {a.last7d >= HOT_THRESHOLD && (
                    <Badge variant="secondary" className="gap-1">
                      <Flame className="h-3 w-3" /> Hot
                    </Badge>
                  )}
                </div>
                <div className="col-span-2 text-right tabular-nums">{a.total}</div>
                <div className="col-span-2 text-right tabular-nums">{a.unique}</div>
                <div className="col-span-2 text-right tabular-nums">{a.last7d}</div>
                <div className="col-span-1 text-right tabular-nums text-muted-foreground">{a.last24h}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default DemandSignalsTab;
