import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Plus, Trash2, GraduationCap, School, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

interface EducationEditorProps {
  education: EducationEntry[];
  onChange: (education: EducationEntry[]) => void;
}

/**
 * GroUp Academy: Academic Credentials Registry Editor (EducationEditor)
 * An authoritative operational sandbox managing structural candidate qualification records.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function EducationEditor({ education = [], onChange }: EducationEditorProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component lifecycles to safely drop background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("education_editor_node_mounted", { activeEntriesCount: education.length });
    return () => {
      isMountedRef.current = false;
    };
  }, [education.length]);

  // High-Performance Schema Ingress Pass: Protect iteration matrices against incomplete shapes
  const safeEducationEntriesList = useMemo(() => {
    if (!Array.isArray(education)) return [];
    return education.map((entryItem) => ({
      institution: typeof entryItem?.institution === "string" ? entryItem.institution : "",
      degree: typeof entryItem?.degree === "string" ? entryItem.degree : "",
      fieldOfStudy: typeof entryItem?.fieldOfStudy === "string" ? entryItem.fieldOfStudy : "",
      startYear: typeof entryItem?.startYear === "string" ? entryItem.startYear : "",
      endYear: typeof entryItem?.endYear === "string" ? entryItem.endYear : "",
    })) satisfies EducationEntry[];
  }, [education]);

  const addAcademicNode = async () => {
    trackEvent("education_editor_node_added");
    const blankTemplateNodeItem: EducationEntry = {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
    };

    try {
      // Invalidate target profile state markers to refresh workspace hydration indices
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        onChange([...safeEducationEntriesList, blankTemplateNodeItem]);
      }
    } catch (err) {
      trackError(err, { component: "EducationEditor", action: "append_blank_academic_node" });
    }
  };

  const removeAcademicNode = async (targetIndexIdNum: number) => {
    if (targetIndexIdNum < 0 || targetIndexIdNum >= safeEducationEntriesList.length) return;
    trackEvent("education_editor_node_removed", { positionIndex: targetIndexIdNum });

    try {
      const compiledNextCollectionArray = safeEducationEntriesList.filter((_, idx) => idx !== targetIndexIdNum);
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        onChange(compiledNextCollectionArray);
      }
    } catch (err) {
      trackError(err, {
        component: "EducationEditor",
        action: "remove_academic_node",
        positionIndex: targetIndexIdNum,
      });
    }
  };

  const updateAcademicNodeField = (
    targetIndexIdNum: number,
    fieldKeyName: keyof EducationEntry,
    nextInputValueStr: string,
  ) => {
    try {
      if (targetIndexIdNum < 0 || targetIndexIdNum >= safeEducationEntriesList.length) return;

      const compiledNextCollectionArray = safeEducationEntriesList.map((entryItem, idx) =>
        idx === targetIndexIdNum ? { ...entryItem, [fieldKeyName]: nextInputValueStr } : entryItem,
      );

      if (isMountedRef.current) {
        onChange(compiledNextCollectionArray);
      }
    } catch (err) {
      trackError(err, {
        component: "EducationEditor",
        action: "update_academic_node_field",
        positionIndex: targetIndexIdNum,
        fieldKeyName,
      });
    }
  };

  return (
    <div className="space-y-4 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTROLS BLOCK */}
      <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none">
        <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 flex-1 leading-none">
          <Label className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide flex items-center gap-2 leading-none block truncate">
            <GraduationCap className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
            <span>Academic Credential Registry</span>
          </Label>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block leading-none pt-0.5">
            Synchronize workspace profile matrices with verified educational credentials
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAcademicNode}
          className="h-8 px-3 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer hover:bg-accent gap-1 flex items-center justify-center transition-colors select-none"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add Record</span>
        </Button>
      </div>

      {/* HUD LEVEL 2: DIRECTORY CORE SELECTION RENDER MATRIX */}
      {safeEducationEntriesList.length === 0 ? (
        /* COLD START COLD INVITATION ACTION FRAME */
        <div
          role="button"
          onClick={addAcademicNode}
          className="group border border-dashed border-border/40 rounded-xl p-8 sm:p-12 text-center select-none cursor-pointer bg-card/20 hover:bg-card/40 hover:border-border/80 transition-all w-full flex flex-col justify-center items-center py-12 overflow-hidden shadow-xs relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.015] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="relative z-10 space-y-4 w-full flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-sm transition-transform duration-500 ease-out transform group-hover:scale-102 group-hover:rotate-2 shadow-sm shrink-0">
              <School className="h-5 w-5 text-muted-foreground/40 stroke-[2.2] transition-colors group-hover:text-primary" />
            </div>
            <div className="space-y-1.5 leading-none text-center font-bold text-xs tracking-tight">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground/80 leading-none">
                Academic Directory Empty
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground/40 leading-normal max-w-xs mx-auto italic">
                No configuration records detected. Click here to append a fresh academic field.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE CONFIGURATION ARTIFACT INPUT ROWS LIST */
        <div className="space-y-3.5 w-full min-w-0 text-left">
          {safeEducationEntriesList.map((entryItem, index) => (
            <Card
              key={index}
              className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-md shadow-sm overflow-hidden text-left w-full min-w-0 flex flex-col justify-center group/card transition-colors hover:border-border/60"
            >
              <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center">
                {/* SUB CONTAINER CONTROL BAR LINE ROW */}
                <div className="flex justify-between items-center pb-2.5 border-b border-border/10 select-none leading-none w-full shrink-0 h-8">
                  <div className="flex items-center gap-2 min-w-0 flex-1 h-full">
                    <div className="h-5.5 w-5.5 rounded bg-primary/10 border border-primary/5 text-primary text-[10px] font-mono font-black flex items-center justify-center shrink-0 shadow-sm leading-none">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70 truncate block pt-0.5 leading-none">
                      Institutional Registry Record
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAcademicNode(index)}
                    className="h-7 w-7 text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors shrink-0 p-0 border-none shadow-none"
                    title="Expunge this specific qualification element row from database collection parameters"
                  >
                    <Trash2 className="h-4 w-4 stroke-[2.2]" />
                  </Button>
                </div>

                {/* SEGMENT LAYER INTERACTIVE ENTRY SHIELD FIELDS ROWS */}
                <div className="grid grid-cols-1 gap-4 w-full font-bold text-xs tracking-tight text-foreground/90">
                  <div className="space-y-1.5 text-left w-full min-w-0">
                    <Label
                      htmlFor={`edu-institution-node-id-${index}`}
                      className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none"
                    >
                      Institutional Track Name *
                    </Label>
                    <Input
                      id={`edu-institution-node-id-${index}`}
                      value={entryItem.institution}
                      onChange={(e) => updateAcademicNodeField(index, "institution", e.target.value)}
                      placeholder="E.g. University of Dhaka"
                      className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                    <div className="space-y-1.5 text-left w-full min-w-0">
                      <Label
                        htmlFor={`edu-degree-node-id-${index}`}
                        className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none"
                      >
                        Credential Attainment Level
                      </Label>
                      <Input
                        id={`edu-degree-node-id-${index}`}
                        value={entryItem.degree}
                        onChange={(e) => updateAcademicNodeField(index, "degree", e.target.value)}
                        placeholder="E.g. Bachelor of Computer Engineering"
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block"
                      />
                    </div>

                    <div className="space-y-1.5 text-left w-full min-w-0">
                      <Label
                        htmlFor={`edu-field-node-id-${index}`}
                        className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none"
                      >
                        Domain Specialization discipline
                      </Label>
                      <Input
                        id={`edu-field-node-id-${index}`}
                        value={entryItem.fieldOfStudy}
                        onChange={(e) => updateAcademicNodeField(index, "fieldOfStudy", e.target.value)}
                        placeholder="E.g. Computer Science"
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner w-full block"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full min-w-0 select-none">
                    <div className="space-y-1.5 text-left w-full min-w-0">
                      <Label
                        htmlFor={`edu-start-node-id-${index}`}
                        className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none"
                      >
                        Deployment Start Year
                      </Label>
                      <Input
                        id={`edu-start-node-id-${index}`}
                        value={entryItem.startYear}
                        onChange={(e) => updateAcademicNodeField(index, "startYear", e.target.value)}
                        placeholder="E.g. 2021"
                        maxLength={4}
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner font-mono block select-text tabular-nums"
                      />
                    </div>

                    <div className="space-y-1.5 text-left w-full min-w-0">
                      <Label
                        htmlFor={`edu-end-node-id-${index}`}
                        className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none"
                      >
                        Conclusion Watermark Year
                      </Label>
                      <Input
                        id={`edu-end-node-id-${index}`}
                        value={entryItem.endYear}
                        onChange={(e) => updateAcademicNodeField(index, "endYear", e.target.value)}
                        placeholder="2025 OR PRESENT"
                        maxLength={12}
                        className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3 shadow-inner font-mono block select-text uppercase tracking-wider"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* HUD LEVEL 3: RECTILINEAR OVERLAY BOTTOM METRIC LOG OMNIPRESENCE SHIELD */}
      <div className="mt-6 flex items-center justify-center gap-1.5 py-2.5 border-t border-border/10 select-none shadow-none pointer-events-none tracking-normal font-bold text-[9px] text-muted-foreground/40 font-mono leading-none shrink-0 uppercase w-full">
        <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2] shrink-0 animate-pulse" />
        <span>Registry parameters verified for authoritative cognitive skill analysis tracks</span>
      </div>
    </div>
  );
}
