import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CountryWithSignal } from "@/hooks/useCountriesWithSignal";

const COUNTRY_FLAGS: Record<string, string> = {
  Bangladesh: "🇧🇩",
  India: "🇮🇳",
  Pakistan: "🇵🇰",
  Singapore: "🇸🇬",
  Japan: "🇯🇵",
  "United Arab Emirates": "🇦🇪",
  "Saudi Arabia": "🇸🇦",
  Ireland: "🇮🇪",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  Canada: "🇨🇦",
  Australia: "🇦🇺",
  Germany: "🇩🇪",
  Netherlands: "🇳🇱",
  Malaysia: "🇲🇾",
  Qatar: "🇶🇦",
};

interface Props {
  country: CountryWithSignal;
  isUserCountry?: boolean;
  onCityClick: (city: string) => void;
}

export function CountryCard({ country, isUserCountry, onCityClick }: Props) {
  const flag = COUNTRY_FLAGS[country.country] ?? "🌍";

  return (
    <Card className={cn(isUserCountry && "border-primary/40 bg-primary/5")}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center text-2xl shrink-0">
            {flag}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">{country.country}</p>
              {isUserCountry && (
                <Badge className="bg-primary/15 text-primary border-0 text-[9px] px-1.5 py-0">
                  Your country
                </Badge>
              )}
              {country.jobs_last_14d > 0 && (
                <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[9px] px-1.5 py-0 gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />+{country.jobs_last_14d}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {country.active_jobs} open {country.active_jobs === 1 ? "role" : "roles"}
            </p>
          </div>
        </div>

        {country.top_cities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {country.top_cities.slice(0, 3).map((c) => (
              <button
                key={c.name}
                onClick={() => onCityClick(c.name)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/40 hover:bg-primary/10 transition-colors text-[10px] font-medium"
              >
                {c.name}
                <span className="text-muted-foreground">{c.count}</span>
                <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {country.top_companies.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <span className="text-[9px] text-muted-foreground mr-1">Hiring:</span>
            {country.top_companies.slice(0, 3).map((co) => (
              <Avatar key={co.name} className="h-5 w-5 border border-border">
                {co.logo_url && <AvatarImage src={co.logo_url} />}
                <AvatarFallback className="text-[8px]">{co.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
