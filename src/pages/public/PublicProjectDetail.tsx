import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setHead } from "@/lib/setHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink } from "lucide-react";

interface Detail {
  project: {
    id: string; slug: string; seo_title: string | null; seo_description: string | null;
    og_image_url: string | null; case_study_md: string | null; featured_deliverables: unknown[];
    title: string; summary: string | null; category: string | null;
    budget_credits: number; currency_display: string; status: string;
    starts_at: string | null; due_at: string | null; view_count: number;
  };
  company: { id: string; name: string; slug: string; logo_url: string | null; tagline: string | null };
  milestones: Array<{ seq: number; title: string; status: string; due_at: string | null }>;
  team: Array<{ handle: string; name: string; photo: string | null }>;
}

export default function PublicProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_public_project_detail", { _slug: slug! });
      if (cancelled) return;
      const d = data as unknown as Detail | null;
      setData(d);
      setLoading(false);
      if (d?.project) {
        setHead({
          title: `${d.project.seo_title ?? d.project.title} · ${d.company.name}`,
          description: d.project.seo_description ?? d.project.summary ?? d.project.title,
          image: d.project.og_image_url ?? undefined,
          canonical: `https://groupacademy.online/projects/${slug}`,
          jsonLd: {
            "@context": "https://schema.org", "@type": "CreativeWork",
            name: d.project.title, description: d.project.summary,
            creator: { "@type": "Organization", name: d.company.name },
          },
          key: "project-detail",
        });
        void supabase.rpc("record_discovery_signal", { _kind: "project", _id: d.project.id, _signal: "view" }).then(() => undefined);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (!data) return <div className="min-h-screen grid place-items-center text-sm">Project not found.</div>;

  const { project, company, milestones, team } = data;
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">← All projects</Link>
          <Link to={`/c/${company.slug}/projects`} className="flex items-center gap-2 text-sm">
            {company.logo_url && <img src={company.logo_url} alt={company.name} className="h-5 w-5 rounded" />}
            <span className="font-medium">{company.name}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {project.og_image_url && <img src={project.og_image_url} alt={project.title} className="w-full rounded-lg" />}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {project.category && <Badge variant="secondary">{project.category}</Badge>}
            <Badge>{project.status}</Badge>
            <span className="text-sm font-medium text-primary">{project.budget_credits} {project.currency_display}</span>
          </div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          {project.summary && <p className="text-muted-foreground">{project.summary}</p>}
        </div>

        {project.case_study_md && (
          <Card><CardContent className="p-6 prose prose-sm max-w-none whitespace-pre-wrap">{project.case_study_md}</CardContent></Card>
        )}

        {milestones.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Milestones</h2>
            <div className="space-y-2">
              {milestones.map(m => (
                <Card key={m.seq}><CardContent className="p-3 flex items-center justify-between text-sm">
                  <span><span className="text-muted-foreground mr-2">#{m.seq}</span>{m.title}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {m.due_at && <><Calendar className="h-3 w-3"/> {new Date(m.due_at).toLocaleDateString()}</>}
                    <Badge variant="outline">{m.status}</Badge>
                  </span>
                </CardContent></Card>
              ))}
            </div>
          </section>
        )}

        {team.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Team</h2>
            <div className="flex flex-wrap gap-3">
              {team.map(t => t.handle && (
                <Link to={`/t/${t.handle}`} key={t.handle} className="flex items-center gap-2 px-3 py-2 rounded-full border hover:bg-accent">
                  {t.photo && <img src={t.photo} alt={t.name} className="h-6 w-6 rounded-full" />}
                  <span className="text-sm">{t.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Card><CardContent className="p-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-medium">Want a team like this?</p>
            <p className="text-sm text-muted-foreground">Post your project on Gro10x.</p>
          </div>
          <Button asChild><Link to="/gro10x">Hire on Gro10x <ExternalLink className="h-4 w-4 ml-1"/></Link></Button>
        </CardContent></Card>
      </main>
    </div>
  );
}
