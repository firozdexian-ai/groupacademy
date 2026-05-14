import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGtmDashboard } from "./hooks/useGtmGraph";
import { Globe, Map, MapPin, Network, Activity, Users, BarChart3, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function GtmOverviewTab() {
  const { data, isLoading } = useGtmDashboard();

  const topTalentCountries = data
    ? [...data.countries].filter(c => c.talent_count > 0).sort((a, b) => b.talent_count - a.talent_count).slice(0, 6)
    : [];
  const maxTalent = topTalentCountries[0]?.talent_count ?? 0;

  return (
    <div className="space-y-6">
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

      {isLoading || !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricTile label="Countries" value={data.totals.countries} icon={Globe} color="text-primary" bg="bg-primary/10" />
            <MetricTile label="Regions / States" value={data.totals.regions} icon={Map} color="text-cyan-500" bg="bg-cyan-500/10" />
            <MetricTile label="Cities" value={data.totals.cities} icon={MapPin} color="text-emerald-500" bg="bg-emerald-500/10" />
            <MetricTile label="Custom Clusters" value={data.totals.clusters} icon={Network} color="text-amber-500" bg="bg-amber-500/10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                      {data.countries.map((country) => (
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
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <Badge variant="outline" className="text-[10px] font-mono">{country.tier}</Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {country.region_count} regions · {country.city_count} cities
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Identities</p>
                              <p className="text-base font-black tabular-nums">{country.talent_count}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={cn("h-2 w-2 rounded-full", country.is_active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")} />
                              <span className="text-[11px] font-bold uppercase tracking-wider">
                                {country.is_active ? "Live" : "Dark"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {data.unmapped_talent_count > 0 && (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-12 rounded-lg bg-amber-500/10 grid place-items-center shrink-0">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm">Unmapped Talents</p>
                              <p className="text-[11px] text-muted-foreground">Country value not in registry</p>
                            </div>
                          </div>
                          <p className="text-base font-black tabular-nums text-amber-600">{data.unmapped_talent_count}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

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
                      {topTalentCountries.map((country, index) => {
                        const percentage = maxTalent > 0 ? Math.round((country.talent_count / maxTalent) * 100) : 0;
                        return (
                          <div key={country.id} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge variant="outline" className="font-mono text-[10px] font-black shrink-0">#{index + 1}</Badge>
                                <span className="text-xs font-bold truncate">{country.name}</span>
                              </div>
                              <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                                {country.talent_count} nodes
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 grid place-items-center">
                    <Users className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Knowledge Packs</p>
                    <p className="text-2xl font-black tabular-nums">{data.totals.knowledge_packs.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: any; color: string; bg: string; }) {
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
