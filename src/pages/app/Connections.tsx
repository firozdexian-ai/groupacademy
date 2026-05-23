import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { acceptConnectionAndOpenThread, respondTalentConnection } from "@/domains/talent/repo/talentRepo";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Check, X, MessageCircle, Clock, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface TalentProfileMetadata {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  custom_profession: string | null;
}

interface ConnRow {
  id: string;
  sender_talent_id: string;
  recipient_talent_id: string;
  status: string;
  fee_paid: number;
  expires_at: string;
  created_at: string;
  responded_at: string | null;
  other: TalentProfileMetadata;
  direction: "incoming" | "outgoing";
}

interface DatabaseConnectionRecord {
  id: string;
  sender_talent_id: string;
  recipient_talent_id: string;
  status: string;
  fee_paid: number;
  expires_at: string;
  created_at: string;
  responded_at: string | null;
}

const SKELETON_ROWS_ROSTER = [1, 2, 3, 4];

/**
 * GroUp Academy: Professional Connection Request Registry (Connections)
 * Hardened responsive communication control workspace grouping pending requests and isolating async state handlers.
 * Version: Launch Candidate · Phase Z1 Production Type Contract Sealed
 */
export default function Connections() {
  const { talent: currentTalentUserNode } = useTalent();
  const { toast } = useToast();
  const navigateHook = useNavigate();

  const [connectionsRegistryRows, setConnectionsRegistryRows] = React.useState<ConnRow[]>([]);
  const [isDataLayerLoading, setIsDataLayerLoading] = React.useState<boolean>(true);
  const [activeMutationTargetId, setActiveMutationTargetId] = React.useState<string | null>(null);

  // =========================================================================
  // DATA ACQUISITION PIPELINE SECURED VIA ATOMIC MOUNT GATES
  // =========================================================================
  const loadConnectionsLedgerInventory = React.useCallback(
    async (isThreadMountedFlag?: { current: boolean }) => {
      if (!currentTalentUserNode?.id) return;

      const localMountFlag = isThreadMountedFlag || { current: true };
      setIsDataLayerLoading(true);

      try {
        const { data: dbConnectionsPayload, error: queryHandshakeError } = await supabase
          .from("talent_connections")
          .select("id, sender_talent_id, recipient_talent_id, status, fee_paid, expires_at, created_at, responded_at")
          .or(`sender_talent_id.eq.${currentTalentUserNode.id},recipient_talent_id.eq.${currentTalentUserNode.id}`)
          .order("created_at", { ascending: false });

        if (queryHandshakeError) throw queryHandshakeError;
        const castConnectionsArray = (dbConnectionsPayload as unknown as DatabaseConnectionRecord[]) ?? [];

        // Extract unique identifier coordinates for multi-row data-fetch joins
        const uniqueForeignIdsSet = new Set<string>();
        castConnectionsArray.forEach((rowNode) => {
          const targetIdStr =
            rowNode.sender_talent_id === currentTalentUserNode.id
              ? rowNode.recipient_talent_id
              : rowNode.sender_talent_id;
          uniqueForeignIdsSet.add(targetIdStr);
        });
        const uniqueForeignIdsArray = Array.from(uniqueForeignIdsSet);

        let joinedTalentsMap = new Map<string, TalentProfileMetadata>();

        if (uniqueForeignIdsArray.length > 0) {
          const { data: dbTalentsPayload, error: talentsJoinError } = await supabase
            .from("talents")
            .select("id, full_name, profile_photo_url, custom_profession")
            .in("id", uniqueForeignIdsArray);

          if (!talentsJoinError && dbTalentsPayload) {
            const castTalentsArray = dbTalentsPayload as unknown as TalentProfileMetadata[];
            joinedTalentsMap = new Map(castTalentsArray.map((talentItem) => [talentItem.id, talentItem]));
          }
        }

        if (!localMountFlag.current) return;

        const calculatedReconciledRows: ConnRow[] = castConnectionsArray.map((rawRowItem) => {
          const associatedForeignId =
            rawRowItem.sender_talent_id === currentTalentUserNode.id
              ? rawRowItem.recipient_talent_id
              : rawRowItem.sender_talent_id;
          const profileFallbackMetadata: TalentProfileMetadata = joinedTalentsMap.get(associatedForeignId) ?? {
            id: associatedForeignId,
            full_name: "Unknown member",
            profile_photo_url: null,
            custom_profession: "Member",
          };

          return {
            ...rawRowItem,
            direction: rawRowItem.recipient_talent_id === currentTalentUserNode.id ? "incoming" : "outgoing",
            other: profileFallbackMetadata,
          };
        });

        setConnectionsRegistryRows(calculatedReconciledRows);
      } catch (fatalHandshakeException) {
        console.error("Failed to load connections:", fatalHandshakeException);
      } finally {
        if (localMountFlag.current) {
          setIsDataLayerLoading(false);
        }
      }
    },
    [currentTalentUserNode?.id],
  );

  React.useEffect(() => {
    const isThreadMountedFlag = { current: true };
    loadConnectionsLedgerInventory(isThreadMountedFlag);

    return () => {
      isThreadMountedFlag.current = false;
    };
  }, [loadConnectionsLedgerInventory]);

  // =========================================================================
  // ACTION HOOKS: AUTHORITATIVE RPC DIRECTION DISPATCH CORES
  // =========================================================================
  const handleAcceptRequestSequence = React.useCallback(
    async (targetConnectionIdUUID: string) => {
      if (activeMutationTargetId) return;
      setActiveMutationTargetId(targetConnectionIdUUID);

      const isThreadMountedFlag = { current: true };
      try {
        const rpcThreadIdResponse = await acceptConnectionAndOpenThread(targetConnectionIdUUID);

        toast({
          title: "Connection accepted",
          description: "You can now message each other.",
        });
        if (rpcThreadIdResponse && isThreadMountedFlag.current) {
          navigateHook(`/app/messages/${String(rpcThreadIdResponse)}`);
        } else {
          await loadConnectionsLedgerInventory(isThreadMountedFlag);
        }
      } catch (fatalMutationException: any) {
        toast({
          title: "Authorization Refused",
          description: fatalMutationException.message || "Failed to accept.",
          variant: "destructive",
        });
      } finally {
        if (isThreadMountedFlag.current) {
          setActiveMutationTargetId(null);
        }
        isThreadMountedFlag.current = false;
      }
    },
    [activeMutationTargetId, navigateHook, loadConnectionsLedgerInventory, toast],
  );

  const handleDeclineRequestSequence = React.useCallback(
    async (targetConnectionIdUUID: string) => {
      if (activeMutationTargetId) return;
      setActiveMutationTargetId(targetConnectionIdUUID);

      const isThreadMountedFlag = { current: true };
      try {
        await respondTalentConnection({ requestId: targetConnectionIdUUID, accept: false });

        toast({
          title: "Request declined",
          description: "Any credits used have been refunded.",
        });
        await loadConnectionsLedgerInventory(isThreadMountedFlag);
      } catch (fatalMutationException: any) {
        toast({
          title: "Couldn't decline",
          description: fatalMutationException.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        if (isThreadMountedFlag.current) {
          setActiveMutationTargetId(null);
        }
        isThreadMountedFlag.current = false;
      }
    },
    [activeMutationTargetId, loadConnectionsLedgerInventory, toast],
  );

  const handleTransitionToMessageCenter = React.useCallback(() => {
    navigateHook("/app/messages");
  }, [navigateHook]);

  // =========================================================================
  // MEMOIZED PARAMETER SECTOR: SECURE SECTOR FILTER MATRIX SEGMENTS
  // =========================================================================
  const segregatedGroupedConnectionsMap = React.useMemo(() => {
    const pendingIncoming: ConnRow[] = [];
    const pendingOutgoing: ConnRow[] = [];
    const verifiedAccepted: ConnRow[] = [];
    const archivedHistory: ConnRow[] = [];

    connectionsRegistryRows.forEach((rowNode) => {
      if (rowNode.status === "accepted") {
        verifiedAccepted.push(rowNode);
      } else if (rowNode.status === "pending") {
        if (rowNode.direction === "incoming") pendingIncoming.push(rowNode);
        else pendingOutgoing.push(rowNode);
      } else if (["declined", "expired", "refunded"].includes(rowNode.status)) {
        archivedHistory.push(rowNode);
      }
    });

    return {
      incoming: pendingIncoming,
      outgoing: pendingOutgoing,
      accepted: verifiedAccepted,
      history: archivedHistory,
    };
  }, [connectionsRegistryRows]);

  // =========================================================================
  // REUSABLE SUB-RENDER CORE ROW CANVAS CARD BUILDER
  // =========================================================================
  const renderInteractiveConnectionCardRow = React.useCallback(
    (connectionRowItem: ConnRow) => {
      const isRowActionProcessing = activeMutationTargetId === connectionRowItem.id;
      const itemUniqueKeyId = `connection-registry-row-${connectionRowItem.id}`;

      return (
        <Card
          key={itemUniqueKeyId}
          className="rounded-lg border border-border/60 bg-card/40 p-3.5 shadow-none overflow-hidden block w-full transform-gpu"
        >
          <div className="flex items-center gap-3.5 leading-none w-full block">
            <Link
              to={`/app/talents/${connectionRowItem.other.id}`}
              className="shrink-0 select-none block leading-none outline-none"
            >
              <Avatar className="h-11 w-11 rounded-lg border border-border/20 shadow-3xs shrink-0 block">
                <AvatarImage
                  src={connectionRowItem.other.profile_photo_url ?? undefined}
                  className="object-cover block"
                />
                <AvatarFallback className="font-mono text-xs font-black uppercase bg-muted text-muted-foreground/60 rounded-lg">
                  {connectionRowItem.other.full_name?.[0] || "T"}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0 space-y-1 block leading-none">
              <Link
                to={`/app/talents/${connectionRowItem.other.id}`}
                className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors truncate block pt-0.5 max-w-[160px] sm:max-w-md select-text"
              >
                {connectionRowItem.other.full_name}
              </Link>
              <p className="text-[11px] font-semibold text-muted-foreground/70 truncate block select-text pr-2 leading-tight">
                {connectionRowItem.other.custom_profession || "Member"}
              </p>
              <div className="font-mono text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight flex items-center gap-1.5 select-none pointer-events-none leading-none pt-0.5 tabular-nums">
                <Clock className="h-3 w-3 stroke-[2] shrink-0 text-primary" />
                <span>
                  {formatDistanceToNow(new Date(connectionRowItem.created_at), { addSuffix: true }).toUpperCase()}
                </span>
                <span className="opacity-30 select-none">•</span>
                <span>Draw Allocation: {connectionRowItem.fee_paid.toLocaleString()} Credits</span>
              </div>
            </div>

            {/* Action Interaction Buttons Box Selector */}
            <div className="flex items-center gap-1.5 shrink-0 leading-none block select-none">
              {connectionRowItem.direction === "incoming" && connectionRowItem.status === "pending" && (
                <div className="flex items-center gap-1.5 leading-none block">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isRowActionProcessing}
                    onClick={() => handleAcceptRequestSequence(connectionRowItem.id)}
                    className="h-7.5 px-2.5 rounded font-mono text-[10px] font-extrabold uppercase tracking-wide gap-1 cursor-pointer transform-gpu active:scale-95"
                  >
                    <Check className="h-3 w-3 stroke-[2.5]" /> <span>Accept</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isRowActionProcessing}
                    onClick={() => handleDeclineRequestSequence(connectionRowItem.id)}
                    className="h-7.5 px-2.5 rounded font-mono text-[10px] font-extrabold uppercase tracking-wide gap-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 cursor-pointer"
                  >
                    <X className="h-3 w-3 stroke-[2.5]" /> <span>Decline</span>
                  </Button>
                </div>
              )}

              {connectionRowItem.status === "accepted" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTransitionToMessageCenter}
                  className="h-7.5 px-3 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider border border-border/60 bg-background/50 hover:bg-accent gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-primary stroke-[2.2]" /> <span>Open Chat</span>
                </Button>
              )}

              {connectionRowItem.direction === "outgoing" && connectionRowItem.status === "pending" && (
                <Badge
                  variant="secondary"
                  className="font-mono text-[8px] font-extrabold uppercase tracking-wider px-1.5 h-4.5 rounded pt-0.5 border border-border/5 select-none pointer-events-none leading-none"
                >
                  Pending Gateway Sync
                </Badge>
              )}

              {["declined", "expired", "refunded"].includes(connectionRowItem.status) && (
                <Badge
                  variant="outline"
                  className="font-mono text-[8px] font-extrabold uppercase tracking-wider px-1.5 h-4.5 rounded border border-border/60 text-muted-foreground/50 bg-background pt-0.5 select-none pointer-events-none leading-none capitalize"
                >
                  {connectionRowItem.status}
                </Badge>
              )}
            </div>
          </div>
        </Card>
      );
    },
    [
      activeMutationTargetId,
      handleAcceptRequestSequence,
      handleDeclineRequestSequence,
      handleTransitionToMessageCenter,
    ],
  );

  if (isDataLayerLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-2 select-none pointer-events-none w-full block">
        {SKELETON_ROWS_ROSTER.map((rowVal) => (
          <Skeleton
            key={`connections-skeleton-row-item-${rowVal}`}
            className="h-20 w-full rounded-lg bg-card/20 block border border-transparent shadow-none"
          />
        ))}
      </div>
    );
  }

  const { incoming, outgoing, accepted, history } = segregatedGroupedConnectionsMap;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 space-y-5 text-left antialiased block transform-gpu w-full">
      {/* HUD LEVEL 1: STRUCTURAL HUD CONTEXT BAR TITLES */}
      <header className="space-y-1 block select-none pointer-events-none border-b border-border/10 pb-3 w-full shrink-0 leading-none">
        <div className="flex items-center gap-2 leading-none w-full block">
          <Sparkles className="h-5 w-5 text-primary stroke-[2.2] shrink-0" />
          <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide text-foreground pt-0.5 block truncate">
            Professional Network Connections
          </h1>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/60 leading-none block pt-0.5">
          Manage incoming communication requests, audit sent tracking rows, and execute synchronized chat environment
          links securely.
        </p>
      </header>

      {/* HUD LEVEL 2: DYNAMIC TABS DISPATCH MATRICES */}
      <div className="w-full block">
        <Tabs defaultValue="incoming" className="w-full block">
          <TabsList className="grid w-full grid-cols-4 p-1 h-10 bg-muted/40 rounded-lg border border-border/10 select-none">
            <TabsTrigger
              value="incoming"
              className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider h-8 cursor-pointer outline-none pt-0.5 tabular-nums"
            >
              Incoming {incoming.length > 0 ? `(${incoming.length.toString()})` : ""}
            </TabsTrigger>
            <TabsTrigger
              value="outgoing"
              className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider h-8 cursor-pointer outline-none pt-0.5 tabular-nums"
            >
              Sent {outgoing.length > 0 ? `(${outgoing.length.toString()})` : ""}
            </TabsTrigger>
            <TabsTrigger
              value="accepted"
              className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider h-8 cursor-pointer outline-none pt-0.5 tabular-nums"
            >
              Accepted
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider h-8 cursor-pointer outline-none pt-0.5 tabular-nums"
            >
              History Archive
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="incoming"
            className="space-y-2 mt-4 block w-full focus:outline-none outline-none animate-in fade-in duration-100"
          >
            {incoming.length === 0 ? (
              <EmptyScreenDisplayMessage msgText="No incoming integration request balance pending validation row entries." />
            ) : (
              incoming.map(renderInteractiveConnectionCardRow)
            )}
          </TabsContent>
          <TabsContent
            value="outgoing"
            className="space-y-2 mt-4 block w-full focus:outline-none outline-none animate-in fade-in duration-100"
          >
            {outgoing.length === 0 ? (
              <EmptyScreenDisplayMessage msgText="Your sent transmission records matrix queue is empty." />
            ) : (
              outgoing.map(renderInteractiveConnectionCardRow)
            )}
          </TabsContent>
          <TabsContent
            value="accepted"
            className="space-y-2 mt-4 block w-full focus:outline-none outline-none animate-in fade-in duration-100"
          >
            {accepted.length === 0 ? (
              <EmptyScreenDisplayMessage msgText="No active verified peer networks committed yet under this profile credential." />
            ) : (
              accepted.map(renderInteractiveConnectionCardRow)
            )}
          </TabsContent>
          <TabsContent
            value="history"
            className="space-y-2 mt-4 block w-full focus:outline-none outline-none animate-in fade-in duration-100"
          >
            {history.length === 0 ? (
              <EmptyScreenDisplayMessage msgText="Historical logs clear. No previous execution updates filed." />
            ) : (
              history.map(renderInteractiveConnectionCardRow)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// =========================================================================
// NESTED ELEMENT: REUSABLE EMPTY STATE BOUNDARY PLACEHOLDER BLOCK
// =========================================================================
function EmptyScreenDisplayMessage({ msgText }: { msgText: string }) {
  return (
    <Card className="rounded-lg border border-dashed border-border/80 bg-muted/5 p-8 text-center select-none block w-full shadow-none pointer-events-none">
      <CardContent className="p-0 space-y-2 block w-full leading-none">
        <div className="h-9 w-9 rounded-lg bg-background border border-border/40 flex items-center justify-center text-muted-foreground/30 mx-auto">
          <UserCheck className="h-4 w-4 stroke-[2.2]" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground/40 leading-normal max-w-xs mx-auto block pt-1">
          {msgText}
        </p>
      </CardContent>
    </Card>
  );
}
