import { useEffect, useState } from "react";
import { useParams, Link, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setHead } from "@/lib/setHead";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

type Period = "weekly" | "monthly" | "alltime";
type Kind = "talents" | "companies" | "reviewers";
const KIND_MAP: Record<Kind, "talent" | "company" | "reviewer"> = { talents: "talent", companies: "company", reviewers: "reviewer" };

export default function PublicLeaderboard() {
  const { kind = "talents" } = useParams<{ kind: Kind }>();
  const [period, setPeriod] = useState<Period>("weekly");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  const dbKind = KIND_MAP[(kind as Kind) ?? "talents"];

  useEffect(() => {
    setHead({
      title: `Top ${kind} · Gro10x leaderboard`,
      description: `Live leaderboard of top ${kind} on Gro10x — refreshed regularly from project completions, trust scores, and reviewer accuracy.`,
      canonical: `https://groupacademy.online/leaderboards/${kind}`,
      jsonLd: { "@context": "https://schema.org", "@type": "ItemList", name: `Top ${kind} on Gro10x` },
      key: `lb-${kind}`,
    });
  }, [kind]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_leaderboard", { _kind: dbKind, _period: period, _category: null });
      if (!cancelled) setRows(((data as unknown) as Array<Record<string, unknown>>) ?? []);
    })();
    return () => { cancelled = true; };
  }, [dbKind, period]);

  const tabs: Array<{ key: Kind; label: string }> = [
    { key: "talents", label: "Top talents" },
    { key: "companies", label: "Top companies" },
    { key: "reviewers", label: "Top reviewers" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link to="/projects" className="text-xs text-muted-foreground">← Projects</Link>
          <h1 className="text-2xl font-bold flex items-center gap-2 mt-2"><Trophy className="h-6 w-6 text-primary" /> Gro10x leaderboards</h1>
          <div className="flex gap-2 mt-4">
            {tabs.map(t => (
              <NavLink key={t.key} to={`/leaderboards/${t.key}`}
                className={({ isActive }) => `text-xs px-3 py-1.5 rounded-full border ${isActive ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}>
                {t.label}
              </NavLink>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            {(["weekly","monthly","alltime"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs px-3 py-1 rounded-full border ${period === p ? "bg-secondary" : ""}`}>{p}</button>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rankings yet for this period.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r, i) => {
              const handle = r.public_handle as string | undefined;
              const slug = r.slug as string | undefined;
              const name = (r.full_name as string) || (r.name as string) || "—";
              const photo = (r.profile_photo_url as string) || (r.logo_url as string) || undefined;
              const score = r.score as number | undefined;
              const tier = r.tier as string | undefined;
              const link = handle ? `/t/${handle}` : slug ? `/c/${slug}/projects` : "#";
              return (
                <Link to={link} key={i}>
                  <Card className="hover:bg-accent/40 transition">
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="w-6 text-center font-semibold text-muted-foreground">{i + 1}</span>
                      <Avatar className="h-9 w-9"><AvatarImage src={photo} /><AvatarFallback>{name[0]}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tier && <span className="mr-2">tier: {tier}</span>}
                          {score != null && <span>score: {score}</span>}
                        </p>
                      </div>
                      {dbKind === "talent" && r.completed != null && <Badge variant="secondary">{String(r.completed)} completed</Badge>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
