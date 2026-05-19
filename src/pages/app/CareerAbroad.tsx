import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * GroUp Academy: Career Abroad Deprecation Interceptor (CareerAbroad)
 * Hardened programmatic transition node routing traffic to the active Study Abroad Learning Hub container.
 * Version: Launch Candidate · Phase Z1 Redirect Insulation Sealed
 */
export default function CareerAbroad() {
  const navigateHook = useNavigate();
  const locationHook = useLocation();

  React.useEffect(() => {
    // Read and mirror existing parameter matrices to avoid stripping global analytics or filters
    const currentParamsBuffer = new URLSearchParams(locationHook.search);

    // Inject authoritative redirection coordinates matching the 2026 destination directory
    currentParamsBuffer.set("tab", "events");
    currentParamsBuffer.set("kind", "abroad");

    // Execute absolute parameter modification using a secure, replaced state frame
    navigateHook(
      {
        pathname: "/app/learning",
        search: `?${currentParamsBuffer.toString()}`,
      },
      {
        replace: true,
      },
    );
  }, [navigateHook, locationHook.search]);

  // Provide a clean layout fallback placeholder while the client's routing channels resolve
  return (
    <div
      role="status"
      className="min-h-screen w-full grid place-items-center bg-background font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none antialiased"
    >
      <div className="flex items-center gap-2.5">
        <Loader2 className="h-4 w-4定位 animate-spin text-primary shrink-0 stroke-[2.5]" />
        <span>Rerouting to Study Abroad Ingress...</span>
      </div>
    </div>
  );
}
