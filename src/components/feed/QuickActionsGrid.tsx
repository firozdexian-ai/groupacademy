import { useNavigate } from "react-router-dom";
import { Briefcase, Plane, Target, ClipboardList, Mic, DollarSign, Bot, Gift, LucideIcon } from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  path: string;
}

const actions: QuickAction[] = [
  { icon: Briefcase, label: "Jobs", path: "/app/jobs" },
  { icon: Gift, label: "Gigs", path: "/app/gigs" },
  { icon: Bot, label: "AI Agents", path: "/app/agents" },
  { icon: Plane, label: "Abroad", path: "/app/abroad" },
  { icon: Target, label: "Tracks", path: "/app/learning/tracks" },
  { icon: ClipboardList, label: "Assessment", path: "/app/services/assessment" },
  { icon: Mic, label: "Interview", path: "/app/services/mock-interview" },
  { icon: DollarSign, label: "Salary", path: "/app/services/salary-analysis" },
];

export function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-[11px] text-center text-muted-foreground leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
