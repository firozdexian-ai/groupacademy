import { useNavigate } from "react-router-dom";
import { Briefcase, Plane, Star, Wifi, Target, Mic, DollarSign, Palette, LucideIcon } from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  path: string;
}

const actions: QuickAction[] = [
  { icon: Briefcase, label: "Jobs", path: "/app/jobs" },
  { icon: Plane, label: "Abroad", path: "/app/abroad" },
  { icon: Star, label: "For You", path: "/app/jobs/all?tab=recommended" },
  { icon: Wifi, label: "Remote", path: "/app/jobs/all?type=remote" },
  { icon: Target, label: "Scorecard", path: "/app/services/assessment" },
  { icon: Mic, label: "Interview", path: "/app/services/mock-interview" },
  { icon: DollarSign, label: "Salary", path: "/app/services/salary-analysis" },
  { icon: Palette, label: "Portfolio", path: "/app/services/portfolio" },
];

export function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-xl p-3 shadow-sm">
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <action.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[10px] text-center text-muted-foreground leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
