import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGtmGraph } from "hooks/useGtmGraph";
import { Globe, Map, MapPin, Network, Activity, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GtmOverviewTab() {
  const { gtmGraphQuery } = useGtmGraph();
  const { data, isLoading } = gtmGraphQuery;

  const topTalentCountries = data
    ? Object.entries(data.talentDensity).sort(([, a], [, b]) => b - a).slice(0, 6)
    : [];

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Global Operations</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Geographical Telemetry &amp; GTM Nodes
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricTile label="Countries" value={data.countries.length} icon={Globe} color="text-primary" bg="bg-primary/10" />
            <MetricTile label="Regions / States" value={data.regions.length} icon={Map} color="text-cyan-500" bg="bg-cyan-500/10" />
            <MetricTile label="Cities" value={data.cities.length} icon={MapPin} color="text-emerald-500" bg="bg-emerald-500/10" />
            <MetricTile label="Custom Clusters" value={data.clusters.length} icon={Network} color="text-amber-500" bg="bg-amber-500/10" />
          </div>

          {/* Maps & Data Splits */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Active Deployment Zones */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest">Active Deployment Zones</h3>
              </div>

              <Card className="border-2">
                <CardContent className="p-4">
                  {data.countries.length === 0 ? (
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-center py-10">
                      Zero Countries Deployed
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.countries.map((country) => {
                        const countryRegions = data.regions.filter((r) => r.country_id === country.id);
                        const talentCount = data.talentDensity[country.name] || 0;

                        return (
                          <div
                            key={country.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-dashed bg-background hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-12 rounded-lg bg-muted grid place-items-center font-mono font-black text-xs shrink-0">
                                {country.iso2}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{country.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] font-mono">
                                    {country.tier}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground">
                                    {countryRegions.length} regions
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                  Identities
                                </p>
                                <p className="text-base font-black tabular-nums">{talentCount}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    country.is_active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40",
                                  )}
                                />
                                <span className="text-[11px] font-bold uppercase tracking-wider">
                                  {country.is_active ? "Live" : "Dark"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Talent Density */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest">Talent Density</h3>
              </div>

              <Card className="border-2">
                <CardContent className="p-4">
                  {topTalentCountries.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">
                      No geographical talent data
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {topTalentCountries.map(([countryName, count], index) => {
                        const maxCount = topTalentCountries[0][1];
                        const percentage = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

                        return (
                          <div key={countryName} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge variant="outline" className="font-mono text-[10px] font-black shrink-0">
                                  #{index + 1}
                                </Badge>
                                <span className="text-xs font-bold truncate">{countryName}</span>
                              </div>
                              <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                                {count} nodes
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Knowledge Packs Mini-tile */}
              <Card className="border-2 border-dashed">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 grid place-items-center">
                    <Users className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Knowledge Packs
                    </p>
                    <p className="text-2xl font-black tabular-nums">
                      {data.knowledgePacks.length.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-2">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl grid place-items-center", bg)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
          <p className="text-2xl font-black tabular-nums">{value?.toLocaleString() || "0"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default GtmOverviewTab;
