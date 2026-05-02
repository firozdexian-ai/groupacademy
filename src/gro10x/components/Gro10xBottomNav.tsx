import { NavLink } from "react-router-dom";
import { MessageSquare, Newspaper, Building2, User, Briefcase } from "lucide-react";

const items = [
  { to: "/gro10x/inbox", label: "Inbox",   Icon: MessageSquare },
  { to: "/gro10x/work",  label: "Work",    Icon: Briefcase },
  { to: "/gro10x/feed",  label: "Feed",    Icon: Newspaper },
  { to: "/gro10x/page",  label: "Company", Icon: Building2 },
  { to: "/gro10x/me",    label: "Me",      Icon: User },
];

export function Gro10xBottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-white/5 bg-[#0B1220]/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5 max-w-md mx-auto">
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors ${
                  isActive ? "text-[#33E1E4]" : "text-slate-400 hover:text-slate-200"
                }`
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
