import * as React from "react";
import { Loader2, Bot, UserX } from "lucide-react";
import {
  assignCareerCoach,
  getTalentCareerCoachId,
  getAiInstructorBasicById,
} from "@/domains/talent/repo/talentRepo";
import { useTalent } from "@/hooks/useTalent";
import { AIChatPanel } from "@/components/ai-instructor/AIChatPanel";
import { trackCoachEvent } from "@/lib/onboarding/telemetry";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface CoachInstructor {
  id: string;
  name: string;
  profession_line_id: string;
  avatar_url: string | null;
}


interface StarterChipConfig {
  label: string;
  prompt: string;
}

const STRATEGIC_GOALS_DIRECTORY: Record<string, string> = {
  first_job: "land your first job",
  switch_role: "switch to a new role",
  get_promoted: "get promoted",
  freelance_earn: "freelance and earn",
  learn_new_skill: "learn a new skill",
  study_abroad: "study abroad",
  build_own_thing: "build your own thing",
};

/**
 * GroUp Academy: Personalized AI Career Coach Dashboard (CareerCoach)
 * Hardened communications portal executing automated coach-to-talent bindings and isolating inference panels from layout shifting.
 * Version: Launch Candidate · Phase Z1 Transaction Matrix Sealed
 */
export default function CareerCoach() {
  const { talent: talentProfileRecord } = useTalent();

  const [activeCoachInstructor, setActiveCoachInstructor] = React.useState<CoachInstructor | null>(null);
  const [isCoachCacheResolving, setIsCoachCacheResolving] = React.useState<boolean>(true);

  // =========================================================================
  // LIFECYCLE SECTOR 1: PROGRAMMATIC HANDSHAKE & COACH ALLOCATION LOOP
  // =========================================================================
  React.useEffect(() => {
    if (!talentProfileRecord?.id) return;

    let isThreadActive = true;
    setIsCoachCacheResolving(true);

    const executeCoachAssignmentAndDossierLookup = async () => {
      try {
        // Step 1: Read active relational coach-to-talent bindings tracking row
        let evaluatedCoachIdUUID = await getTalentCareerCoachId(talentProfileRecord.id);

        // Step 2: Programmatically trigger remote atomic allocation RPC procedure if mapping is unassigned
        if (!evaluatedCoachIdUUID) {
          try {
            evaluatedCoachIdUUID = await assignCareerCoach(talentProfileRecord.id);
          } catch {
            evaluatedCoachIdUUID = null;
          }
        }

        if (!evaluatedCoachIdUUID) {
          if (isThreadActive) {
            setActiveCoachInstructor(null);
            setIsCoachCacheResolving(false);
          }
          return;
        }

        // Step 3: Gather lead artificial intelligence instructor biography specifications
        const instructorQueryPayload = await getAiInstructorBasicById(evaluatedCoachIdUUID);

        if (isThreadActive) {
          if (instructorQueryPayload) {
            setActiveCoachInstructor(instructorQueryPayload as unknown as CoachInstructor);
            trackCoachEvent("opened", { coachId: evaluatedCoachIdUUID });
          } else {
            setActiveCoachInstructor(null);
          }
        }
      } catch (fatalHandshakeException) {
        console.error("Critical Coach Telemetry Assignment Loop Exception:", fatalHandshakeException);
      } finally {
        if (isThreadActive) {
          setIsCoachCacheResolving(false);
        }
      }
    };

    executeCoachAssignmentAndDossierLookup();

    return () => {
      isThreadActive = false;
    };
  }, [talentProfileRecord?.id]);

  // =========================================================================
  // MEMOIZED PARAMETER SECTOR: TEXT CONTEXT PRE-COMPILATIONS
  // =========================================================================
  const resolvedGivenNameStr = React.useMemo<string>(() => {
    if (!talentProfileRecord?.fullName) return "there";
    // Sanitize multi-space entries and clean name string allocations defensively
    const scrubbedNomenclatureArray = talentProfileRecord.fullName.trim().replace(/\s+/g, " ").split(" ");
    const candidatePrimaryToken = scrubbedNomenclatureArray[0] || "there";

    const operationalNomenclatureBlocklists = ["MR.", "MRS.", "MS.", "DR.", "MD.", "PROF."];
    if (
      operationalNomenclatureBlocklists.includes(candidatePrimaryToken.toUpperCase()) &&
      scrubbedNomenclatureArray.length > 1
    ) {
      return scrubbedNomenclatureArray[1];
    }
    return candidatePrimaryToken;
  }, [talentProfileRecord?.fullName]);

  const resolvedGoalLabelStr = React.useMemo<string | null>(() => {
    if (!talentProfileRecord?.primaryGoal) return null;
    return STRATEGIC_GOALS_DIRECTORY[talentProfileRecord.primaryGoal] || talentProfileRecord.primaryGoal;
  }, [talentProfileRecord?.primaryGoal]);

  const synthesizedSeedAssistantPrompt = React.useMemo<string | undefined>(() => {
    if (!activeCoachInstructor) return undefined;
    const coreGoalClauseStr = resolvedGoalLabelStr
      ? ` You indicated your current target landmark objective is to ${resolvedGoalLabelStr}.`
      : "";
    return `Hi ${resolvedGivenNameStr}, I am ${activeCoachInstructor.name} — your specialized performance Career Coach.${coreGoalClauseStr} Shall we construct a milestone 30-day advancement sprint, calibrate structural resume formatting errors, or map corporate positions aligned with your capabilities?`;
  }, [activeCoachInstructor, resolvedGivenNameStr, resolvedGoalLabelStr]);

  const contextStarterChips = React.useMemo<StarterChipConfig[]>(() => {
    return [
      {
        label: "Plan My Next 30 Days",
        prompt: `Build me an authoritative, milestone-oriented 30-day execution plan to ${resolvedGoalLabelStr || "advance my operational positioning boundaries"} safely.`,
      },
      {
        label: "Audit My CV Architecture",
        prompt:
          "Perform a structural code review on my current CV document and isolate 3 critical optimization refactors.",
      },
      {
        label: "Target Open Market Roles",
        prompt:
          "Identify targeted organizational placement opportunities suited to my skill metrics, along with an entry rationale map.",
      },
      {
        label: "Isolate High-Value Competencies",
        prompt:
          "Cross-reference my active skill portfolio data against market demands to determine the highest value educational node to unlock next.",
      },
    ];
  }, [resolvedGoalLabelStr]);

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] max-w-3xl mx-auto w-full px-4 py-3 antialiased transform-gpu">
      {/* HUD LEVEL 1: ADMINISTRATIVE HUB TITLE BLOCK METADATA */}
      <header className="px-1 pb-3 block select-none pointer-events-none leading-none w-full shrink-0 border-b border-border/10 mb-3">
        <div className="flex items-center gap-2.5 leading-none w-full block">
          <div className="p-1.5 bg-primary/5 border border-primary/10 rounded-md text-primary shrink-0 block shadow-3xs">
            <Bot className="h-4 w-4 stroke-[2.2]" />
          </div>
          <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-900 pt-0.5">
            Personal Intelligence Career Coach
          </h1>
        </div>
        <p className="font-mono text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tight block leading-none pt-1.5">
          {activeCoachInstructor
            ? `OPERATIONAL MODERATOR: ${activeCoachInstructor.name.toUpperCase()} • ASSIGNED TO TARGET LANDMARK: ${resolvedGoalLabelStr ? resolvedGoalLabelStr.toUpperCase() : "GENERAL IMPROVEMENT PROTOCOL"}`
            : "Continuous AI guidance counseling for systemic professional track transitions."}
        </p>
      </header>

      {/* HUD LEVEL 2: CONSOLE WORKSPACE VIEWPORT LAYOUT GATEWAYS */}
      <main className="flex-1 min-h-0 block w-full relative">
        {isCoachCacheResolving ? (
          <div
            role="status"
            className="absolute inset-0 grid place-items-center bg-background/50 backdrop-blur-3xs select-none pointer-events-none font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/40 leading-none"
          >
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0 stroke-[2.5]" />
              <span>Initializing Interactive Coach Container...</span>
            </div>
          </div>
        ) : !activeCoachInstructor ? (
          <div
            role="alert"
            className="absolute inset-0 grid place-items-center text-center p-6 antialiased select-none transform-gpu"
          >
            <div className="max-w-xs block space-y-4 leading-none">
              <div className="h-9 w-9 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/40 mx-auto pointer-events-none">
                <UserX className="h-4 w-4 stroke-[2.2]" />
              </div>
              <div className="space-y-1 block leading-none">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Coach Allocation Restricted</p>
                <p className="text-[11px] font-semibold text-muted-foreground/50 leading-normal mt-1">
                  We could not map an automated career coach instructor node to your workspace profile settings.
                </p>
                <p className="font-mono text-[10px] font-black uppercase text-primary pt-2 block">
                  Complete discipline settings inside your dossier.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full block w-full animate-in fade-in duration-200">
            <AIChatPanel
              professionLineId={activeCoachInstructor.profession_line_id}
              mode="career_coach"
              instructorName={activeCoachInstructor.name}
              placeholder="Query your personal performance counselor regarding capability tracks,CV improvements, or milestone plans..."
              seedAssistantMessage={synthesizedSeedAssistantPrompt}
              starterChips={contextStarterChips}
              className="h-full rounded-lg border border-border/60 bg-background/30 shadow-none overflow-hidden block w-full"
            />
          </div>
        )}
      </main>
    </div>
  );
}
