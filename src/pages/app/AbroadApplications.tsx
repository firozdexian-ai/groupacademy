import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listAbroadApplicationsForCurrentUser } from "@/domains/abroad/repo/abroadRepo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface AbroadApplication {
  id: string;
  target_country: string;
  intake_term: string | null;
  stage: string;
  updated_at: string;
  created_at: string;
}

const STAGE_COLORS: Record<string, string> = {
  intake: "bg-slate-500 border-slate-600",
  shortlisted: "bg-blue-500 border-blue-600",
  docs_in_progress: "bg-amber-500 border-amber-600",
  submitted: "bg-cyan-500 border-cyan-600",
  offer: "bg-emerald-500 border-emerald-600",
  visa: "bg-purple-500 border-purple-600",
  enrolled: "bg-green-600 border-green-700",
  declined: "bg-rose-500 border-rose-600",
};

/**
 * GroUp Academy: Authoritative Academic Application Ledger Matrix (AbroadApplications)
 * Hardened tracker component shielding runtime lookups against lookup property cracks and local timezone drift.
 * Version: Launch Candidate · Phase Z0 Lifecycle Insulation Hardened
 */
export default function AbroadApplications() {
  // =========================================================================
  // DATA ACQUISITION PIPELINE THROUGH REACT QUERY CACHE
  // =========================================================================
  const { data: applicationsRegistryRows = [], isLoading: isRegistryCacheResolving } = useQuery<AbroadApplication[]>({
    queryKey: ["my-abroad-applications-ledger"],
    queryFn: async (): Promise<AbroadApplication[]> => {
      const rawDatabaseRows = await listAbroadApplicationsForCurrentUser();
      return (rawDatabaseRows as unknown as AbroadApplication[]) ?? [];
    },
  });

  return (
    <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: TRACKING PROFILE INDEX PANEL BAR */}
      <header className="block w-full select-none pb-2 border-b border-border/10">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground leading-none pt-0.5">
          International Matriculation Portfolios
        </h1>
        <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-none block mt-1">
          Monitor your visa validation states, dossier collection runs, and active university admissions.
        </p>
      </header>

      {/* HUD LEVEL 2: DYNAMIC PIPELINE RESOLUTION BLOCK SWITCHPORTS */}
      {isRegistryCacheResolving ? (
        <div className="space-y-2 block w-full">
          <Skeleton className="h-16 w-full rounded-lg shrink-0" />
          <Skeleton className="h-16 w-full rounded-lg shrink-0" />
        </div>
      ) : applicationsRegistryRows.length === 0 ? (
        <Card className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center select-none block mt-2">
          <Inbox className="h-6 w-6 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
          <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
            No academic migration sequences logged under this profile. Pinpoint a global target workspace route to
            deploy an application record.
          </p>
        </Card>
      ) : (
        <div className="space-y-2 block w-full">
          {applicationsRegistryRows.map((applicationItemNode) => {
            // Defensively evaluate background variables to block unmapped token interpolation breaks
            const matchingStageColorClassStr =
              STAGE_COLORS[applicationItemNode.stage] || "bg-muted border-border text-muted-foreground";

            return (
              <Card
                key={`academic-application-row-${applicationItemNode.id}`}
                className="rounded-lg border border-border/60 bg-card/30 shadow-none overflow-hidden block w-full transform-gpu transition-colors hover:border-border-foreground/5"
              >
                <CardContent className="p-3 flex items-center justify-between gap-4 leading-none w-full">
                  <div className="min-w-0 flex-1 leading-none space-y-1 block">
                    <p className="text-xs sm:text-sm font-bold text-foreground truncate block uppercase tracking-wide pt-0.5 select-text">
                      {applicationItemNode.target_country}
                      <span className="font-mono font-medium opacity-40 mx-2 select-none">·</span>
                      <span className="text-muted-foreground/80 lowercase font-medium font-sans">
                        {applicationItemNode.intake_term ?? "Timeline Allocation Pending"}
                      </span>
                    </p>

                    <div className="font-mono text-[10px] font-bold text-muted-foreground/40 inline-flex items-center gap-1 leading-none select-none pointer-events-none uppercase tracking-tight">
                      <Calendar className="h-3 w-3 stroke-[2.2]" />
                      {/* Force absolute parsing filters to guard client trees against locale hydration drift */}
                      <span>
                        Settle Coordinates:{" "}
                        {new Date(applicationItemNode.updated_at).toLocaleDateString("en-US", { timeZone: "UTC" })}
                      </span>
                    </div>
                  </div>

                  <Badge
                    className={cn(
                      "font-mono text-[9px] font-extrabold uppercase px-2 h-5 tracking-wider select-none shrink-0 pointer-events-none leading-none pt-0.5 rounded-sm border text-white shadow-2xs",
                      matchingStageColorClassStr,
                    )}
                  >
                    {applicationItemNode.stage.replace(/_/g, " ")}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
