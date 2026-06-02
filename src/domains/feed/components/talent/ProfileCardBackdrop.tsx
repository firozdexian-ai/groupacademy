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
 * Premium background backdrop component for profile cards.
 * Pulls active themes and dynamically handles image, video, and gradient styles.
 */
export function ProfileCardBackdrop({ onTextColor }: Props) {
  const [reduced, setReduced] = useState(false);

  // Monitor user preference for reduced motion to optimize performance
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handleMotionChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", handleMotionChange);
    return () => mq.removeEventListener?.("change", handleMotionChange);
  }, []);

  // Sync active background skins from database records
  const { data: theme, error } = useQuery<Theme | null>({
    queryKey: ["profile-card-theme-active"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const data = await listActiveProfileCardThemes();
      const now = Date.now();

      // Extract current active theme based on active date rules
      const active = (data || []).find((t: any) => {
        try {
          const startOk = !t.start_at || new Date(t.start_at).getTime() <= now;
          const endOk = !t.end_at || new Date(t.end_at).getTime() >= now;
          return startOk && endOk;
        } catch (dateErr) {
          return false;
        }
      });

      return (active as Theme) || null;
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Track database fetch exceptions silently in the background
  useEffect(() => {
    if (error) {
      trackError(error instanceof Error ? error : String(error), {
        component: "ProfileCardBackdrop",
        action: "fetch_active_theme_query",
      });
    }
  }, [error]);

  // Log successful theme application events
  useEffect(() => {
    if (theme) {
      trackEvent("profile_card_theme_applied", {
        themeId: theme.id,
        mediaType: theme.media_type,
        textColorMode: theme.text_color,
      });
    }
  }, [theme]);

  // Synchronize layout color overrides with parent shells
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
      {/* 1. Gradient Background Layout */}
      {theme.media_type === "gradient" && theme.gradient_css && (
        <div
          className="absolute inset-0 w-full h-full transition-opacity duration-300"
          style={{ background: theme.gradient_css }}
        />
      )}

      {/* 2. Static Image & GIF Layout */}
      {(theme.media_type === "image" || theme.media_type === "gif") && theme.media_url && (
        <img
          src={theme.media_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 animate-in fade-in-40"
          loading="eager"
          decoding="async"
        />
      )}

      {/* 3. Loop Video Layout with Motion Reduction Check */}
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

      {/* 4. Lottie Animation Fallback Preview */}
      {theme.media_type === "lottie" && theme.poster_url && (
        <img src={theme.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* Overlay backdrop shading for readability text protection */}
      <div
        className="absolute inset-0 transition-all duration-300 pointer-events-none"
        style={{ background: `rgba(0,0,0,${overlay})` }}
      />
    </div>
  );
}