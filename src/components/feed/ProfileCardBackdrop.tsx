import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Theme {
  id: string;
  media_type: "image" | "gif" | "video" | "lottie" | "gradient";
  media_url: string | null;
  poster_url: string | null;
  gradient_css: string | null;
  overlay_opacity: number;
  text_color: "auto" | "light" | "dark";
}

interface Props {
  onTextColor?: (mode: "light" | "dark" | "auto") => void;
}

export function ProfileCardBackdrop({ onTextColor }: Props) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener?.("change", h);
    return () => mq.removeEventListener?.("change", h);
  }, []);

  const { data: theme } = useQuery({
    queryKey: ["profile-card-theme-active"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profile_card_themes")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(5);
      const now = Date.now();
      const active = (data || []).find((t: any) => {
        const sOk = !t.start_at || new Date(t.start_at).getTime() <= now;
        const eOk = !t.end_at || new Date(t.end_at).getTime() >= now;
        return sOk && eOk;
      });
      return (active as Theme) || null;
    },
  });

  useEffect(() => {
    onTextColor?.(theme?.text_color ?? "auto");
  }, [theme?.text_color, onTextColor]);

  if (!theme) return null;

  const overlay = Math.max(0, Math.min(1, Number(theme.overlay_opacity ?? 0.55)));

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" aria-hidden>
      {theme.media_type === "gradient" && theme.gradient_css && (
        <div className="absolute inset-0" style={{ background: theme.gradient_css }} />
      )}
      {(theme.media_type === "image" || theme.media_type === "gif") && theme.media_url && (
        <img src={theme.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {theme.media_type === "video" && theme.media_url && (
        reduced && theme.poster_url ? (
          <img src={theme.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <video
            src={theme.media_url}
            poster={theme.poster_url ?? undefined}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        )
      )}
      {theme.media_type === "lottie" && theme.poster_url && (
        <img src={theme.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {/* Readability scrim */}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(0,0,0,${overlay})` }}
      />
    </div>
  );
}
