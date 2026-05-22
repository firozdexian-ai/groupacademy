import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listActiveDestinationAgents } from "@/domains/abroad/repo/abroadRepo";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Plane, Languages, Mic, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface DestinationAgent {
  id: string;
  country_code: string;
  display_name: string;
  tagline: string | null;
  flag_emoji: string | null;
  is_active: boolean;
  display_order: number | null;
}

/**
 * GroUp Academy: International Matriculation Navigation Hub (AbroadHub)
 * Hardened responsive directory panel aligning background lookup states and stabilizing tracking card grids.
 * Version: Launch Candidate · Phase Z0 Interface Architecture Hardened
 */
export default function AbroadHub() {
  // =========================================================================
  // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
  // =========================================================================
  const { data: destinationAgentsRegistry = [], isLoading: isRegistryResolving } = useQuery<DestinationAgent[]>({
    queryKey: ["destination-agents-registry-list"],
    queryFn: async (): Promise<DestinationAgent[]> => {
      const databaseOutputPayload = await listActiveDestinationAgents();
      return (databaseOutputPayload as unknown as DestinationAgent[]) ?? [];
    },
  });

  return (
    <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: APP SHELL CONTEXT HEADER BANNER */}
      <header className="block w-full select-none pb-2 border-b border-border/10">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground leading-none pt-0.5">
          Global Mobility Ecosystem
        </h1>
        <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-none block mt-1">
          Select an international operations track destination to formulate academic path coordinates.
        </p>
      </header>

      {/* HUD LEVEL 2: COMPOSITE ASSESSMENT AND LANGUAGE COACH RIGS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 block w-full select-none">
        <Link
          to="/app/abroad/ielts"
          className="group block rounded-lg outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Card className="rounded-lg border border-border/60 bg-card/30 shadow-none transition-colors duration-100 hover:border-border-foreground/10">
            <CardContent className="p-3 flex items-center gap-2.5 leading-none w-full block">
              <Mic className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground group-hover:text-primary transition-colors block pt-0.5">
                IELTS Language Evaluator Coach
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link
          to="/app/languages"
          className="group block rounded-lg outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Card className="rounded-lg border border-border/60 bg-card/30 shadow-none transition-colors duration-100 hover:border-border-foreground/10">
            <CardContent className="p-3 flex items-center gap-2.5 leading-none w-full block">
              <Languages className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground group-hover:text-primary transition-colors block pt-0.5">
                Universal Language Research Lab
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* HUD LEVEL 3: DYNAMIC DESTINATION ENTRY VECTOR STREAM */}
      <div className="space-y-2 block w-full">
        <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
          Verified Destination Target Nodes
        </h2>

        {isRegistryResolving ? (
          // Symmetric layout skeleton tracks to securely avoid layout-snapping glitches
          <div className="space-y-2 block w-full">
            {Array.from({ length: 3 }).map((_, skeletonIdxNum) => (
              <div
                key={`destination-hub-loading-skeleton-${skeletonIdxNum}`}
                className="rounded-lg border border-border/40 p-3 flex items-center gap-3.5 leading-none bg-card/10 block w-full"
              >
                <Skeleton className="h-8 w-8 rounded-md shrink-0 block" />
                <div className="flex-1 min-w-0 space-y-1.5 block leading-none">
                  <Skeleton className="h-3 w-1/4 rounded-xs block" />
                  <Skeleton className="h-2.5 w-1/2 rounded-xs block" />
                </div>
              </div>
            ))}
          </div>
        ) : destinationAgentsRegistry.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center select-none block">
            <Inbox className="h-5 w-5 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
            <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
              No country-specific destination neural interfaces are active within this tracking quadrant sequence.
            </p>
          </div>
        ) : (
          <div className="space-y-2 block w-full">
            {destinationAgentsRegistry.map((agentItemNode) => (
              <Link
                key={`destination-agent-route-link-${agentItemNode.country_code}`}
                to={`/app/abroad/destinations/${agentItemNode.country_code}`}
                className="group block rounded-lg outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Card className="rounded-lg border border-border/60 bg-card/40 shadow-none transition-colors duration-100 hover:border-border-foreground/10 overflow-hidden">
                  <CardContent className="p-3 flex items-center gap-3.5 leading-none w-full block">
                    <span
                      role="img"
                      aria-label={`${agentItemNode.display_name} localized emblem flag`}
                      className="text-2xl shrink-0 select-none pointer-events-none block leading-none h-8 w-8 grid place-items-center bg-muted/30 rounded border border-border/5"
                    >
                      {agentItemNode.flag_emoji ?? "🌍"}
                    </span>

                    <div className="flex-1 min-w-0 leading-none space-y-1 block">
                      <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate block pt-0.5 uppercase tracking-wide">
                        {agentItemNode.display_name}
                      </p>
                      {agentItemNode.tagline && (
                        <p className="text-[11px] font-semibold text-muted-foreground/60 leading-tight block select-text truncate pr-4">
                          {agentItemNode.tagline}
                        </p>
                      )}
                    </div>

                    <Plane className="h-3.5 w-3.5 text-muted-foreground/40 stroke-[2.2] shrink-0 group-hover:text-foreground group-hover:translate-x-0.5 transition-all select-none pointer-events-none" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* HUD LEVEL 4: GLOBAL USER SUBMISSIONS FOOT GATE ROUTER */}
      <div className="pt-2 block w-full shrink-0 select-none">
        <Button
          type="button"
          variant="outline"
          asChild
          className="w-full h-9 rounded-lg font-bold uppercase text-[10px] sm:text-xs tracking-wider border border-border/60 bg-background/50 hover:bg-accent transition-colors shadow-2xs transform-gpu active:scale-[0.995] cursor-pointer block"
        >
          <Link to="/app/abroad/applications">Audit Active Portfolio Submissions</Link>
        </Button>
      </div>
    </div>
  );
}
