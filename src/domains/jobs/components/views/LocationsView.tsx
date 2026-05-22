import { useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryCard } from "@/domains/jobs/components/CountryCard";
import type { CountryWithSignal } from "@/hooks/useCountriesWithSignal";

interface Props {
  countries?: CountryWithSignal[];
  talent?: { country?: string | null } | null;
}

export function LocationsView({ countries, talent }: Props) {
  const navigate = useNavigate();
  const list = countries ?? [];

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-12 px-4 rounded-2xl border border-dashed border-border/40 bg-card/40">
        <Globe className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground/80">No location data yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          We'll show you where roles are opening as soon as we have signal.
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate("/app/jobs/all")}>
          Browse all jobs
        </Button>
      </div>
    );
  }

  const userCountry = talent?.country?.trim().toLowerCase() ?? "";
  const sorted = [...list].sort((a, b) => {
    const aMatch = a.country.toLowerCase() === userCountry ? 1 : 0;
    const bMatch = b.country.toLowerCase() === userCountry ? 1 : 0;
    return bMatch - aMatch;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((c) => (
          <CountryCard
            key={c.country}
            country={c}
            isUserCountry={c.country.toLowerCase() === userCountry}
            onCityClick={(city) =>
              navigate(`/app/jobs/all?city=${encodeURIComponent(city)}`)
            }
          />
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/jobs/all")}>
          View all jobs →
        </Button>
      </div>
    </div>
  );
}
