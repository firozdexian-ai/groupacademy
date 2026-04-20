import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";

/**
 * Platform Protocol: Service Attribution Bridge
 * Intercepts public share links, logs telemetry, and routes to secure nodes.
 */
export default function PublicServiceLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const trackAndRedirect = async () => {
      const source = searchParams.get("source");
      const serviceSlug = searchParams.get("service");

      // Execution Layer: Attribution Telemetry
      if (source && serviceSlug) {
        try {
          // CTO Note: RPC call is fire-and-forget to minimize UX latency
          await supabase.rpc("track_service_click", {
            p_slug: serviceSlug,
            p_source: source,
          });
        } catch (err) {
          console.error("Platform Telemetry Handshake Failed:", err);
        }
      }

      // Logic Layer: Dynamic Routing Architecture
      const returnTo = serviceSlug ? `/app/services/${serviceSlug}` : "/app/services";

      // Navigate to Auth Gateway with deep-link preservation
      // We use replace: true to prune this redirect node from the history stack
      navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
    };

    trackAndRedirect();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background selection:bg-primary/10">
      <div className="text-center space-y-6 animate-in fade-in duration-700">
        {/* Branding HUD */}
        <div className="relative w-16 h-16 mx-auto mb-8">
          <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping" />
          <div className="relative h-16 w-16 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center shadow-2xl">
            <img src={logoIcon} className="w-8 h-8 opacity-80" alt="GroUp" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em]">
            <Sparkles className="w-3 h-3 fill-primary" />
            Initializing Node
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
            Establishing Secure Handshake...
          </p>
        </div>

        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 pt-12">
          GroUp Academy Intelligence Network
        </p>
      </div>
    </div>
  );
}
