import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { TrendingUp, ChevronRight, MapPin, Building2 } from "lucide-react";
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

/**
 * CountryCard — country tile with active job count, top cities, and top employers.
 */
export function CountryCard({ country, isUserCountry = false, onCityClick }: Props) {
  const queryClient = useQueryClient();

  // Monitor geographical index element impressions safely via telemetry hooks
  useEffect(() => {
    if (country?.country) {
      trackEvent("spatial_country_card_rendered", {
        countryName: country.country,
        activeJobs: country.active_jobs,
        isUserLocalContext: isUserCountry,
      });
    }
  }, [country, isUserCountry]);

  if (!country || !country.country) {
    trackError("CountryCard component mounted without standard model anchors.", {
      component: "CountryCard",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const handleCityFilterTrigger = async (cityNameStr: string) => {
    if (!cityNameStr) return;

    trackEvent("spatial_city_node_selected", {
      cityName: cityNameStr,
      countryName: country.country,
    });

    try {
      await onCityClick(cityNameStr);

      // Automated Efficiency: Synchronize cache pools instantly across vertical layouts
      queryClient.invalidateQueries({ queryKey: ["spatial-market-gigs"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    } catch (err) {
      trackError(err, {
        component: "CountryCard",
        action: "execute_onCityClick_callback",
        targetCity: cityNameStr,
        targetCountry: country.country,
      });
    }
  };

  const flagEmojiContext = COUNTRY_FLAGS[country.country] ?? "🌍";
  const activeRolesTotalCount = Number(country.active_jobs || 0);

  return (
    <Card
      className={cn(
        "w-full text-left rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm select-none transition-all duration-300 transform-gpu hover:border-primary/30",
        isUserCountry && "border-primary/30 bg-primary/[0.02] dark:bg-primary/[0.005] shadow-inner",
      )}
    >
      <CardContent className="p-3.5 space-y-3 w-full min-w-0">
        {/* TOP COMPONENT IDENTITY SEGMENT */}
        <div className="flex items-center gap-3 w-full min-w-0">
          {/* Flag Visualization Glyph Wrapper */}
          <div className="h-10 w-10 rounded-xl bg-muted/40 dark:bg-muted/10 border border-border/20 flex items-center justify-center text-xl shrink-0 shadow-inner select-none">
            <span role="img" aria-label={`National flag of ${country.country}`}>
              {flagEmojiContext}
            </span>
          </div>

          {/* Typographic Metadata Container Node */}
          <div className="min-w-0 flex-1 flex flex-col justify-center text-left space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap w-full">
              <p className="text-sm font-bold text-foreground/90 tracking-tight leading-none truncate max-w-[60%] select-text selection:bg-primary/20">
                {country.country}
              </p>

              {isUserCountry && (
                <Badge className="bg-primary/10 border border-primary/20 text-primary text-[9px] font-extrabold tracking-wide uppercase px-1.5 h-4.5 rounded select-none">
                  Your country
                </Badge>
              )}

              {country.jobs_last_14d > 0 && (
                <Badge className="bg-success/10 dark:bg-success/5 text-success dark:text-success border border-success/10 text-[9px] font-extrabold tracking-wide uppercase px-1.5 h-4.5 gap-0.5 shadow-sm shrink-0 tabular-nums animate-in slide-in-from-left-1 duration-200">
                  <TrendingUp className="h-2.5 w-2.5 stroke-[2.5]" />
                  <span>+{country.jobs_last_14d} new</span>
                </Badge>
              )}
            </div>

            <p className="text-[11px] font-bold text-muted-foreground/80 tracking-tight leading-none pt-0.5 tabular-nums select-none">
              {activeRolesTotalCount.toLocaleString()} open{" "}
              {activeRolesTotalCount === 1 ? "active position" : "active positions"}
            </p>
          </div>
        </div>

        {/* MIDDLE TRACK: DYNAMIC CITY NODE LINKS */}
        {country.top_cities && country.top_cities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5 w-full select-none">
            {country.top_cities.slice(0, 3).map((cityItem) => {
              if (!cityItem || !cityItem.name) return null;
              return (
                <button
                  key={cityItem.name}
                  type="button"
                  onClick={() => handleCityFilterTrigger(cityItem.name)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/20 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200 text-[10px] font-bold tracking-tight text-foreground/90 cursor-pointer transform-gpu active:scale-95 outline-none focus-visible:ring-1 focus-visible:ring-ring tabular-nums group"
                  aria-label={`Filter jobs in ${cityItem.name} (${cityItem.count} open)`}
                >
                  <MapPin className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary transition-colors stroke-[2.2]" />
                  <span className="truncate max-w-[80px]">{cityItem.name}</span>
                  <span className="text-muted-foreground/60 font-semibold font-mono text-[9px] border-l border-border/30 pl-1.5">
                    {cityItem.count || 0}
                  </span>
                  <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all stroke-[2.5]" />
                </button>
              );
            })}
          </div>
        )}

        {/* BOTTOM TRACK: SUITE EMPLOYER MARQUEE AVATARS */}
        {country.top_companies && country.top_companies.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-border/10 select-none w-full animate-in fade-in duration-300">
            <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider shrink-0">
              <Building2 className="h-2.5 w-2.5 text-primary stroke-[2.2]" />
              <span>Hiring:</span>
            </div>

            <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
              {country.top_companies.slice(0, 3).map((companyItem) => {
                if (!companyItem || !companyItem.name) return null;

                const alphaInitials =
                  companyItem.name
                    ?.split(" ")
                    .filter(Boolean)
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "CO";

                return (
                  <Avatar
                    key={companyItem.name}
                    title={companyItem.name}
                    className="h-5 w-5 border border-background bg-background shadow-sm shrink-0 transition-transform hover:scale-105 duration-200"
                  >
                    {companyItem.logo_url && (
                      <AvatarImage
                        src={companyItem.logo_url}
                        alt={`${companyItem.name} organization identity logo`}
                        className="object-cover"
                        loading="lazy"
                      />
                    )}
                    <AvatarFallback className="text-[7px] font-extrabold bg-primary/10 text-primary select-none uppercase tracking-tighter scale-90">
                      {alphaInitials}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
