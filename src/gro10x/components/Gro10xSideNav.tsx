import { NavLink } from "react-router-dom";
import {
  MessageSquare,
  Newspaper,
  Building2,
  Activity,
  GraduationCap,
  Bot,
  Users,
  Search,
  Package,
  CreditCard,
  Briefcase,
} from "lucide-react";

const primary = [
  { to: "/gro10x/inbox", label: "Inbox", Icon: MessageSquare },
  { to: "/gro10x/work", label: "Activities", Icon: Activity },
  { to: "/gro10x/learn", label: "Learn", Icon: GraduationCap },
  { to: "/gro10x/feed", label: "Feed", Icon: Newspaper },
  { to: "/gro10x/page", label: "Company", Icon: Building2 },
];

const secondary = [
  { to: "/gro10x/agents", label: "Agents", Icon: Bot },
  { to: "/gro10x/crm", label: "CRM", Icon: Users },
  { to: "/gro10x/sourcing", label: "Sourcing", Icon: Search },
  { to: "/gro10x/offerings", label: "Offerings", Icon: Package },
  { to: "/gro10x/learn/ops", label: "Learning Ops", Icon: Briefcase },
  { to: "/gro10x/billing", label: "Billing", Icon: CreditCard },
];

interface Props {
  className?: string;
}

export function Gro10xSideNav({ className = "" }: Props) {
  return (
    <aside
      className={`sticky top-0 self-start h-[100dvh] w-[240px] shrink-0 border-r border-white/5 bg-[#0B1220]/80 backdrop-blur-md flex-col ${className}`}
      aria-label="Primary"
    >
      <div className="px-5 pt-5 pb-3">
        <NavLink to="/gro10x" className="text-[15px] font-semibold tracking-tight text-white">
          Gro<span className="text-[#33E1E4]">10x</span>
        </NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-6">
        <ul className="space-y-0.5">
          {primary.map(({ to, label, Icon }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} />
          ))}
        </ul>
        <div className="mt-6 mb-2 px-3 text-[10px] uppercase tracking-wider text-slate-500">
          Workspace
        </div>
        <ul className="space-y-0.5">
          {secondary.map(({ to, label, Icon }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function NavItem({
  to,
  label,
  Icon,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={to === "/gro10x"}
        className={({ isActive }) =>
          `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive
              ? "bg-white/5 text-[#33E1E4]"
              : "text-slate-300 hover:text-white hover:bg-white/[0.03]"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-[#33E1E4]"
              />
            )}
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
}
