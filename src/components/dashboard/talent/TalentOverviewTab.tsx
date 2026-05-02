/**
 * Talent Overview — KPIs and breakdowns of the talent pipeline.
 * Pure read-only queries against talents + profession_categories +
 * professional_roles + aisha_conversations.
 */
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Briefcase,
  Globe,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import StatsCard from "@/components/dashboard/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
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

        const [
          total,
          newToday,
          new7d,
          new30d,
          prev7d,
          prev30d,
          withCVCount,
          withProfCount,
          withRoleCount,
        ] = await Promise.all([
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

        // Recent signups
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

        // Breakdowns: pull a wide slice and group client-side
        const { data: rows } = await supabase
          .from("talents")
          .select("country, profession_category_id, professional_role_id, profession_categories(name), professional_roles(name)")
          .limit(5000);

        const groupBy = (
          arr: any[],
          key: (r: any) => string | null,
          limit: number,
        ): Bucket[] => {
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

        const byCategory = groupBy(
          rows ?? [],
          (r) => r.profession_categories?.name ?? null,
          15,
        );
        const byCountry = groupBy(rows ?? [], (r) => r.country, 10);
        const byRole = groupBy(rows ?? [], (r) => r.professional_roles?.name ?? null, 15);

        // Aisha funnel
        const aishaCount = async (filter?: (q: any) => any) => {
          let q = supabase
            .from("aisha_conversations")
            .select("id", { head: true, count: "exact" });
          if (filter) q = filter(q);
          const { count } = await q;
          return count ?? 0;
        };
        const [started, emailCaptured, completedSignup] = await Promise.all([
          aishaCount(),
          aishaCount((q) => q.not("email", "is", null)),
          aishaCount((q) => q.not("completed_at", "is", null)),
        ]);

        // Profile complete = has CV + has profession + has phone
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

        if (!mounted) return;
        setData({
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
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const delta = (cur: number, prev: number) =>
    prev ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <LayoutDashboard className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
              Talent Overview
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Pipeline · completeness · onboarding funnel
          </p>
        </div>
      </header>

      {loading || !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title="Total Talents" value={data.total.toLocaleString()} icon={Users} />
            <StatsCard
              title="New (today)"
              value={data.newToday.toLocaleString()}
              icon={UserCheck}
            />
            <StatsCard
              title="New (7d)"
              value={data.new7d.toLocaleString()}
              icon={UserCheck}
              trend={`${delta(data.new7d, data.prev7d) >= 0 ? "+" : ""}${delta(data.new7d, data.prev7d)}%`}
              trendLabel="vs prev 7d"
            />
            <StatsCard
              title="New (30d)"
              value={data.new30d.toLocaleString()}
              icon={UserCheck}
              trend={`${delta(data.new30d, data.prev30d) >= 0 ? "+" : ""}${delta(data.new30d, data.prev30d)}%`}
              trendLabel="vs prev 30d"
            />
            <StatsCard
              title="With CV"
              value={`${pct(data.withCV, data.total)}%`}
              icon={FileText}
            />
            <StatsCard
              title="Tagged Profession"
              value={`${pct(data.withProfession, data.total)}%`}
              icon={Briefcase}
            />
            <StatsCard
              title="Tagged Role"
              value={`${pct(data.withRole, data.total)}%`}
              icon={Briefcase}
            />
            <StatsCard
              title="Profile Complete"
              value={`${pct(data.funnel.profileComplete, data.total)}%`}
              icon={UserCheck}
            />
          </div>

          {/* Onboarding funnel */}
          <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] italic">
                Onboarding Funnel (Aisha)
              </h3>
            </div>
            <FunnelRow label="Started chat" value={data.funnel.started} max={data.funnel.started || 1} />
            <FunnelRow label="Email captured" value={data.funnel.emailCaptured} max={data.funnel.started || 1} />
            <FunnelRow label="Completed signup" value={data.funnel.completedSignup} max={data.funnel.started || 1} />
            <FunnelRow label="Profile complete" value={data.funnel.profileComplete} max={data.total || 1} />
            <FunnelRow label="CV parsed" value={data.funnel.cvParsed} max={data.total || 1} />
          </Card>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarBreakdown title="By Profession Category" icon={Briefcase} data={data.byCategory} />
            <BarBreakdown title="By Country" icon={Globe} data={data.byCountry} />
            <BarBreakdown title="By Professional Role" icon={Briefcase} data={data.byRole} />
            <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl p-6 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] italic flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Recent Signups
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.recent.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-sm border-b border-border/20 pb-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.full_name || r.email || "—"}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {r.country || "—"} · {r.profession || "untagged"} ·{" "}
                        {r.cv_url ? "CV ✓" : "no CV"}
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap ml-3">
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold">
          {value.toLocaleString()} <span className="text-muted-foreground font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-blue-600"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BarBreakdown({
  title,
  icon: Icon,
  data,
}: {
  title: string;
  icon: any;
  data: Bucket[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl p-6 space-y-3">
      <h3 className="text-xs font-black uppercase tracking-[0.3em] italic flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {data.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No data yet.</p>
        )}
        {data.map((d) => (
          <div key={d.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="truncate pr-2">{d.label}</span>
              <span className="font-bold">{d.value.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/70 to-blue-600/70"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
