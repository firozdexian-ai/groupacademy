import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Lock,
  Unlock,
  Sparkles,
  Flame,
  Briefcase,
  MapPin,
  Building2,
  Globe,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTalent } from "@/hooks/useTalent";
import { ConnectionRequestDialog } from "@/components/talents/ConnectionRequestDialog";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

// Production Data Contracts[cite: 8]
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
  const navigate = useNavigate();
  const { talent: me } = useTalent();
  const [dialog, setDialog] = useState(false);

  // Digital Workforce Anomaly Protocol[cite: 6]
  const reportAnomaly = async (event: string, context: any) => {
    console.error(`[Digital Workforce Anomaly] ${event}`, context);
    await supabase.functions.invoke("admin-support-assistant", {
      body: { type: "talent_profile_error", event, context },
    });
  };

  const {
    data: t,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["talent-profile", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing ID");
      const { data, error } = await supabase
        .from("talents")
        .select(
          "id, full_name, profile_photo_url, cover_image_url, custom_profession, country, linkedin_url, portfolio_url, skills",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) {
        await reportAnomaly("ProfileFetchFailure", { id, error });
        throw error;
      }
      return data as TalentDetail | null;
    },
    enabled: !!id,
  });

  const { data: meta } = useQuery({
    queryKey: ["talent-meta", id],
    enabled: !!id,
    queryFn: async () => {
      const [s, v, h] = await Promise.all([
        supabase.from("talent_inbox_settings").select("unlocked").eq("talent_id", id!).maybeSingle(),
        supabase.from("v_talent_transaction_volume").select("volume").eq("talent_id", id!).maybeSingle(),
        supabase.from("post_hypes").select("id", { count: "exact", head: true }).eq("recipient_talent_id", id!),
      ]);
      return {
        unlocked: Boolean(s.data?.unlocked),
        volume: Number(v.data?.volume || 0),
        hypeCount: h.count || 0,
      };
    },
  });

  if (isLoading)
    return (
      <div className={PAGE_SHELL}>
        <Skeleton className="h-64 w-full rounded-[32px]" />
      </div>
    );
  if (error || !t)
    return (
      <div className={PAGE_SHELL}>
        <p className="text-sm">Profile node unreachable.</p>
      </div>
    );

  const isMe = me?.id === t.id;
  const skills: string[] = Array.isArray(t.skills)
    ? t.skills.map((s: any) => (typeof s === "string" ? s : s?.name))
    : [];

  return (
    <div className={PAGE_SHELL}>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-4 rounded-xl">
        <ArrowLeft className="h-4 w-4 mr-2" /> Directory
      </Button>

      <Card className={cn(CARD, "overflow-hidden rounded-[32px]")}>
        <div
          className="h-40 bg-gradient-to-r from-primary/30 to-primary/10"
          style={t.cover_image_url ? { backgroundImage: `url(${t.cover_image_url})`, backgroundSize: "cover" } : {}}
        />
        <CardContent className="p-8 -mt-16">
          <Avatar className="h-28 w-28 border-[6px] border-background rounded-[24px]">
            <AvatarImage src={t.profile_photo_url ?? undefined} />
            <AvatarFallback className="text-3xl font-black">{t.full_name[0]}</AvatarFallback>
          </Avatar>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-1">
              <h1 className={PAGE_TITLE}>{t.full_name}</h1>
              <p className={cn(PAGE_SUBTITLE, "flex items-center gap-1.5")}>
                <Briefcase className="h-3 w-3" /> {t.custom_profession || "Talent"}
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <MapPin className="h-3 w-3" /> {t.country || "Global"}
              </p>
            </div>
            {!isMe && (
              <Button onClick={() => setDialog(true)} disabled={!meta?.unlocked} className="rounded-xl px-6">
                {meta?.unlocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                {meta?.unlocked ? "Connect" : "Locked"}
              </Button>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Badge
              variant="secondary"
              className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest italic flex items-center gap-1.5"
            >
              <Flame className="h-3 w-3 text-orange-500" /> {meta?.hypeCount || 0} Hypes
            </Badge>
            <Badge
              variant="secondary"
              className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest italic flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-primary" /> {Math.round(meta?.volume || 0)} Credits Volume
            </Badge>
          </div>

          <div className="mt-8 space-y-4">
            <h2 className={SECTION_TITLE}>Mastery Nodes</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="outline" className="rounded-xl px-4 py-1">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <ConnectionRequestDialog open={dialog} onOpenChange={setDialog} recipientId={t.id} recipientName={t.full_name} />
    </div>
  );
}
