import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle2, Circle } from "lucide-react";

interface Props {
  talent: any;
}

interface Step {
  key: string;
  label: string;
  done: boolean;
}

export function ProfileCompletenessGate({ talent }: Props) {
  const navigate = useNavigate();

  const skills = Array.isArray(talent?.skills) ? talent.skills : [];
  const experience = Array.isArray(talent?.experience) ? talent.experience : [];
  const education = Array.isArray(talent?.education) ? talent.education : [];

  const steps: Step[] = [
    { key: "profession", label: "Set your profession", done: !!talent?.profession_category_id || !!talent?.custom_profession },
    { key: "skills", label: "Add at least 3 skills", done: skills.length >= 3 },
    { key: "experience", label: "Add work experience or projects", done: experience.length > 0 || (Array.isArray(talent?.projects) && talent.projects.length > 0) },
    { key: "education", label: "Add education", done: education.length > 0 },
    { key: "cv", label: "Upload your CV", done: !!talent?.cv_url },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = Math.round((completed / total) * 100);

  if (percent >= 60) return null;

  const missing = steps.filter((s) => !s.done).slice(0, 3);

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Complete your profile to unlock AI matching</p>
            <p className="text-xs text-muted-foreground">
              {percent}% complete — a fuller profile dramatically improves match quality.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          {missing.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <span className="text-muted-foreground">{s.label}</span>
            </div>
          ))}
          {steps.filter((s) => s.done).slice(0, 1).map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-muted-foreground line-through">{s.label}</span>
            </div>
          ))}
        </div>

        <Button onClick={() => navigate("/app/profile")} className="w-full h-10 rounded-lg gap-2 text-sm">
          Complete profile <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
