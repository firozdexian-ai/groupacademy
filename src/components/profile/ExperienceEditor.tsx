import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Plus, Trash2, Briefcase, Calendar, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExperienceEntry {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ExperienceEditorProps {
  experience: ExperienceEntry[];
  onChange: (experience: ExperienceEntry[]) => void;
}

/**
 * GroUp Academy: Professional Career History Ledger Editor (ExperienceEditor)
 * An authoritative operational sandbox enforcing reverse-chronological data modeling rules over profile configurations.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function ExperienceEditor({ experience = [], onChange }: ExperienceEditorProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("experience_editor_node_mounted", { activeRecordsCount: experience.length });
    return () => {
      isMountedRef.current = false;
    };
  }, [experience.length]);

  // High-Performance Schema Ingress Pass: Protect iteration matrices against incomplete shapes
  const safeExperienceEntriesList = useMemo(() => {
    if (!Array.isArray(experience)) return [];
    return experience.map((entryItem) => ({
      company: typeof entryItem?.company === "string" ? entryItem.company : "",
      position: typeof entryItem?.position === "string" ? entryItem.position : "",
      startDate: typeof entryItem?.startDate === "string" ? entryItem.startDate : "",
      endDate: typeof entryItem?.endDate === "string" ? entryItem.endDate : "",
      description: typeof entryItem?.description === "string" ? entryItem.description : "",
    })) satisfies ExperienceEntry[];
  }, [experience]);

  const addExperienceNode = async () => {
    trackEvent("experience_editor_node_added");
    const freshTemplateNodeItem: ExperienceEntry = {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
    };

    try {
      // Reverse Chronological Protocol Assignment: Prepend records to head indices
      const nextCollectionPayload = [freshTemplateNodeItem, ...safeExperienceEntriesList];
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        onChange(nextCollectionPayload);
      }
    } catch (err) {
      trackError(err, { component: "ExperienceEditor", action: "prepend_blank_experience_node" });
    }
  };

  const removeExperienceNode = async (targetIndexIdNum: number) => {
    if (targetIndexIdNum < 0 || targetIndexIdNum >= safeExperienceEntriesList.length) return;
    trackEvent("experience_editor_node_removed", { positionIndex: targetIndexIdNum });

    try {
      const nextCollectionPayload = safeExperienceEntriesList.filter((_, idx) => idx !== targetIndexIdNum);
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        onChange(nextCollectionPayload);
      }
    } catch (err) {
      trackError(err, {
        component: "ExperienceEditor",
        action: "remove_experience_node",
        positionIndex: targetIndexIdNum,
      });
    }
  };

  const updateExperienceNodeField = (
    targetIndexIdNum: number,
    fieldKeyName: keyof ExperienceEntry,
    nextInputValueStr: string,
  ) => {
    try {
      if (targetIndexIdNum < 0 || targetIndexIdNum >= safeExperienceEntriesList.length) return;

      const nextCollectionPayload = safeExperienceEntriesList.map((entryItem, idx) =>
        idx === targetIndexIdNum ? { ...entryItem, [fieldKeyName]: nextInputValueStr } : entryItem,
      );

      if (isMountedRef.current) {
        onChange(nextCollectionPayload);
      }
    } catch (err) {
      trackError(err, {
        component: "ExperienceEditor",
        action: "update_experience_node_field",
        positionIndex: targetIndexIdNum,
        fieldKeyName,
      });
    }
  };

  const handleActiveRoleStatusToggleProtocol = (targetIndexIdNum: number, isRoleCurrentlyActive: boolean) => {
    trackEvent("experience_editor_active_role_toggled", {
      positionIndex: targetIndexIdNum,
      isActive: isRoleCurrentlyActive,
    });
    updateExperienceNodeField(targetIndexIdNum, "endDate", isRoleCurrentlyActive ? "Present" : "");
  };

  return (
    <div className="space-y-4 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTROLS BLOCK */}
      <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none">
        <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 flex-1 leading-none">
          <Label className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide flex items-center gap-2 leading-none block truncate">
            <Briefcase className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
            <span>Professional Experience Registry</span>
          </Label>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block leading-none pt-0.5">
            Synchronize workspace profile blocks with historical vocational placement indices
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addExperienceNode}
          className="h-8 px-3 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer hover:bg-accent gap-1 flex items-center justify-center transition-colors select-none"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Deploy Node</span>
        </Button>
      </div>

      {/* HUD LEVEL 2: DIRECTORY CORE SELECTION RENDER MATRIX */}
      {safeExperienceEntriesList.length === 0 ? (
        /* COLD START COLD INVITATION ACTION FRAME */
        <div
          role="button"
          onClick={addExperienceNode}
          className="group border border-dashed border-border/40 rounded-xl p-8 sm:p-12 text-center select-none cursor-pointer bg-card/20 hover:bg-card/40 hover:border-border/80 transition-all w-full flex flex-col justify-center items-center py-12 overflow-hidden shadow-xs relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.015] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="relative z-10 space-y-4 w-full flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-sm transition-transform duration-500 ease-out transform group-hover:scale-102 group-hover:rotate-2 shadow-sm shrink-0">
              <Briefcase className="h-5 w-5 text-muted-foreground/40 stroke-[2.2] transition-colors group-hover:text-primary" />
            </div>
            <div className="space-y-1.5 leading-none text-center font-bold text-xs tracking-tight">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground/80 leading-none">
                Experience Ledger Vacant
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/40 leading-normal max-w-xs mx-auto italic">
                No active professional records found. Click here to initialize a career node entry line.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE CONFIGURATION ARTIFACT INPUT CARD LIST */
        <div className="space-y-4 w-full min-w-0 text-left">
          {safeExperienceEntriesList.map((entryItem, index) => {
            const isRoleMarkedCurrent = entryItem.endDate?.trim().toLowerCase() === "present";

            return (
              <Card
                key={index}
                className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-md shadow-sm overflow-hidden text-left w-full min-w-0 flex flex-col justify-center group/card transition-colors hover:border-border/60"
              >
                <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center">
                  {/* CARD ACTIONS LINE ROW CONTROL BAR */}
                  <div className="flex justify-between items-center pb-2.5 border-b border-border/10 select-none leading-none w-full shrink-0 h-8">
                    <div className="flex items-center gap-2 min-w-0 flex-1 h-full">
                      <ShieldCheck className="h-4 w-4 text-primary opacity-50 stroke-[2.2] shrink-0 animate-pulse" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70 truncate block pt-0.5 leading-none">
                        Professional Placement Module Artifact #{safeExperienceEntriesList.length - index}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExperienceNode(index)}
                      className="h-7 w-7 text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors shrink-0 p-0 border-none shadow-none"
                      title="Expunge this specific operational record row from user database parameters"
                    >
                      <Trash2 className="h-4 w-4 stroke-[2.2]" />
                    </Button>
                  </div>

                  {/* CORE INPUT GROUP GRID MATRICES */}
                  <div className="grid grid-cols-1 gap-4 w-full font-bold text-xs tracking-tight text-foreground/90">
                    {/* POSITION TRACK TITLE & CORPORATE SPONSOR LEVER */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                      <div className="space-y-1.5 text-left w-full min-w-0">
                        <Label
                          htmlFor={`exp-position-node-id-${index}`}
                          className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none"
                        >
                          Placement Job Title *
                        </Label>
                        <Input
                          id={`exp-position-node-id-${index}`}
                          value={entryItem.position}
                          onChange={(e) => updateExperienceNodeField(index, "position", e.target.value)}
                          placeholder="E.g. Senior Backend Cloud Architect"
                          className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block"
                        />
                      </div>

                      <div className="space-y-1.5 text-left w-full min-w-0">
                        <Label
                          htmlFor={`exp-company-node-id-${index}`}
                          className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none"
                        >
                          Corporate Host Employer *
                        </Label>
                        <Input
                          id={`exp-company-node-id-${index}`}
                          value={entryItem.company}
                          onChange={(e) => updateExperienceNodeField(index, "company", e.target.value)}
                          placeholder="E.g. Global Distributed Systems Ltd"
                          className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block"
                        />
                      </div>
                    </div>

                    {/* DURATION LOG CHRONOLOGY FIELDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                      <div className="space-y-1.5 text-left w-full min-w-0">
                        <Label
                          htmlFor={`exp-startdate-node-id-${index}`}
                          className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none flex items-center gap-1"
                        >
                          <Calendar className="h-3 w-3 stroke-[2.2]" />
                          <span>Deployment Activation Date</span>
                        </Label>
                        <Input
                          id={`exp-startdate-node-id-${index}`}
                          value={entryItem.startDate}
                          onChange={(e) => updateExperienceNodeField(index, "startDate", e.target.value)}
                          placeholder="E.g. JAN 2021"
                          className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner uppercase font-mono block select-text tracking-wider"
                        />
                      </div>

                      <div className="space-y-1.5 text-left w-full min-w-0">
                        <div className="flex items-center justify-between gap-4 px-0.5 select-none leading-none h-4">
                          <Label
                            htmlFor={`exp-enddate-node-id-${index}`}
                            className="text-[10px] font-extrabold uppercase tracking-wide text-primary block leading-none select-none flex items-center gap-1"
                          >
                            <Calendar className="h-3 w-3 stroke-[2.2]" />
                            <span>Termination Watermark Date</span>
                          </Label>

                          {/* CHECKBOX PROMPT SWITCH LAYER */}
                          <div className="flex items-center gap-1 bg-primary/5 border border-primary/10 rounded px-1.5 h-4.5 shadow-xs shrink-0 cursor-pointer">
                            <Checkbox
                              id={`current-role-checkbox-id-${index}`}
                              checked={isRoleMarkedCurrent}
                              onCheckedChange={(checkedStateBool) =>
                                handleActiveRoleStatusToggleProtocol(index, !!checkedStateBool)
                              }
                              className="h-3 w-3 rounded-xs border-primary text-primary-foreground focus-visible:ring-0 cursor-pointer shadow-none shrink-0"
                            />
                            <Label
                              htmlFor={`current-role-checkbox-id-${index}`}
                              className="text-[9px] font-black uppercase tracking-wide italic cursor-pointer text-primary/80 pl-0.5 pt-0.5 select-none"
                            >
                              Active Role
                            </Label>
                          </div>
                        </div>

                        <Input
                          id={`exp-enddate-node-id-${index}`}
                          value={entryItem.endDate}
                          onChange={(e) => updateExperienceNodeField(index, "endDate", e.target.value)}
                          placeholder="E.g. DEC 2024"
                          disabled={isRoleMarkedCurrent}
                          className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 disabled:opacity-40 font-mono block select-text uppercase tracking-wider disabled:cursor-not-allowed shadow-inner"
                        />
                      </div>
                    </div>

                    {/* ACHIEVEMENT BULLET SUMMARY BOX LAYER */}
                    <div className="space-y-1.5 text-left w-full min-w-0">
                      <Label
                        htmlFor={`exp-description-node-id-${index}`}
                        className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none"
                      >
                        Vocational Deliverables Impact Summary
                      </Label>
                      <Textarea
                        id={`exp-description-node-id-${index}`}
                        value={entryItem.description}
                        onChange={(e) => updateExperienceNodeField(index, "description", e.target.value)}
                        placeholder="• Designed and executed high-availability microservice routing logic pipelines…&#10;• Optimized core API layer latency thresholds by 40 percent under production parameters…"
                        rows={3}
                        className="w-full rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3.5 leading-relaxed resize-none shadow-inner"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* HUD LEVEL 3: RECTILINEAR OVERLAY BOTTOM METRIC LOG OMNIPRESENCE SHIELD */}
      <div className="mt-6 flex items-center justify-center gap-1.5 py-2.5 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none shrink-0 uppercase w-full">
        <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
        <span>Experience parameters synchronized for real-time market placement calibrations</span>
      </div>
    </div>
  );
}
