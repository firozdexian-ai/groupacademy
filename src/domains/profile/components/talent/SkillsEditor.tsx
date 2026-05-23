import { useState, useEffect, useMemo, useRef, KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { X, Plus, Sparkles, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SkillsEditorProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

/**
 * GroUp Academy: Technical Skill Matrix Ingress Control Terminal (SkillsEditor)
 * An authoritative operational sandbox managing technical skills, micro-credentials, and match vectors.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function SkillsEditor({ skills = [], onChange }: SkillsEditorProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);
  const [inputValue, setInputValue] = useState("");

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("skills_matrix_editor_mounted", { loadedSkillsCount: skills.length });
    return () => {
      isMountedRef.current = false;
    };
  }, [skills.length]);

  // High-Performance Array Ingress Optimization: Clean incomplete formats from primitive maps
  const safeSkillsCollection = useMemo(() => {
    if (!Array.isArray(skills)) return [];
    return skills
      .map((skillStr) =>
        String(skillStr || "")
          .trim()
          .toUpperCase(),
      )
      .filter(Boolean);
  }, [skills]);

  const addSkillNode = async () => {
    const sanitizedInputToken = inputValue.trim().toUpperCase();
    if (!sanitizedInputToken) return;

    if (safeSkillsCollection.includes(sanitizedInputToken)) {
      toast("DUPLICATE_NODE_REJECTED", {
        description: "This proficiency token is already mapped to your matrix.",
      });
      setInputValue("");
      return;
    }

    trackEvent("skills_matrix_node_appended", { token: sanitizedInputToken });

    try {
      const nextCollectionPayload = [...safeSkillsCollection, sanitizedInputToken];

      // Invalidate target profile markers to refresh workspace hydration curves globally
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        onChange(nextCollectionPayload);
        setInputValue("");
      }
    } catch (err) {
      trackError(err, { component: "SkillsEditor", action: "append_skill_node", token: sanitizedInputToken });
    }
  };

  const removeSkillNode = async (targetSkillTokenStr: string) => {
    if (!targetSkillTokenStr) return;
    trackEvent("skills_matrix_node_removed", { token: targetSkillTokenStr });

    try {
      const nextCollectionPayload = safeSkillsCollection.filter((sToken) => sToken !== targetSkillTokenStr);
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });

      if (isMountedRef.current) {
        onChange(nextCollectionPayload);
      }
    } catch (err) {
      trackError(err, { component: "SkillsEditor", action: "remove_skill_node", token: targetSkillTokenStr });
    }
  };

  const handleTerminalInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkillNode();
    }
  };

  return (
    <div className="space-y-4 text-left max-w-full w-full transform-gpu antialiased">
      {/* HUD LEVEL 1: TOP PANEL TRACK HEADING BLOCK */}
      <div className="space-y-1.5 text-left flex flex-col justify-center min-w-0 select-none w-full leading-none shrink-0 h-8">
        <Label className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide flex items-center gap-2 leading-none block truncate">
          <Target className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
          <span>Your skills</span>
        </Label>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block leading-none pt-0.5">
          Add skills so we can match you with better jobs and gigs.
        </p>
      </div>

      {/* HUD LEVEL 2: RECTILINEAR ENTRY DISPATCH BOX STRIP */}
      <div className="flex gap-2.5 items-center w-full shrink-0 font-bold text-xs select-none">
        <div className="relative flex-1 group/input min-w-0 h-10 flex items-center">
          <Input
            value={inputValue}
            onKeyDown={handleTerminalInputKeyDown}
            placeholder="Add a skill (e.g. React, Python, DevOps)…"
            onChange={(e) => setInputValue(e.target.value)}
            className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground pl-9 pr-3 shadow-inner w-full block focus-visible:ring-1 focus-visible:ring-ring select-text uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-medium placeholder:text-muted-foreground/30"
          />
          <Zap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors stroke-[2.2]" />
        </div>

        <Button
          type="button"
          onClick={addSkillNode}
          disabled={!inputValue.trim()}
          className="h-10 w-10 rounded-xl border border-border/60 text-muted-foreground font-bold hover:text-foreground hover:bg-accent shrink-0 shadow-sm cursor-pointer transform-gpu active:scale-95 transition-transform flex items-center justify-center p-0"
          title="Add skill"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
        </Button>
      </div>

      {/* HUD LEVEL 3: GRID TEXT TAG LAYOUT CANVAS BLOCK */}
      <div className="min-h-[100px] p-4 rounded-xl border border-border/40 bg-card/20 backdrop-blur-xs flex items-center justify-start text-left w-full min-w-0 shadow-inner overflow-hidden">
        {safeSkillsCollection.length === 0 ? (
          /* COLD START VACANT MATRIX HOVER INDICATOR */
          <div className="flex flex-col items-center justify-center gap-2 py-4 mx-auto opacity-40 text-center select-none tracking-normal font-bold text-[10px] text-muted-foreground leading-none">
            <Sparkles className="h-5 w-5 stroke-[2.2] animate-pulse text-muted-foreground/60" />
            <p className="font-mono uppercase tracking-wider block leading-none pt-0.5">
              No skills added yet
            </p>
          </div>
        ) : (
          /* ACTIVE SKILL EMBLEM BADGE COLLECTION BLOCK DECK */
          <div className="flex flex-wrap items-center justify-start gap-2 w-full text-left">
            {safeSkillsCollection.map((skillToken, idx) => (
              <Badge
                key={`${skillToken}-${idx}`}
                variant="secondary"
                className={cn(
                  "pl-3 pr-1 h-7 rounded-xl border flex items-center gap-1.5 select-all font-bold lowercase tracking-normal text-xs leading-none transition-all duration-300 transform-gpu",
                  "bg-primary/[0.015] border-primary/10 text-foreground/90 font-semibold shadow-xs hover:border-primary/40 hover:scale-[1.015]",
                )}
              >
                <span className="truncate max-w-[140px] uppercase font-mono text-[10px] font-bold tracking-wide select-all block leading-none pt-0.5 selection:bg-primary/20">
                  {skillToken}
                </span>

                <button
                  type="button"
                  onClick={() => removeSkillNode(skillToken)}
                  className="h-5 w-5 rounded-md bg-muted border border-border/40 text-muted-foreground hover:bg-rose-500 hover:text-white hover:border-transparent transition-colors cursor-pointer select-none flex items-center justify-center p-0 shrink-0"
                  title={`Expunge ${skillToken} parameter from secure profile lookup registry`}
                >
                  <X className="h-3 w-3 stroke-[2.5]" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* HUD LEVEL 4: INTELLIGENCE SYSTEM EXECUTING OVERLAY ASSISTANCE RIBBON */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/[0.01] border border-primary/10 select-none text-left w-full shadow-sm shrink-0">
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5 stroke-[2.2]" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-relaxed tracking-wide">
          <span className="text-primary font-black italic">Executive Guidance:</span> Populate technical capabilities,
          tool frameworks, languages, and core soft proficiencies cleanly to optimize your neural visibility
          calculations inside global enterprise recruiter matching passes.
        </p>
      </div>
    </div>
  );
}
