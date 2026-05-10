import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Briefcase,
  Globe,
  AlertCircle,
  DatabaseZap,
  Clock,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Global CRM Command Center
 * 2026 Standard: Blended Phase 6 UI (Deep Telemetry & Funnel Analysis)
 */

type Bucket = { label: string; value: number };

interface OverviewData {
  total: number;
  newToday: number;
  new7d: number;
  new30d: number;
  prev7d: number;
  prev30d: number;
  withCV: number;
  withProfession: number;
  withRole: number;
  recent: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    country: string | null;
    created_at: string;
    cv_url: string | null;
    profession: string | null;
  }>;
  byCategory: Bucket[];
  byCountry: Bucket[];
  byRole: Bucket[];
  funnel: {
    started: number;
    emailCaptured: number;
    completedSignup: number;
    profileComplete: number;
    cvParsed: number;
  };
}

const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

export function TalentOverviewTab() {
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["talent-overview-deep-telemetry"],
    queryFn: async () => {
      const today = iso(daysAgo(1));
      const t7 = iso(daysAgo(7));
      const t14 = iso(daysAgo(14));
      const t30 = iso(daysAgo(30));
      const t60 = iso(daysAgo(60));

      const counts = async (gte?: string, lt?: string) => {
        let q = supabase.from("talents").select("id", { head: true, count: "exact" });
        if (gte) q = q.gte("created_at", gte);
        if (lt) q = q.lt("created_at", lt);
        const { count } = await q;
        return count ?? 0;
      };

      const [total, newToday, new7d, new30d, prev7d, prev30d, withCVCount, withProfCount, withRoleCount] =
        await Promise.all([
          counts(),
          counts(today),
          counts(t7),
          counts(t30),
          counts(t14, t7),
          counts(t60, t30),
          (async () => {
            const { count } = await supabase
              .from("talents")
              .select("id", { head: true, count: "exact" })
              .not("cv_url", "is", null);
            return count ?? 0;
          })(),
          (async () => {
            const { count } = await supabase
              .from("talents")
              .select("id", { head: true, count: "exact" })
              .not("profession_category_id", "is", null);
            return count ?? 0;
          })(),
          (async () => {
            const { count } = await supabase
              .from("talents")
              .select("id", { head: true, count: "exact" })
              .not("professional_role_id", "is", null);
            return count ?? 0;
          })(),
        ]);

      const { data: recentRows } = await supabase
        .from("talents")
        .select(
          "id, full_name, email, country, created_at, cv_url, profession_category_id, profession_categories(name)",
        )
        .order("created_at", { ascending: false })
        .limit(20);
      const recent = (recentRows ?? []).map((r: any) => ({
        id: r.id,
        full_name: r.full_name,
        email: r.email,
        country: r.country,
        created_at: r.created_at,
        cv_url: r.cv_url,
        profession: r.profession_categories?.name ?? null,
      }));

      const { data: rows } = await supabase
        .from("talents")
        .select(
          "country, profession_category_id, professional_role_id, profession_categories(name), professional_roles(name)",
        )
        .limit(5000);
      const groupBy = (arr: any[], key: (r: any) => string | null, limit: number): Bucket[] => {
        const map = new Map<string, number>();
        for (const r of arr) {
          const k = key(r);
          if (!k) continue;
          map.set(k, (map.get(k) ?? 0) + 1);
        }
        return [...map.entries()]
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit);
      };

      const byCategory = groupBy(rows ?? [], (r) => r.profession_categories?.name ?? null, 15);
      const byCountry = groupBy(rows ?? [], (r) => r.country, 10);
      const byRole = groupBy(rows ?? [], (r) => r.professional_roles?.name ?? null, 15);

      const aishaCount = async (filter?: (q: any) => any) => {
        let q = supabase.from("aisha_conversations").select("id", { head: true, count: "exact" });
        if (filter) q = filter(q);
        const { count } = await q;
        return count ?? 0;
      };

      const [started, emailCaptured, completedSignup] = await Promise.all([
        aishaCount(),
        aishaCount((q) => q.not("email", "is", null)),
        aishaCount((q) => q.not("completed_at", "is", null)),
      ]);

      const { count: profileCompleteCount } = await supabase
        .from("talents")
        .select("id", { head: true, count: "exact" })
        .not("cv_url", "is", null)
        .not("profession_category_id", "is", null)
        .not("phone", "is", null);
      const { count: cvParsedCount } = await supabase
        .from("talents")
        .select("id", { head: true, count: "exact" })
        .not("cv_parsed_at", "is", null);

      return {
        total,
        newToday,
        new7d,
        new30d,
        prev7d,
        prev30d,
        withCV: withCVCount,
        withProfession: withProfCount,
        withRole: withRoleCount,
        recent,
        byCategory,
        byCountry,
        byRole,
        funnel: {
          started,
          emailCaptured,
          completedSignup,
          profileComplete: profileCompleteCount ?? 0,
          cvParsed: cvParsedCount ?? 0,
        },
      };
    },
  });

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const delta = (cur: number, prev: number) => (prev ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Phase 6 Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-indigo-500">
            <DatabaseZap className="h-8 w-8 text-indigo-500 fill-indigo-500/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Global CRM
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Pipeline Health · Funnel Friction · Global Node Identity
          </p>
        </div>
        <Badge
          variant="outline"
          className="h-12 px-6 rounded-xl font-black uppercase text-xs tracking-widest gap-2 border-indigo-500/50 text-indigo-600 bg-indigo-500/10 animate-pulse"
        >
          <Activity className="h-4 w-4" /> Telemetry Active
        </Badge>
      </header>

      {isLoading || !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[32px] border-2 border-border/40 bg-muted/40" />
          ))}
          <Skeleton className="col-span-2 md:col-span-4 h-[400px] rounded-[40px] border-2 border-border/40 bg-muted/40" />
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricTile
              label="Total Nodes"
              value={data.total}
              icon={Users}
              color="text-indigo-500"
              bg="bg-indigo-500/10"
            />
            <MetricTile
              label="New (24H)"
              value={data.newToday}
              icon={UserCheck}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <MetricTile
              label="New (7D)"
              value={data.new7d}
              icon={Activity}
              color="text-blue-500"
              bg="bg-blue-500/10"
              trend={`${delta(data.new7d, data.prev7d) >= 0 ? "+" : ""}${delta(data.new7d, data.prev7d)}%`}
            />
            <MetricTile
              label="New (30D)"
              value={data.new30d}
              icon={Globe}
              color="text-fuchsia-500"
              bg="bg-fuchsia-500/10"
              trend={`${delta(data.new30d, data.prev30d) >= 0 ? "+" : ""}${delta(data.new30d, data.prev30d)}%`}
            />
            <MetricTile
              label="With CV"
              value={`${pct(data.withCV, data.total)}%`}
              icon={FileText}
              color="text-amber-500"
              bg="bg-amber-500/10"
            />
            <MetricTile
              label="Tagged Profession"
              value={`${pct(data.withProfession, data.total)}%`}
              icon={Briefcase}
              color="text-orange-500"
              bg="bg-orange-500/10"
            />
            <MetricTile
              label="Tagged Role"
              value={`${pct(data.withRole, data.total)}%`}
              icon={Briefcase}
              color="text-rose-500"
              bg="bg-rose-500/10"
            />
            <MetricTile
              label="Profile Complete"
              value={`${pct(data.funnel.profileComplete, data.total)}%`}
              icon={ShieldCheck}
              color="text-teal-500"
              bg="bg-teal-500/10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Onboarding Funnel */}
            <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative text-left">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-10 bg-primary pointer-events-none" />
              <div className="p-8 space-y-8 relative z-10">
                <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border-2 border-blue-500/20">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-foreground">
                      Welcome AI Funnel
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Node Onboarding Pipeline
                    </p>
                  </div>
                </div>
                <div className="grid gap-5">
                  <FunnelRow
                    label="Started Chat"
                    value={data.funnel.started}
                    max={data.funnel.started || 1}
                    color="from-blue-400 to-blue-600"
                  />
                  <FunnelRow
                    label="Email Captured"
                    value={data.funnel.emailCaptured}
                    max={data.funnel.started || 1}
                    color="from-indigo-400 to-indigo-600"
                  />
                  <FunnelRow
                    label="Completed Signup"
                    value={data.funnel.completedSignup}
                    max={data.funnel.started || 1}
                    color="from-violet-400 to-violet-600"
                  />
                  <FunnelRow
                    label="Profile Complete"
                    value={data.funnel.profileComplete}
                    max={data.total || 1}
                    color="from-fuchsia-400 to-fuchsia-600"
                  />
                  <FunnelRow
                    label="CV Parsed"
                    value={data.funnel.cvParsed}
                    max={data.total || 1}
                    color="from-emerald-400 to-emerald-600"
                  />
                </div>
              </div>
            </Card>

            {/* Recent Signups */}
            <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden text-left">
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-8 border-b border-border/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-foreground">
                      Recent Registrations
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Latest Global Nodes
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 max-h-[420px]">
                <div className="space-y-2">
                  {data.recent.length === 0 && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 text-center py-12 italic">
                      No recent signups
                    </p>
                  )}
                  {data.recent.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/40 transition-all border-2 border-transparent hover:border-border/40 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-sm uppercase italic tracking-tight truncate group-hover:text-emerald-500 transition-colors">
                          {r.full_name || r.email || "Unknown User"}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate flex items-center gap-2 mt-1">
                          <span className="truncate max-w-[80px] sm:max-w-none">{r.country || "No Location"}</span>
                          <span>·</span>
                          <span className="truncate">{r.profession || "Untagged"}</span>
                          <span>·</span>
                          <Badge
                            variant={r.cv_url ? "default" : "secondary"}
                            className={cn(
                              "px-2 py-0 h-4 text-[8px] rounded-sm font-black border-none",
                              r.cv_url ? "bg-emerald-500/20 text-emerald-600" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {r.cv_url ? "CV" : "NO CV"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground/60 whitespace-nowrap ml-4 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{" "}
                        {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BarBreakdown title="By Profession" icon={Briefcase} data={data.byCategory} color="blue" />
            <BarBreakdown title="By Country" icon={Globe} data={data.byCountry} color="fuchsia" />
            <BarBreakdown title="By Role" icon={Briefcase} data={data.byRole} color="amber" />
          </div>
        </>
      )}
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg, trend }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden hover:border-primary/30 transition-all group text-left">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-6 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1 truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black italic tracking-tighter leading-none text-foreground/90">
              {value?.toLocaleString() || "0"}
            </p>
            {trend && (
              <Badge
                variant="outline"
                className={cn(
                  "font-black text-[9px] uppercase tracking-widest px-1.5 border-none",
                  trend.startsWith("+") ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive",
                )}
              >
                {trend}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-2 p-4 rounded-2xl border-2 border-border/10 bg-muted/10 transition-all hover:bg-muted/20">
      <div className="flex justify-between items-end text-sm">
        <span className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">{label}</span>
        <div className="flex items-center gap-3">
          <span className="font-black text-xl italic tracking-tighter leading-none">{value.toLocaleString()}</span>
          <Badge
            variant="outline"
            className="font-black text-[10px] w-12 justify-center border-2 border-border/20 bg-background"
          >
            {pct}%
          </Badge>
        </div>
      </div>
      <div className="h-3 bg-background rounded-full overflow-hidden shadow-inner border border-border/5">
        <div
          className={cn("h-full transition-all duration-1000 ease-out rounded-full bg-gradient-to-r", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BarBreakdown({ title, icon: Icon, data, color }: { title: string; icon: any; data: Bucket[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  const gradientMap: Record<string, string> = {
    blue: "from-blue-400 to-indigo-500",
    fuchsia: "from-fuchsia-400 to-pink-500",
    amber: "from-amber-400 to-orange-500",
  };

  const bgGradient = gradientMap[color] || gradientMap.blue;

  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg flex flex-col overflow-hidden text-left">
      <div className={cn("h-1.5 w-full bg-gradient-to-r", bgGradient)} />
      <div className="p-6 border-b border-border/10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic flex items-center gap-2 text-foreground/70">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[350px]">
        {data.length === 0 && (
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 text-center py-8 italic">
            No data available.
          </p>
        )}
        {data.map((d) => (
          <div key={d.label} className="space-y-1.5 group">
            <div className="flex justify-between items-end text-sm px-1">
              <span className="truncate pr-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                {d.label}
              </span>
              <span className="font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors">
                {d.value.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 bg-background rounded-full overflow-hidden shadow-inner border border-border/5">
              <div
                className={cn(
                  "h-full rounded-full transition-all bg-gradient-to-r opacity-80 group-hover:opacity-100",
                  bgGradient,
                )}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default TalentOverviewTab;
