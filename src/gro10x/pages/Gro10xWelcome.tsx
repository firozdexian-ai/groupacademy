import { useNavigate } from "react-router-dom";
import { GRO10X_BG, GRO10X_TEXT } from "../lib/tokens";
import { CheckCircle2 } from "lucide-react";

/**
 * Gro10x Welcome — post-signup wizard placeholder.
 * v1 just acknowledges and routes to the inbox. Step-by-step UI
 * (Profile · Hours · Services · Invites · Agents) is wired next iteration.
 */
export default function Gro10xWelcome() {
  const navigate = useNavigate();

  return (
    <div className={`${GRO10X_BG} ${GRO10X_TEXT} min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center`}>
      <CheckCircle2 className="h-14 w-14 text-[#33E1E4] mb-4" />
      <h1 className="text-2xl font-bold">You're in.</h1>
      <p className="mt-2 text-sm text-slate-400 max-w-sm">
        Your Gro10x workspace is ready. Two starter agents are pinned to your inbox —
        try chatting with the Recruiter or the Concierge.
      </p>
      <button
        onClick={() => navigate("/gro10x/inbox", { replace: true })}
        className="mt-8 rounded-full bg-[#33E1E4] text-[#06121A] font-semibold px-6 py-3"
      >
        Open my inbox
      </button>
      <p className="mt-3 text-xs text-slate-500">
        You can complete your company page anytime from the bottom nav.
      </p>
    </div>
  );
}
