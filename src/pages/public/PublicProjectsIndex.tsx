import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setHead } from "@/lib/setHead";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";

interface ProjectRow {
  id: string; slug: string; seo_title: string | null; seo_description: string | null;
  og_image_url: string | null; title: string; summary: string | null; category: string | null;
  budget_credits: number; currency_display: string; company_name: string; company_slug: string;
  company_logo: string | null;
}

export default function PublicProjectsIndex() {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHead({
      title: "Public projects · Gro10x",
      description: "Browse case studies and live B2B projects from teams on Gro10x.",
      canonical: "https://groupacademy.online/projects",
      jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", name: "Gro10x public projects" },
      key: "projects-index",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_public_projects", { _filters: { q }, _page: 0, _page_size: 24 });
      if (!cancelled) {
        const payload = (data as { results?: ProjectRow[] } | null)?.results ?? [];
        setRows(payload);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between">
          <Link to="/" className="font-semibold flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Gro10x Projects</Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link to="/leaderboards/talents" className="hover:text-foreground">Top talents</Link>
            <Link to="/leaderboards/companies" className="hover:text-foreground">Top companies</Link>
            <Link to="/leaderboards/reviewers" className="hover:text-foreground">Top reviewers</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Showcase</h1>
        <p className="text-sm text-muted-foreground mb-6">Public case studies from teams shipping work on Gro10x.</p>
        <Input placeholder="Search projects…" value={q} onChange={e => setQ(e.target.value)} className="max-w-md mb-6" />
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public projects yet. Be the first to publish.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map(r => (
              <Link to={`/projects/${r.slug}`} key={r.id}>
                <Card className="hover:shadow-md transition">
                  {r.og_image_url && <img src={r.og_image_url} alt={r.title} className="w-full h-32 object-cover rounded-t" loading="lazy" />}
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {r.company_logo && <img src={r.company_logo} alt={r.company_name} className="h-4 w-4 rounded" />}
                      <span>{r.company_name}</span>
                    </div>
                    <h2 className="font-semibold leading-tight">{r.title}</h2>
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.summary ?? r.seo_description}</p>
                    <div className="flex items-center gap-2 pt-1">
                      {r.category && <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>}
                      <span className="text-xs text-primary font-medium">{r.budget_credits} {r.currency_display}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
