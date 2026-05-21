import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTalentLists, useAddToList, useCreateTalentList } from "@/domains/profile/hooks/useTalentLists";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Plus, Bookmark, Loader2, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaveToListSheetProps {
  companyId: string;
  talentId: string;
  talentName: string;
  onClose: () => void;
}

interface StructuralTalentListNode {
  id: string;
  name: string;
  member_count?: number;
}

/**
 * GroUp Academy: Talent Pipeline Curation Sheet Orchestrator (SaveToListSheet)
 * An authoritative operational sandbox managing target profile saving actions, dynamic pipeline generation, and list metrics tracking.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function SaveToListSheet({ companyId, talentId, talentName, onClose }: SaveToListSheetProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const { data: talentListsPayload, isLoading: isRegistryLoading } = useTalentLists(companyId);
  const addToListMutation = useAddToList();
  const createListMutation = useCreateTalentList();

  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newListNameInput, setNewListNameInput] = useState("");
  const [curationNoteInput, setCurationNoteInput] = useState("");
  const [internalActionBusy, setInternalActionBusy] = useState(false);

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("save_to_list_sheet_mounted", { companyId, talentId });
    return () => {
      isMountedRef.current = false;
    };
  }, [companyId, talentId]);

  const safeTalentListsCollection = useMemo(() => {
    if (!Array.isArray(talentListsPayload)) return [];
    return talentListsPayload.filter(
      (listNode) => listNode && typeof listNode.id === "string",
    ) as StructuralTalentListNode[];
  }, [talentListsPayload]);

  const handleProfileSaveExecute = async (targetListIdStr: string) => {
    if (!targetListIdStr || internalActionBusy) return;

    setInternalActionBusy(true);
    trackEvent("save_to_list_execution_initiated", { targetListIdStr });
    const dynamicToastTrackerId = toast.loading("Committing curation properties down pipeline tracking rows…");

    try {
      await addToListMutation.mutateAsync({
        listId: targetListIdStr,
        talentId,
        note: curationNoteInput.trim() || undefined,
        companyId,
      });

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["talent-lists", companyId] });
      await queryClient.invalidateQueries({ queryKey: ["talent-profile", talentId] });

      if (isMountedRef.current) {
        toast.success(
          `Profile vectors for ${talentName || "talent node"} successfully committed down registry index.`,
          { id: dynamicToastTrackerId },
        );
        trackEvent("save_to_list_execution_success", { targetListIdStr });
        onClose();
      }
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "SaveToListSheet",
        action: "commit_talent_list_save_api",
        targetListIdStr,
      });

      toast.error(`Ecosystem write validation error: ${formattedExceptionMsgStr}`, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setInternalActionBusy(false);
      }
    }
  };

  const handlePipelineWorkspaceCreationProtocol = async () => {
    const sanitizedListNameStr = newListNameInput.trim();
    if (!sanitizedListNameStr || internalActionBusy) return;

    setInternalActionBusy(true);
    trackEvent("save_to_list_workspace_creation_initiated");
    const dynamicToastTrackerId = toast.loading("Initializing fresh candidate roster sector parameters…");

    try {
      const newlyCreatedListObjectNode = await createListMutation.mutateAsync({
        companyId,
        name: sanitizedListNameStr,
      });

      if (!newlyCreatedListObjectNode || !newlyCreatedListObjectNode.id) {
        throw new Error("Registry Error: Target infrastructure node failed to return a valid block ID mapping.");
      }

      await queryClient.invalidateQueries({ queryKey: ["talent-lists", companyId] });
      trackEvent("save_to_list_workspace_creation_success", { targetListIdStr: newlyCreatedListObjectNode.id });

      // Secondary Cascade Ingress: Automatically save target profile directly to newly established track
      await handleProfileSaveExecute(newlyCreatedListObjectNode.id);
    } catch (caughtPipelineExceptionErr: any) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "SaveToListSheet",
        action: "commit_pipeline_workspace_generation",
      });

      toast.error(`Ecosystem setup allocation fault: ${formattedExceptionMsgStr}`, { id: dynamicToastTrackerId });
      if (isMountedRef.current) {
        setInternalActionBusy(false);
      }
    }
  };

  return (
    <Sheet
      open
      onOpenChange={(isOpenStateBool) => {
        if (!isOpenStateBool && !internalActionBusy) {
          trackEvent("save_to_list_sheet_cancelled");
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[80vh] max-h-[80vh] rounded-t-xl border-t border-border/40 bg-background/95 backdrop-blur-xl flex flex-col p-4 sm:p-5 text-left antialiased transform-gpu select-none sm:select-text"
      >
        {/* HUD LEVEL 1: OVERLAY CONTENT WORKSPACE ROW HEADER */}
        <SheetHeader className="mb-4 text-left select-none shrink-0 leading-none w-full">
          <div className="flex items-center gap-2.5 leading-none w-full">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <Bookmark className="h-4 w-4 text-primary stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex flex-col justify-center leading-none flex-1">
              <SheetTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none block truncate text-ellipsis pr-1">
                Index {talentName || "Target Talent Node"} to Curation Pipeline
              </SheetTitle>
              <SheetDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none pt-1">
                Synchronize talent profile matching vectors within specific corporate vetting buckets
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* HUD LEVEL 2: COMPONENT ROW CURATION NOTE ATTACHMENT TEXTAREA */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1 outline-none font-bold text-xs text-foreground/90 w-full min-w-0 flex flex-col justify-start">
          <div className="space-y-1.5 text-left w-full min-w-0 shrink-0">
            <Textarea
              rows={2}
              value={curationNoteInput}
              disabled={internalActionBusy}
              placeholder="Inject precise contextual sourcing context notes (e.g. key psychometric parity yields, performance vectors observed)…"
              onChange={(e) => setCurationNoteInput(e.target.value)}
              className="w-full rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 leading-relaxed resize-none shadow-inner min-h-[60px] focus-visible:ring-1 focus-visible:ring-ring"
              maxLength={300}
            />
          </div>

          {/* HUD LEVEL 3: SCROLL AREA DIRECTORY HOSTING ACTIVE ACCOUNT RETRIEVAL ARRAYS */}
          <ScrollArea className="flex-1 border border-border/10 bg-muted/5 rounded-xl p-2 w-full min-w-0 select-none">
            <div className="space-y-2 w-full min-w-0 flex flex-col justify-start">
              {isRegistryLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground leading-none w-full">
                  <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5]" />
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider animate-pulse">
                    Hydrating organizational lists matrix…
                  </span>
                </div>
              ) : safeTalentListsCollection.length === 0 ? (
                <p className="text-[10px] font-mono font-extrabold text-center py-12 uppercase tracking-widest text-muted-foreground/40 italic">
                  Pipeline Directory Vacant &bull; Mapped categories unallocated
                </p>
              ) : (
                safeTalentListsCollection.map((listNodeItem) => (
                  <button
                    key={listNodeItem.id}
                    type="button"
                    disabled={internalActionBusy}
                    onClick={() => handleProfileSaveExecute(listNodeItem.id)}
                    className="w-full flex items-center justify-between gap-4 p-3 rounded-lg border border-border/40 bg-background/50 hover:bg-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 select-none text-left font-bold text-xs tracking-tight transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span className="flex items-center gap-2 min-w-0 flex-1 text-foreground/90 uppercase italic text-xs tracking-wide truncate text-ellipsis pr-1">
                      <Bookmark className="h-4 w-4 text-muted-foreground/60 shrink-0 stroke-[2.2]" />
                      <span>{listNodeItem.name}</span>
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-md font-mono font-bold text-[9px] h-5 px-1.5 shrink-0 bg-muted text-muted-foreground border-border/10 uppercase tracking-normal"
                    >
                      {listNodeItem.member_count ?? 0} vectors
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* HUD LEVEL 4: CONDITIONAL PANEL DISPATCHING FRESH WORKSPACE GENERATION */}
          <div className="w-full shrink-0 font-bold text-xs select-none border-t border-border/10 pt-3 mt-auto">
            {showCreateWorkspace ? (
              <div className="space-y-3 p-3 border border-border/40 bg-background/50 rounded-xl w-full flex flex-col justify-center animate-in slide-in-from-bottom-1 duration-150">
                <div className="space-y-1.5 text-left w-full min-w-0">
                  <Input
                    value={newListNameInput}
                    disabled={internalActionBusy}
                    placeholder="Enter precise configuration name for replacement pipeline roster…"
                    onChange={(e) => setNewListNameInput(e.target.value)}
                    className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block focus-visible:ring-1 focus-visible:ring-ring uppercase select-text"
                    maxLength={50}
                  />
                </div>

                <div className="flex gap-2.5 font-bold text-xs select-none w-full shrink-0">
                  <Button
                    size="sm"
                    type="button"
                    disabled={!newListNameInput.trim() || internalActionBusy}
                    onClick={handlePipelineWorkspaceCreationProtocol}
                    className="flex-[2] h-9 rounded-xl font-bold uppercase text-[10px] tracking-wide gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-transform active:scale-[0.985] flex items-center justify-center"
                  >
                    {internalActionBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                        <span>Allocate & Commit Roster</span>
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    disabled={internalActionBusy}
                    onClick={() => {
                      setNewListNameInput("");
                      setShowCreateWorkspace(false);
                    }}
                    className="flex-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 hover:text-foreground h-9 px-3 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={internalActionBusy || isRegistryLoading}
                onClick={() => setShowCreateWorkspace(true)}
                className="w-full h-10 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer hover:bg-accent gap-1.5 flex items-center justify-center transition-colors select-none"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Initialize Alternative Segment Sourcing List Node</span>
              </Button>
            )}
          </div>
        </div>

        {/* HUD LEVEL 5: OVERLAY BOTTOM OMNIPRESENCE SHIELD RIBBON FOOTER */}
        <div className="shrink-0 pt-2 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none uppercase w-full flex items-center justify-center gap-1.5 h-6">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
          <span>Talent tracking classification curation segment variables index processing complete</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
