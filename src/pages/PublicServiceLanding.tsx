import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Public landing page for service share links.
 * Captures source tracking params, calls RPC, then redirects to auth.
 */
export default function PublicServiceLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const trackAndRedirect = async () => {
      const source = searchParams.get("source");
      const serviceSlug = searchParams.get("service");

      // Track the click if we have tracking params
      if (source && serviceSlug) {
        try {
          await supabase.rpc("track_service_click", {
            p_slug: serviceSlug,
            p_source: source,
          });
        } catch (err) {
          console.error("Service tracking failed", err);
        }
      }

      // Build the return path based on service
      const returnTo = serviceSlug 
        ? `/app/services/${serviceSlug}` 
        : "/app/services";
      
      // Redirect to auth with return path
      navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
    };

    trackAndRedirect();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
