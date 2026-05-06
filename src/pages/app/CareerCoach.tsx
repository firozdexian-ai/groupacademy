import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { AIChatPanel } from "@/components/ai-instructor/AIChatPanel";
import { trackCoachEvent } from "@/lib/onboarding/telemetry";

const GOAL_LABEL: Record<string, string> = {
  first_job: "land your first job",
  switch_role: "switch to a new role",
  get_promoted: "get promoted",
  freelance_earn: "freelance and earn",
  learn_new_skill: "learn a new skill",
  study_abroad: "study abroad",
  build_own_thing: "build your own thing",
};

interface CoachInstructor {
  id: string;
  name: string;
  profession_line_id: string;
  avatar_url: string | null;
}

export default function CareerCoach() {
  const { talent } = useTalent();
  const [coach, setCoach] = useState<CoachInstructor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!talent?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // 1. Read current binding
        const { data: t } = await supabase
          .from("talents")
          .select("career_coach_instructor_id")
          .eq("id", talent.id)
          .maybeSingle();

        let coachId: string | null = (t as any)?.career_coach_instructor_id ?? null;

        // 2. Auto-assign if missing
        if (!coachId) {
          const { data: assigned } = await supabase.rpc("assign_career_coach" as any, {
            _talent_id: talent.id,
          });
          coachId = (assigned as any) ?? null;
        }

        if (!coachId) {
          if (!cancelled) setCoach(null);
          return;
        }

        const { data: ai } = await supabase
          .from("ai_instructors")
          .select("id, name, profession_line_id, avatar_url")
          .eq("id", coachId)
          .maybeSingle();
        if (!cancelled) setCoach((ai as any) ?? null);
        trackCoachEvent("opened", { coachId });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [talent?.id]);

  const firstName = talent?.fullName?.split(" ")[0] || "there";
  const goalLabel = talent?.primaryGoal ? GOAL_LABEL[talent.primaryGoal] || talent.primaryGoal : null;
  const seed = coach
    ? `Hi ${firstName}, I'm ${coach.name} — your Career Coach.${
        goalLabel ? ` You said your goal is to ${goalLabel}.` : ""
      } Want to start with a 30-day plan, fix your CV, or find roles you'd actually land?`
    : undefined;

  const starterChips = [
    { label: "Plan my next 30 days", prompt: `Build me a focused 30-day plan to ${goalLabel || "move forward in my career"}.` },
    { label: "Review my CV", prompt: "Review my CV and give me 3 specific improvements." },
    { label: "Find me jobs", prompt: "What kind of roles should I be applying to right now, and why?" },
    { label: "What skill should I learn?", prompt: "Given my profile and goal, what is the single most valuable skill I should learn next?" },
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] max-w-3xl mx-auto w-full px-2 sm:px-4 py-2">
      <div className="px-2 pb-2">
        <h1 className="text-xl font-bold text-slate-900">Career Coach</h1>
        <p className="text-xs text-slate-500">
          {coach ? `${coach.name} • here to help you ${goalLabel || "grow your career"}` : "Personal coaching for your career"}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : !coach ? (
          <div className="h-full flex items-center justify-center text-center px-6">
            <div>
              <p className="text-sm text-slate-600 mb-2">We couldn't bind a Career Coach yet.</p>
              <p className="text-xs text-slate-500">Finish setting your profession in your profile, then come back.</p>
            </div>
          </div>
        ) : (
          <AIChatPanel
            professionLineId={coach.profession_line_id}
            mode="career_coach"
            instructorName={coach.name}
            placeholder="Ask anything about your career…"
            seedAssistantMessage={seed}
            starterChips={starterChips}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
