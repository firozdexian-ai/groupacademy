/**
 * Companies Overview — KPIs for the B2B (companies + contacts) pipeline.
 */
import { useEffect, useState } from "react";
import { Building2, Users, UserCheck, FileText, Globe, Sparkles } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

type Bucket = { label: string; value: number };

interface OverviewData {
  totalCompanies: number;
  verified: number;
  newCompanies7d: number;
  newCompanies30d: number;
  totalContacts: number;
  registered: number;
  uploaded: number;
  cvMatched: number;
  byIndustry: Bucket[];
  byCountry: Bucket[];
  riyaFunnel: { started: number; emailCaptured: number; completed: number; abandoned: number };
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();

export function CompaniesOverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const head = (table: string) =>
          supabase.from(table as any).select("id", { head: true, count: "exact" });

        const [
          totalCompanies,
          verified,
          new7d,
          new30d,
          totalContacts,
          registered,
          uploaded,
          cvMatched,
          riyaStarted,
          riyaCompleted,
          industriesRows,
          countriesRows,
        ] = await Promise.all([
          head("companies"),
          supabase.from("companies").select("id", { head: true, count: "exact" }).eq("is_verified", true),
          supabase.from("companies").select("id", { head: true, count: "exact" }).gte("created_at", daysAgo(7)),
          supabase.from("companies").select("id", { head: true, count: "exact" }).gte("created_at", daysAgo(30)),
          head("contacts"),
          supabase.from("contacts").select("id", { head: true, count: "exact" }).not("user_id", "is", null),
          supabase.from("contacts").select("id", { head: true, count: "exact" })
            .is("user_id", null).neq("source", "cv_match"),
          supabase.from("contacts").select("id", { head: true, count: "exact" }).eq("source", "cv_match"),
          head("riya_conversations"),
          supabase.from("riya_conversations").select("id", { head: true, count: "exact" }).not("completed_at", "is", null),
          supabase.from("companies").select("industry").not("industry", "is", null).limit(2000),
          supabase.from("companies").select("country").not("country", "is", null).limit(2000),
        ]);

        const tally = (rows: any[] | null, key: string): Bucket[] => {
          const m = new Map<string, number>();
          for (const r of rows ?? []) {
            const v = r[key];
            if (!v) continue;
            m.set(v, (m.get(v) ?? 0) + 1);
          }
          return Array.from(m.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
        };

        const started = riyaStarted.count ?? 0;
        const completed = riyaCompleted.count ?? 0;
        if (!mounted) return;
        setData({
          totalCompanies: totalCompanies.count ?? 0,
          verified: verified.count ?? 0,
          newCompanies7d: new7d.count ?? 0,
          newCompanies30d: new30d.count ?? 0,
          totalContacts: totalContacts.count ?? 0,
          registered: registered.count ?? 0,
          uploaded: uploaded.count ?? 0,
          cvMatched: cvMatched.count ?? 0,
          byIndustry: tally(industriesRows.data as any[], "industry"),
          byCountry: tally(countriesRows.data as any[], "country"),
          riyaFunnel: {
            started,
            emailCaptured: started, // every session was started via email request
            completed,
            abandoned: Math.max(0, started - completed),
          },
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Companies Overview</h2>
        <p className="text-sm text-muted-foreground">B2B pipeline · employers, contacts, and Riya signups.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <StatsCard title="Total companies" value={data.totalCompanies} icon={Building2} />
        <StatsCard title="Verified" value={data.verified} icon={UserCheck} />
        <StatsCard title="New (7d)" value={data.newCompanies7d} icon={Sparkles} />
        <StatsCard title="New (30d)" value={data.newCompanies30d} icon={Sparkles} />
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <StatsCard title="Total contacts" value={data.totalContacts} icon={Users} />
        <StatsCard title="Registered" value={data.registered} icon={UserCheck} />
        <StatsCard title="Uploaded" value={data.uploaded} icon={FileText} />
        <StatsCard title="CV-matched" value={data.cvMatched} icon={FileText} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Riya signup funnel
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Started</span><b>{data.riyaFunnel.started}</b></li>
            <li className="flex justify-between"><span>Completed</span><b>{data.riyaFunnel.completed}</b></li>
            <li className="flex justify-between text-muted-foreground"><span>Abandoned</span><b>{data.riyaFunnel.abandoned}</b></li>
          </ul>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Top industries
          </h3>
          <ul className="space-y-1.5 text-sm">
            {data.byIndustry.map((b) => (
              <li key={b.label} className="flex justify-between">
                <span className="truncate">{b.label}</span><b>{b.value}</b>
              </li>
            ))}
            {data.byIndustry.length === 0 && (
              <li className="text-muted-foreground text-xs">No data yet.</li>
            )}
          </ul>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Top countries
          </h3>
          <ul className="space-y-1.5 text-sm">
            {data.byCountry.map((b) => (
              <li key={b.label} className="flex justify-between">
                <span className="truncate">{b.label}</span><b>{b.value}</b>
              </li>
            ))}
            {data.byCountry.length === 0 && (
              <li className="text-muted-foreground text-xs">No data yet.</li>
            )}
          </ul>
        </Card>
      </section>
    </div>
  );
}
