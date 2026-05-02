/**
 * Gro10x B2B Learning tab — entry point that lets POCs and employees
 * browse and share company-relevant courses inside the Gro10x shell.
 *
 * v1: deep-links into the existing talent Learning Hub (single source of truth
 * for courses/enrollments). When the user shares a course link in a Gro10x
 * thread, the existing inbox link-preview infra handles rendering.
 */
import { Link } from "react-router-dom";
import { GraduationCap, ExternalLink, BookOpen, Sparkles } from "lucide-react";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";

const ENTRY_POINTS = [
  {
    title: "Browse Courses",
    desc: "Curated B2B-relevant courses across leadership, sales, ops",
    icon: BookOpen,
    href: "/app/learning",
  },
  {
    title: "Career Tracks",
    desc: "Multi-course tracks for fast skill ramp-up",
    icon: GraduationCap,
    href: "/app/learning?tab=tracks",
  },
  {
    title: "AI Concierge",
    desc: "Ask the platform concierge what to learn next",
    icon: Sparkles,
    href: "/app",
  },
];

export default function Gro10xLearn() {
  return (
    <div className="max-w-md mx-auto pb-8">
      <div className="px-4 pt-4">
        <h1 className="text-lg font-semibold">Learning</h1>
        <p className={`text-xs ${GRO10X_MUTED} mt-0.5`}>
          Upskill your team. Share any course into a thread to push it to your group.
        </p>
      </div>

      <div className="px-4 mt-3 space-y-2">
        {ENTRY_POINTS.map((e) => (
          <Link
            key={e.title}
            to={e.href}
            className={`block ${GRO10X_PANEL} border border-white/10 rounded-2xl p-3 hover:bg-white/5`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#33E1E4]/10 grid place-items-center text-[#33E1E4] shrink-0">
                <e.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{e.desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500" />
            </div>
          </Link>
        ))}
      </div>

      <div className={`mx-4 mt-6 ${GRO10X_PANEL} border border-white/10 rounded-2xl p-4`}>
        <p className="text-sm font-medium">Coming soon</p>
        <p className={`text-[11px] ${GRO10X_MUTED} mt-1`}>
          Company-private learning paths, completion analytics for your team, and bulk seat assignments.
        </p>
      </div>
    </div>
  );
}
