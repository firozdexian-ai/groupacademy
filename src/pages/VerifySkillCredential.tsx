import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Award, Trophy, ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<string, { icon: any; label: string; tone: string }> = {
  foundational: { icon: BadgeCheck, label: "Foundational", tone: "text-primary" },
  proficient: { icon: Award, label: "Proficient", tone: "text-success-green" },
  expert: { icon: Trophy, label: "Expert", tone: "text-amber-500" },
};

export default function VerifySkillCredential() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [credential, setCredential] = useState<any>(null);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data } = await supabase
        .from("skill_credentials")
        .select("*, content:content_id(title), talent:talent_id(name, headline)")
        .eq("verify_code", code.toUpperCase())
        .maybeSingle();
      setCredential(data);
      setLoading(false);
    })();
  }, [code]);

  useEffect(() => {
    if (!credential) return;
    document.title = `Verified credential — ${credential.topic_tag.replace(/_/g, " ")}`;
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "EducationalOccupationalCredential",
      credentialCategory: credential.level,
      name: credential.topic_tag.replace(/_/g, " "),
      dateCreated: credential.issued_at,
      recognizedBy: { "@type": "Organization", name: "Group Academy" },
      about: credential.content?.title,
    });
    document.head.appendChild(ld);
    return () => { document.head.removeChild(ld); };
  }, [credential]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-3">
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!credential || credential.revoked_at) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-3">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive" />
        <h1 className="text-xl font-bold">Credential not found</h1>
        <p className="text-sm text-muted-foreground">
          This credential is invalid, has been revoked, or the link is incorrect.
        </p>
        <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
      </div>
    );
  }

  const meta = LEVEL_META[credential.level];
  const Icon = meta.icon;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Group Academy
      </Link>

      <Card className="rounded-3xl border-2 border-primary/20 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-success-green/10 px-5 py-6 text-center space-y-2">
          <div className={cn("inline-flex items-center justify-center h-16 w-16 rounded-full bg-background shadow-md", meta.tone)}>
            <Icon className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold capitalize">{credential.topic_tag.replace(/_/g, " ")}</h1>
          <p className={cn("text-sm font-semibold", meta.tone)}>{meta.label} skill credential</p>
        </div>
        <CardContent className="px-5 py-4 space-y-3 text-sm">
          <Row label="Awarded to" value={credential.talent?.name ?? "Talent"} />
          {credential.talent?.headline && <Row label="Title" value={credential.talent.headline} />}
          {credential.content?.title && <Row label="Course" value={credential.content.title} />}
          <Row label="Mastery" value={`${Math.round(Number(credential.mastery_at_issue) * 100)}%`} />
          <Row label="Practice attempts" value={String(credential.attempts_at_issue)} />
          <Row label="Issued" value={new Date(credential.issued_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} />
          <Row label="Verify code" value={credential.verify_code} mono />
          <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs text-success-green">
            <ShieldCheck className="h-4 w-4" />
            Verified by Group Academy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-right", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
