import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setHead } from "@/lib/setHead";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface Payload {
  company: { id: string; name: string; slug: string; logo_url: string | null; tagline: string | null } | null;
  projects: Array<{ slug: string; title: string; summary: string | null; category: string | null; og_image_url: string | null; budget_credits: number; currency_display: string }>;
}

export default function CompanyPublicProjects() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_company_public_projects", { _slug: slug! });
      if (cancelled) return;
      const p = (data as unknown) as Payload | null;
      setData(p);
      setLoading(false);
      if (p?.company) {
        setHead({
          title: `${p.company.name} · Projects`,
          description: p.company.tagline ?? `Public project portfolio for ${p.company.name} on Gro10x.`,
          canonical: `https://groupacademy.online/c/${slug}/projects`,
          jsonLd: { "@context": "https://schema.org", "@type": "ItemList", name: `${p.company.name} projects` },
          key: "company-projects",
        });
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (!data?.company) return <div className="min-h-screen grid place-items-center text-sm">Company not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-6 flex items-center gap-3">
          {data.company.logo_url ? <img src={data.company.logo_url} alt={data.company.name} className="h-10 w-10 rounded" /> : <Building2 className="h-10 w-10 text-muted-foreground" />}
          <div>
            <h1 className="text-2xl font-semibold">{data.company.name}</h1>
            {data.company.tagline && <p className="text-sm text-muted-foreground">{data.company.tagline}</p>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="text-lg font-medium mb-4">Public projects</h2>
        {data.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.projects.map(p => (
              <Link to={`/projects/${p.slug}`} key={p.slug}>
                <Card className="hover:shadow-md transition">
                  {p.og_image_url && <img src={p.og_image_url} alt={p.title} className="w-full h-32 object-cover rounded-t" loading="lazy" />}
                  <CardContent className="p-4 space-y-1">
                    <h3 className="font-semibold text-sm leading-tight">{p.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.summary}</p>
                    <p className="text-xs text-primary mt-1">{p.budget_credits} {p.currency_display}</p>
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
