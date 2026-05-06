import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, BookOpen, ArrowRight } from "lucide-react";

function setHead(title: string, desc: string, jsonLd: object) {
  document.title = title;
  let m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
  m.content = desc;
  let s = document.getElementById("ld-branded-catalog") as HTMLScriptElement | null;
  if (!s) { s = document.createElement("script"); s.id = "ld-branded-catalog"; s.type = "application/ld+json"; document.head.appendChild(s); }
  s.text = JSON.stringify(jsonLd);
}

interface BrandedCatalog {
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    banner_url: string | null;
    tagline: string | null;
  };
  tracks: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    cover_url: string | null;
    enrollment_credits: number;
    item_count: number;
  }>;
}

export default function CompanyBrandedCatalog() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<BrandedCatalog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_company_branded_catalog", { p_slug: slug! });
      if (!cancelled) {
        setData(error ? null : (data as unknown as BrandedCatalog));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (!data?.company) {
    return (
      <div className="min-h-screen grid place-items-center text-center p-6">
        <div>
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-sm mt-3">Company not found.</p>
          <Link to="/" className="text-xs text-primary mt-2 inline-block">Go home</Link>
        </div>
      </div>
    );
  }

  const c = data.company;
  const title = `${c.name} · Learning catalog`;
  setHead(title, c.tagline ?? `Learning tracks from ${c.name}.`, {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    itemListElement: data.tracks.map((t, i) => ({
      "@type": "Course",
      position: i + 1,
      name: t.title,
      description: t.summary ?? undefined,
      provider: { "@type": "Organization", name: c.name },
    })),
  });

  return (
    <div className="min-h-screen bg-background">

      {/* Banner */}
      <header className="relative">
        {c.banner_url ? (
          <img src={c.banner_url} alt="" className="w-full h-40 md:h-56 object-cover" />
        ) : (
          <div className="w-full h-32 md:h-40 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        <div className="max-w-5xl mx-auto px-4 -mt-10 md:-mt-14 relative">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-card border border-border shadow-lg overflow-hidden grid place-items-center">
              {c.logo_url ? (
                <img src={c.logo_url} alt={c.name} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="pb-2 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{c.name}</h1>
              {c.tagline && <p className="text-sm text-muted-foreground mt-1">{c.tagline}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">Learning tracks</h2>

        {data.tracks.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm mt-3 text-muted-foreground">No published tracks yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {data.tracks.map((t) => (
              <Link
                key={t.id}
                to={`/auth?returnTo=/gro10x/learn`}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition"
              >
                {t.cover_url ? (
                  <img src={t.cover_url} alt="" className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-primary/10 to-secondary/10" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold leading-tight group-hover:text-primary transition">{t.title}</h3>
                  {t.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.summary}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.item_count} {t.item_count === 1 ? "course" : "courses"}</span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      Enroll <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mt-8 text-center">
          Sponsored by {c.name} · Powered by GroUp Academy
        </p>
      </main>
    </div>
  );
}
