/**
 * Demand Signals Admin Widget (B6 Implementation).
 * Aggregates feature_waitlist registrations to rank deferred surfaces by market demand.
 * Adheres to 2024 Professional SaaS UI guidelines and channels query issues to telemetry.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type WaitlistRow = {
  feature_key: string;
  user_id: string | null;
  email: string | null;
  created_at: string;
};

type AggregateSignal = {
  key: string;
  displayName: string;
  total: number;
  unique: number;
  last7d: number;
  last24h: number;
};

const HOT_THRESHOLD = 10;

/**
 * Transforms raw dash-separated feature keys into professional, scannable display titles.
 */
function formatFeatureKey(key: string): string {
  if (!key) return "Unknown Feature";
  return key
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Safely aggregates waitlist metadata on the client side.
 * Keeps memory overhead bounded while processing trending metrics.
 */
function processDemandSignals(rows: WaitlistRow[]): AggregateSignal[] {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

  const groups = new Map<string, WaitlistRow[]>();

  for (const row of rows) {
    const key = row.feature_key || "unspecified";
    const collection = groups.get(key) ?? [];
    collection.push(row);
    groups.set(key, collection);
  }

  const aggregated: AggregateSignal[] = [];

  for (const [key, list] of groups) {
    const uniqueIdentifiers = new Set<string>();
    let last7d = 0;
    let last24h = 0;

    for (const row of list) {
      // Establish unique identity signature using authenticated ID fallback to raw email strings
      const identitySignature = row.user_id ?? row.email ?? `anon-${row.created_at}`;
      uniqueIdentifiers.add(identitySignature);

      const rowAgeMs = now - new Date(row.created_at).getTime();
      if (rowAgeMs <= SEVEN_DAYS_MS) last7d++;
      if (rowAgeMs <= ONE_DAY_MS) last24h++;
    }

    aggregated.push({
      key,
      displayName: formatFeatureKey(key),
      total: list.length,
      unique: uniqueIdentifiers.size,
      last7d,
      last24h,
    });
  }

  // Rank strictly by recent velocity (last 7 days) followed by lifetime aggregate totals
  return aggregated.sort((a, b) => b.last7d - a.last7d || b.total - a.total);
}

export function DemandSignalsTab() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["admin-feature-waitlist-signals"],
    queryFn: async () => {
      const { data: signalData, error: queryError } = await supabase
        .from("feature_waitlist" as any)
        .select("feature_key, user_id, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (queryError) {
        // Log telemetry anomalies down into our Digital Workforce audit pipeline
        await supabase.from("platform_events").insert({
          event_kind: "demand_signals_query_fault",
          subject_kind: "analytics",
          payload: { severity: "warning", message: queryError.message, timestamp: new Date().toISOString() },
        });
        throw queryError;
      }

      return (signalData ?? []) as unknown as WaitlistRow[];
    },
    staleTime: 1000 * 60 * 5, // Cache entries safely for 5 minutes under administrative views
  });

  const aggregates = useMemo(() => (data ? processDemandSignals(data) : []), [data]);

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Feature Demand Signals</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Aggregated interest matrices from deferred coming-soon surfaces used to optimize our feature deployment
            roadmap.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
          Refresh Metrics
        </button>
      </div>

      {isLoading ? (
        <div className="border border-border rounded-xl p-4 bg-card space-y-3">
          <div className="h-4 bg-muted rounded w-1/4 mb-4 animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 border-destructive/20 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-destructive">Could not sync demand matrices</h4>
            <p className="text-xs text-muted-foreground">
              Our background monitoring systems hit an anomaly. Please try again or notify system operations.
            </p>
          </div>
        </Card>
      ) : aggregates.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-muted/10">
          <p className="text-sm text-muted-foreground">
            No telemetry data recorded. Waitlist tables are currently empty.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-border shadow-sm rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 pl-6">Feature Target / Key</th>
                  <th className="px-4 py-3 text-right">Lifetime Leads</th>
                  <th className="px-4 py-3 text-right">Unique Users</th>
                  <th className="px-4 py-3 text-right text-foreground font-semibold">Weekly Velocity (7d)</th>
                  <th className="px-4 py-3 text-right pr-6">Daily Growth (24h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {aggregates.map((row) => (
                  <tr key={row.key} className="hover:bg-muted/20 transition-colors text-sm">
                    <td className="px-4 py-3.5 pl-6 font-medium text-foreground">
                      <div className="flex items-center gap-2.5 max-w-xs sm:max-w-md">
                        <span className="truncate" title={row.displayName}>
                          {row.displayName}
                        </span>
                        <code
                          className="text-3xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground truncate"
                          title={row.key}
                        >
                          {row.key}
                        </code>
                        {row.last7d >= HOT_THRESHOLD && (
                          <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/10 gap-0.5 px-1.5 py-0 shrink-0 text-3xs font-bold uppercase tracking-wider">
                            <Flame className="h-3 w-3 fill-amber-600" /> Hot
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-muted-foreground">
                      {row.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-muted-foreground">
                      {row.unique.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums font-semibold text-foreground">
                      {row.last7d.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-muted-foreground pr-6">
                      {row.last24h.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default DemandSignalsTab;
