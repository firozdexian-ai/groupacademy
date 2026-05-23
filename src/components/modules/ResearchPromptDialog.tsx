import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Copy, Check, Zap, ShieldCheck, Cpu } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ResearchPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleTitle: string;
  moduleDescription: string;
  moduleIndex: number;
  totalModules: number;
  courseTitle: string;
  courseIndex: number;
  totalCourses: number;
  levelName: string;
  programName: string;
  schoolName: string;
  academyName: string;
}

function buildResearchProtocol(props: Omit<ResearchPromptDialogProps, "open" | "onOpenChange">): string {
  const {
    moduleTitle,
    moduleDescription,
    moduleIndex,
    totalModules,
    courseTitle,
    courseIndex,
    totalCourses,
    levelName,
    programName,
    schoolName,
    academyName,
  } = props;

  const talkingPoints = moduleDescription?.trim()
    ? `\n[PROTOCOL_TALKING_POINTS]:\n${moduleDescription
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `• ${l}`)
        .join("\n")}\n`
    : "\n[TALKING_POINTS]: (none yet — explore the topic broadly)\n";

  return `SYSTEM_ROLE: Curriculum_Research_Specialist
INSTITUTIONAL_TARGET: ${academyName} // ${schoolName}

[PEDAGOGICAL_CONTEXT]:
- Program: ${programName}
- Level: ${levelName}
- Course: ${courseTitle} (${courseIndex}/${totalCourses})
- Module: ${moduleTitle} (${moduleIndex}/${totalModules})

${talkingPoints}

[RESEARCH_INSTRUCTIONS]:
Execute deep-sync discovery for this educational node. Provide actionable artifacts covering:
1. THEORETICAL_FRAMEWORKS: Key definitions and industry-standard models.
2. OPS_BEST_PRACTICES: Current global standards and elite implementation strategies.
3. CASE_STUDY_REPOSITORY: Global real-world deployments and outcome analysis.
4. DEFICIT_AUDIT: Common professional failures and conceptual misconceptions.
5. TOOLKIT_SYNC: Industry-standard software, templates, and essential resources.
6. ASSESSMENT_VECTORS: High-yield discussion nodes and quiz-worthy concepts.
7. EXTERNAL_UPLINKS: Verified citations, technical reading, and high-fidelity video references.

FORMAT: Output must be structured with high-intensity headers. Content must be deployment-ready for video lectures, slide decks, and simulation exercises.`;
}

/**
 * GroUp Academy: Curriculum Intelligence Uplink Bridge (ResearchPromptDialog)
 * An authoritative operational modal structured to construct high-yield research protocols for external research platforms.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export default function ResearchPromptDialog(props: ResearchPromptDialogProps) {
  const { open, onOpenChange, ...promptProps } = props;
  const [isCopied, setIsCopied] = useState(false);

  // Monitor deep research bridge interactions safely via telemetry tracking indicators
  useEffect(() => {
    if (open && promptProps.moduleTitle) {
      trackEvent("curriculum_research_bridge_rendered", {
        moduleTitle: promptProps.moduleTitle,
        courseTitle: promptProps.courseTitle,
      });
    }
  }, [open, promptProps.moduleTitle, promptProps.courseTitle]);

  // 1. High-Performance Memory Allocations: Enforce hard memoization over raw string construction loops
  const promptPayload = useMemo(() => {
    if (!open) return "";
    return buildResearchProtocol(promptProps);
  }, [open, promptProps]);

  const executeCopyHandshake = async () => {
    trackEvent("curriculum_research_protocol_copy_requested", { moduleTitle: promptProps.moduleTitle });

    try {
      await navigator.clipboard.writeText(promptPayload);
      setIsCopied(true);
      toast.success("Research prompt copied to clipboard");
      trackEvent("curriculum_research_protocol_copy_success");

      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      trackError(err, {
        component: "ResearchPromptDialog",
        action: "execute_copy_handshake_callback",
      });
      toast.error("Sync Failure: Please execute selection copy manually.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(visibleState) => {
        onOpenChange(visibleState);
        if (!visibleState) trackEvent("curriculum_research_bridge_dismissed");
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] rounded-2xl border border-border/40 bg-card/60 backdrop-blur-3xl shadow-2xl p-0 overflow-hidden flex flex-col text-left antialiased transform-gpu">
        {/* HUD: HEADER BANNER SEGMENT AREA */}
        <div className="p-6 border-b border-border/10 bg-primary/[0.02] shrink-0 select-none w-full">
          <DialogHeader className="text-left leading-none">
            <div className="flex items-center gap-3.5 w-full">
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-inner">
                <Cpu className="h-5 w-5 text-primary animate-pulse stroke-[2.2]" />
              </div>
              <div className="space-y-1 flex flex-col justify-center leading-none min-w-0 flex-1">
                <DialogTitle className="text-base font-bold text-foreground/90 uppercase tracking-wider leading-none">
                  Deep Research Synapse Bridge
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none pt-0.5">
                  Neural Intelligence Ingress &bull; Compiling Knowledge Tokens
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* VIEWPORT: PROMPT TEXTAREA VISUAL LAYOUT CONTAINER */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col space-y-3 w-full min-w-0">
          <div className="flex items-center justify-between gap-4 select-none leading-none w-full">
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 block pl-0.5 leading-none">
              Generated System Prompt Output Manifest
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-500 opacity-40 stroke-[2.2] shrink-0" />
          </div>

          <Textarea
            value={promptPayload}
            readOnly
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            className="flex-1 min-h-[260px] rounded-xl border border-border/30 bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary/15 font-mono font-medium text-xs leading-relaxed italic text-foreground/80 resize-none p-4 select-all shadow-inner"
          />

          <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40 text-center select-none leading-normal max-w-md mx-auto pt-0.5">
            Inject this analytical script sequence into GPT-4, Claude 3.5 Sonnet, or Gemini Pro for advanced curriculum
            synthesis yield.
          </p>
        </div>

        {/* HUD: FOOTER INTERACTION ROUTE COMMAND RIBBON */}
        <DialogFooter className="p-6 bg-muted/5 border-t border-border/10 flex flex-row items-center justify-end gap-3 select-none shrink-0 w-full">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              trackEvent("curriculum_research_bridge_dismiss_clicked");
              onOpenChange(false);
            }}
            className="h-9 px-4 rounded-xl font-bold uppercase text-[10px] tracking-wide border-border/60 text-muted-foreground hover:bg-accent shrink-0 cursor-pointer shadow-sm transition-transform active:scale-95"
          >
            Dismiss
          </Button>

          <Button
            type="button"
            onClick={executeCopyHandshake}
            className="h-9 flex-1 rounded-xl font-extrabold uppercase text-[10px] tracking-wider gap-1.5 cursor-pointer shadow-sm transition-all active:scale-[0.99] bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>Ecosystem Protocol Synced</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 stroke-[2.2]" />
                <span>Copy Research Protocol Payload</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
