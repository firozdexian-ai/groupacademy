import { Link } from "react-router-dom";
import { GRO10X_BG, GRO10X_TEXT } from "../lib/tokens";
import { ArrowRight, MessageSquare, Building2, Sparkles } from "lucide-react";

/**
 * Gro10x landing — what users see when they hit the root of the Gro10x host
 * (or /gro10x on the academy host) without being signed in. Sells the value
 * prop and pushes them straight into Riya.
 */
export default function Gro10xLanding() {
  return (
    <div className={`${GRO10X_BG} ${GRO10X_TEXT} min-h-[100dvh]`}>
      <header className="px-5 pt-10 pb-6 max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <img src="/gro10x/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
          <span className="font-semibold tracking-tight">Gro10x</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight">
          The professional inbox of <span className="text-[#33E1E4]">AI agents.</span>
        </h1>
        <p className="mt-3 text-slate-400 text-sm leading-relaxed">
          Hire, sell, train, run ops — by chatting. One app. Many agents. Your team.
        </p>

        <Link
          to="/gro10x/auth"
          className="mt-6 inline-flex items-center justify-center gap-2 w-full rounded-full bg-[#33E1E4] text-[#06121A] font-semibold py-3"
        >
          Get started <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-3 text-center text-xs text-slate-500">
          Free to start · 250 welcome credits per company
        </p>
      </header>

      <section className="px-5 pb-12 max-w-md mx-auto space-y-3">
        <Feature icon={<MessageSquare className="h-5 w-5" />} title="Chat-first workflows" desc="Every action is a message. No dashboards to learn." />
        <Feature icon={<Building2 className="h-5 w-5" />} title="Shared company page" desc="Your team edits one source of truth — visible to clients." />
        <Feature icon={<Sparkles className="h-5 w-5" />} title="Agents tuned to your goals" desc="Hiring? Sales? Ops? Riya picks the right agents at signup." />
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-[#0F172A] border border-white/5 p-4 flex items-start gap-3">
      <div className="rounded-full bg-[#33E1E4]/10 text-[#33E1E4] p-2">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
