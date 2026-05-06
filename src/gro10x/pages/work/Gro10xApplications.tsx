import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ApplicationKanban } from "@/components/applications/ApplicationKanban";
import { useGro10xCompanyId } from "../../hooks/useGro10xCompanyId";
import { GRO10X_MUTED } from "../../lib/tokens";
import { useState } from "react";

export default function Gro10xApplications() {
  const navigate = useNavigate();
  const { data: companyId, isLoading } = useGro10xCompanyId();
  const [showWithdrawn, setShowWithdrawn] = useState(false);

  return (
    <div className="max-w-6xl mx-auto pb-safe">
      <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-3 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/gro10x/work")}
          className="rounded-full p-2 hover:bg-white/5"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-medium">All applications</p>
          <p className={`text-[11px] ${GRO10X_MUTED}`}>
            Across every role your company posted
          </p>
        </div>
        <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={showWithdrawn}
            onChange={(e) => setShowWithdrawn(e.target.checked)}
          />
          Withdrawn
        </label>
      </header>

      <div className="px-3 py-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !companyId ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No active company workspace.
          </p>
        ) : (
          <ApplicationKanban companyId={companyId} showWithdrawn={showWithdrawn} />
        )}
      </div>
    </div>
  );
}
