import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, Unlock, Sparkles, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionRequestDialog } from "@/components/talents/ConnectionRequestDialog";
import { useTalent } from "@/hooks/useTalent";

interface TalentDetail {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  cover_image_url: string | null;
  custom_profession: string | null;
  country: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  skills: any;
}

export default function TalentPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const { talent: me } = useTalent();
  const [t, setT] = useState<TalentDetail | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [volume, setVolume] = useState(0);
  const [hypeReceived, setHypeReceived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: talent }, { data: settings }, { data: vol }, { count }] = await Promise.all([
        supabase
          .from("talents")
          .select("id, full_name, profile_photo_url, cover_image_url, custom_profession, country, linkedin_url, portfolio_url, skills")
          .eq("id", id)
          .maybeSingle(),
        supabase.from("talent_inbox_settings").select("unlocked").eq("talent_id", id).maybeSingle(),
        supabase.from("v_talent_transaction_volume").select("volume").eq("talent_id", id).maybeSingle(),
        supabase.from("post_hypes").select("id", { count: "exact", head: true }).eq("recipient_talent_id", id),
      ]);
      setT(talent as any);
      setUnlocked(Boolean((settings as any)?.unlocked));
      setVolume(Number((vol as any)?.volume ?? 0));
      setHypeReceived(count ?? 0);
      setLoading(false);
    })();
  }, [id]);

  const isMe = me?.id === id;

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (!t) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-muted-foreground">Talent not found.</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/app/talents"><ArrowLeft className="h-4 w-4 mr-2" />Back to directory</Link>
        </Button>
      </div>
    );
  }

  const skills: string[] = Array.isArray(t.skills)
    ? t.skills.map((s: any) => (typeof s === "string" ? s : s?.name)).filter(Boolean)
    : [];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/app/talents"><ArrowLeft className="h-4 w-4 mr-2" />Directory</Link>
      </Button>

      <Card className="overflow-hidden">
        <div
          className="h-32 bg-gradient-to-r from-primary/30 to-primary/10"
          style={t.cover_image_url ? { backgroundImage: `url(${t.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        />
        <div className="p-5 -mt-12">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={t.profile_photo_url ?? undefined} />
            <AvatarFallback className="text-2xl">{t.full_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{t.full_name}</h1>
              <p className="text-sm text-muted-foreground">
                {t.custom_profession || "Talent"}{t.country ? ` · ${t.country}` : ""}
              </p>
            </div>
            {!isMe && (
              <Button onClick={() => setDialog(true)} disabled={!unlocked} className="gap-2">
                {unlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {unlocked ? "Connect" : "Inbox closed"}
              </Button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary" className="gap-1"><Flame className="h-3 w-3" />{hypeReceived} hypes</Badge>
            <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />{Math.round(volume)} cr volume</Badge>
            {unlocked && <Badge className="gap-1"><Unlock className="h-3 w-3" />Open inbox</Badge>}
          </div>

          {skills.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold mb-2">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.slice(0, 16).map((s) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {(t.linkedin_url || t.portfolio_url) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {t.linkedin_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={t.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>
                </Button>
              )}
              {t.portfolio_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={t.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a>
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <ConnectionRequestDialog
        open={dialog}
        onOpenChange={setDialog}
        recipientId={t.id}
        recipientName={t.full_name}
      />
    </div>
  );
}
