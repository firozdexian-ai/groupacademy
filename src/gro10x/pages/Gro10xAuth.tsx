import { Link } from "react-router-dom";
import { GRO10X_BG, GRO10X_TEXT } from "../lib/tokens";

/**
 * Gro10x Auth Chat (Riya) — v1 placeholder shell.
 * Next iteration wires the conversational state machine + ai-company-auth-agent
 * edge function (CV upload, role/company confirm, goals, password).
 * For now, this links to the existing /for-companies/signup wizard so the flow
 * is unbroken end-to-end.
 */
export default function Gro10xAuth() {
  return (
    <div className={`${GRO10X_BG} ${GRO10X_TEXT} min-h-[100dvh] flex flex-col`}>
      <header className="px-5 pt-10 pb-4 max-w-md mx-auto w-full">
        <div className="flex items-center gap-2 mb-6">
          <img src="/gro10x/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
          <span className="font-semibold tracking-tight">Gro10x</span>
        </div>
      </header>

      <main className="flex-1 px-5 max-w-md mx-auto w-full">
        <div className="rounded-2xl rounded-tl-sm bg-[#0F172A] border border-white/5 p-4 text-sm">
          Hi, I'm <strong className="text-[#33E1E4]">Riya</strong> — your B2B concierge.
          <br />
          <br />
          I'll set up your workspace in under 60 seconds. I'll need your work email, your CV
          (optional but speeds things up), and what you want to get done first.
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
          ⚙️ The conversational flow is wiring up. For now, please use the quick form below.
        </div>

        <Link
          to="/for-companies/signup"
          className="mt-4 inline-flex items-center justify-center w-full rounded-full bg-[#33E1E4] text-[#06121A] font-semibold py-3"
        >
          Continue to quick signup
        </Link>

        <p className="mt-3 text-center text-xs text-slate-500">
          Already on Gro10x?{" "}
          <Link to="/auth" className="text-[#33E1E4] hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
