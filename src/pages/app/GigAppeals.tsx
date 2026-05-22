import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationVerdictCard } from "@/domains/gigs/components/talent/VerificationVerdictCard";
import { Scale, Loader2, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface GigVerificationDetails {
  id: string;
  status: string;
  verdict_notes: string | null;
  created_at: string;
}

interface VerificationAppealRecord {
  id: string;
  verification_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | string;
  resolution_notes: string | null;
  created_at: string;
  gig_verifications: GigVerificationDetails | null;
}

const SKELETON_ITEMS_ROSTER = [1, 2, 3];

/**
 * GroUp Academy: Gig Verification Dispute & Appeals Registry (GigAppeals)
 * Hardened responsive arbitration ledger listing automated verdicts and managing strict schema data validation paths.
 * Version: Launch Candidate · Phase Z1 Production Type Contract Sealed
 */
export default function GigAppeals() {
  // =========================================================================
  // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
  // =========================================================================
  const { data: appealsLedgerPayload = [], isLoading: isLedgerCacheResolving } = useQuery<VerificationAppealRecord[]>({
    queryKey: ["app-talent-gig-appeals-ledger"],
    queryFn: async (): Promise<VerificationAppealRecord[]> => {
      const { data: dbAppealsPayload, error: queryHandshakeError } = await supabase
        .from("gig_verification_appeals")
        .select(
          "id, verification_id, reason, status, resolution_notes, created_at, gig_verifications(id, status, verdict_notes, created_at)",
        )
        .order("created_at", { ascending: false });

      if (queryHandshakeError) throw queryHandshakeError;
      return (dbAppealsPayload as unknown as VerificationAppealRecord[]) ?? [];
    },
    staleTime: 2 * 60 * 1000, // Optimize read telemetry lifecycle
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4 pb-safe-bottom text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: STRUCTURAL HUD CONTEXT BAR TITLES */}
      <header className="space-y-1 block select-none pointer-events-none border-b border-border/10 pb-3 w-full shrink-0 leading-none">
        <div className="flex items-center gap-2 leading-none w-full block">
          <Scale className="h-4.5 w-4.5 text-primary stroke-[2.2] shrink-0" />
          <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground pt-0.5 block truncate">
            Disputes & Verification Appeals
          </h1>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/60 leading-none block pt-0.5">
          Track individual submitted verification disputes, analyze procedural milestones, and review automated AI
          verdict indexes.
        </p>
      </header>

      {/* HUD LEVEL 2: CONDITIONAL CONTENT CONTAINER ROUTING CORES */}
      {isLedgerCacheResolving ? (
        <div className="space-y-2.5 block w-full select-none pointer-events-none">
          {SKELETON_ITEMS_ROSTER.map((idxNum) => (
            <Skeleton
              key={`appeals-ledger-skeleton-card-${idxNum}`}
              className="h-28 w-full rounded-lg bg-card/10 block border border-transparent shadow-none"
            />
          ))}
        </div>
      ) : appealsLedgerPayload.length === 0 ? (
        <Card className="rounded-lg border border-dashed border-border/80 bg-muted/5 p-8 text-center select-none block w-full shadow-none pointer-events-none">
          <CardContent className="p-0 space-y-2 block w-full leading-none">
            <div className="h-9 w-9 rounded-lg bg-background border border-border/40 grid place-items-center text-muted-foreground/30 mx-auto">
              <Scale className="h-4 w-4 stroke-[2.2]" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground/40 leading-normal max-w-xs mx-auto block pt-1">
              No dispute appeals logged. Your verification tracking archive history matches the system clearance base
              standard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 block w-full align-top">
          {appealsLedgerPayload.map((appealItemNode) => {
            const isApproved = appealItemNode.status === "approved";
            const isRejected = appealItemNode.status === "rejected";

            // Format incoming temporal markers safely out of raw render runtime streams
            const formattedDateString = appealItemNode.created_at
              ? new Date(appealItemNode.created_at)
                  .toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                  .toUpperCase()
              : "UNKNOWN REGISTRATION DATE";

            return (
              <Card
                key={`appeal-dispute-record-row-${appealItemNode.id}`}
                className="rounded-lg border border-border/60 bg-card/30 shadow-none overflow-hidden block w-full"
              >
                <CardContent className="p-4 space-y-3 block w-full leading-none">
                  {/* Item Badge & Telemetry Heading Row */}
                  <div className="flex items-center justify-between gap-4 leading-none w-full shrink-0 select-none pointer-events-none">
                    <Badge
                      variant={isApproved ? "default" : isRejected ? "destructive" : "secondary"}
                      className={cn(
                        "font-mono text-[8px] font-black uppercase px-2 h-4.5 rounded border tracking-wide pt-0.5 leading-none shrink-0 rounded-xs shadow-3xs",
                        !isApproved && !isRejected && "bg-muted text-muted-foreground border-border/40",
                      )}
                    >
                      {appealItemNode.status.toUpperCase()}
                    </Badge>

                    <span className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight flex items-center gap-1.5 leading-none tabular-nums pt-0.5">
                      <Calendar className="h-3.5 w-3.5 stroke-[2] shrink-0 text-muted-foreground/30" />
                      <span>{formattedDateString}</span>
                    </span>
                  </div>

                  {/* Submission Reason Core Payload Block */}
                  <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed block select-text whitespace-normal break-words tracking-normal">
                    {appealItemNode.reason}
                  </p>

                  {/* Relational Nested Component Gateways */}
                  {appealItemNode.gig_verifications && (
                    <div className="block w-full leading-none select-text border-t border-border/5 pt-3 mt-1 shrink-0">
                      <VerificationVerdictCard verification={appealItemNode.gig_verifications as any} />
                    </div>
                  )}

                  {/* Supplemental Operations Notes From Administration Channels */}
                  {appealItemNode.resolution_notes && (
                    <div className="rounded-lg border border-border/60 bg-muted/40 p-3 block w-full leading-none select-text mt-1 flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-muted-foreground/40 stroke-[2.2] shrink-0 mt-0.5 select-none pointer-events-none" />
                      <div className="flex-1 leading-normal block">
                        <span className="font-mono text-[9px] font-bold uppercase text-muted-foreground/50 tracking-wide block mb-1 select-none pointer-events-none leading-none">
                          Administrative Resolution Notes
                        </span>
                        <p className="text-xs text-muted-foreground/80 font-medium italic tracking-normal">
                          {appealItemNode.resolution_notes}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
