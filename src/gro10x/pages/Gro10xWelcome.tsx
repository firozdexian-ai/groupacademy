import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCompany } from "../hooks/useActiveCompany";
import { getAgentMeta } from "../lib/agents";
import { GRO10X_BG, GRO10X_TEXT } from "../lib/tokens";
import { listPinnedAgentKeys } from "@/domains/agents/repo/agentsRepo";

/**
 * Gro10x Welcome — confirms signup and shows the agents Riya pinned for the
 * user's selected goals so the next step feels concrete.
 */
export default function Gro10xWelcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyId } = useActiveCompany();
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id || !companyId) return;
    let cancelled = false;
    void listPinnedAgentKeys(user.id, companyId).then((keys) => {
      if (!cancelled) setPinned(keys);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, companyId]);

  const previewAgents = pinned.slice(0, 3).map(getAgentMeta);

  return (
    <div className={`${GRO10X_BG} ${GRO10X_TEXT} min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center`}>
      <CheckCircle2 className="h-14 w-14 text-[#33E1E4] mb-4" aria-hidden />
      <h1 className="text-2xl font-bold">You're in.</h1>
      <p className="mt-2 text-sm text-slate-400 max-w-sm">
        Your Gro10x workspace is ready
        {previewAgents.length > 0 && (
          <>
            {" "}— pinned agents for you:{" "}
            <span className="text-slate-200">
              {previewAgents.map((a) => a.name).join(" · ")}
            </span>
          </>
        )}
        .
      </p>

      {previewAgents.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {previewAgents.map((a) => (
            <span key={a.key} className="text-2xl" title={a.name}>
              {a.emoji}
            </span>
          ))}
        </div>
      )}

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
