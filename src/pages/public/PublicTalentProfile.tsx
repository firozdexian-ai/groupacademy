import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Award, Trophy, ExternalLink, Linkedin, Globe, Lock, ShieldCheck, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<string, { icon: any; label: string; tone: string }> = {
  foundational: { icon: BadgeCheck, label: "Foundational", tone: "text-primary bg-primary/10 border-primary/30" },
  proficient: { icon: Award, label: "Proficient", tone: "text-success-green bg-success-green/10 border-success-green/30" },
  expert: { icon: Trophy, label: "Expert", tone: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
};

export default function PublicTalentProfile() {
  const { handle } = useParams<{ handle: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!handle) return;
    (async () => {
      const { data } = await supabase.rpc("get_public_talent_profile", { _handle: handle });
      setProfile(data ?? null);
      setLoading(false);
    })();
  }, [handle]);

  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.full_name} — Group Academy`;
    const desc = profile.bio ?? `${profile.full_name} on Group Academy — verified skills and learning mastery.`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    const ogTags = [
      ["og:title", `${profile.full_name} — Group Academy`],
      ["og:description", desc],
      ["og:type", "profile"],
      ["og:image", profile.profile_photo_url ?? ""],
      ["twitter:card", "summary_large_image"],
    ];
    const created: HTMLMetaElement[] = [];
    ogTags.forEach(([k, v]) => {
      const m = document.createElement("meta");
      m.setAttribute("property", k);
      m.setAttribute("content", v);
      document.head.appendChild(m);
      created.push(m);
    });

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.full_name,
      description: desc,
      image: profile.profile_photo_url,
      jobTitle: profile.profession,
      address: profile.country ? { "@type": "PostalAddress", addressCountry: profile.country } : undefined,
      sameAs: [profile.linkedin_url, profile.portfolio_url].filter(Boolean),
      hasCredential: (profile.credentials ?? []).map((c: any) => ({
        "@type": "EducationalOccupationalCredential",
        name: c.topic_tag.replace(/_/g, " "),
        credentialCategory: c.level,
        recognizedBy: { "@type": "Organization", name: "Group Academy" },
        url: `${window.location.origin}/verify/skill/${c.verify_code}`,
      })),
    });
    document.head.appendChild(ld);

    return () => {
      created.forEach((el) => document.head.removeChild(el));
      document.head.removeChild(ld);
    };
  }, [profile]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-3">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-xl font-bold">Profile is private</h1>
        <p className="text-sm text-muted-foreground">
          This profile is not public, or the link is incorrect.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back to Group Academy</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-12">
      {/* Hero */}
      <Card className="rounded-3xl overflow-hidden border-border/60">
        {profile.cover_image_url && (
          <div
            className="h-28 bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.cover_image_url})` }}
          />
        )}
        <CardContent className={cn("p-4 space-y-2", profile.cover_image_url ? "-mt-10" : "")}>
          <Avatar className="h-20 w-20 border-4 border-background shadow">
            <AvatarImage src={profile.profile_photo_url ?? undefined} />
            <AvatarFallback>{profile.full_name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-black leading-tight">{profile.full_name}</h1>
            {profile.profession && <p className="text-sm text-muted-foreground">{profile.profession}</p>}
            {profile.country && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {profile.country}
              </p>
            )}
          </div>
          {profile.bio && <p className="text-sm">{profile.bio}</p>}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {profile.linkedin_url && (
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                  <Linkedin className="h-3.5 w-3.5 mr-1" /> LinkedIn
                </a>
              </Button>
            )}
            {profile.portfolio_url && (
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <a href={profile.portfolio_url} target="_blank" rel="noreferrer">
                  <Globe className="h-3.5 w-3.5 mr-1" /> Portfolio
                </a>
              </Button>
            )}
            <Button asChild size="sm" className="h-8 text-xs ml-auto">
              <Link to={`/app/talents/${profile.id}`}>
                Connect <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verified Skills */}
      {profile.show_credentials && profile.credentials?.length > 0 && (
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success-green" />
              Verified skills ({profile.credentials.length})
            </h2>
            <div className="space-y-2">
              {profile.credentials.map((c: any) => {
                const meta = LEVEL_META[c.level];
                const Icon = meta.icon;
                return (
                  <div key={c.id} className={cn("flex items-center gap-2 rounded-xl border p-2", meta.tone)}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate capitalize">
                        {c.topic_tag.replace(/_/g, " ")}
                      </p>
                      <p className="text-[11px] opacity-80 truncate">
                        {meta.label} · {c.course_title ?? "Cross-course"} · {Math.round(Number(c.mastery_at_issue) * 100)}%
                      </p>
                    </div>
                    <Link
                      to={`/verify/skill/${c.verify_code}`}
                      className="text-[11px] font-semibold inline-flex items-center gap-0.5 hover:underline"
                    >
                      Verify <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mastery */}
      {profile.show_mastery && profile.mastery && profile.mastery.tracked_topics > 0 && (
        <Card className="rounded-2xl border-border/60">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-bold">Learning mastery</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Topics tracked</p>
                <p className="text-xl font-black">{profile.mastery.tracked_topics}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Avg mastery</p>
                <p className="text-xl font-black">{Math.round(Number(profile.mastery.avg_mastery) * 100)}%</p>
              </div>
            </div>
            {profile.mastery.top_strengths?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Top strengths</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.mastery.top_strengths.map((s: any) => (
                    <span key={s.topic_tag} className="inline-flex items-center gap-1 text-xs bg-success-green/10 text-success-green border border-success-green/30 rounded-full px-2 py-0.5 capitalize">
                      {s.topic_tag.replace(/_/g, " ")} · {Math.round(Number(s.mastery) * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-center text-[11px] text-muted-foreground pt-2">
        Powered by <Link to="/" className="font-semibold text-primary hover:underline">Group Academy</Link>
      </p>
    </div>
  );
}
