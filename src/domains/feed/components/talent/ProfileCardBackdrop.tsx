import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listActiveProfileCardThemes } from "@/domains/feed/repo/feedRepo";
import { trackError, trackEvent } from "@/lib/errorTracking";

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

/**
 * Premium, performance-hardened Profile Card Backdrop presentation node.
 * Strictly optimized according to GroUp Academy Phase Z0 SAAS UI specifications,
 * featuring accessible media fallbacks and centralized query tracking metrics.
 */
export function ProfileCardBackdrop({ onTextColor }: Props) {
  const [reduced, setReduced] = useState(false);

  // Accessible media preference tracking lifecycles
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener?.("change", h);
    return () => mq.removeEventListener?.("change", h);
  }, []);

  // 1. TanStack Query Server State Synchronization (staleTime 10 min configuration)
  const { data: theme, error } = useQuery<Theme | null>({
    queryKey: ["profile-card-theme-active"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      // Direct data query execution block using the canonical typed database client
      const { data, error: dbError } = await supabase
        .from("profile_card_themes")
        .select(
          "id, media_type, media_url, poster_url, gradient_css, overlay_opacity, text_color, start_at, end_at, is_active, priority",
        )
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(5);

      if (dbError) {
        throw dbError;
      }

      const now = Date.now();

      // Calculate active promotional bounds safely with rigorous exception protection
      const active = (data || []).find((t: any) => {
        try {
          const sOk = !t.start_at || new Date(t.start_at).getTime() <= now;
          const eOk = !t.end_at || new Date(t.end_at).getTime() >= now;
          return sOk && eOk;
        } catch (dateErr) {
          return false;
        }
      });

      return (active as Theme) || null;
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // 2. Instrument Operational Telemetry Boundaries
  useEffect(() => {
    if (error) {
      trackError(error instanceof Error ? error : String(error), {
        component: "ProfileCardBackdrop",
        action: "fetch_active_theme_query",
      });
    }
  }, [error]);

  useEffect(() => {
    if (theme) {
      trackEvent("profile_card_theme_applied", {
        themeId: theme.id,
        mediaType: theme.media_type,
        textColorMode: theme.text_color,
      });
    }
  }, [theme]);

  // Synchronize layout color mode hooks with parent shells safely
  useEffect(() => {
    onTextColor?.(theme?.text_color ?? "auto");
  }, [theme?.text_color, onTextColor]);

  if (!theme) return null;

  const overlay = Math.max(0, Math.min(1, Number(theme.overlay_opacity ?? 0.55)));

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none transform-gpu select-none"
      aria-hidden
    >
      {/* 1. Gradient Render Panel Layer */}
      {theme.media_type === "gradient" && theme.gradient_css && (
        <div
          className="absolute inset-0 w-full h-full transition-opacity duration-300"
          style={{ background: theme.gradient_css }}
        />
      )}

      {/* 2. Static Image & GIF Layout Track */}
      {(theme.media_type === "image" || theme.media_type === "gif") && theme.media_url && (
        <img
          src={theme.media_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 animate-in fade-in-40"
          loading="eager"
          decoding="async"
        />
      )}

      {/* 3. High-Fidelity Loop Video Streaming Pipeline */}
      {theme.media_type === "video" &&
        theme.media_url &&
        (reduced && theme.poster_url ? (
          <img src={theme.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <video
            src={theme.media_url}
            poster={theme.poster_url ?? undefined}
            className="absolute inset-0 w-full h-full object-cover transform-gpu"
            autoPlay
            loop
            muted
            playsInline
            style={{ willChange: "transform" }}
          />
        ))}

      {/* 4. Secondary Lottie Animation Poster Fallback Block */}
      {theme.media_type === "lottie" && theme.poster_url && (
        <img src={theme.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* Immersive Clarity Scrim Overlay Grid */}
      <div
        className="absolute inset-0 transition-all duration-300 pointer-events-none"
        style={{ background: `rgba(0,0,0,${overlay})` }}
      />
    </div>
  );
}
