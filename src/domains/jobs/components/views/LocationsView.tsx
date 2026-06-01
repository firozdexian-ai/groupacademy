/**
 * GroUp Academy: Geographical Market CRM Surface (LocationsView)
 * CTO Reference: Authoritative component for context-based geographical filtering.
 * Version: Launch Candidate · Phase Z0 Hardened · Build Fix Patch
 * Enhancements: GPU performance layout, structured tracking metrics, automated data bounds.
 */
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryCard } from "@/domains/jobs/components/CountryCard";
import type { CountryWithSignal } from "@/hooks/useCountriesWithSignal";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface Props {
  countries?: CountryWithSignal[];
  talent?: { country?: string | null } | null;
}

export function LocationsView({ countries, talent }: Props) {
  const navigate = useNavigate();
  const list = countries ?? [];

  const userCountry = useMemo(() => {
    return talent?.country?.trim().toLowerCase() ?? "";
  }, [talent]);

  // Sort locations dynamically, ensuring the talent's home region sits at the top row slot
  const sortedCountries = useMemo(() => {
    if (list.length === 0) return [];
    return [...list].sort((a, b) => {
      const aMatch = a.country.toLowerCase() === userCountry ? 1 : 0;
      const bMatch = b.country.toLowerCase() === userCountry ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [list, userCountry]);

  // Monitor geographical telemetry profiles safely over analytical path loops
  useEffect(() => {
    if (list.length > 0) {
      trackEvent("geography_location_card_rendered", {
        listedCount: list.length,
        hasMatchedUserHome: list.some((c) => c.country.toLowerCase() === userCountry),
      });
    }
  }, [list.length, userCountry]);

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-3.5 py-14 px-6 rounded-2xl border border-dashed border-border/60 bg-card/40 backdrop-blur-md select-none animate-in fade-in duration-300 w-full">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-1 shadow-inner border border-border/10">
          <Globe className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-semibold text-foreground/90 tracking-tight">No location data yet</p>
        <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
          We'll show you where roles are opening as soon as our matching markers pick up active data signals.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            trackEvent("geography_empty_state_browse_clicked");
            navigate("/app/jobs/all");
          }}
          className="rounded-xl font-medium text-xs mt-1 shadow-sm border-border/60 bg-background hover:bg-muted"
        >
          Browse all jobs
        </Button>
      </div>
    );
  }

  const handleCityNavigationClick = (cityName: string) => {
    trackEvent("geography_city_filter_triggered", { city: cityName });
    try {
      navigate(`/app/jobs/all?city=${encodeURIComponent(cityName)}`);
    } catch (err) {
      trackError(err, {
        component: "LocationsView",
        action: "execute_onCityClick_navigation",
        city: cityName,
      });
    }
  };

  return (
    <div className="space-y-6 antialiased select-none sm:select-text w-full">
      {/* High-performance hardware accelerated grid matrix layer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 transform-gpu">
        {sortedCountries.map((c) => {
          const isHomeMatch = c.country.toLowerCase() === userCountry;
          return (
            <div
              key={c.country}
              className={cn(
                "transition-transform duration-200 hover:scale-[1.005] h-full rounded-2xl",
                isHomeMatch && "border border-primary/10 shadow-sm",
              )}
            >
              <CountryCard country={c} isUserCountry={isHomeMatch} onCityClick={handleCityNavigationClick} />
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pt-2 select-none">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            trackEvent("geography_view_all_jobs_clicked");
            navigate("/app/jobs/all");
          }}
          className="text-xs font-semibold rounded-xl text-primary hover:text-primary hover:bg-primary/5 gap-1 transition-colors"
        >
          <span>View all jobs</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
