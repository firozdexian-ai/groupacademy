import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Scale, Calendar, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface DisputeRecord {
  id: string;
  gig_id: string;
  reason_code: string;
  status: "pending" | "resolved" | "rejected" | string;
  final_verdict: string | null;
  created_at: string;
  opened_by_role: string;
}

const SKELETON_ROWS_ROSTER = [1, 2, 3];

/**
 * GroUp Academy: Gig Dispute Mitigation & Settlement Interface (GigDisputes)
 * Hardened responsive arbitration ledger monitoring ongoing contract disputes and safeguarding state updates on unmount.
 * Version: Launch Candidate · Phase Z1 Production Type Contract Sealed
 */
export default function GigDisputes() {
  const [disputesRegistryItems, setDisputesRegistryItems] = React.useState<DisputeRecord[]>([]);
  const [isDataLayerLoading, setIsDataLayerLoading] = React.useState<boolean>(true);

  // =========================================================================
  // LIFECYCLE SECTOR 1: DATA ACQUISITION PIPELINE SECURED VIA MOUNT GATES
  // =========================================================================
  React.useEffect(() => {
    const isThreadActiveFlag = { current: true };
    setIsDataLayerLoading(true);

    const loadDisputesLedgerHistory = async () => {
      try {
        const { data: dbDisputesPayload, error: queryHandshakeError } = await supabase
          .from("gig_disputes")
          .select("id, gig_id, reason_code, status, final_verdict, created_at, opened_by_role")
          .order("created_at", { ascending: false });

        if (queryHandshakeError) throw queryHandshakeError;

        if (isThreadActiveFlag.current) {
          setDisputesRegistryItems((dbDisputesPayload as unknown as DisputeRecord[]) ?? []);
        }
      } catch (fatalHandshakeException) {
        console.error("[gigs] Failed to load disputes:", fatalHandshakeException);
      } finally {
        if (isThreadActiveFlag.current) {
          setIsDataLayerLoading(false);
        }
      }
    };

    loadDisputesLedgerHistory();

    return () => {
      isThreadActiveFlag.current = false;
    };
  }, []);

  // =========================================================================
  // CONDITION RENDERING LAYOUT CONTROL CHECKPOINTS
  // =========================================================================
  if (isDataLayerLoading) {
    return (
      <div
        role="status"
        className="w-full flex items-center justify-center py-16 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none pointer-events-none gap-2.5"
      >
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0 stroke-[2.5]" />
        <span>Loading disputes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: APPLICATION HEADER MODULE DESCRIPTION PANELS */}
      <header className="space-y-1 block select-none pointer-events-none border-b border-border/10 pb-3 w-full shrink-0 leading-none">
        <div className="flex items-center gap-2 leading-none w-full block">
          <Scale className="h-4.5 w-4.5 text-primary stroke-[2.2] shrink-0" />
          <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground pt-0.5 block truncate">
            My disputes
          </h1>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/60 leading-none block pt-0.5">
          Track your open disputes and review final verdicts.
        </p>
      </header>

      {/* HUD LEVEL 2: DIRECTORY GRID ITERATOR LAYOUT MODULES */}
      {disputesRegistryItems.length === 0 ? (
        <Card className="rounded-lg border border-dashed border-border/80 bg-muted/5 p-8 text-center select-none block w-full shadow-none pointer-events-none">
          <CardContent className="p-0 space-y-2 block w-full leading-none">
            <div className="h-9 w-9 rounded-lg bg-background border border-border/40 grid place-items-center text-muted-foreground/30 mx-auto">
              <Scale className="h-4 w-4 stroke-[2.2]" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground/40 leading-normal max-w-xs mx-auto block pt-1">
              You haven't opened any disputes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 block w-full align-top">
          {disputesRegistryItems.map((disputeItemNode) => {
            const isResolved = disputeItemNode.status === "resolved";
            const isRejected = disputeItemNode.status === "rejected";

            // Format incoming temporal markers safely out of raw render runtime streams
            const formattedDateString = disputeItemNode.created_at
              ? new Date(disputeItemNode.created_at)
                  .toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .toUpperCase()
              : "Unknown date";

            return (
              <Card
                key={`dispute-dossier-card-${disputeItemNode.id}`}
                className="rounded-lg border border-border/60 bg-card/30 shadow-none overflow-hidden block w-full"
              >
                <CardHeader className="p-3.5 pb-2 border-b border-border/5 bg-muted/20 flex flex-row items-center justify-between w-full select-none shrink-0 leading-none">
                  <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2 m-0">
                    <span>Reason: {disputeItemNode.reason_code.replace(/_/g, " ")}</span>
                  </CardTitle>

                  <Badge
                    variant={isResolved ? "default" : isRejected ? "destructive" : "secondary"}
                    className={cn(
                      "font-mono text-[8px] font-black uppercase px-2 h-4.5 border tracking-wide pt-0.5 leading-none shrink-0 rounded-xs shadow-3xs",
                      !isResolved && !isRejected && "bg-muted text-muted-foreground border-border/40",
                    )}
                  >
                    {disputeItemNode.status.toUpperCase()}
                  </Badge>
                </CardHeader>

                <CardContent className="p-3.5 space-y-2 block w-full leading-none select-text">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tight select-none pointer-events-none leading-none tabular-nums w-full shrink-0">
                    <div className="flex items-center gap-1">
                      <span>Opened by: </span>
                      <strong className="text-foreground/70 font-sans tracking-normal font-semibold capitalize">
                        {disputeItemNode.opened_by_role}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 stroke-[2] shrink-0 text-muted-foreground/30" />
                      <span>{formattedDateString}</span>
                    </div>
                  </div>

                  {/* Operational supplementary final verdict notification box */}
                  {disputeItemNode.final_verdict && (
                    <div className="rounded-lg border border-border/60 bg-background/50 p-3 block w-full leading-none select-text mt-1.5 flex items-start gap-2.5">
                      <ShieldAlert className="h-4 w-4 text-muted-foreground/40 stroke-[2.2] shrink-0 mt-0.5 select-none pointer-events-none" />
                      <div className="flex-1 leading-normal block">
                        <span className="font-mono text-[9px] font-bold uppercase text-muted-foreground/50 tracking-wide block mb-1 select-none pointer-events-none leading-none">
                          System Final Settlement Verdict
                        </span>
                        <p className="text-xs text-foreground/80 font-semibold tracking-normal">
                          {disputeItemNode.final_verdict}
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
