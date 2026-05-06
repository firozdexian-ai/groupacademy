import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { trackOnboardingStep } from "@/lib/onboarding/telemetry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GoalStepProps {
  onContinue: () => void;
}

const STATUS_OPTIONS = [
  { value: "student", label: "Student", sub: "Currently enrolled" },
  { value: "fresh_graduate", label: "Fresh graduate", sub: "Just finished studying" },
  { value: "job_seeking", label: "Looking for a job", sub: "Open to new roles" },
  { value: "working", label: "Employed", sub: "In a full-time role" },
  { value: "freelancer", label: "Freelancer", sub: "Working on projects" },
  { value: "career_changer", label: "Switching careers", sub: "Pivoting fields" },
];

const GOAL_OPTIONS = [
  { value: "first_job", label: "Land my first job" },
  { value: "switch_role", label: "Switch to a new role" },
  { value: "get_promoted", label: "Get promoted" },
  { value: "freelance_earn", label: "Freelance & earn" },
  { value: "learn_new_skill", label: "Learn a new skill" },
  { value: "study_abroad", label: "Study abroad" },
  { value: "build_own_thing", label: "Build my own thing" },
];

export function GoalStep({ onContinue }: GoalStepProps) {
  const { talent, updateTalent } = useTalent();
  const [status, setStatus] = useState<string>(talent?.currentStatus ?? "");
  const [goal, setGoal] = useState<string>(talent?.primaryGoal ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { trackOnboardingStep("goal", "view"); }, []);

  const canContinue = !!status && !!goal;

  async function handleContinue() {
    if (!canContinue) return;
    setIsSaving(true);
    try {
      const ok = await updateTalent({ currentStatus: status, primaryGoal: goal } as any);
      if (!ok) throw new Error("save failed");
      trackOnboardingStep("goal", "next", { status, goal });
      onContinue();
    } catch {
      toast.error("Couldn't save. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col px-4 py-6 max-w-xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-6 space-y-2 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Where are you headed?</h2>
        <p className="text-sm text-slate-500">We'll tailor jobs, courses and your AI coach to this.</p>
      </div>

      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">I'm currently</p>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setStatus(o.value)}
              className={cn(
                "text-left rounded-xl border px-3 py-3 transition-colors",
                status === o.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div className="text-sm font-semibold text-slate-900">{o.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{o.sub}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">My main goal</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGoal(g.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm border transition-colors",
                goal === g.value
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-4 pb-[max(env(safe-area-inset-bottom),12px)]">
        <Button
          onClick={handleContinue}
          disabled={!canContinue || isSaving}
          className="w-full h-12 rounded-xl text-base"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
